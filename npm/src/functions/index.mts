import "@azure/functions-extensions-servicebus";
import { ServiceBusClient } from "@azure/service-bus";
import { ServiceBusReceivedMessage } from '@azure/service-bus';
import { ServiceBusMessageContext } from "@azure/functions-extensions-servicebus"
import { app, InvocationContext } from "@azure/functions";
import { setTimeout as sleep } from "timers/promises";
import { v4 } from "uuid";

type MessagePayload = Record<string, string>

async function processMessage(body: MessagePayload, context: InvocationContext): Promise<void> {
  console.log('what is the body', body)
  if (body?.text === "Nikolaus Kopernikus") {
    context.log('[PROCESSMSG] Nikolaus Kopernikus - abandonding', body);
    throw Error("Abandoning message for testing");
  } else if (body?.text === "Marie Curie") {
    // set have 10 seconds lock duration
    context.log('[PROCESSMSG] Marie Curie - sleeping for 11 seconds to test renew lock', body);
    await sleep(11000);
    context.log('[PROCESSMSG] Marie Curie - completing message', body);
  } else {
    context.log('[PROCESSMSG] Other - completed message', body);
  }
}

function handler(messages: Array<MessagePayload>, context: InvocationContext): Promise<Array<PromiseSettledResult<void>>> {
  return Promise.allSettled(messages.map(msg => processMessage(msg, context)))
}

class MessageCompleter {

  #mutex: Promise<void>
  #timerId: NodeJS.Timeout | undefined

  constructor(private context: ServiceBusMessageContext, private index: number, private ctx: InvocationContext) {
    this.#mutex = Promise.resolve();
    this.#watchMessageLockTimeout()
    // console.log(context.messages[this.index])
    // console.log(context.messages[this.index].applicationProperties)
  }

  get message(): ServiceBusReceivedMessage {
    if (Array.isArray(this.context.messages)) {
      return this.context.messages[this.index];
    }
    return this.context.messages
  }

  #watchMessageLockTimeout(): void {
    //@ts-ignore
    const renewTime = this.message.lockedUntilUtc?.getTime() - Date.now() - 500
    console.log('what is renew time', renewTime)

    this.#timerId = setTimeout(async () => {
      this.#mutex.then(async () => {
        this.ctx.log('[MESSAGECOMPLETER][LOCK] Renewing lock for message:', this.message.messageId);
        await this.context.actions.renewMessageLock(this.message)

        this.#watchMessageLockTimeout()
      })
      this.ctx.log('[MESSAGECOMPLETER][LOCK] Lock renewed for message:', this.message.messageId);
      // this has to be configurable, ideally from the message
    }, renewTime)
  }

  async complete(): Promise<void> {
    return await this.#mutex
      .then(() => {
        this.#timerId && clearTimeout(this.#timerId)
        this.ctx.log(`[MESSAGECOMPLETER][COMPLETE] Clearing timer(${this.#timerId}): ${this.message.messageId}`);
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
        this.#timerId && clearTimeout(this.#timerId)
        console.log(`[MESSAGECOMPLETER][ABANDON] Clearing timer(${this.#timerId}): ${this.message.messageId}`);
      }).then(async () => {
        console.log("[MESSAGECOMPLETER][ABANDON] Abandoning message:", this.message.messageId, this.message.lockToken, this.message.body);
        // this.message.scheduledEnqueueTimeUtc = new Date(new Date().getTime() + 10000); // 10 seconds delay
        // const oneHourMs = 60 * 60 * 1000
        const oneMinute = 60
        const delaySeconds = new Date(new Date().getTime() + 10000 - oneMinute)///.toUTCString()

        console.log(`[MESSAGECOMPLETER][ABANDON] Abandoning message: ${this.message.deliveryCount} with delay ${delaySeconds}`);
        // create delay seconds in utc timesonze
        // this.message.scheduledEnqueueTimeUtc = delaySeconds


        // const textEncoder = new TextEncoder();
        // return this.context.actions.abandon(this.message, textEncoder.encode(JSON.stringify({ scheduledEnqueueTimeUtc: delaySeconds }))).then(() => {
        // return this.context.actions.abandon(this.message, Buffer.from(JSON.stringify(['scheduledEnqueueTimeUtc', delaySeconds.toUTCString()]))).then(() => {
        console.log('service bus connection string', process.env.AzureWebJobsServiceBus)
        const fullyQualifiedNamespace = process.env.AzureWebJobsServiceBus as string
        const sbClient = new ServiceBusClient(fullyQualifiedNamespace);
        const sender = sbClient.createSender("mock-queue")
        const scheduledEnqueueTime = new Date(Date.now() + (10 * 1000));
        console.log("this.message.applicationProperties?.count", this.message.applicationProperties?.count)
        let retryCount = this.message.applicationProperties?.retryCount as number
        if (retryCount === undefined) {
          retryCount = 0
        }
        console.log(">>> retry count", retryCount)
        if (retryCount >= 10) {
          console.log('>>> Max retry count reached, completing message', this.message.body)
          return this.context.actions.deadletter(this.message)
        }
        console.log('>>> before scheduling message', this.message.body)
        const scheduledMsg = {
          ...this.message,
          body: this.message.body,
          messageId: v4(),
          scheduledEnqueueTime: scheduledEnqueueTime,
          retryCnt: 10,
          applicationProperties: {
            ...this.message.applicationProperties,
            retryCount: retryCount + 1,
          }
        }
        console.log('>>> before scheduling message', JSON.stringify(scheduledMsg))

        await sender.scheduleMessages([scheduledMsg], scheduledEnqueueTime);
        await sender.close();
        await sbClient.close();
        return this.context.actions.complete(this.message)
          // return this.context.actions.abandon(this.message, {
          //   scheduledEnqueueTimeUtc: delaySeconds,
          //   retryCnt: (this.message.deliveryCount ?? 0) + 1,
          //   lastRetryTime: new Date().toISOString(),
          //   errorMessage: "Processing failed"
          // })
          .then(() => {
            console.log(`[MESSAGECOMPLETER][ABANDON] Abandoned message: ${this.message.messageId}`);
          });
      })
  }
}

