{
  description = "scalus-treasury";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-25.11";
    flake-utils.url = "github:numtide/flake-utils";
    cardano-node.url = "github:IntersectMBO/cardano-node";
  };

  outputs =
    { self
    , flake-utils
    , nixpkgs
    , cardano-node
    , ...
    } @ inputs:
    (flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = import nixpkgs { inherit system; };
        cardano-cli = cardano-node.packages.${system}.cardano-cli;
      in
      rec {
        devShell = pkgs.mkShell {
          # This fixes bash prompt/autocomplete issues with subshells (i.e. in VSCode) under `nix develop`/direnv
          buildInputs = [ pkgs.bashInteractive ];
          packages = with pkgs; [
            git
            gh
            bun
            nodejs
            jq
            nixpkgs-fmt
            cardano-cli
            age
            scala-cli # runs m5-withdraw/m5-withdraw.scala (Scalus tx builder)
            jdk21 # JVM for scala-cli
          ];

          # Export secrets from .env (BLOCKFROST_PROJECT_ID, etc.) into the shell.
          # Resolve the repo root so it works from any subdirectory.
          shellHook = ''
            root="$(${pkgs.git}/bin/git rev-parse --show-toplevel 2>/dev/null || echo "$PWD")"
            if [ -f "$root/.env" ]; then
              set -a
              . "$root/.env"
              set +a
            fi
          '';
        };
      })
    );

  nixConfig = {
    extra-substituters = [
      "https://cache.iog.io"
    ];
    extra-trusted-public-keys = [
      "hydra.iohk.io:f/Ea+s+dFdN+3Y/G+FDgSq+a5NEWhJGzdjvKNGv0/EQ="
    ];
    allow-import-from-derivation = true;
  };
}
