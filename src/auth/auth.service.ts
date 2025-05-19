import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  validate(password: string): { token: string } {
    const correctPassword = this.configService.get<string>('AUTH_PASSWORD');
    
    if (!correctPassword) {
      throw new Error('AUTH_PASSWORD environment variable is not defined');
    }
    
    if (password !== correctPassword) {
      throw new UnauthorizedException('Invalid password');
    }
    
    const payload = { authenticated: true };
    const token = this.jwtService.sign(payload);
    
    return { token };
  }
}