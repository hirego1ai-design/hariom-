import { SystemEvent } from '@prisma/client';

type ConsumerHandler = (event: SystemEvent) => Promise<void>;

interface Consumer {
  consumerId: string;
  handler: ConsumerHandler;
}

export class ConsumerRegistry {
  private static consumers: Map<string, Consumer[]> = new Map();

  static register(eventType: string, consumerId: string, handler: ConsumerHandler): void {
    if (!this.consumers.has(eventType)) {
      this.consumers.set(eventType, []);
    }
    const existing = this.consumers.get(eventType)!;
    if (existing.some((c) => c.consumerId === consumerId)) {
      return; // Deduplicate consumer registration
    }
    existing.push({ consumerId, handler });
  }

  static getConsumers(eventType: string): Consumer[] {
    return this.consumers.get(eventType) || [];
  }
}
