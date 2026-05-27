import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { TimestampEntity } from 'src/commun/entities/timestamp.entity';
import { WebhookDelivery } from './webhook-delivery.entity';

@Entity('webhook_subscriptions')
export class WebhookSubscription extends TimestampEntity {
  @Column()
  targetUrl!: string;

  @Column({ type: 'text', nullable: true })
  secret!: string | null;

  @Column({ type: 'uuid', nullable: true })
  contestId!: string | null;

  @Column({ default: true })
  active!: boolean;

  @OneToMany(() => WebhookDelivery, (d) => d.subscription)
  deliveries?: WebhookDelivery[];
}
