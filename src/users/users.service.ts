import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { User } from './user.entity';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly repo: Repository<User>,
  ) {}

  /**
   * Finds a user by email address (case-insensitive)
   * @param email - Email address to search for
   * @returns Promise containing user or null if not found
   */
  async findByEmail(email: string): Promise<User | null> {
    return await this.repo.findOne({
      where: {
        email: email.toLowerCase(),
        deletedAt: IsNull(),
      },
    });
  }

  /**
   * Finds a user by username (case-insensitive)
   * @param username - Username to search for
   * @returns Promise containing user or null if not found
   */
  async findByUsername(username: string): Promise<User | null> {
    return await this.repo.findOne({
      where: {
        username: username.toLowerCase(),
        deletedAt: IsNull(),
      },
    });
  }

  /**
   * Finds a user by either email or username (case-insensitive)
   * @param identifier - Email or username to search for
   * @returns Promise containing user or null if not found
   */
  async findByEmailOrUsername(identifier: string): Promise<User | null> {
    const lowerIdentifier = identifier.toLowerCase();
    return await this.repo.findOne({
      where: [
        { email: lowerIdentifier, deletedAt: IsNull() },
        { username: lowerIdentifier, deletedAt: IsNull() },
      ],
    });
  }

  /**
   * Finds a user by ID
   * @param id - User ID to search for
   * @returns Promise containing user or null if not found
   */
  async findById(id: string): Promise<User | null> {
    return await this.repo.findOne({
      where: {
        id,
        deletedAt: IsNull(),
      },
    });
  }

  /**
   * Creates a new user in the database
   * @param user - Partial user object with required fields
   * @returns Promise containing the created user
   */
  async create(user: Partial<User>): Promise<User> {
    const entity = this.repo.create(user);
    return await this.repo.save(entity);
  }

  /**
   * Updates a user's information
   * @param id - User ID to update
   * @param updateData - Fields to update
   * @returns Promise containing the updated user
   * @throws NotFoundException if user not found
   * @throws ConflictException if username already taken
   */
  async updateUser(id: string, updateData: UpdateUserDto): Promise<User> {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if username is being updated and if it's already taken
    if (updateData.username && updateData.username !== user.username) {
      const existingUser = await this.findByUsername(updateData.username);
      if (existingUser) {
        throw new ConflictException('Username already taken');
      }
    }

    await this.repo.update(id, updateData);
    return await this.findById(id);
  }

  async softDelete(id: string): Promise<boolean> {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    await this.repo.update(id, {
      deletedAt: new Date(),
      isActive: false,
    });

    return true;
  }

  async incrementPasswordResetCount(id: string): Promise<void> {
    await this.repo.update(id, {
      passwordResetCount: () => 'password_reset_count + 1',
      lastPasswordReset: new Date(),
    });
  }

  async updatePassword(id: string, passwordHash: string): Promise<void> {
    await this.repo.update(id, { passwordHash });
    await this.incrementPasswordResetCount(id);
  }

  async completeStepTwo(id: string, stepTwoData: Partial<User>): Promise<User> {
    await this.repo.update(id, {
      ...stepTwoData,
      stepTwoComplete: true,
      isVerified: true,
    });
    return (await this.findById(id)) as User;
  }

  // Get user profile (safe data without sensitive info)
  async getUserProfile(id: string): Promise<Partial<User> | null> {
    const user = await this.findById(id);
    if (!user) {
      return null;
    }

    const { passwordHash, deletedAt, ...profile } = user;
    return profile;
  }
}
