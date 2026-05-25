export interface KafkaEvent {
  key: string;
  value: {
    eventType: string;
    timestamp: string;
    [key: string]: unknown;
  };
}
