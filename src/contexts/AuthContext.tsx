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
  onAuthStateChanged,
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
  getAuthToken: () => Promise<string | null>;

  // ✅ compat con AuthModal (porque ahí llamás getIdToken())
  getIdToken: () => Promise<string | null>;

  // ✅ para UserProfilePage: cambiar password con reauth
  changePassword: (
    currentPassword: string,
    newPassword: string,
  ) => Promise<void>;

  // ✅ opcional (RECOMENDADO): actualizar displayName desde Profile
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

  const user = useMemo(
    () => (fbUser ? mapFirebaseUser(fbUser) : null),
    [fbUser],
  );
  const isAuthenticated = !!fbUser;

  const persistToken = useCallback(async () => {
    if (!auth.currentUser) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    const token = await fbGetIdToken(auth.currentUser, true);
    localStorage.setItem(STORAGE_KEY, token);
    return token;
  }, []);

  // ✅ Persistencia automática (refresh y sigue logueado)
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setFbUser(u);
      setLoadingAuth(false);

      try {
        if (u) await persistToken();
        else localStorage.removeItem(STORAGE_KEY);
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    });
    return () => unsub();
  }, [persistToken]);

  // Backward compatible (no recomendado)
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
    await persistToken();
    const u = mapFirebaseUser(cred.user);
    console.log("[AuthContext] Email login OK:", u.email);
    return u;
  };

  const signupWithEmail = async (
    fullName: string,
    email: string,
    password: string,
  ): Promise<User> => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(cred.user, { displayName: fullName });

    await persistToken();

    const u: User = {
      uid: cred.user.uid,
      email: cred.user.email || email,
      fullName,
    };
    console.log("[AuthContext] Signup OK:", u.email);
    return u;
  };

  // ✅ Google: devuelve user + si es nuevo (para mostrar Paso 2 de 2)
  const startGoogleOAuth = async (): Promise<GoogleOAuthResult> => {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });

    const cred = await signInWithPopup(auth, provider);
    const info = getAdditionalUserInfo(cred);
    const isNewUser = !!info?.isNewUser;

    await persistToken();

    const u = mapFirebaseUser(cred.user);
    console.log("[AuthContext] Google login OK:", u.email, "new?", isNewUser);

    return { user: u, isNewUser };
  };

  const logout = async () => {
    await signOut(auth);
    localStorage.removeItem(STORAGE_KEY);
    console.log("[AuthContext] Logout OK");
    window.dispatchEvent(new CustomEvent("heypoint:logout"));
  };

  // ✅ Token para backend
  const getAuthToken = async (): Promise<string | null> => {
    if (!auth.currentUser) return null;
    const token = await fbGetIdToken(auth.currentUser, true);
    localStorage.setItem(STORAGE_KEY, token);
    return token;
  };

  // ✅ alias para tu modal (AuthModal usa getIdToken())
  const getIdTokenFn = getAuthToken;

  // ✅ Cambiar password (requiere re-auth)
  const changePassword = async (
    currentPassword: string,
    newPassword: string,
  ) => {
    const u = auth.currentUser;
    if (!u) throw new Error("No hay usuario autenticado.");
    if (!u.email) throw new Error("Tu usuario no tiene email asociado.");

    // Si el proveedor es Google (no password), esto va a fallar: avisamos mejor
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

  // ✅ Actualizar displayName (útil para que header / token / UI refleje el nombre nuevo)
  const updateDisplayName = async (fullName: string) => {
    const u = auth.currentUser;
    if (!u) throw new Error("No hay usuario autenticado.");
    const name = (fullName || "").trim();
    if (!name) throw new Error("El nombre no puede estar vacío.");
    await updateProfile(u, { displayName: name });

    // opcional: refrescar token local y estado
    await persistToken();
    // forzar re-render con user actualizado (firebase ya lo hace, pero esto ayuda)
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
        getAuthToken,
        getIdToken: getIdTokenFn,
        changePassword,
        updateDisplayName, // ✅
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
