import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('notes')
@Index(['id'])
@Index(['createdAt'])
export class Note {
  @PrimaryColumn('uuid')
  id!: string;

  @Column('text')
  text!: string;

  @Column('varchar', { length: 255 })
  passwordHash!: string;

  @Column('text', { nullable: true })
  summary!: string | null;

  @Column('timestamp', { nullable: true })
  summaryGeneratedAt!: Date | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
