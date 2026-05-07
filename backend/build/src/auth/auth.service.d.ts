import { AppRole } from "@prisma/client";
import { JwtService } from "@nestjs/jwt";
import { PrismaService } from "../prisma/prisma.service";
import { SignupDto } from "./dto/signup.dto";
export type JwtPayload = {
    sub: string;
    roles: AppRole[];
};
export declare class AuthService {
    private readonly prisma;
    private readonly jwt;
    constructor(prisma: PrismaService, jwt: JwtService);
    login(login: string, password: string): Promise<{
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
    private issueSession;
}
