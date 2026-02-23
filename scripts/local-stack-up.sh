#!/usr/bin/env bash
set -euo pipefail

bash ./scripts/local-stack-up-ops.sh
bash ./scripts/local-stack-up-app.sh
