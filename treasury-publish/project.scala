//> using scala 3.3.8
//> using dep org.scalus::scalus-cardano-ledger:0.18.2
//> using test.dep org.scalameta::munit::1.0.0

// Shared scala-cli project for the Phase-1 treasury-withdrawal publishing tools.
// Mains (run with `scala-cli run treasury-publish --main-class <Name>`):
//   GenKeys, InitRegistry, RegisterScripts, BuildGovAction
//
// The contract bytecode comes from the vendored, audited SundaeSwap
// treasury-funds blueprint `plutus.json`; parameters are applied with Scalus's
// UPLC engine (see Scripts.scala). This repo does NOT reimplement the contracts.
