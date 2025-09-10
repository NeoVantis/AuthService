import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { Admin } from './admin.entity';
import { AdminLoginDto } from './dto/admin-login.dto';
import { CreateAdminDto } from './dto/create-admin.dto';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(Admin)
    private readonly adminRepo: Repository<Admin>,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * Find an admin by username
   */
  async findByUsername(username: string): Promise<Admin | null> {
    return await this.adminRepo.findOne({
      where: { username: username.toLowerCase() },
    });
  }

  /**
   * Create a new admin
   */
  async create(createAdminDto: CreateAdminDto): Promise<Admin> {
    const { username, password, name, role } = createAdminDto;
    
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
  async login(adminLoginDto: AdminLoginDto): Promise<{ access_token: string; userRole: number }> {
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
    const payload = { sub: admin.id, username: admin.username, role: admin.role };
    const access_token = await this.jwtService.signAsync(payload);
    
    return {
      access_token,
      userRole: admin.role,
    };
  }
}