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
   * Finds a user by either email or username (case-insensitive) including soft-deleted users
   * @param identifier - Email or username to search for
   * @returns Promise containing user or null if not found
   */
  async findByEmailOrUsernameIncludingDeleted(
    identifier: string,
  ): Promise<User | null> {
    const lowerIdentifier = identifier.toLowerCase();
    return await this.repo.findOne({
      where: [{ email: lowerIdentifier }, { username: lowerIdentifier }],
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
   * Finds a user by ID including soft-deleted users
   * @param id - User ID to search for
   * @returns Promise containing user or null if not found
   */
  async findByIdIncludingDeleted(id: string): Promise<User | null> {
    return await this.repo.findOne({
      where: {
        id,
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
    const updatedUser = await this.findById(id);
    if (!updatedUser) {
      throw new NotFoundException('User not found after update');
    }
    return updatedUser;
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

  async clearDeletedAt(id: string): Promise<void> {
    await this.repo
      .createQueryBuilder()
      .update(User)
      .set({ deletedAt: () => 'NULL' })
      .where('id = :id', { id })
      .execute();
  }

  async reactivateUser(id: string): Promise<void> {
    await this.repo
      .createQueryBuilder()
      .update(User)
      .set({
        isActive: true,
        deletedAt: () => 'NULL',
      })
      .where('id = :id', { id })
      .execute();
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
    });
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  // Get user profile (safe data without sensitive info)
  async getUserProfile(id: string): Promise<Partial<User> | null> {
    const user = await this.findById(id);
    if (!user) {
      return null;
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, deletedAt, ...profile } = user;
    return profile;
  }

  /**
   * Finds users with pagination, filtering, and search, along with total count
   * @param options - Query options including where conditions, pagination, select fields, and order
   * @returns Promise containing array of users and total count
   */
  async findAndCountWithSearch(options: {
    where?: any;
    skip?: number;
    take?: number;
    select?: (keyof User)[];
    order?: any;
  }): Promise<[User[], number]> {
    const queryBuilder = this.repo.createQueryBuilder('user');
    
    // Always filter out soft-deleted users
    queryBuilder.where('user.deletedAt IS NULL');

    // Apply additional filters
    if (options.where) {
      if (options.where.$or) {
        // Handle search conditions
        const searchConditions = options.where.$or;
        delete options.where.$or;
        
        // Add non-search filters first
        Object.keys(options.where).forEach(key => {
          queryBuilder.andWhere(`user.${key} = :${key}`, { [key]: options.where[key] });
        });

        // Add search conditions with OR
        if (searchConditions.length > 0) {
          const searchQuery = searchConditions.map((condition: any, index: number) => {
            const field = Object.keys(condition)[0];
            const value = condition[field].$like;
            queryBuilder.setParameter(`search${index}`, value);
            return `LOWER(user.${field}) LIKE LOWER(:search${index})`;
          }).join(' OR ');
          
          queryBuilder.andWhere(`(${searchQuery})`);
        }
      } else {
        // Handle regular filters
        Object.keys(options.where).forEach(key => {
          queryBuilder.andWhere(`user.${key} = :${key}`, { [key]: options.where[key] });
        });
      }
    }

    // Apply select fields
    if (options.select) {
      const selectFields = options.select.map(field => `user.${field as string}`);
      queryBuilder.select(selectFields);
    }

    // Apply ordering
    if (options.order) {
      Object.keys(options.order).forEach(field => {
        queryBuilder.addOrderBy(`user.${field}`, options.order[field]);
      });
    }

    // Apply pagination
    if (options.skip !== undefined) {
      queryBuilder.offset(options.skip);
    }
    if (options.take !== undefined) {
      queryBuilder.limit(options.take);
    }

    return queryBuilder.getManyAndCount();
  }

  /**
   * Finds users with pagination and filtering, along with total count
   * @param options - Query options including where conditions, pagination, select fields, and order
   * @returns Promise containing array of users and total count
   */
  async findAndCount(options: {
    where?: any;
    skip?: number;
    take?: number;
    select?: (keyof User)[];
    order?: any;
  }): Promise<[User[], number]> {
    const queryOptions = {
      ...options,
      where: {
        ...options.where,
        deletedAt: IsNull(), // Always filter out soft-deleted users
      },
    };

    return await this.repo.findAndCount(queryOptions);
  }

  /**
   * Finds ALL users including deactivated ones (for admin use)
   * @param options - Query options including where conditions, pagination, select fields, and order
   * @returns Promise containing array of users and total count
   */
  async findAndCountIncludingDeactivated(options: {
    where?: any;
    skip?: number;
    take?: number;
    select?: (keyof User)[];
    order?: any;
  }): Promise<[User[], number]> {
    // Don't filter out soft-deleted users for admin searches
    const queryOptions = {
      ...options,
      where: {
        ...options.where,
        // No deletedAt filter - include all users
      },
    };

    return await this.repo.findAndCount(queryOptions);
  }
}
