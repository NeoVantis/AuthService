import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  ForbiddenException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { Admin } from './admin.entity';
import { AdminLoginDto } from './dto/admin-login.dto';
import { CreateAdminDto } from './dto/create-admin.dto';

@Injectable()
export class AdminService implements OnModuleInit {
  constructor(
    @InjectRepository(Admin)
    private readonly adminRepo: Repository<Admin>,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * Initialize the module - create super admin if no admins exist
   */
  async onModuleInit() {
    await this.createSuperAdminIfNeeded();
  }

  /**
   * Create super admin if no admins exist in the database
   */
  async createSuperAdminIfNeeded(): Promise<void> {
    try {
      const adminCount = await this.adminRepo.count();

      if (adminCount === 0) {
        const superAdminEmail =
          process.env.SUPER_ADMIN_EMAIL || 'md@neovantis.xyz';
        const superAdminPassword =
          process.env.SUPER_ADMIN_PASSWORD || 'abcabcabc';

        const passwordHash = await bcrypt.hash(superAdminPassword, 10);

        const superAdmin = this.adminRepo.create({
          username: superAdminEmail,
          name: 'Super Administrator',
          passwordHash,
          role: 0, // 0 = super admin
        });

        await this.adminRepo.save(superAdmin);
        console.log(`✅ Super admin created with username: ${superAdminEmail}`);
      }
    } catch (error) {
      console.error('❌ Error creating super admin:', error);
    }
  }

  /**
   * Find an admin by username
   */
  async findByUsername(username: string): Promise<Admin | null> {
    return await this.adminRepo.findOne({
      where: { username: username.toLowerCase() },
    });
  }

  /**
   * Create a new admin (only super admins can create other admins)
   */
  async create(
    createAdminDto: CreateAdminDto,
    requestingAdminId?: string,
  ): Promise<Admin> {
    const { username, password, name, role } = createAdminDto;

    // If a requesting admin ID is provided, verify they are super admin
    if (requestingAdminId) {
      const requestingAdmin = await this.adminRepo.findOne({
        where: { id: requestingAdminId },
      });

      if (!requestingAdmin || requestingAdmin.role !== 0) {
        throw new ForbiddenException(
          'Only super administrators can create new admins',
        );
      }
    }

    // Check if username already exists
    const existingAdmin = await this.findByUsername(username);
    if (existingAdmin) {
      throw new ConflictException('Username already taken');
    }

    // Hash the password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create and save the admin
    const admin = this.adminRepo.create({
      username,
      name,
      passwordHash,
      role,
    });

    return await this.adminRepo.save(admin);
  }

  /**
   * Admin login
   */
  async login(
    adminLoginDto: AdminLoginDto,
  ): Promise<{ access_token: string; userRole: number }> {
    const { username, password } = adminLoginDto;

    // Find admin by username
    const admin = await this.findByUsername(username);
    if (!admin) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, admin.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Generate JWT token
    const payload = {
      sub: admin.id,
      username: admin.username,
      role: admin.role,
    };
    const access_token = await this.jwtService.signAsync(payload);

    return {
      access_token,
      userRole: admin.role,
    };
  }

  /**
   * Get admin from JWT token
   */
  async getAdminFromToken(token: string): Promise<Admin | null> {
    try {
      const payload = await this.jwtService.verifyAsync(token);
      return await this.adminRepo.findOne({
        where: { id: payload.sub },
      });
    } catch {
      return null;
    }
  }

  /**
   * Verify if admin is super admin
   */
  async verifySuperAdmin(adminId: string): Promise<boolean> {
    const admin = await this.adminRepo.findOne({
      where: { id: adminId },
    });
    return admin?.role === 0;
  }

  /**
   * Get all admins (only super admins can access this)
   */
  async getAllAdmins(requestingAdminId: string): Promise<Admin[]> {
    const isSuperAdmin = await this.verifySuperAdmin(requestingAdminId);
    if (!isSuperAdmin) {
      throw new ForbiddenException(
        'Only super administrators can view all admins',
      );
    }

    return await this.adminRepo.find({
      select: ['id', 'username', 'name', 'role', 'createdAt', 'updatedAt'],
    });
  }
}
