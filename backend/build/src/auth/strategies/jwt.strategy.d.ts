import { ConfigService } from "@nestjs/config";
import { Strategy } from "passport-jwt";
import { AppRole } from "@prisma/client";
import { JwtPayload } from "../auth.service";
export type AuthedRequestUser = {
    userId: string;
    roles: AppRole[];
};
declare const JwtStrategy_base: new (...args: [opt: import("passport-jwt").StrategyOptionsWithRequest] | [opt: import("passport-jwt").StrategyOptionsWithoutRequest]) => Strategy & {
    validate(...args: any[]): unknown;
};
export declare class JwtStrategy extends JwtStrategy_base {
    constructor(config: ConfigService);
    validate(payload: JwtPayload): AuthedRequestUser;
}
export {};
