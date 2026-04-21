import { ServiceBusClient } from "@azure/service-bus";
import { DefaultAzureCredential } from "@azure/identity";

const serviceBusName = "servicebussuccessonerror" // process.env.SERVICE_BUS_NAME;

// Replace `<SERVICE-BUS-NAMESPACE>` with your namespace
// const fullyQualifiedNamespace = `${serviceBusName}.servicebus.windows.net`;
const fullyQualifiedNamespace = `Endpoint=sb://localhost:5672;SharedAccessKeyName=RootManageSharedAccessKey;SharedAccessKey=SAS_KEY_VALUE;UseDevelopmentEmulator=true;`;

// Passwordless credential
const credential = new DefaultAzureCredential();

// name of the queue
// const queueName = "messages"
const queueName = "mock-queue"

async function main() {
  // create a Service Bus client using the passwordless authentication to the Service Bus namespace
  console.log('Creating client: ', queueName);
  const sbClient = new ServiceBusClient(fullyQualifiedNamespace);

  // createSender() can also be used to create a sender for a topic.
  console.log('Creating sender for queue: ', queueName);
  // const receiver = sbClient.createReceiver(queueName, { subQueueType: 'deadLetter' });
  const receiver = sbClient.createReceiver(queueName, {
    // subQueueType: "deadLetter"
  });

  try {
    for await (const message of receiver.getMessageIterator()) {
      console.log(`Completed message`, JSON.stringify(message.body))
      await receiver.completeMessage(message)
    }

  } finally {
    await sbClient.close();
  }
}

// call the main function
try {
  console.log('Running sendMessages sample');
  await main()
} catch (err) {
  console.log("Error occurred: ", err);
  process.exit(1);
}
