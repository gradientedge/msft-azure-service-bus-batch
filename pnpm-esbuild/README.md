# Experiment

The purpose of the experiment is to test configuration for service bus extension support.

Function setup:
- pnpm
- esbuild
- ESM module

To execute experiment run below script:
```shell
./run.sh
```

## Environment

```text
NODE:
v22.13.1

NPM:
10.9.2

FUNC:
4.2.2

AZ:
{
  "azure-cli": "2.77.0",
  "azure-cli-core": "2.77.0",
  "azure-cli-telemetry": "1.1.0",
  "extensions": {
    "account": "0.2.5",
    "application-insights": "1.2.3",
    "containerapp": "1.2.0b2"
  }
}
```

## Dependencies

```text
@msft-azure-service-bus-batch/functions-pnpm-esbuild@1.0.0 /Users/kamil/repo/ge/msft-azure-service-bus-batch/pnpm-esbuild
├── @azure/functions-extensions-servicebus@0.2.0-preview -> ./node_modules/.pnpm/@azure+functions-extensions-servicebus@0.2.0-preview/node_modules/@azure/functions-extensions-servicebus
├── @azure/functions@4.8.0 -> ./node_modules/.pnpm/@azure+functions@4.8.0/node_modules/@azure/functions
├── @azure/service-bus@7.9.5 -> ./node_modules/.pnpm/@azure+service-bus@7.9.5/node_modules/@azure/service-bus
├── @types/node@22.18.0 -> ./node_modules/.pnpm/@types+node@22.18.0/node_modules/@types/node
├── azure-functions-core-tools@4.2.2 -> ./node_modules/.pnpm/azure-functions-core-tools@4.2.2/node_modules/azure-functions-core-tools
├── esbuild@0.25.1 -> ./node_modules/.pnpm/esbuild@0.25.1/node_modules/esbuild
├── rimraf@6.0.1 -> ./node_modules/.pnpm/rimraf@6.0.1/node_modules/rimraf
└── typescript@5.9.2 -> ./node_modules/.pnpm/typescript@5.9.2/node_modules/typescript

```

## Error

For full list of errors see [error page](./ERROR.md)

