import { IsString, IsInt, Min, Max } from 'class-validator';

export class CreateAdminDto {
  @IsString()
  name: string;

  @IsString()
  username: string;

  @IsString()
  password: string;

  @IsInt()
  @Min(0)
  @Max(1)
  role: number;
}