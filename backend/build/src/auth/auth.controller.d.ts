import { AuthService } from "./auth.service";
import { LoginDto } from "./dto/login.dto";
import { SignupDto } from "./dto/signup.dto";
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    login(dto: LoginDto): Promise<{
        accessToken: string;
        tokenType: "Bearer";
        expiresAtUnix: number | null;
        user: {
            id: string;
            email: string | null;
            phone: string;
            fullName: string;
            organizationId: string | null;
            roles: import(".prisma/client").$Enums.AppRole[];
        };
    }>;
    signup(dto: SignupDto): Promise<{
        accessToken: string;
        tokenType: "Bearer";
        expiresAtUnix: number | null;
        user: {
            id: string;
            email: string | null;
            phone: string;
            fullName: string;
            organizationId: string | null;
            roles: import(".prisma/client").$Enums.AppRole[];
        };
    }>;
}
