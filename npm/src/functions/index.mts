import "@azure/functions-extensions-servicebus";
import { ServiceBusReceivedMessage } from '@azure/service-bus';
import { ServiceBusMessageContext } from "@azure/functions-extensions-servicebus"
// it would be good to have access to it
// @ts-ignore
import { ServiceBusMessageActions } from "@azure/functions-extensions-servicebus/dist/azure-functions-extensions-servicebus"
import { app, InvocationContext, InvocationContextExtraInputs } from "@azure/functions";
import { setTimeout as sleep } from "timers/promises";

async function processMessage(body: string, context: InvocationContext): Promise<void> {
  if (body === "Nikolaus Kopernikus") {
    context.log('[PROCESSMSG] Nikolaus Kopernikus - abandonding', body);
    throw Error("Abandoning message for testing");
  } else if (body === "Marie Curie") {
    // set have 10 seconds lock duration
    context.log('[PROCESSMSG] Marie Curie - sleeping for 11 seconds to test renew lock', body);
    await sleep(11000);
    context.log('[PROCESSMSG] Marie Curie - completing message', body);
  } else {
    context.log('[PROCESSMSG] Other - completed message', body);
  }
}

function handler(messages: Array<string>, context: InvocationContext): Promise<Array<PromiseSettledResult<void>>> {
  return Promise.allSettled(messages.map(msg => processMessage(msg, context)))
}

class MessageCompleter {

  #mutex: Promise<void>
  timerId: NodeJS.Timeout = setTimeout(() => { }, 0)

  constructor(private context: ServiceBusMessageContext, private index: number, private ctx: InvocationContext) {
    this.#mutex = Promise.resolve();
    this.#watchMessageLockTimeout()
  }

  get message(): ServiceBusReceivedMessage {
    if (Array.isArray(this.context.messages)) {
      return this.context.messages[this.index];
    }
    return this.context.messages
  }

  #watchMessageLockTimeout(): void {
    this.timerId = setTimeout(async () => {
      this.#mutex.then(async () => {
        this.ctx.log('[MESSAGECOMPLETER][LOCK] Renewing lock for message:', this.message.messageId);
        await this.context.actions.renewMessageLock(this.message)

        this.#watchMessageLockTimeout()
      })
      this.ctx.log('[MESSAGECOMPLETER][LOCK] Lock renewed for message:', this.message.messageId);
      // this has to be configurable, ideally from the message
    }, 9000)
  }

  async complete(): Promise<void> {
    return await this.#mutex
      .then(() => {
        clearTimeout(this.timerId)
        this.ctx.log(`[MESSAGECOMPLETER][COMPLETE] Clearing timer(${this.timerId}): ${this.message.messageId}`);
      }).then(async () => {
        this.ctx.log(`[MESSAGECOMPLETER][COMPLETE] Completing message: ${this.message.messageId}`);
        return this.context.actions.complete(this.message).then(() => {
          this.ctx.log(`[MESSAGECOMPLETER][COMPLETE] Completed message: ${this.message.messageId}`);
        })
      })
  }

  async abandon(): Promise<void> {
    return await this.#mutex
      .then(() => {
        clearTimeout(this.timerId)
        console.log(`[MESSAGECOMPLETER][ABANDON] Clearing timer(${this.timerId}): ${this.message.messageId}`);
      }).then(async () => {
        console.log("[MESSAGECOMPLETER][ABANDON] Abandoning message:", this.message.messageId, this.message.lockToken, this.message.body);
        // Why does the second parameter is required? Can it be optional?
        // @ts-ignore
        return this.context.actions.abandon(this.message).then(() => {
          console.log(`[MESSAGECOMPLETER][ABANDON] Abandoned message: ${this.message.messageId}`);
        });
      })
  }
}

function middleware(handler: (messages: Array<string>, context: InvocationContext) => Promise<Array<PromiseSettledResult<void>>>): (serviceBusMessageContext: ServiceBusMessageContext, context: InvocationContext) => Promise<void> {

  return async function(serviceBusMessageContext: ServiceBusMessageContext, context: InvocationContext) {
    const payloads: Array<string> = []
    const messageCompleters: Array<MessageCompleter> = []
    const messages = Array.isArray(serviceBusMessageContext.messages) ? serviceBusMessageContext.messages : [serviceBusMessageContext.messages];
    let index = 0
    for (const message of messages) {
      context.debug('Message body:', message.body);
      const content = JSON.parse(message.body) as string;
      payloads.push(content)
      // @ts-ignore
      messageCompleters.push(new MessageCompleter(serviceBusMessageContext, index, context));
      // at the moment we have following properties missing from message object
      // - message.lockedUntilUtc
      // - message.enqueuedTimeUtc,
      // which makes it hard to implement renew lock, unless hardcoding value configured for the queue
      index += 1
    }

    const results = await handler(payloads, context)

    // Later change to promise all
    for (const [index, result] of results.entries()) {
      const message = messages[index];
      if (result.status === 'fulfilled') {
        context.log('[MIDDLEWARE] Message processed successfully, completing:', message.messageId);
        try {
          await messageCompleters[index].complete()
        } catch (err) {
          context.error("[MIDDLEWARE] Completing message failed:", message.messageId, err);
        }
      } else {
        //@ts-ignore
        context.log("[MIDDLEWARE] Abandoning message lock token:", message.messageId, serviceBusMessageContext.messages[index].lockToken);
        context.log('[MIDDLEWARE] Message processing failed, abandoning:', message.messageId);
        try {
          await messageCompleters[index].abandon()
        } catch (err) {
          context.error("[MIDDLEWARE] Abandon request failed:", message.messageId, err);
        }
      }
    }
  }
}

async function serviceBusHandler(serviceBusMessageContext: ServiceBusMessageContext, context: InvocationContext): Promise<void> {

  //@ts-ignore
  const message = serviceBusMessageContext.messages[0]
  setTimeout(async () => {
    await serviceBusMessageContext.actions.renewMessageLock(message)
  })
  await sleep(11000)

  await serviceBusMessageContext.actions.abandon(message)
}

app.serviceBusQueue("serviceBusTrigger", {
  connection: "AzureWebJobsServiceBus",
  queueName: "messages",
  cardinality: "many",
  sdkBinding: true, //Ensure this is set to true
  autoCompleteMessages: false, //Exposing this so that customer can take action on the messages
  handler: middleware(handler),
});

