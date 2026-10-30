import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { api } from "../services/api";
import type { User } from "../types";
const AuthContext = createContext<{
  user: User | null;
  ready: boolean;
  setUser: (u: User | null) => void;
  logout: () => Promise<void>;
}>({ user: null, ready: false, setUser: () => {}, logout: async () => {} });
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    api
      .me()
      .then(setUser)
      .catch(() => {})
      .finally(() => setReady(true));
  }, []);
  return (
    <AuthContext.Provider
      value={{
        user,
        ready,
        setUser,
        logout: async () => {
          await api.logout();
          setUser(null);
        },
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
export const useAuth = () => useContext(AuthContext);
