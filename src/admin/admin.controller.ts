import { 
  Body, 
  Controller, 
  Post, 
  Get,
  Version, 
  Headers,
  UnauthorizedException,
  ForbiddenException 
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminLoginDto } from './dto/admin-login.dto';
import { CreateAdminDto } from './dto/create-admin.dto';

@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

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
    if (!authorization || !authorization.startsWith('Bearer ')) {
      throw new UnauthorizedException('Admin access token required');
    }

    const token = authorization.substring(7);
    const requestingAdmin = await this.adminService.getAdminFromToken(token);

    if (!requestingAdmin) {
      throw new UnauthorizedException('Invalid admin token');
    }

    return this.adminService.create(createAdminDto, requestingAdmin.id);
  }

  @Get('list')
  @Version('1')
  async listAdmins(@Headers('authorization') authorization?: string) {
    // Verify that the requesting user is a super admin
    if (!authorization || !authorization.startsWith('Bearer ')) {
      throw new UnauthorizedException('Admin access token required');
    }

    const token = authorization.substring(7);
    const requestingAdmin = await this.adminService.getAdminFromToken(token);

    if (!requestingAdmin) {
      throw new UnauthorizedException('Invalid admin token');
    }

    return this.adminService.getAllAdmins(requestingAdmin.id);
  }

  @Get('me')
  @Version('1')
  async getProfile(@Headers('authorization') authorization?: string) {
    if (!authorization || !authorization.startsWith('Bearer ')) {
      throw new UnauthorizedException('Admin access token required');
    }

    const token = authorization.substring(7);
    const admin = await this.adminService.getAdminFromToken(token);

    if (!admin) {
      throw new UnauthorizedException('Invalid admin token');
    }

    // Return admin profile without password hash
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, ...profile } = admin;
    return { admin: profile };
  }
}