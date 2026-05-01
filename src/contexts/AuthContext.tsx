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
  browserLocalPersistence,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInAnonymously
} from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc, setDoc, collection, addDoc, query, where, getDocs } from "firebase/firestore";

interface AuthContextType {
  user: any | null;
  profile: any | null;
  loading: boolean;
  login: () => Promise<void>;
  loginWithEmail: (email: string, password: string) => Promise<void>;
  signupWithEmail: (email: string, password: string, additionalData: any) => Promise<any>;
  loginAsGuest: (name: string, phone: string) => Promise<any>;
  logout: () => Promise<void>;
  isAdmin: boolean;
  isGuest: boolean;
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
            
            // Handle linked profile for visitors
            if (data.linkedMemberId) {
              const linkedRef = doc(db, "members", data.linkedMemberId);
              const linkedSnap = await getDoc(linkedRef);
              if (linkedSnap.exists()) {
                setProfile({ id: linkedSnap.id, ...linkedSnap.data(), uid: user.uid });
              } else {
                setProfile({ id: userSnap.id, ...data });
              }
            } else {
              setProfile({ id: userSnap.id, ...data });
            }
          } else {
            console.log("DEBUG: Perfil não encontrado no Firestore.");
            if (user.email === "iempministerioprofecia@gmail.com") {
              const newProfile = {
                name: user.displayName || "Admin",
                email: user.email,
                role: "Administradores",
                status: "active",
                createdAt: new Date().toISOString()
              };
              await setDoc(userRef, newProfile);
              setProfile({ id: user.uid, ...newProfile });
            } else {
              setProfile(null);
            }
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

  const loginWithEmail = async (email: string, password: string) => {
    setError(null);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
      console.error("DEBUG: Erro fatal no login por email:", error);
      let msg = error.message || "Erro desconhecido no login";
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
         msg = "E-mail ou senha incorretos. Se você usava a versão antiga, pode ser necessário solicitar acesso novamente.";
      }
      setError(msg);
      throw error;
    }
  };

  const signupWithEmail = async (email: string, password: string, additionalData: any) => {
    setError(null);

    const newProfile = {
      name: additionalData.name,
      email: email,
      phone: additionalData.phone || "",
      birthDate: additionalData.birthDate || "",
      churchRole: additionalData.churchRole || "Membro",
      role: additionalData.role || "Membro",
      status: additionalData.status || "pending",
      hasDashboardAccess: false,
      createdAt: new Date().toISOString()
    };

    try {
      const userCred = await createUserWithEmailAndPassword(auth, email, password);
      const uid = userCred.user.uid;
      const userRef = doc(db, "members", uid);
      await setDoc(userRef, newProfile);
      
      const notifRef = doc(collection(db, "notifications"));
      await setDoc(notifRef, {
        title: "Novo Cadastro (Email)",
        message: `${newProfile.name} solicitou acesso ao painel com cargo de ${newProfile.churchRole}.`,
        type: "registration",
        memberId: uid,
        read: false,
        createdAt: new Date().toISOString()
      });
      
      return userCred.user;
    } catch (error: any) {
      console.error("Erro no cadastro Auth:", error);
      let msg = error.message;
      if (error.code === 'auth/email-already-in-use') {
        msg = "E-mail já está em uso.";
      } else if (error.code === 'auth/operation-not-allowed') {
        msg = "O login por email/senha está desabilitado no Firebase. Verifique as configurações.";
      }
      setError(msg);
      throw error;
    }
  };

  const loginAsGuest = async (name: string, phone: string) => {
    setError(null);
    try {
      const cleanPhone = phone.replace(/\D/g, '');
      const visitorId = `visitor_${cleanPhone}`;
      
      // 1. Check if a member with this phone already exists
      const visitorRef = doc(db, "members", visitorId);
      const visitorSnap = await getDoc(visitorRef);
      
      let existingProfile = null;
      if (visitorSnap.exists()) {
        existingProfile = { id: visitorSnap.id, ...visitorSnap.data() };
        console.log("Visitor identified by phone ID:", visitorId, existingProfile);
      }

      const userCred = await signInAnonymously(auth);
      const uid = userCred.user.uid;
      
      const lastVisit = new Date().toISOString();
      const canonicalProfile = {
        name: name || (existingProfile as any)?.name || "Visitante",
        phone: phone,
        role: "Visitante",
        status: "visitor",
        email: (existingProfile as any)?.email || `${cleanPhone}@visitante.com`,
        createdAt: (existingProfile as any)?.createdAt || lastVisit,
        lastVisit: lastVisit,
        lgpdAccepted: (existingProfile as any)?.lgpdAccepted || false
      };

      try {
        // Save the canonical visitor document (unique by phone)
        await setDoc(visitorRef, canonicalProfile, { merge: true });
        
        // Save the session link (unique by anonymous UID)
        const sessionRef = doc(db, "members", uid);
        await setDoc(sessionRef, {
          linkedMemberId: visitorId,
          role: "Visitante",
          status: "visitor_session", // This keeps it out of the main dashboard list
          lastVisit: lastVisit
        }, { merge: true });
        
        // Only send notification if it's truly a new visitor (first time with this phone)
        if (!existingProfile) {
          const notifRef = doc(collection(db, "notifications"));
          await setDoc(notifRef, {
            title: "Novo Visitante",
            message: `Um visitante ${name} acabou de entrar`,
            type: "registration",
            memberId: visitorId,
            read: false,
            createdAt: new Date().toISOString()
          });
        }
      } catch (e) {
        console.warn("Could not write to members or notifications:", e);
      }
      
      setProfile({ id: visitorId, ...canonicalProfile, uid: uid });
      return userCred.user;
    } catch (error: any) {
      console.error("Erro no login de visitante:", error);
      let msg = error.message;
      if (error.code === 'auth/operation-not-allowed' || error.code === 'auth/admin-restricted-operation') {
        msg = "O login de visitante (Anônimo) está desabilitado. Peça ao administrador para ativar 'Anônimo' na aba Authentication do Firebase.";
      }
      setError(msg);
      throw error;
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
                  profile?.role === "Administradores" || 
                  profile?.role === "admin" || 
                  profile?.role === "Direção" ||
                  profile?.role === "Desenvolvedor" ||
                  customUserData?.role === "admin" || 
                  customUserData?.role === "Administradores" ||
                  (isCustomLoggedIn && !customUserData);

  const isGuest = profile?.role === "Visitante" || profile?.status === "visitor" || firebaseUser?.isAnonymous === true;

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

  const user = firebaseUser ? {
    ...firebaseUser,
    displayName: profile?.name || firebaseUser.displayName,
    photoURL: profile?.photoURL || firebaseUser.photoURL,
    uid: firebaseUser.uid,
    email: firebaseUser.email
  } : (isCustomLoggedIn ? {
    displayName: customUserData?.name || "Administrador",
    email: customUserData?.email || "admin@ministerioprofecia.com.br",
    photoURL: customUserData?.photoURL || "",
    uid: customUserData?.id || "admin"
  } : null);

  return (
    <AuthContext.Provider value={{ user, profile: profile || customUserData, loading, login, loginAsGuest, loginWithEmail, signupWithEmail, logout, isAdmin, isGuest, setCustomLogin, error, clearError }}>
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
