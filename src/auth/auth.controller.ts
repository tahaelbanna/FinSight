import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Public } from './decorators/public.decorator';
import { CurrentUser, Principal } from './decorators/current-user.decorator';
import { LoginDto } from './dtos/login.dto';
import { AuthResponseDto } from './dtos/auth-response.dto';
import { RefreshTokenDto } from './dtos/refresh-token.dto';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) {}

    @Post('login')
    @Public()
    async login(@Body() body: LoginDto): Promise<AuthResponseDto> {
        return this.authService.login(body);
    }

    @Post('logout')
    async logout(@CurrentUser() principal: Principal): Promise<void> {
        return this.authService.logout(principal.user.user_id);
    }

    @Post('refresh-token')
    @Public()
    async refreshToken(@Body() body: RefreshTokenDto): Promise<AuthResponseDto> {
        return this.authService.refreshToken(body);
    }
}
