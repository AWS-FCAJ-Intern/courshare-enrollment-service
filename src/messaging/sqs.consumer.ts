import {
  DeleteMessageCommand,
  ReceiveMessageCommand,
} from '@aws-sdk/client-sqs';

import { sqsClient } from '../config/sqs';
import { Message } from "@aws-sdk/client-sqs";

import { RegisterCourseService, RemoveEnrollmentService } from '../services/enrollment.service';
import { PaymentEvent, PaymentEventType } from "../events/payment.event";

class PaymentConsumer {
  private readonly queueUrl = process.env.PAYMENT_SQS_QUEUE_URL!;

  async start() {
    while (true) {
      try {
        await this.receiveMessages();
      } catch (err) {
        console.error(err);

        await new Promise(resolve =>
          setTimeout(resolve, 3000)
        );
      }
    }
  }
  async receiveMessages() {
    const command = new ReceiveMessageCommand({
      QueueUrl: this.queueUrl,
      MaxNumberOfMessages: 10,
      WaitTimeSeconds: 20,
    });
    const response = await sqsClient.send(command);
    if (!response.Messages?.length) {
      return;
    }
    for (const message of response.Messages) {
      try {
        await this.handleMessage(message);
      } catch (error) {
        console.error("Error handling message:", error);
      }
    }
  }
  async handleMessage(message: Message) {
    if (!message.Body) {
      console.warn("Empty message body");
      return;
    }

    let body: PaymentEvent;

    try {
      body = JSON.parse(message.Body);
    } catch (err) {
      console.error("Invalid message format");

      await this.deleteMessage(message.ReceiptHandle!);

      return;
    }
    const { eventType, payload } = body;
    switch (eventType) {
      case PaymentEventType.COURSE_PURCHASED:
        // Handle course purchased event
        try {
          await RegisterCourseService(payload.userId, payload.courseId);
          await this.deleteMessage(message.ReceiptHandle!);
        } catch (error) {
          console.error("Error registering course:", error);
        }
        break;
      case PaymentEventType.COURSE_REFUNDED:
        // Handle course refunded event
        try {
          await RemoveEnrollmentService(payload.userId, payload.courseId);
          await this.deleteMessage(message.ReceiptHandle!);
        } catch (error) {
          console.error("Error removing enrollment:", error);
        }
        break;
      default:
        console.warn(`Unhandled event type: ${eventType}`);
        await this.deleteMessage(message.ReceiptHandle!);
        break;
    }
  }
  async deleteMessage(receiptHandle: string) {
    try {
      const deleteMessageCommand = new DeleteMessageCommand({
        QueueUrl: this.queueUrl,
        ReceiptHandle: receiptHandle,
      });
      await sqsClient.send(deleteMessageCommand);
    } catch (error) {
      console.error("Error deleting message:", error);
    }
  }
}

export const paymentConsumer = new PaymentConsumer();