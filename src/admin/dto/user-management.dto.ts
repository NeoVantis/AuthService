import {
  IsOptional,
  IsNumber,
  IsBoolean,
  IsString,
  IsIn,
  Min,
  Max,
  MaxLength,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class GetUsersQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'Page must be a number' })
  @Min(1, { message: 'Page must be at least 1' })
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'Limit must be a number' })
  @Min(1, { message: 'Limit must be at least 1' })
  @Max(100, { message: 'Limit cannot exceed 100' })
  limit?: number = 10;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return undefined;
  })
  @IsBoolean({ message: 'Verified must be a boolean' })
  verified?: boolean;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return undefined;
  })
  @IsBoolean({ message: 'Active must be a boolean' })
  active?: boolean;

  // Search functionality
  @IsOptional()
  @IsString({ message: 'Search must be a string' })
  @MaxLength(100, { message: 'Search term cannot exceed 100 characters' })
  search?: string;

  @IsOptional()
  @IsString({ message: 'Search field must be a string' })
  @IsIn(['username', 'email', 'fullName', 'college', 'all'], {
    message:
      'Search field must be one of: username, email, fullName, college, all',
  })
  searchField?: 'username' | 'email' | 'fullName' | 'college' | 'all' = 'all';

  // Sorting functionality
  @IsOptional()
  @IsString({ message: 'Sort by must be a string' })
  @IsIn(
    ['username', 'email', 'fullName', 'createdAt', 'isVerified', 'isActive'],
    {
      message:
        'Sort by must be one of: username, email, fullName, createdAt, isVerified, isActive',
    },
  )
  sortBy?:
    | 'username'
    | 'email'
    | 'fullName'
    | 'createdAt'
    | 'isVerified'
    | 'isActive' = 'createdAt';

  @IsOptional()
  @IsString({ message: 'Sort order must be a string' })
  @IsIn(['ASC', 'DESC'], {
    message: 'Sort order must be either ASC or DESC',
  })
  sortOrder?: 'ASC' | 'DESC' = 'DESC';
}

export class DeactivateUserDto {
  @IsOptional()
  @IsString({ message: 'Reason must be a string' })
  reason?: string;
}
