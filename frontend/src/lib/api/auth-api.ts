import { api } from "./client";
import type { User } from "@/types/api";

export interface RegisterInput {
  email: string;
  password: string;
  name: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export const authApi = {
  register: (input: RegisterInput) => api.post<User>("/api/auth/register", input),
  login: (input: LoginInput) => api.post<User>("/api/auth/login", input),
  logout: () => api.post<{ success: boolean }>("/api/auth/logout"),
  me: () => api.get<User>("/api/auth/me"),
};
