import { ServiceBusClient } from "@azure/service-bus";
import { DefaultAzureCredential } from "@azure/identity";

const serviceBusName = "servicebussuccessonerror" // process.env.SERVICE_BUS_NAME;

// Replace `<SERVICE-BUS-NAMESPACE>` with your namespace
// const fullyQualifiedNamespace = `${serviceBusName}.servicebus.windows.net`;
const fullyQualifiedNamespace = "Endpoint=sb://localhost:5672;SharedAccessKeyName=RootManageSharedAccessKey;SharedAccessKey=SAS_KEY_VALUE;UseDevelopmentEmulator=true;";


// Passwordless credential
const credential = new DefaultAzureCredential();

// name of the queue
// const queueName = "messages"
const queueName = "mock-queue"

const oneHourMs = 60 * 60 * 1000
const delaySeconds = new Date(new Date().getTime() + 60000)///.toUTCString()
console.log("Delay until: ", delaySeconds);
const otherMessages = [
  {
    "body": {
      "id": "622a2c8f-93d7-48bf-a782-b8f91fb40f85",
      "source": "/specsavers-eu-dev/products",
      "specversion": "1.0",
      "type": "com.commercetools.product.message.ProductUnpublished",
      "subject": "4e81f0bf-4339-4200-beea-80a83530b241",
      "time": "2025-05-22T11:02:21.71Z",
      "dataref": "/specsavers-eu-dev/messages/622a2c8f-93d7-48bf-a782-b8f91fb40f85",
      "sequence": "5",
      "sequencetype": "Integer",
      "data": {
        "notificationType": "Message",
        "projectKey": "specsavers-eu-dev",
        "id": "622a2c8f-93d7-48bf-a782-b8f91fb40f85",
        "version": 1,
        "sequenceNumber": 5,
        "resource": {
          "typeId": "product",
          "id": "4e81f0bf-4339-4200-beea-80a83530b241"
        },
        "resourceVersion": 24,
        "resourceUserProvidedIdentifiers": { "key": "5001824", "slug": { "en-GB": "harry" } }, "type": "ProductPublished", "createdAt": "2025-05-22T11:02:21.71Z", "lastModifiedAt": "2025-05-22T11:02:21.71Z", "createdBy": { "isPlatformClient": true, "user": { "typeId": "user", "id": "eddd250b-73d1-4866-b293-5db047c9151d" } }, "lastModifiedBy": { "isPlatformClient": true, "user": { "typeId": "user", "id": "eddd250b-73d1-4866-b293-5db047c9151d" } }
      }
    },
    "applicationProperties": {
      "lastErrorTime": null,
      "lastErrorMessage": null,
      "firstProcessedAt": null,
      "totalDeliveryAttempts": 1,
      // "originalMessageIds": ["n/a"],
      "customDeliveryCount": 2
    },
    "scheduledEnqueueTimeUtc": "2025-10-17T08:06:05.516Z"
  }]

const messages = [
  // { body: "Albert Einstein" },
  // { body: "Nikolaus Kopernikus", scheduledEnqueueTimeUtc: delaySeconds },
  { body: JSON.stringify({ text: "Nikolaus Kopernikus" }), contentType: "application/json" },
  // { body: "Marie Curie" },
  // { body: "Werner Heisenberg" },
  // { body: "Steven Hawking" },
  // { body: "Isaac Newton" },
  // { body: "Niels Bohr" },
  // { body: "Michael Faraday" },
  // { body: "Galileo Galilei" },
  // { body: "Johannes Kepler" },
  // { body: "Nikolaus Kopernikus" }
];

async function main() {
  // create a Service Bus client using the passwordless authentication to the Service Bus namespace
  console.log('Creating client: ', queueName);
  const sbClient = new ServiceBusClient(fullyQualifiedNamespace);

  // createSender() can also be used to create a sender for a topic.
  console.log('Creating sender for queue: ', queueName);
  const sender = sbClient.createSender(queueName);

  try {
    // Tries to send all messages in a single batch.
    // Will fail if the messages cannot fit in a batch.
    // await sender.sendMessages(messages);

    // await sender.sendMessages(messages);
    await sender.sendMessages(messages);
    // create a batch object
    // console.log('Creating batch');
    // let batch = await sender.createMessageBatch();
    // console.log('Created batch');
    //
    // for (const message of messages) {
    //   // for each message in the array
    //
    //   console.log('Adding message to batch: ', message);
    //   // try to add the message to the batch
    //   if (!batch.tryAddMessage(message)) {
    //     // if it fails to add the message to the current batch
    //     // send the current batch as it is full
    //     await sender.sendMessages(batch);
    //
    //     // then, create a new batch
    //     batch = await sender.createMessageBatch();
    //
    //     // now, add the message failed to be added to the previous batch to this batch
    //     if (!batch.tryAddMessage(message)) {
    //       // if it still can't be added to the batch, the message is probably too big to fit in a batch
    //       throw new Error("Message too big to fit in a batch");
    //     }
    //   } else {
    //     console.log("Added message to batch: ", message);
    //   }
    // }
    //
    // console.log(`Sending a batch of messages to the queue: ${queueName}`);
    //
    // // Send the last created batch of messages to the queue
    // await sender.sendMessages(batch);
    //
    // console.log(`Sent a batch of messages to the queue: ${queueName}`);

    // Close the sender
    await sender.close();
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
