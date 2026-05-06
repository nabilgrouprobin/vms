import { api } from "@/lib/api";

export type LoginResponse = {
  accessToken: string;
  tokenType: "Bearer";
  user: {
    id: string;
    email: string | null;
    phone: string;
    fullName: string;
    organizationId: string | null;
    roles: string[];
  };
};

export function loginRequest(login: string, password: string) {
  return api<LoginResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ login, password })
  });
}

export function signupRequest(body: {
  fullName: string;
  phone: string;
  password: string;
}) {
  return api<LoginResponse>("/auth/signup", {
    method: "POST",
    body: JSON.stringify(body)
  });
}