function middleware(handler: (messages: Array<MessagePayload>, context: InvocationContext) => Promise<Array<PromiseSettledResult<void>>>): (serviceBusMessageContext: ServiceBusMessageContext, context: InvocationContext) => Promise<void> {

  return async function(serviceBusMessageContext: ServiceBusMessageContext, context: InvocationContext) {
    const payloads: Array<MessagePayload> = []
    const messageCompleters: Array<MessageCompleter> = []
    const messages = Array.isArray(serviceBusMessageContext.messages) ? serviceBusMessageContext.messages : [serviceBusMessageContext.messages];
    let index = 0
    for (const message of messages) {
      context.debug('Message body:', message.body);
      const content = JSON.parse(message.body) as MessagePayload;
      payloads.push(content)
      messageCompleters.push(new MessageCompleter(serviceBusMessageContext, index, context));
      //@ts-ignore
      console.log('what is message attributes', (message.lockedUntilUtc?.getTime() - message.enqueuedTimeUtc?.getTime()))
      // at the moment we have following properties missing from message object
      // - message.lockedUntilUtc
      // - message.enqueuedTimeUtc,
      // which makes it hard to implement renew lock, unless hardcoding value configured for the queue
      index += 1
    }

    const results = await handler(payloads, context)

    // Promise allSettled to ensure we attempt to complete/abandon all messages
    // if they fails to complete they will be back to the queue after lock expires
    await Promise.allSettled(results.map(async (result, index) => {
      const message = messages[index];
      if (result.status === 'fulfilled') {
        context.log('[MIDDLEWARE] Message processed successfully, completing:', message.messageId);
        try {
          await messageCompleters[index].complete()
        } catch (err) {
          context.error("[MIDDLEWARE] Completing message failed:", message.messageId, err);
        }
      } else {
        context.log("[MIDDLEWARE] Abandoning message lock token:", message.messageId, messages[index].lockToken);
        context.log('[MIDDLEWARE] Message processing failed, abandoning:', message.messageId);
        try {
          await messageCompleters[index].abandon()
        } catch (err) {
          context.error("[MIDDLEWARE] Abandon request failed:", message.messageId, err);
        }
      }
    }))
  }
}

function defaultHandler(message: any, context: InvocationContext) {
  context.log('Service bus queue function processed message:', message);
  context.log('EnqueuedTimeUtc =', context.triggerMetadata?.enqueuedTimeUtc);
  context.log('DeliveryCount =', context.triggerMetadata?.deliveryCount);
  context.log('MessageId =', context.triggerMetadata?.messageId);
  throw new Error("Abandoning message for testing");
}

app.serviceBusQueue("serviceBusTrigger", {
  connection: "AzureWebJobsServiceBus",
  // queueName: "messages",
  queueName: "mock-queue",
  cardinality: "one",
  sdkBinding: true, //Ensure this is set to true
  autoCompleteMessages: false, //Exposing this so that customer can take action on the messages
  handler: middleware(handler),
  // handler: defaultHandler,
});

