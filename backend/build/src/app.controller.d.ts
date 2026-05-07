import { PrismaService } from "./prisma/prisma.service";
export declare class AppController {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getHealth(): {
        name: string;
        status: string;
    };
    getDatabaseHealth(): Promise<{
        database: string;
    }>;
}
