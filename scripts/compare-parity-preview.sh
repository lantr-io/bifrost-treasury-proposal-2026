#!/usr/bin/env bash
#
# Live bun ⇄ scalus deployment parity check (dry-run, submits nothing).
#
# Runs the standup→publish pipeline (init → register → gov) through BOTH the
# bun scripts and the scalus `treasury-publish` tools against the same chain
# state, forcing the identical one-shot seed into both, and asserts that every
# deterministic artifact is byte-identical:
#
#   - one-shot registry policy hash
#   - treasury / vendor script hashes
#   - treasury / vendor / admin reward (stake) accounts  [register]
#   - the gov-action withdrawal JSON (reward acct, amount, guardrails, anchor) [gov]
#
# The raw signed tx CBOR is NOT compared: Blaze (bun) and Scalus TxBuilder
# estimate fees / select change independently, so their bytes differ even when
# the on-chain effect is identical. That difference is expected and accepted.
#
# Usage:
#   scripts/compare-parity-preview.sh <txid#ix> [network]
#
#   <txid#ix>  ada-only admin UTxO to use as the one-shot seed (must exist on
#              the target network's admin wallet)
#   network    preview (default) | preprod
#
# Requires: .env with BLOCKFROST_PROJECT_ID (network-scoped); funded admin keys.
# Leaves deployment/<network>.json untouched (backs it up and restores it).

set -euo pipefail

SEED="${1:?usage: compare-parity-preview.sh <txid#ix> [network]}"
NET="${2:-preview}"
DEPLOY="deployment/${NET}.json"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

red()   { printf '\033[31m%s\033[0m\n' "$1"; }
green() { printf '\033[32m%s\033[0m\n' "$1"; }

fail=0
check() { # name expected actual
  if [[ "$2" == "$3" && -n "$2" ]]; then
    green "  ✓ $1: $2"
  else
    red   "  ✗ $1: bun='$2' scalus='$3'"
    fail=1
  fi
}

# 56-hex (28-byte script/policy hash) from the line carrying a label, or the
# Nth stake_test1 address. The label words can themselves contain hex letters
# (e.g. the "c" in "script"), so match the WHOLE line first, then pull the lone
# 56-char hex token — never try to bridge label→hash with a character class.
hex56() { { grep -i "$1" | grep -oiE '[0-9a-f]{56}' | head -1; } || true; }

echo "== bun ⇄ scalus deployment parity (network=$NET, seed=$SEED) =="

# Fresh deploy: move any existing deployment aside so init runs.
[[ -f "$DEPLOY" ]] && mv "$DEPLOY" "$TMP/deploy.bak"
restore() { [[ -f "$TMP/deploy.bak" ]] && mv -f "$TMP/deploy.bak" "$DEPLOY" || rm -f "$DEPLOY"; }
trap 'restore; rm -rf "$TMP"' EXIT

# ---- init -----------------------------------------------------------------
echo "[1/3] init"
NETWORK="$NET" SKIP_EVAL=1 bun scripts/01-init-registry.ts --seed "$SEED" >"$TMP/init.bun" 2>&1
scala-cli run treasury-publish --main-class treasurypublish.init -- \
  --network "$NET" --seed "$SEED" >"$TMP/init.scalus" 2>&1

B_POL=$(hex56 'Registry policy'  <"$TMP/init.bun");    S_POL=$(hex56 'registry policy' <"$TMP/init.scalus")
B_TRE=$(hex56 'Treasury script'  <"$TMP/init.bun");    S_TRE=$(hex56 'treasury script' <"$TMP/init.scalus")
B_VEN=$(hex56 'Vendor'           <"$TMP/init.bun");    S_VEN=$(hex56 'vendor'          <"$TMP/init.scalus")
check "registry policy" "$B_POL" "$S_POL"
check "treasury hash"   "$B_TRE" "$S_TRE"
check "vendor hash"     "$B_VEN" "$S_VEN"

# Bootstrap a deployment from the agreed hashes so register/gov can read it.
# Asset name 5245474953545259 = ascii "REGISTRY" (the one-shot NFT name).
jq -n --arg net "$NET" --arg pol "$B_POL" --arg tre "$B_TRE" --arg ven "$B_VEN" \
  --arg tx "${SEED%#*}" --argjson ix "${SEED#*#}" \
  '{network:$net, seedUtxo:{txId:$tx, outputIndex:$ix}, registryPolicyHex:$pol,
    registryAssetNameHex:"5245474953545259", treasuryScriptHashHex:$tre,
    vendorScriptHashHex:$ven, treasuryExpirationMs:"1814400000000", txs:{}}' >"$DEPLOY"
# (asset name is the constant "REGISTRY" hex; keep literal to avoid surprises)
jq '.registryAssetNameHex="5245474953545259"' "$DEPLOY" >"$TMP/d" && mv "$TMP/d" "$DEPLOY"

# ---- register -------------------------------------------------------------
echo "[2/3] register"
NETWORK="$NET" SKIP_EVAL=1 bun scripts/02-register-scripts.ts >"$TMP/reg.bun" 2>&1
scala-cli run treasury-publish --main-class treasurypublish.register -- \
  --network "$NET" >"$TMP/reg.scalus" 2>&1
# Extract by label, not position: an "admin … already registered" line can
# appear first and carries its own stake address, which would shift indexes.
# The three reward lines each contain "reward" + the workstream word.
rl() { { grep -i reward | grep -i "$1" | grep -oE 'stake_test1[0-9a-z]+' | head -1; } || true; }
for l in treasury vendor admin; do
  check "$l reward acct" "$(rl "$l" <"$TMP/reg.bun")" "$(rl "$l" <"$TMP/reg.scalus")"
done

# ---- gov ------------------------------------------------------------------
echo "[3/3] gov"
NETWORK="$NET" SKIP_EVAL=1 bun scripts/03-build-gov-action.ts >"$TMP/gov.bun.log" 2>&1
cp "gov/${NET}-withdrawal.json" "$TMP/gov.bun.json"
scala-cli run treasury-publish --main-class treasurypublish.gov -- \
  --network "$NET" >"$TMP/gov.scalus.log" 2>&1
cp "gov/${NET}-withdrawal.json" "$TMP/gov.scalus.json"
if diff <(jq -S . "$TMP/gov.bun.json") <(jq -S . "$TMP/gov.scalus.json") >/dev/null; then
  green "  ✓ gov withdrawal JSON: identical"
else
  red   "  ✗ gov withdrawal JSON differs:"; diff <(jq -S . "$TMP/gov.bun.json") <(jq -S . "$TMP/gov.scalus.json") || true
  fail=1
fi

echo
if [[ "$fail" == 0 ]]; then green "PARITY OK — all deterministic artifacts identical"; else red "PARITY FAILED"; exit 1; fi
