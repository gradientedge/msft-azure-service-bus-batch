import "@azure/functions-extensions-servicebus";
// import { ServiceBusClient } from "@azure/service-bus"
// import { type ServiceBusMessageContext } from "@azure/functions-extensions-servicebus"
// import { ServiceBusMessageActions } from "@azure/functions-extensions-servicebus/dist/azure-functions-extensions-servicebus"
import { app, InvocationContext } from "@azure/functions";

export async function serviceBusTrigger1(
  ...args: unknown[]
  // serviceBusClient: ServiceBusClient,
  // message: unknown,
  // context: InvocationContext
): Promise<void> {
  console.log('ServiceBus function invoked with args:', args);
  // context.log(
  //   `Service Bus function processed message: ${JSON.stringify(message)}`
  // );
  // try {
  //   //Actual Message
  //   context.log("triggerMetadata: ", context.triggerMetadata);
  //   context.log('Completing the message', ServiceBusMessageContext.messages[0]);
  //   //Use serviceBusMessageActions to action on the messages
  //   await ServiceBusMessageContext.serviceBusMessageActions.complete(ServiceBusMessageContext.messages[0]);
  //   context.log('Completing the body', ServiceBusMessageContext.messages[0].body);
  // }
}

app.serviceBusQueue("serviceBusTrigger", {
  connection: "AzureWebJobsServiceBus",
  queueName: "messages",
  cardinality: "many",
  sdkBinding: true, //Ensure this is set to true
  autoCompleteMessages: false, //Exposing this so that customer can take action on the messages
  handler: serviceBusTrigger1,
});

// https://learn.microsoft.com/en-us/azure/azure-functions/functions-bindings-service-bus?tabs=isolated-process%2Cextensionv5&pivots=programming-language-javascript
// autoCompleteMessages
