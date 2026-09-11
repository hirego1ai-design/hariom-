import { prisma } from '@/lib/prisma';
import { OutboxEntry, Prisma } from '@prisma/client';
import { ConsumerRegistry } from './ConsumerRegistry';

export class EventDispatcher {
  static async dispatchOutboxEntry(entry: OutboxEntry): Promise<void> {
    const systemEvent = await prisma.systemEvent.upsert({
      where: { idempotencyKey: entry.idempotencyKey },
      update: {},
      create: {
        eventType: entry.eventType,
        payload: entry.payload as Prisma.InputJsonValue,
        correlationId: entry.correlationId,
        companyId: entry.companyId,
        idempotencyKey: entry.idempotencyKey,
      },
    });

    const consumers = ConsumerRegistry.getConsumers(entry.eventType);

    for (const consumer of consumers) {
      const existingCheckpoint = await prisma.eventConsumerCheckpoint.findFirst({
        where: {
          idempotencyKey: entry.idempotencyKey,
          consumerId: consumer.consumerId,
          status: 'PROCESSED',
        },
      });

      if (existingCheckpoint) {
        continue;
      }

      await consumer.handler(systemEvent);

      await prisma.eventConsumerCheckpoint.upsert({
        where: { idempotencyKey_consumerId: { idempotencyKey: entry.idempotencyKey, consumerId: consumer.consumerId } },
        update: { status: 'PROCESSED', processedAt: new Date() },
        create: {
          idempotencyKey: entry.idempotencyKey,
          consumerId: consumer.consumerId,
          status: 'PROCESSED',
          processedAt: new Date(),
        },
      });
    }
  }
}
