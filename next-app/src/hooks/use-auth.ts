"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, type ApiUser } from "@/lib/api-client";
import { useAuthStore } from "@/stores/auth-store";

type LoginInput = {
  email: string;
  password: string;
};

export function useCurrentUser() {
  return useQuery({
    queryKey: ["auth", "me"],
    queryFn: async () => apiRequest<{ user: ApiUser }>("/auth/me"),
    retry: false,
  });
}

export function useLogin() {
  const setSession = useAuthStore((state) => state.setSession);

  return useMutation({
    mutationFn: async (input: LoginInput) =>
      apiRequest<{ user: ApiUser; accessToken: string }>("/auth/login", {
        method: "POST",
        body: JSON.stringify(input),
      }),
    onSuccess: (data) => setSession(data),
  });
}
