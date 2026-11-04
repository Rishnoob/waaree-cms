import { api, errorMessage } from "@/lib/api/client";
import { clearSession, setSession } from "@/lib/auth/session";

export async function login(email: string, password: string): Promise<void> {
  const { data, error } = await api.POST("/auth/login", { body: { email, password } });
  if (error || !data) throw new Error(errorMessage(error, "Couldn't log in. Please try again."));
  setSession(data);
}

export async function logout(): Promise<void> {
  try {
    await api.POST("/auth/logout");
  } finally {
    clearSession(); // log out locally even if the network call fails
  }
}
