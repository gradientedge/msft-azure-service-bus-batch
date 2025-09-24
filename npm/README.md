# Experiment

The purpose of the experiment is to test configuration for OTEL support.

Function setup:
- npm
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
@msft-azure-service-bus-batch/functions-npm@1.0.0 /Users/kamil/repo/ge/msft-azure-service-bus-batch/npm
├── @azure/functions-extensions-servicebus@0.2.0-preview
├── @azure/functions@4.8.0
├── @azure/service-bus@7.9.5
├── @types/minimist@1.2.5
├── @types/node@22.18.0
├── azure-functions-core-tools@4.2.2
├── rimraf@6.0.1
└── typescript@5.9.2

```
## Error

For full list of errors see [error page](./ERROR.md)

