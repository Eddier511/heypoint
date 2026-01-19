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

interface User {
  email: string;
  fullName: string;
  uid?: string;
}

type GoogleOAuthResult = {
  user: User;
  isNewUser: boolean;
};

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null; // legacy-friendly
  currentUser: FirebaseUser | null; // ✅ para profile page / firebase ops
  loadingAuth: boolean;

  // Backward compatible (legacy)
  login: (userData: User) => void;

  // Auth real
  loginWithEmail: (email: string, password: string) => Promise<User>;
  signupWithEmail: (
    fullName: string,
    email: string,
    password: string,
  ) => Promise<User>;
  startGoogleOAuth: () => Promise<GoogleOAuthResult>;
  logout: () => Promise<void>;

  // Token para backend
  getAuthToken: (forceRefresh?: boolean) => Promise<string | null>;

  // ✅ compat con AuthModal
  getIdToken: () => Promise<string | null>;

  // ✅ para UserProfilePage: cambiar password con reauth
  changePassword: (
    currentPassword: string,
    newPassword: string,
  ) => Promise<void>;

  // ✅ opcional (RECOMENDADO)
  updateDisplayName: (fullName: string) => Promise<void>;
}

const STORAGE_KEY = "heypoint_id_token";
const AuthContext = createContext<AuthContextType | undefined>(undefined);

function mapFirebaseUser(u: FirebaseUser): User {
  return {
    uid: u.uid,
    email: u.email || "",
    fullName: u.displayName || "User",
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [fbUser, setFbUser] = useState<FirebaseUser | null>(null);

  const user = useMemo(() => (fbUser ? mapFirebaseUser(fbUser) : null), [fbUser]);
  const isAuthenticated = !!fbUser;

  const persistToken = useCallback(async (forceRefresh = false) => {
    const u = auth.currentUser;
    if (!u) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }

    const tok
