import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ValidateDto } from './dto/validate.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('validate')
  validate(@Body() validateDto: ValidateDto) {
    return this.authService.validate(validateDto.password);
  }
}