import React, { createContext, useContext, useEffect, useState } from "react";
import { 
  onAuthStateChanged, 
  User, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithRedirect, 
  getRedirectResult, 
  signOut,
  setPersistence,
  browserLocalPersistence
} from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc, setDoc, collection } from "firebase/firestore";

interface AuthContextType {
  user: any | null;
  profile: any | null;
  loading: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  isAdmin: boolean;
  setCustomLogin: (status: boolean, userData?: any) => void;
  error: string | null;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCustomLoggedIn, setIsCustomLoggedIn] = useState(() => {
    return localStorage.getItem("adminLoggedIn") === "true";
  });
  const [customUserData, setCustomUserData] = useState<any | null>(() => {
    const saved = localStorage.getItem("customUserData");
    return saved ? JSON.parse(saved) : null;
  });

  useEffect(() => {
    // Check if cookies are enabled
    if (!navigator.cookieEnabled) {
      setError("Os cookies estão desativados no seu navegador. Ative-os para fazer login.");
    }

    // Ensure persistence is set to local
    setPersistence(auth, browserLocalPersistence).catch(err => {
      console.error("Erro ao definir persistência:", err);
    });

    // Check for redirect result on mount
    getRedirectResult(auth).then((result) => {
      if (result) {
        console.log("DEBUG: Login via redirecionamento concluído");
      }
    }).catch((error) => {
      console.error("DEBUG: Erro no retorno do redirecionamento:", error);
    });

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log("DEBUG: onAuthStateChanged disparado, user:", user?.email);
      setFirebaseUser(user);
      
      if (user) {
        try {
          console.log("DEBUG: Buscando perfil no Firestore para:", user.uid);
          // Get or create profile in members collection
          const userRef = doc(db, "members", user.uid);
          const userSnap = await getDoc(userRef);
          
          if (userSnap.exists()) {
            const data = userSnap.data();
            console.log("DEBUG: Perfil encontrado no Firestore:", data);
            setProfile({ id: userSnap.id, ...data });
          } else {
            console.log("DEBUG: Perfil não encontrado, criando novo...");
            const newProfile = {
              name: user.displayName,
              email: user.email,
              photoURL: user.photoURL,
              role: user.email === "iempministerioprofecia@gmail.com" ? "admin" : "member",
              status: user.email === "iempministerioprofecia@gmail.com" ? "approved" : "pending",
              hasDashboardAccess: user.email === "iempministerioprofecia@gmail.com",
              createdAt: new Date().toISOString()
            };
            await setDoc(userRef, newProfile);
            console.log("DEBUG: Novo perfil criado");
            
            // Create notification for new Google sign up
            if (user.email !== "iempministerioprofecia@gmail.com") {
              const notifRef = doc(collection(db, "notifications"));
              await setDoc(notifRef, {
                title: "Novo Cadastro (Google)",
                message: `${newProfile.name} solicitou acesso via Google.`,
                type: "registration",
                memberId: user.uid,
                read: false,
                createdAt: new Date().toISOString()
              });
            }
            
            setProfile({ id: user.uid, ...newProfile });
          }
        } catch (error) {
          console.error("DEBUG: Erro ao processar perfil no onAuthStateChanged:", error);
        }
      } else {
        setProfile(null);
      }
      
      console.log("DEBUG: Finalizando processamento de auth, user:", user?.email, "loading = false");
      setLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const login = async () => {
    setError(null);
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({
        prompt: 'select_account'
      });
      
      console.log("DEBUG: Iniciando signInWithPopup...");
      try {
        const result = await signInWithPopup(auth, provider);
        console.log("DEBUG: signInWithPopup concluído com sucesso para:", result.user.email);
      } catch (popupError: any) {
        console.warn("DEBUG: Erro no popup (code):", popupError.code);
        
        // If popup is blocked, cancelled by system, or other issues, try redirect
        const shouldRedirect = [
          'auth/popup-blocked',
          'auth/cancelled-popup-request',
          'auth/popup-closed-by-user', // Sometimes triggered by blockers
          'auth/internal-error',
          'auth/network-request-failed'
        ].includes(popupError.code);

        if (shouldRedirect) {
          console.log(`DEBUG: Erro ${popupError.code} detectado. Tentando signInWithRedirect como fallback...`);
          try {
            await signInWithRedirect(auth, provider);
          } catch (redirectError: any) {
            console.error("DEBUG: Erro no signInWithRedirect:", redirectError);
            let msg = redirectError.message;
            if (redirectError.code === 'auth/network-request-failed') {
              msg = "Falha na conexão com o Google. Verifique sua internet ou desative extensões como AdBlock que podem estar bloqueando o login.";
            }
            setError(msg);
          }
        } else {
          setError(popupError.message);
        }
      }
    } catch (error: any) {
      console.error("DEBUG: Erro fatal no login:", error);
      let msg = error.message || "Erro desconhecido no login";
      if (error.code === 'auth/network-request-failed') {
        msg = "Falha na conexão com o Google. Verifique sua internet ou desative extensões como AdBlock que podem estar bloqueando o login.";
      }
      setError(msg);
    }
  };

  const clearError = () => setError(null);

  const logout = async () => {
    if (firebaseUser) {
      await signOut(auth);
    }
    localStorage.removeItem("adminLoggedIn");
    localStorage.removeItem("customUserData");
    setIsCustomLoggedIn(false);
    setCustomUserData(null);
    window.location.href = "/";
  };

  const setCustomLogin = (status: boolean, userData?: any) => {
    setIsCustomLoggedIn(status);
    if (status) {
      localStorage.setItem("adminLoggedIn", "true");
      if (userData) {
        localStorage.setItem("customUserData", JSON.stringify(userData));
        setCustomUserData(userData);
      }
    } else {
      localStorage.removeItem("adminLoggedIn");
      localStorage.removeItem("customUserData");
      setCustomUserData(null);
    }
  };

  const isAdmin = (firebaseUser?.email?.toLowerCase().trim() === "iempministerioprofecia@gmail.com") || 
                  (auth.currentUser?.email?.toLowerCase().trim() === "iempministerioprofecia@gmail.com") ||
                  profile?.role === "admin" || 
                  profile?.role === "Direção" ||
                  customUserData?.role === "admin" || 
                  (isCustomLoggedIn && !customUserData);

  useEffect(() => {
    console.log("DEBUG AuthContext State Update:", {
      firebaseUserEmail: firebaseUser?.email,
      firebaseUserEmailType: typeof firebaseUser?.email,
      authCurrentUserEmail: auth.currentUser?.email,
      profileRole: profile?.role,
      isAdmin,
      isEmailMatch: firebaseUser?.email?.toLowerCase().trim() === "iempministerioprofecia@gmail.com"
    });
  }, [firebaseUser, profile, isAdmin]);

  const user = firebaseUser || (isCustomLoggedIn ? {
    displayName: customUserData?.name || "Administrador",
    email: customUserData?.email || "admin@ministerioprofecia.com.br",
    photoURL: customUserData?.photoURL || "",
    uid: customUserData?.id || "admin"
  } : null);

  return (
    <AuthContext.Provider value={{ user, profile: profile || customUserData, loading, login, logout, isAdmin, setCustomLogin, error, clearError }}>
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
