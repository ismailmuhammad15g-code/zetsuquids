import { jwtDecode } from "jwt-decode";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
  FC,
} from "react";
import { supabase } from "../lib/api";

// Types for Supabase User
interface SupabaseUser {
  id: string;
  email: string;
  user_metadata?: Record<string, unknown>;
  app_metadata?: Record<string, unknown>;
  aud?: string;
  created_at?: string;
  updated_at?: string;
}

// Auth Context Value Type
interface AuthContextValue {
  user: SupabaseUser | null;
  token: string | null;
  loading: boolean;
  login: (newToken: string, userData: SupabaseUser) => void;
  logout: () => Promise<void>;
  updateUser: (userData: SupabaseUser) => void;
  isAuthenticated: () => boolean;
}

// Auth Provider Props Type
interface AuthProviderProps {
  children: ReactNode;
}

// Default context value
const defaultAuthValue: AuthContextValue = {
  user: null,
  token: null,
  loading: true,
  login: () => {},
  logout: async () => {},
  updateUser: () => {},
  isAuthenticated: () => false,
};

const AuthContext = createContext<AuthContextValue>(defaultAuthValue);

export const AuthProvider: FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Load user from localStorage on mount AND monitor Supabase auth state changes
  useEffect(() => {
    let isComponentMounted = true;

    // First, restore from localStorage if available
    const savedToken = localStorage.getItem("auth_token");
    const savedUser = localStorage.getItem("auth_user");

    if (savedToken && savedUser) {
      try {
        // Try to decode as JWT (for email/password login)
        // Supabase OAuth tokens are also JWTs, so this should work
        const decoded = jwtDecode<{ exp: number }>(savedToken);
        if (decoded.exp * 1000 > Date.now()) {
          if (isComponentMounted) {
            setToken(savedToken);
            setUser(JSON.parse(savedUser) as SupabaseUser);
          }
          console.log(
            "Auth restored from localStorage:",
            (JSON.parse(savedUser) as SupabaseUser)?.email
          );
        } else {
          // Token expired, clear storage
          console.log("Token expired, clearing auth from localStorage");
          localStorage.removeItem("auth_token");
          localStorage.removeItem("auth_user");
        }
      } catch (error: unknown) {
        // If JWT decode fails, try treating it as Supabase session token
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        console.log("Token decode error, attempting OAuth restore:", errorMessage);
        try {
          if (isComponentMounted) {
            setToken(savedToken);
            setUser(JSON.parse(savedUser) as SupabaseUser);
          }
          console.log(
            "Auth restored (OAuth):",
            (JSON.parse(savedUser) as SupabaseUser)?.email
          );
        } catch (err: unknown) {
          console.error("Error loading auth:", err);
          localStorage.removeItem("auth_token");
          localStorage.removeItem("auth_user");
        }
      }
    }

    // Set up listener for Supabase auth state changes
    const { data } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log(
          "🔄 Supabase auth state changed:",
          event,
          "User:",
          session?.user?.email
        );

        if (!isComponentMounted) return;

        // When user logs in (SIGNED_IN or INITIAL_SESSION)
        if (
          (event === "SIGNED_IN" || event === "INITIAL_SESSION") &&
          session?.user
        ) {
          console.log("✅ Auth state changed to SIGNED_IN/INITIAL_SESSION");
          if (isComponentMounted) {
            setToken(session.access_token);
            setUser(session.user as SupabaseUser);
            localStorage.setItem("auth_token", session.access_token);
            localStorage.setItem("auth_user", JSON.stringify(session.user));
          }
        }
        // When token is refreshed
        else if (event === "TOKEN_REFRESHED" && session?.user) {
          console.log("🔄 Token refreshed");
          if (isComponentMounted) {
            setToken(session.access_token);
            localStorage.setItem("auth_token", session.access_token);
          }
        }
        // When user logs out or session is invalid
        else if (event === "SIGNED_OUT" || (event as string) === "USER_DELETED") {
          console.log("❌ Auth state changed to SIGNED_OUT/USER_DELETED");
          if (isComponentMounted) {
            setToken(null);
            setUser(null);
            localStorage.removeItem("auth_token");
            localStorage.removeItem("auth_user");
          }
        }

        if (isComponentMounted) {
          setLoading(false);
        }
      }
    );

    // Check initial session from Supabase
    const checkSession = async (): Promise<void> => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (session?.user && isComponentMounted) {
          console.log("✅ Found active session in Supabase:", session.user.email);
          setToken(session.access_token);
          setUser(session.user as SupabaseUser);
          localStorage.setItem("auth_token", session.access_token);
          localStorage.setItem("auth_user", JSON.stringify(session.user));
        } else {
          console.log("No active session found");
          if (isComponentMounted) {
            setLoading(false);
          }
        }
      } catch (error: unknown) {
        console.error("Error checking session:", error);
        if (isComponentMounted) {
          setLoading(false);
        }
      }
    };

    checkSession();

    return () => {
      isComponentMounted = false;
      data?.subscription?.unsubscribe();
    };
  }, []);

  const login = (newToken: string, userData: SupabaseUser): void => {
    console.log("AuthContext login called with:", {
      token: newToken?.substring(0, 20),
      user: userData?.email,
    });
    setToken(newToken);
    setUser(userData);
    localStorage.setItem("auth_token", newToken);
    localStorage.setItem("auth_user", JSON.stringify(userData));
  };

  const logout = async (): Promise<void> => {
    try {
      await supabase.auth.signOut();
    } catch (error: unknown) {
      console.error("Error signing out:", error);
    }
    setToken(null);
    setUser(null);
    localStorage.removeItem("auth_token");
    localStorage.removeItem("auth_user");
  };

  const updateUser = (userData: SupabaseUser): void => {
    setUser(userData);
    localStorage.setItem("auth_user", JSON.stringify(userData));
  };

  const isAuthenticated = (): boolean => {
    return !!token && !!user;
  };

  const value: AuthContextValue = {
    user,
    token,
    loading,
    login,
    logout,
    updateUser,
    isAuthenticated,
  };

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
};

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
