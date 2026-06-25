### Annex 2: Competitive Landscape
<!--
#### Smart contract development

Scalus is already one of the most complete and actively developed smart contract platforms on Cardano. It combines a Scala-native contract language, integrated transaction building, advanced optimisation paths, rich documentation, design patterns, a blueprint catalogue, and an enterprise-grade development experience in one stack.

That matters because teams are not only choosing a language. They are choosing how quickly they can write, understand, optimise, test, and maintain non-trivial protocols over time. In that regard, Scalus is positioned as a full smart contract development platform rather than only a contract DSL.

The next iteration extends that further with early access to features from the next Cardano hard fork.

| Capability | Scalus | Aiken | Plutarch |
|---|---|---|---|
| Easy to write contracts | Yes | Yes | No |
| Plutus support | V1, V2, V3 | V3 | V1, V2, V3 |
| Standard library | Yes | Yes | Yes |
| Low-level UPLC control | Yes | No | Yes |
| Custom optimisations | Yes | Limited (Compiler-driven) | Possible (manual) |
| Off-chain type/code reuse | Native | Code generator | Code generator |
| Developer pool | Large (JVM) | Growing (Cardano-native) | Small (Haskell) |
| Custom data representation | Annotations | Limited | Manual |
| Debugging | Enterprise-level / Native IDE | Third-party | Third-party |
| Error handling | Stack traces with source position | Debug logs | Debug logs |
| Transaction building | Native (JVM), JS/TS | External (Lucid, MeshJS) | External (Cardano-transaction-lib, etc) |
| Testing framework | Integrated (property, scenario, state-machine, emulator) | Built-in (aiken test, property) | Haskell ecosystem tooling |

* Aiken: https://aiken-lang.org/ 
* Plutarch: https://plutarch-plutus.org/ 

#### Development environment and testing

Scalus's development environment is optimised to accelerate development/testing cycles. The key differentiator is the in-memory node emulator: a fast, in-process Cardano execution environment available natively on the JVM and exportable into JavaScript and TypeScript.

This gives Cardano something much closer to what Hardhat and Foundry provide in Ethereum: a local environment where testing, debugging, scenario execution, and application logic can run against the same integrated stack. Rather than stitching together contract code, off-chain code, emulators, and external devnets, builders can work inside one coherent toolchain.

| Capability | Scalus | Yaci Dev Kit | Hardhat (Ethereum ref) | Foundry (Ethereum ref) |
|---|---|---|---|---|
| In-memory blockchain | Yes (in-process Cardano node) | No (Yaci Devnet via Docker) | Yes (Hardhat Network) | Yes (Anvil) |
| Local devnet | Yes (via Yaci Dev Kit) | Yes (configurable) | Yes | Yes |
| Block production control | Yes (slot/epoch manipulation) | Yes | Yes | Yes |
| Test language | Scala (native types) | Java | JavaScript / TypeScript | Solidity (native) |
| Property-based testing | Yes | Limited | Yes (Solidity fuzz) | Yes (Forge fuzz) |
| Multi-party / wallet testing | Native | Yes | Yes | Yes |
| Smart contract debugging | Source-position stack traces | tx-level logs | Console.log, stack traces | Stack traces |
| Test execution speed | Fast (in-process) | Medium (node communication overhead) | Fast | Very fast (Rust-based) |

* Yaci Dev Kit: https://devkit.yaci.xyz/ 
* Hardhat: https://hardhat.org/ 
* Foundry: https://www.getfoundry.sh/ 

-->

#### Application framework

The next layer is the application framework itself. In the Cardano landscape, the closest comparison is Balius in the Rust ecosystem. Most other widely used tools, including MeshJS and Evolution SDK, are primarily SDKs for transaction building and protocol interaction rather than full application runtimes.

Scalus goes further by combining smart contracts, transaction building, reactive workers, persistence, scheduling into one application platform. The goal is not just to help teams assemble transactions, but to help them build complete dApps and protocol backends on one stack.

This is where Scalus moves from tooling into an application platform: it complements contract development with the runtime layer needed to launch, operate, and evolve real applications.

| Capability | Scalus | Balius |
|---|---|---|
| Primary focus | Application runtime + embedded node | Headless dApps / workers (WASM) |
| Reactive workers | Yes (typed, durable) | Yes (WASM-based) |
| Persistence layer | Crash-consistent | Yes |
| Job / time scheduling | Yes | Yes |
| Crash recovery | Yes (event log replay) | Yes |
| L1 node access | No (uses external node) | No (uses external node, Dolos) |
| Source language / runtime | Scala/Kotlin/Java (JVM), Native | Rust, WASM |
| Production maturity | In development | In development |

* Balius: https://docs.txpipe.io/balius 

#### Conclusion

Taken together, these layers make Scalus unusual in the Cardano landscape. It is not only a smart contract language, not only a testing environment, not only an application runtime. It is a coherent application platform that brings those pieces together into one stack.

That is the core difference. Scalus is designed to reduce assembly work, compress time-to-production, and give builders one integrated platform to build, test, launch serious Cardano applications.
