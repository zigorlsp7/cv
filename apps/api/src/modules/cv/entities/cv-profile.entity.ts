import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export type CvSection = {
  id: string;
  title: string;
  summary: string;
  bullets: string[];
};

export type CvDocument = {
  fullName: string;
  role: string;
  tagline: string;
  chips: string[];
  sections: CvSection[];
};

@Entity({ name: 'cv_profiles' })
@Index('UQ_cv_profiles_slug', ['slug'], { unique: true })
export class CvProfile {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 64, default: 'primary' })
  slug!: string;

  @Column({ type: 'jsonb' })
  content!: CvDocument;

  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamptz',
    default: () => 'CURRENT_TIMESTAMP',
  })
  createdAt!: Date;

  @UpdateDateColumn({
    name: 'updated_at',
    type: 'timestamptz',
    default: () => 'CURRENT_TIMESTAMP',
  })
  updatedAt!: Date;
}

