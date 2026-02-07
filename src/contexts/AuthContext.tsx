// src/contexts/AuthContext.tsx
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
  useCallback,
} from "react";
import {
  GoogleAuthProvider,
  onIdTokenChanged,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
  getIdToken as fbGetIdToken,
  getAdditionalUserInfo,
  User as FirebaseUser,
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
} from "firebase/auth";
import { auth } from "../config/firebaseClient";
import { reload } from "firebase/auth";

interface User {
  email: string;
  fullName: string;
  uid?: string;
  emailVerified?: boolean;
}

type GoogleOAuthResult = {
  user: User;
  isNewUser: boolean;
};

// ✅ Perfil extendido (lo que guardás en Firestore)
export type CustomerProfile = {
  uid?: string;
  email?: string;
  fullName?: string;
  phone?: string;
  dni?: string;
  birthDate?: string;
  apartmentNumber?: string;
  pickupPoint?: string;
};

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  currentUser: FirebaseUser | null;
  loadingAuth: boolean;
  refreshEmailVerification: () => Promise<boolean>;

  // legacy
  login: (userData: User) => void;

  // firebase auth
  loginWithEmail: (email: string, password: string) => Promise<User>;
  signupWithEmail: (
    fullName: string,
    email: string,
    password: string,
  ) => Promise<User>;
  startGoogleOAuth: () => Promise<GoogleOAuthResult>;
  logout: () => Promise<void>;

  // token
  getAuthToken: (forceRefresh?: boolean) => Promise<string | null>;
  getIdToken: () => Promise<string | null>;

  // backend profile helpers (para que TODO pegue con /api)
  fetchMe: () => Promise<{ exists: boolean; profile: CustomerProfile | null }>;
  saveProfile: (payload: CustomerProfile) => Promise<any>;

  // account ops
  changePassword: (
    currentPassword: string,
    newPassword: string,
  ) => Promise<void>;
  updateDisplayName: (fullName: string) => Promise<void>;
}

const STORAGE_KEY = "heypoint_id_token";
const AuthContext = createContext<AuthContextType | undefined>(undefined);

function mapFirebaseUser(u: FirebaseUser): User {
  return {
    uid: u.uid,
    email: u.email || "",
    fullName: u.displayName || "User",
    emailVerified: !!u.emailVerified, // ✅ NUEVO
  };
}

// ✅ URL helpers (SIEMPRE /api)
function joinUrl(base: string, path: string) {
  const b = (base || "").replace(/\/+$/, "");
  const p = (path || "").replace(/^\/+/, "");
  return `${b}/${p}`;
}

function resolveApiBase() {
  const raw =
    import.meta.env.VITE_API_URL ||
    import.meta.env.VITE_API_BASE_URL ||
    "http://localhost:4000";

  const base = String(raw).trim().replace(/\/+$/, "");
  return base.endsWith("/api") ? base : `${base}/api`;
}

