import { Entity, Column, PrimaryGeneratedColumn, ManyToOne } from 'typeorm';
import { TimestampEntity } from 'src/commun/entities/timestamp.entity';
import { WebhookSubscription } from './webhook-subscription.entity';

export enum WebhookDeliveryStatus {
  PENDING = 'pending',
  SENT = 'sent',
  FAILED = 'failed',
}

@Entity('webhook_deliveries')
export class WebhookDelivery extends TimestampEntity {
  @ManyToOne(() => WebhookSubscription, (s) => s.deliveries, { nullable: false })
  subscription!: WebhookSubscription;

  @Column({ type: 'enum', enum: WebhookDeliveryStatus, default: WebhookDeliveryStatus.PENDING })
  status!: WebhookDeliveryStatus;

  @Column({ default: 0 })
  attempts!: number;

  @Column({ type: 'timestamp', nullable: true })
  lastAttemptAt!: Date | null;

  @Column({ type: 'integer', nullable: true })
  responseCode!: number | null;

  @Column('text')
  payload!: string;
}
