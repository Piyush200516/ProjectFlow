export type ApiUser = {
  id: number;
  email: string;
  fullName: string;
  role: "STUDENT" | "MENTOR" | "HOD" | "ADMIN" | "SUPER_ADMIN";
  isActive: boolean;
  emailVerifiedAt: string | null;
};

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://project-flow-ed3n.vercel.app/api";

export async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    credentials: "include",
    headers: {
      "content-type": "application/json",
      ...(init.headers || {}),
    },
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || "Request failed");
  }
  return data as T;
}