function apiUrl(path: string) {
  return joinUrl(resolveApiBase(), path);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [fbUser, setFbUser] = useState<FirebaseUser | null>(null);

  const user = useMemo(
    () => (fbUser ? mapFirebaseUser(fbUser) : null),
    [fbUser],
  );
  const isAuthenticated = !!fbUser;

  const persistToken = useCallback(async (forceRefresh = false) => {
    const u = auth.currentUser;
    if (!u) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }

    const token = await fbGetIdToken(u, forceRefresh);
    localStorage.setItem(STORAGE_KEY, token);
    return token;
  }, []);

  // ✅ mantiene token fresco
  useEffect(() => {
    const unsub = onIdTokenChanged(auth, async (u) => {
      setFbUser(u);
      setLoadingAuth(false);

      try {
        if (u) await persistToken(false);
        else localStorage.removeItem(STORAGE_KEY);
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    });

    return () => unsub();
  }, [persistToken]);

  // legacy
  const login = (_userData: User) => {
    console.warn(
      "[AuthContext] login(userData) legacy. Usá loginWithEmail / startGoogleOAuth.",
    );
  };

  const loginWithEmail = async (
    email: string,
    password: string,
  ): Promise<User> => {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    await persistToken(false);
    return mapFirebaseUser(cred.user);
  };

  const signupWithEmail = async (
    fullName: string,
    email: string,
    password: string,
  ): Promise<User> => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(cred.user, { displayName: fullName });
    await persistToken(false);

    return {
      uid: cred.user.uid,
      email: cred.user.email || email,
      fullName,
    };
  };

  const startGoogleOAuth = async (): Promise<GoogleOAuthResult> => {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });

    const cred = await signInWithPopup(auth, provider);
    const info = getAdditionalUserInfo(cred);
    const isNewUser = !!info?.isNewUser;

    await persistToken(false);

    const u = mapFirebaseUser(cred.user);
    return { user: u, isNewUser };
  };

  const logout = async () => {
    await signOut(auth);
    localStorage.removeItem(STORAGE_KEY);
    window.dispatchEvent(new CustomEvent("heypoint:logout"));
  };

  // token
  const getAuthToken = async (forceRefresh = false): Promise<string | null> => {
    const u = auth.currentUser;
    if (!u) return null;
    const token = await fbGetIdToken(u, forceRefresh);
    localStorage.setItem(STORAGE_KEY, token);
    return token;
  };

  const getIdTokenFn = () => getAuthToken(false);

  // ✅ Backend: GET /api/customers/me
  const fetchMe = async () => {
    const tok = await getAuthToken(false);
    if (!tok) return { exists: false, profile: null };

    const res = await fetch(apiUrl("/customers/me"), {
      method: "GET",
      headers: { Authorization: `Bearer ${tok}` },
    });

    // si el token expiró raro, intentá 1 vez forzando refresh
    if (res.status === 401) {
      const tok2 = await getAuthToken(true);
      if (!tok2) return { exists: false, profile: null };

      const res2 = await fetch(apiUrl("/customers/me"), {
        method: "GET",
        headers: { Authorization: `Bearer ${tok2}` },
      });

      if (!res2.ok) {
        const text = await res2.text().catch(() => "");
        throw new Error(`fetchMe failed (${res2.status}). ${text}`.trim());
      }
      return (await res2.json()) as {
        exists: boolean;
        profile: CustomerProfile | null;
      };
    }

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`fetchMe failed (${res.status}). ${text}`.trim());
    }

    return (await res.json()) as {
      exists: boolean;
      profile: CustomerProfile | null;
    };
  };

  const refreshEmailVerification = async (): Promise<boolean> => {
    const u = auth.currentUser;
    if (!u) return false;

    await reload(u); // ✅ trae emailVerified actualizado
    setFbUser(auth.currentUser); // refresca estado para UI
    return !!auth.currentUser?.emailVerified;
  };

  // ✅ Backend: POST /api/customers/profile (alias)
  const saveProfile = async (payload: CustomerProfile) => {
    const tok = await getAuthToken(false);
    if (!tok) throw new Error("No hay sesión activa.");

    const res = await fetch(apiUrl("/customers/profile"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tok}`,
      },
      body: JSON.stringify(payload),
    });

    // retry 401 con refresh
    if (res.status === 401) {
      const tok2 = await getAuthToken(true);
      if (!tok2) throw new Error("No hay sesión activa.");

      const res2 = await fetch(apiUrl("/customers/profile"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${tok2}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res2.ok) {
        const text = await res2.text().catch(() => "");
        throw new Error(`saveProfile failed (${res2.status}). ${text}`.trim());
      }
      return res2.json().catch(() => ({}));
    }

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`saveProfile failed (${res.status}). ${text}`.trim());
    }

    return res.json().catch(() => ({}));
  };

  const changePassword = async (
    currentPassword: string,
    newPassword: string,
  ) => {
    const u = auth.currentUser;
    if (!u) throw new Error("No hay usuario autenticado.");
    if (!u.email) throw new Error("Tu usuario no tiene email asociado.");

    const hasPasswordProvider = u.providerData?.some(
      (p) => p.providerId === "password",
    );
    if (!hasPasswordProvider) {
      throw new Error(
        "Tu cuenta está vinculada a Google. Para definir una contraseña, usá 'Olvidé mi contraseña' con tu correo.",
      );
    }

    const credential = EmailAuthProvider.credential(u.email, currentPassword);
    await reauthenticateWithCredential(u, credential);
    await updatePassword(u, newPassword);
  };

  const updateDisplayName = async (fullName: string) => {
    const u = auth.currentUser;
    if (!u) throw new Error("No hay usuario autenticado.");
    const name = (fullName || "").trim();
    if (!name) throw new Error("El nombre no puede estar vacío.");

    await updateProfile(u, { displayName: name });
    await persistToken(false);
    setFbUser(auth.currentUser);
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        user,
        currentUser: fbUser,
        loadingAuth,
        login,
        loginWithEmail,
        signupWithEmail,
        startGoogleOAuth,
        logout,
        refreshEmailVerification,
        getAuthToken,
        getIdToken: getIdTokenFn,
        fetchMe,
        saveProfile,
        changePassword,
        updateDisplayName,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
