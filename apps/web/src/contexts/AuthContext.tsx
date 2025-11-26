import { createContext, useContext, useState, ReactNode } from "react";

interface User {
  email: string;
  fullName: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  login: (userData: User) => void;
  logout: () => void;
  startGoogleOAuth: () => Promise<User>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  const login = (userData: User) => {
    console.log('[AuthContext] User logged in:', userData.fullName);
    setIsAuthenticated(true);
    setUser(userData);
  };

  const logout = () => {
    console.log('[AuthContext] User logged out');
    setIsAuthenticated(false);
    setUser(null);
    
    // Emit custom event to trigger navigation to homepage
    // This prevents showing restricted content after logout
    window.dispatchEvent(new CustomEvent('heypoint:logout'));
  };

  // TODO: Implement real Google OAuth flow
  // For now, this is a mock that simulates the OAuth process
  const startGoogleOAuth = async (): Promise<User> => {
    console.log('[AuthContext] Starting Google OAuth...');
    
    // Simulate OAuth delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Mock user data from Google
    const googleUser: User = {
      email: "user@gmail.com",
      fullName: "Google User"
    };
    
    console.log('[AuthContext] Google OAuth completed:', googleUser.fullName);
    return googleUser;
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        user,
        login,
        logout,
        startGoogleOAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}