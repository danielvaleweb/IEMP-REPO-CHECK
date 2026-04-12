import React, { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, User, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

interface AuthContextType {
  user: any | null;
  profile: any | null;
  loading: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  isAdmin: boolean;
  setCustomLogin: (status: boolean, userData?: any) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [isCustomLoggedIn, setIsCustomLoggedIn] = useState(() => {
    return localStorage.getItem("adminLoggedIn") === "true";
  });
  const [customUserData, setCustomUserData] = useState<any | null>(() => {
    const saved = localStorage.getItem("customUserData");
    return saved ? JSON.parse(saved) : null;
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      
      if (user) {
        // Get or create profile in members collection
        const userRef = doc(db, "members", user.uid);
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists()) {
          setProfile(userSnap.data());
        } else {
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
          
          // Create notification for new Google sign up
          if (user.email !== "iempministerioprofecia@gmail.com") {
            await setDoc(doc(db, "notifications", crypto.randomUUID()), {
              title: "Novo Cadastro (Google)",
              message: `${newProfile.name} solicitou acesso via Google.`,
              type: "registration",
              memberId: user.uid,
              read: false,
              createdAt: new Date().toISOString()
            });
          }
          
          setProfile(newProfile);
        }
      } else {
        setProfile(null);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Erro ao fazer login com Google:", error);
      throw error;
    }
  };

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

  const isAdmin = profile?.role === "admin" || customUserData?.role === "admin" || (isCustomLoggedIn && !customUserData);

  const user = firebaseUser || (isCustomLoggedIn ? {
    displayName: customUserData?.name || "Administrador",
    email: customUserData?.email || "admin@ministerioprofecia.com.br",
    photoURL: customUserData?.photoURL || "",
    uid: customUserData?.id || "admin"
  } : null);

  return (
    <AuthContext.Provider value={{ user, profile: profile || customUserData, loading, login, logout, isAdmin, setCustomLogin }}>
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
