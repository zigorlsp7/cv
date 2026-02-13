import { Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'dummy' })
export class Dummy {
  @PrimaryGeneratedColumn()
  id!: number;
}
