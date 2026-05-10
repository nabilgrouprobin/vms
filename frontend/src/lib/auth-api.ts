import { apiValidated } from "@/lib/api";
import { loginResponseSchema, type LoginResponseSchema } from "@/lib/api-schemas";

/**
 * The shape of a successful `/auth/login` or `/auth/signup` response.
 *
 * Type is derived from the runtime zod schema (`loginResponseSchema`) so the
 * compile-time and runtime expectations cannot diverge. Importers should keep
 * using `LoginResponse` — we just point it at the inferred type now.
 */
export type LoginResponse = LoginResponseSchema;

export function loginRequest(login: string, password: string) {
  return apiValidated("/auth/login", loginResponseSchema, {
    method: "POST",
    body: JSON.stringify({ login, password })
  });
}

export function signupRequest(body: {
  fullName: string;
  phone: string;
  password: string;
}) {
  return apiValidated("/auth/signup", loginResponseSchema, {
    method: "POST",
    body: JSON.stringify(body)
  });
}
