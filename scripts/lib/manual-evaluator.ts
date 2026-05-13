import { Redeemers, Redeemer, type Transaction } from "@blaze-cardano/core";

/**
 * Custom Blaze Evaluator that bypasses server-side Plutus evaluation by
 * pinning every redeemer's execution units to a generous static value.
 *
 * Why: Blockfrost preview's /utils/txs/evaluate(/utxos) endpoint is broken
 * — the upstream eval tool returns empty stdout, surfacing as
 * `"expected value at line 1 column 1"` (serde_json on no input). The
 * ledger itself accepts the tx fine, so the bypass is safe — fees are
 * slightly overpaid on testnet (well within budget for any 100k-tADA
 * deposit flow), and the node re-runs eval at submission anyway.
 *
 * Activated by `SKIP_EVAL=1` in env. Mainnet must NOT use this — overpaid
 * fees there are real money. The provider helper that wires this in throws
 * if NETWORK=mainnet + SKIP_EVAL=1.
 *
 * Defaults are sized to fit:
 *   - per-redeemer: well under per-tx max (mem 14M, steps 10B)
 *   - per-tx (up to 4 redeemers): still ~4× headroom under per-tx max
 *
 * If a script needs more, raise these defaults — but first verify on
 * preprod (where Blockfrost eval works) to get a real number.
 */
export interface ManualEvalOpts {
  mem?: number;
  steps?: number;
}

export function manualEvaluator(opts: ManualEvalOpts = {}) {
  const mem = opts.mem ?? 2_000_000;
  const steps = opts.steps ?? 1_000_000_000;
  return async (tx: Transaction, _additional: unknown[]): Promise<Redeemers> => {
    const witnessSet = tx.witnessSet();
    const existing = witnessSet.redeemers();
    if (!existing) {
      throw new Error(
        "manualEvaluator: tx has no redeemers — nothing to evaluate. " +
          "Either the tx genuinely doesn't need eval, or Blaze hasn't placed " +
          "the redeemers yet (call useEvaluator before complete()).",
      );
    }
    const updatedCore = existing.values().map((r: Redeemer) => {
      const core = r.toCore();
      return { ...core, executionUnits: { memory: mem, steps } };
    });
    return Redeemers.fromCore(updatedCore);
  };
}

/** True iff env requests the manual evaluator. Refuses on mainnet. */
export function shouldUseManualEvaluator(): boolean {
  if (process.env.SKIP_EVAL !== "1") return false;
  if (process.env.NETWORK === "mainnet") {
    throw new Error(
      "SKIP_EVAL=1 is forbidden on mainnet — overpaid fees are real money. " +
        "Plutus eval should work on mainnet via Blockfrost.",
    );
  }
  return true;
}
