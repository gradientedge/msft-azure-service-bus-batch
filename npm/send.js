import { ServiceBusClient } from "@azure/service-bus";
import { DefaultAzureCredential } from "@azure/identity";

const serviceBusName = "servicebussuccessonerror" // process.env.SERVICE_BUS_NAME;

// Replace `<SERVICE-BUS-NAMESPACE>` with your namespace
const fullyQualifiedNamespace = `${serviceBusName}.servicebus.windows.net`;

// Passwordless credential
const credential = new DefaultAzureCredential();

// name of the queue
const queueName = "messages"

const messages = [
  { body: "Albert Einstein" },
  { body: "Nikolaus Kopernikus" },
  { body: "Marie Curie" },
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
  const sbClient = new ServiceBusClient(fullyQualifiedNamespace, credential);

  // createSender() can also be used to create a sender for a topic.
  console.log('Creating sender for queue: ', queueName);
  const sender = sbClient.createSender(queueName);

  try {
    // Tries to send all messages in a single batch.
    // Will fail if the messages cannot fit in a batch.
    // await sender.sendMessages(messages);

    // create a batch object
    console.log('Creating batch');
    let batch = await sender.createMessageBatch();
    console.log('Created batch');

    for (const message of messages) {
      // for each message in the array

      console.log('Adding message to batch: ', message);
      // try to add the message to the batch
      if (!batch.tryAddMessage(message)) {
        // if it fails to add the message to the current batch
        // send the current batch as it is full
        await sender.sendMessages(batch);

        // then, create a new batch
        batch = await sender.createMessageBatch();

        // now, add the message failed to be added to the previous batch to this batch
        if (!batch.tryAddMessage(message)) {
          // if it still can't be added to the batch, the message is probably too big to fit in a batch
          throw new Error("Message too big to fit in a batch");
        }
      } else {
        console.log("Added message to batch: ", message);
      }
    }

    console.log(`Sending a batch of messages to the queue: ${queueName}`);

    // Send the last created batch of messages to the queue
    await sender.sendMessages(batch);

    console.log(`Sent a batch of messages to the queue: ${queueName}`);

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
