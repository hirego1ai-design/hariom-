import { create } from "zustand";
import { UserRole } from "@/types";

export interface UserSessionState {
  id: string | null;
  email: string | null;
  name: string | null;
  role: UserRole | null;
  token: string | null;
  isAuthenticated: boolean;
  setSession: (session: { id: string; email: string; name: string; role: UserRole; token?: string }) => void;
  clearSession: () => void;
}

export const useAuthStore = create<UserSessionState>((set) => ({
  id: null,
  email: null,
  name: null,
  role: null,
  token: null,
  isAuthenticated: false,
  setSession: (session) =>
    set({
      id: session.id,
      email: session.email,
      name: session.name,
      role: session.role,
      token: session.token || null,
      isAuthenticated: true,
    }),
  clearSession: () =>
    set({
      id: null,
      email: null,
      name: null,
      role: null,
      token: null,
      isAuthenticated: false,
    }),
}));
