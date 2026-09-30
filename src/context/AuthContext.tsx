import React, { createContext, useContext, useState, useEffect } from 'react';
import { signInWithPopup, signOut as firebaseSignOut, onAuthStateChanged } from 'firebase/auth';
import { auth, googleAuthProvider } from '../lib/firebase.ts';
import { UserRole } from '../types/regulatory.ts';

interface AuthUser {
  id: number;
  uid: string;
  email: string;
  name: string;
  role: UserRole;
  organizationId: number;
}

interface AuthContextValue {
  user: AuthUser;
  idToken: string | null;
  isFirebaseAuthenticated: boolean;
  activeRole: UserRole;
  activeOrgId: number;
  setActiveRole: (role: UserRole) => void;
  setActiveOrgId: (orgId: number) => void;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const defaultDemoUser: AuthUser = {
  id: 1,
  uid: 'demo-session',
  email: 'rohan.kulkarni@aarogya-apis.in',
  name: 'Rohan Kulkarni',
  role: 'APPLICANT',
  organizationId: 1,
};

const AuthContext = createContext<AuthContextValue>({
  user: defaultDemoUser,
  idToken: null,
  isFirebaseAuthenticated: false,
  activeRole: 'APPLICANT',
  activeOrgId: 1,
  setActiveRole: () => {},
  setActiveOrgId: () => {},
  signInWithGoogle: async () => {},
  signOut: async () => {},
});

let inMemoryIdToken: string | null = null;

export function getInMemoryToken(): string | null {
  return inMemoryIdToken;
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser>(defaultDemoUser);
  const [idToken, setIdToken] = useState<string | null>(null);
  const [isFirebaseAuthenticated, setIsFirebaseAuthenticated] = useState(false);
  const [activeRole, setActiveRoleState] = useState<UserRole>('APPLICANT');
  const [activeOrgId, setActiveOrgId] = useState<number>(1);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        try {
          const token = await fbUser.getIdToken();
          inMemoryIdToken = token;
          setIdToken(token);
          setIsFirebaseAuthenticated(true);

          const res = await fetch('/api/auth/me', {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          if (res.ok) {
            const data = await res.json();
            if (data.user) {
              setUser(data.user);
              setActiveRoleState((data.user.role as UserRole) || 'APPLICANT');
              setActiveOrgId(data.user.organizationId || 1);
            }
          }
        } catch (err) {
          console.error('Error syncing Firebase user:', err);
        }
      } else {
        inMemoryIdToken = null;
        setIdToken(null);
        setIsFirebaseAuthenticated(false);
        setUser(defaultDemoUser);
      }
    });
    return () => unsubscribe();
  }, []);

  const setActiveRole = async (role: UserRole) => {
    setActiveRoleState(role);
    setUser((prev) => ({ ...prev, role }));
    try {
      await fetch('/api/auth/role', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(inMemoryIdToken ? { Authorization: `Bearer ${inMemoryIdToken}` } : {}),
        },
        body: JSON.stringify({ role, organizationId: activeOrgId }),
      });
    } catch {
      // Role updated locally
    }
  };

  const signInWithGoogle = async () => {
    const cred = await signInWithPopup(auth, googleAuthProvider);
    const token = await cred.user.getIdToken();
    inMemoryIdToken = token;
    setIdToken(token);
    setIsFirebaseAuthenticated(true);
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
    inMemoryIdToken = null;
    setIdToken(null);
    setIsFirebaseAuthenticated(false);
    setUser(defaultDemoUser);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        idToken,
        isFirebaseAuthenticated,
        activeRole,
        activeOrgId,
        setActiveRole,
        setActiveOrgId,
        signInWithGoogle,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  return useContext(AuthContext);
}
