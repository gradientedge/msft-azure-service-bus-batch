#!/usr/bin/env bash
set -euo pipefail

# Config (override via env)
RESOURCE_GROUP_NAME="${RESOURCE_GROUP_NAME:-playground-kamil}"
FUNCTION_NAME="${FUNCTION_NAME:-batch-service-bus}"

echo "Cleaning and installing dev deps"
rm -rf dist
npm ci --prefer-offline

# Results header
{
  echo "# Experiment"
  echo
  echo "The purpose of the experiment is to test configuration for OTEL support."
  echo
  echo "Function setup:"
  echo "- npm"
  echo "- ESM module"
  echo
  echo "To execute experiment run below script:"
  echo "\`\`\`shell"
  echo "./run.sh"
  echo "\`\`\`"
  echo
  echo "## Environment"
  echo
  echo "\`\`\`text"
  echo "NODE:"
  node -v
  echo
  echo "NPM:"
  npm -v
  echo
  echo "FUNC:"
  func --version || true
  echo
  echo "AZ:"
  az version || true
  echo "\`\`\`"
  echo
  echo "## Dependencies"
  echo
  echo "\`\`\`text"
  npm ls || true
  echo "\`\`\`"
} >README.md

echo "Building application"
npm run build

echo "Installing production deps (omit dev)"
npm ci --omit=dev

echo "Updating Function App settings (Node preload)"

APP_ARGS="--enable-source-maps"
az functionapp config appsettings set \
  --name "${FUNCTION_NAME}" \
  --resource-group "${RESOURCE_GROUP_NAME}" \
  --settings "languageWorkers__node__arguments=${APP_ARGS}" >/dev/null

echo "Waiting for app setting to apply..."
# Poll until setting is visible server-side (up to ~60s)
for _ in {1..30}; do
  val="$(az functionapp config appsettings list \
    --name "${FUNCTION_NAME}" \
    --resource-group "${RESOURCE_GROUP_NAME}" \
    --query "[?name=='languageWorkers__node__arguments'].value | [0]" -o tsv || true)"
  [[ "$val" == "$APP_ARGS" ]] && break
  sleep 2
done

sleep 15

echo "Deploying application"
# We already built JS; avoid TypeScript rebuild during publish
func azure functionapp publish "${FUNCTION_NAME}" --javascript 2>&1

{
  echo
  echo "## Error"
  echo
  echo "For full list of errors see [error page](./ERROR.md)"
  echo
} >>README.md

echo "Done. See README.md"
