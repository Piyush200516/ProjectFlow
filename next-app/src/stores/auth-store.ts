import { create } from "zustand";
import type { ApiUser } from "@/lib/api-client";

type AuthState = {
  user: ApiUser | null;
  accessToken: string | null;
  setSession: (session: { user: ApiUser; accessToken: string }) => void;
  clearSession: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  setSession: ({ user, accessToken }) => set({ user, accessToken }),
  clearSession: () => set({ user: null, accessToken: null }),
}));
