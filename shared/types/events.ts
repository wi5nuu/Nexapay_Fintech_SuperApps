import { v4 as uuidv4 } from 'uuid';

/**
 * Interface representing a Domain Event
 */
export interface IDomainEvent {
  dateTimeOccurred: Date;
  getAggregateId(): string;
}

/**
 * Base abstract class for Domain Events
 * used to communicate changes within the domain or across microservices.
 */
export abstract class DomainEvent implements IDomainEvent {
  public readonly dateTimeOccurred: Date;
  public readonly eventId: string;

  constructor() {
    this.dateTimeOccurred = new Date();
    this.eventId = uuidv4();
  }

  abstract getAggregateId(): string;
}

/**
 * Base class for an Integration Event
 * typically sent across microservices boundaries (e.g., via Kafka).
 */
export abstract class IntegrationEvent extends DomainEvent {
  public readonly correlationId?: string;

  constructor(correlationId?: string) {
    super();
    this.correlationId = correlationId;
  }
}
