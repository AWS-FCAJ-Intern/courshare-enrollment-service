import {
    SendMessageCommand
} from "@aws-sdk/client-sqs";

import { sqsClient } from "../config/sqs";

import {EnrollmentEvent} from "../events/enrollment.event";


export class SqsPublisher {
  async EnrollmentPublisher(event: EnrollmentEvent): Promise<void> {
    const command = new SendMessageCommand({
      QueueUrl: process.env.SQS_QUEUE_URL,
      MessageBody: JSON.stringify(event),
    });
    await sqsClient.send(command);
  }
}

export const sqsPublisher = new SqsPublisher();