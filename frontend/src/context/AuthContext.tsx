import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { api } from "../api";

type User = { id: number; name: string; email: string };
type AuthCtx = {
  user: User | null; loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
};
const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (localStorage.getItem("token")) {
      api.me().then(setUser).catch(() => localStorage.removeItem("token")).finally(() => setLoading(false));
    } else setLoading(false);
  }, []);

  async function login(email: string, password: string) {
    const res = await api.login(email, password);
    localStorage.setItem("token", res.access_token);
    setUser(res.user);
  }
  async function register(name: string, email: string, password: string) {
    const res = await api.register(name, email, password);
    localStorage.setItem("token", res.access_token);
    setUser(res.user);
  }
  function logout() { localStorage.removeItem("token"); setUser(null); }

  return <Ctx.Provider value={{ user, loading, login, register, logout }}>{children}</Ctx.Provider>;
}
export const useAuth = () => useContext(Ctx)!;
