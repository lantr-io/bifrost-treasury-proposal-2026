//> using scala 3.3.8
// titanium-rdfc 3.x (URDNA2015/RDFC-1.0 canonicalizer, used by AnchorSigning)
// requires Java 21+; pin the JVM so the anchor signer is reproducible.
//> using jvm 21
//> using dep org.scalus::scalus-cardano-ledger:0.18.2
// CIP-100 anchor signing (AnchorSigning / signAnchor): URDNA2015 JSON-LD
// canonicalization. titanium-json-ld emits RDF via the same titanium-rdf-api
// that titanium-rdfc consumes; jakarta.json-api + parsson are the JSON model
// Titanium parses into. Output is byte-identical to the bun `jsonld` path.
//> using dep com.apicatalog:titanium-json-ld:1.7.0
//> using dep com.apicatalog:titanium-rdfc:3.0.0
//> using dep jakarta.json:jakarta.json-api:2.1.3
//> using dep org.eclipse.parsson:parsson:1.1.7
//> using test.dep org.scalameta::munit::1.0.0

// Shared scala-cli project for the Phase-1 treasury-withdrawal publishing tools.
// Mains (run with `scala-cli run treasury-publish --main-class <Name>`):
//   GenKeys, InitRegistry, RegisterScripts, BuildGovAction, signAnchor
//
// The contract bytecode comes from the vendored, audited SundaeSwap
// treasury-funds blueprint `plutus.json`; parameters are applied with Scalus's
// UPLC engine (see Scripts.scala). This repo does NOT reimplement the contracts.
