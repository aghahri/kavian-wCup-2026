"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { ClientUser } from "@/lib/current-user";

type CurrentUserContextValue = {
  user: ClientUser | null;
  setUser: (user: ClientUser | null) => void;
  refreshUser: () => Promise<ClientUser | null>;
  clearUser: () => void;
};

const CurrentUserContext = createContext<CurrentUserContextValue | null>(null);

type CurrentUserProviderProps = {
  initialUser: ClientUser | null;
  children: ReactNode;
};

export function CurrentUserProvider({ initialUser, children }: CurrentUserProviderProps) {
  const [user, setUser] = useState<ClientUser | null>(initialUser);

  const refreshUser = useCallback(async () => {
    try {
      const response = await fetch("/api/me", {
        cache: "no-store",
        credentials: "same-origin",
      });
      if (!response.ok) {
        setUser(null);
        return null;
      }
      const data = (await response.json()) as { user: ClientUser | null };
      setUser(data.user);
      return data.user;
    } catch {
      return null;
    }
  }, []);

  const clearUser = useCallback(() => {
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, setUser, refreshUser, clearUser }),
    [user, refreshUser, clearUser]
  );

  return (
    <CurrentUserContext.Provider value={value}>{children}</CurrentUserContext.Provider>
  );
}

export function useCurrentUser() {
  const context = useContext(CurrentUserContext);
  if (!context) {
    throw new Error("useCurrentUser must be used within CurrentUserProvider");
  }
  return context;
}
