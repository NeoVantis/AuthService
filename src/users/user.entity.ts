import {
  BeforeInsert,
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';

@Entity('users')
@Unique(['email'])
@Unique(['username'])
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 50 })
  username: string;

  @Column({ type: 'varchar', length: 255 })
  email: string;

  @Column({ name: 'password_hash', type: 'varchar', length: 255 })
  passwordHash: string;

  // Step 1 signup fields (username, email, password)
  @Column({ name: 'step_one_complete', type: 'boolean', default: false })
  stepOneComplete: boolean;

  // Step 2 signup fields
  @Column({ name: 'full_name', type: 'varchar', length: 255, nullable: true })
  fullName?: string;

  @Column({ name: 'phone_number', type: 'varchar', length: 20, nullable: true })
  phoneNumber?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  college?: string;

  @Column({ type: 'text', nullable: true })
  address?: string;

  @Column({ name: 'step_two_complete', type: 'boolean', default: false })
  stepTwoComplete: boolean;

  // Account status
  @Column({ name: 'is_verified', type: 'boolean', default: false })
  isVerified: boolean;

  @Column({ name: 'email_verified_at', type: 'timestamp', nullable: true })
  emailVerifiedAt?: Date;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @Column({ name: 'deleted_at', type: 'timestamp', nullable: true })
  deletedAt?: Date;

  // Password reset tracking
  @Column({ name: 'password_reset_count', type: 'int', default: 0 })
  passwordResetCount: number;

  @Column({ name: 'last_password_reset', type: 'timestamp', nullable: true })
  lastPasswordReset?: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @BeforeInsert()
  normalizeFields() {
    this.email = this.email?.toLowerCase().trim();
    this.username = this.username?.toLowerCase().trim();
  }

  // Helper method to check if signup is complete
  get isSignupComplete(): boolean {
    return this.stepOneComplete && this.stepTwoComplete;
  }
}
