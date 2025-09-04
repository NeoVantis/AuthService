import {
  Body,
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Query,
  Version,
  Headers,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './user.entity';
import { AuthService } from '../auth/auth.service';

@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly authService: AuthService,
  ) {}

  @Post()
  @Version('1')
  create(@Body() dto: CreateUserDto): Promise<User> {
    // NOTE: controller not used for auth; kept for manual tests only
    return this.usersService.create({
      username: 'test_user_' + Date.now(),
      email: dto.email,
      passwordHash: dto.password,
      stepOneComplete: true,
      stepTwoComplete: false,
    });
  }

  @Get()
  @Version('1')
  async list(): Promise<User[]> {
    // not for prod, just sanity check
    return [];
  }

  @Get('find')
  @Version('1')
  async findUser(
    @Query('username') username?: string,
    @Query('email') email?: string,
  ): Promise<{ user: Partial<User> | null }> {
    let user: User | null = null;

    if (username) {
      user = await this.usersService.findByUsername(username);
    } else if (email) {
      user = await this.usersService.findByEmail(email);
    }

    if (!user) {
      return { user: null };
    }

    const profile = await this.usersService.getUserProfile(user.id);
    return { user: profile };
  }

  @Get(':id')
  @Version('1')
  async getUserById(@Param('id') id: string): Promise<{ user: Partial<User> }> {
    const user = await this.usersService.getUserProfile(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return { user };
  }

  @Put(':id')
  @Version('1')
  async updateUser(
    @Param('id') id: string,
    @Body() updateData: UpdateUserDto,
    @Headers('authorization') authorization?: string,
  ): Promise<{ user: Partial<User> }> {
    // Verify user owns this profile or has admin access
    if (!authorization || !authorization.startsWith('Bearer ')) {
      throw new UnauthorizedException('Access token required');
    }

    const token = authorization.substring(7);
    const tokenUser = await this.authService.getUserFromToken(token);

    if (!tokenUser || tokenUser.id !== id) {
      throw new UnauthorizedException('You can only update your own profile');
    }

    const updatedUser = await this.usersService.updateUser(id, updateData);
    const profile = await this.usersService.getUserProfile(updatedUser.id);
    return { user: profile as Partial<User> };
  }

  @Delete(':id')
  @Version('1')
  async softDeleteUser(
    @Param('id') id: string,
    @Headers('authorization') authorization?: string,
  ): Promise<{ message: string }> {
    // Verify user owns this profile
    if (!authorization || !authorization.startsWith('Bearer ')) {
      throw new UnauthorizedException('Access token required');
    }

    const token = authorization.substring(7);
    const tokenUser = await this.authService.getUserFromToken(token);

    if (!tokenUser || tokenUser.id !== id) {
      throw new UnauthorizedException('You can only delete your own profile');
    }

    await this.usersService.softDelete(id);
    return { message: 'User account deactivated successfully' };
  }
}
