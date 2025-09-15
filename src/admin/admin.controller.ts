import {
  Body,
  Controller,
  Post,
  Get,
  Patch,
  Param,
  Query,
  Version,
  Headers,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { AuthService } from '../auth/auth.service';
import { UsersService } from '../users/users.service';
import { AdminLoginDto } from './dto/admin-login.dto';
import { CreateAdminDto } from './dto/create-admin.dto';
import { GetUsersQueryDto, DeactivateUserDto } from './dto/user-management.dto';

@Controller('admin')
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
  ) {}

  @Post('login')
  @Version('1')
  login(@Body() adminLoginDto: AdminLoginDto) {
    return this.adminService.login(adminLoginDto);
  }

  @Post('create')
  @Version('1')
  async create(
    @Body() createAdminDto: CreateAdminDto,
    @Headers('authorization') authorization?: string,
  ) {
    // Verify that the requesting user is a super admin
    const requestingAdmin = await this.validateAdminToken(authorization);

    return this.adminService.create(createAdminDto, requestingAdmin.id);
  }

  @Get('list')
  @Version('1')
  async listAdmins(@Headers('authorization') authorization?: string) {
    // Verify that the requesting user is a super admin
    const requestingAdmin = await this.validateAdminToken(authorization);

    return this.adminService.getAllAdmins(requestingAdmin.id);
  }

  @Get('me')
  @Version('1')
  async getProfile(@Headers('authorization') authorization?: string) {
    const admin = await this.validateAdminToken(authorization);

    // Return admin profile without password hash
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, ...profile } = admin;
    return { admin: profile };
  }

  /**
   * Helper method to validate admin token and return admin info
   */
  private async validateAdminToken(authorization?: string) {
    if (!authorization || !authorization.startsWith('Bearer ')) {
      throw new UnauthorizedException('Admin access token required');
    }

    const token = authorization.substring(7);
    const admin = await this.adminService.getAdminFromToken(token);

    if (!admin) {
      throw new UnauthorizedException('Invalid admin token');
    }

    return admin;
  }

  /**
   * Get all users with pagination, filtering, search, and sorting
   * NOTE: This includes deactivated users so admins can find and reactivate them
   */
  @Get('users')
  @Version('1')
  async getUserList(
    @Query() query: GetUsersQueryDto,
    @Headers('authorization') authorization?: string,
  ) {
    // Validate admin token
    await this.validateAdminToken(authorization);

    // Call AuthService method with enhanced options
    return await this.authService.getAllUsers({
      page: query.page || 1,
      limit: query.limit || 10,
      verified: query.verified,
      active: query.active,
      search: query.search,
      searchField: query.searchField || 'all',
      sortBy: query.sortBy || 'createdAt',
      sortOrder: query.sortOrder || 'DESC',
    });
  }

  /**
   * Get single user details
   */
  @Get('users/:userId')
  @Version('1')
  async getUserDetails(
    @Param('userId') userId: string,
    @Headers('authorization') authorization?: string,
  ) {
    // Validate admin token
    await this.validateAdminToken(authorization);

    // Validate UUID format
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(userId)) {
      throw new UnauthorizedException('Invalid user ID format');
    }

    // Get user profile from users service
    const user = await this.usersService.getUserProfile(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return { user };
  }

  /**
   * Deactivate a user account
   * TODO: Add rate limiting for admin actions in production
   * TODO: Add audit logging to database
   */
  @Patch('users/:userId/deactivate')
  @Version('1')
  async deactivateUser(
    @Param('userId') userId: string,
    @Body() body: DeactivateUserDto,
    @Headers('authorization') authorization?: string,
  ) {
    // Validate admin token
    const admin = await this.validateAdminToken(authorization);

    // Validate UUID format
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(userId)) {
      throw new UnauthorizedException('Invalid user ID format');
    }

    // Call AuthService method
    return await this.authService.softDeleteUser(userId, admin.id, body.reason);
  }

  /**
   * Reactivate a user account
   * TODO: Add rate limiting for admin actions in production
   * TODO: Add audit logging to database
   */
  @Patch('users/:userId/reactivate')
  @Version('1')
  async reactivateUser(
    @Param('userId') userId: string,
    @Headers('authorization') authorization?: string,
  ) {
    // Validate admin token
    const admin = await this.validateAdminToken(authorization);

    // Validate UUID format
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(userId)) {
      throw new UnauthorizedException('Invalid user ID format');
    }

    // Call AuthService method
    return await this.authService.reactivateUser(userId, admin.id);
  }
}
