import {
  Body,
  Controller,
  ForbiddenException,
  HttpCode,
  Post,
  UseGuards
} from "@nestjs/common";

import { AuthService } from "./auth.service";
import { Public } from "./decorators/public.decorator";
import { LoginDto } from "./dto/login.dto";
import { SignupDto } from "./dto/signup.dto";
import { AuthRateLimitGuard } from "./guards/auth-rate-limit.guard";

@Controller("auth")
@UseGuards(AuthRateLimitGuard)
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post("login")
  @HttpCode(200)
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto.login, dto.password);
  }

  /**
   * Public self-signup is disabled by default to prevent random `REPORT_VIEWER`
   * accounts being created in production. Set `ENABLE_PUBLIC_SIGNUP=true` in
   * `backend/.env` to opt in (e.g. for staging or open-trial environments).
   */
  @Public()
  @Post("signup")
  @HttpCode(201)
  signup(@Body() dto: SignupDto) {
    if (process.env.ENABLE_PUBLIC_SIGNUP !== "true") {
      throw new ForbiddenException(
        "Self-signup is disabled. Contact an administrator to be invited."
      );
    }
    return this.authService.signup(dto);
  }
}
