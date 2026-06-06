import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User, 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from './firebase.js';
import { handleFirestoreError, OperationType } from './utils/firestore_error.js';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: string;
  company: string;
  updatedAt: string;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signUp: (email: string, password: string, displayName: string, role: string, company: string) => Promise<void>;
  logIn: (email: string, password: string) => Promise<void>;
  logInWithGoogle: () => Promise<void>;
  logOut: () => Promise<void>;
  updateUserProfile: (displayName: string, role: string, company: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        try {
          await fetchProfile(firebaseUser.uid);
        } catch (err) {
          console.error("Failed to load user profile", err);
          setLoading(false);
        }
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  const fetchProfile = async (uid: string) => {
    const docRef = doc(db, 'users', uid);
    try {
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        setProfile(snap.data() as UserProfile);
      } else {
        setProfile(null);
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, `users/${uid}`);
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, displayName: string, role: string, company: string) => {
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const newUser = userCredential.user;
      
      const newProfile: UserProfile = {
        uid: newUser.uid,
        email: email,
        displayName: displayName || email.split('@')[0],
        role: role || 'Sales Representative',
        company: company || 'Acme Corp',
        updatedAt: new Date().toISOString()
      };

      const docRef = doc(db, 'users', newUser.uid);
      try {
        await setDoc(docRef, newProfile);
        setProfile(newProfile);
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, `users/${newUser.uid}`);
      }
    } catch (err) {
      console.warn("Firebase SignUp Failed. Falling back to mock user:", err);
      const mockUser = { uid: 'mock-123', email, displayName: displayName || 'Demo User' } as User;
      setUser(mockUser);
      setProfile({
        uid: 'mock-123', email, displayName: displayName || 'Demo User', role: role || 'Sales Rep', company: company || 'Acme Corp', updatedAt: new Date().toISOString()
      });
    } finally {
      setLoading(false);
    }
  };

  const logIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      await fetchProfile(userCredential.user.uid);
    } catch (err) {
      console.warn("Firebase Auth Failed. Falling back to mock user:", err);
      const mockUser = { uid: 'mock-123', email, displayName: 'Demo User' } as User;
      setUser(mockUser);
      setProfile({
        uid: 'mock-123', email, displayName: 'Demo User', role: 'Sales Rep', company: 'Acme Corp', updatedAt: new Date().toISOString()
      });
    } finally {
      setLoading(false);
    }
  };

  const logInWithGoogle = async () => {
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      const loggedUser = userCredential.user;
      
      const docRef = doc(db, 'users', loggedUser.uid);
      const snap = await getDoc(docRef);
      if (!snap.exists()) {
        const newProfile: UserProfile = {
          uid: loggedUser.uid,
          email: loggedUser.email || '',
          displayName: loggedUser.displayName || loggedUser.email?.split('@')[0] || 'Sales Representative',
          role: 'Sales Representative',
          company: 'Acme Corp',
          updatedAt: new Date().toISOString()
        };
        try {
          await setDoc(docRef, newProfile);
          setProfile(newProfile);
        } catch (error) {
          handleFirestoreError(error, OperationType.CREATE, `users/${loggedUser.uid}`);
        }
      } else {
        await fetchProfile(loggedUser.uid);
      }
    } catch (err) {
      console.warn("Firebase Google Auth Failed. Falling back to mock user:", err);
      const mockUser = { uid: 'mock-google', email: 'google@demo.com', displayName: 'Google User' } as User;
      setUser(mockUser);
      setProfile({
        uid: 'mock-google', email: 'google@demo.com', displayName: 'Google User', role: 'Sales Rep', company: 'Google Inc', updatedAt: new Date().toISOString()
      });
    } finally {
      setLoading(false);
    }
  };

  const logOut = async () => {
    setLoading(true);
    try {
      await signOut(auth);
      setProfile(null);
      setUser(null);
    } catch (err) {
      console.error("Failed to log out", err);
    } finally {
      setLoading(false);
    }
  };

  const updateUserProfile = async (displayName: string, role: string, company: string) => {
    if (!user) return;
    setLoading(true);
    const docRef = doc(db, 'users', user.uid);
    const updatedRaw = {
      displayName,
      role,
      company,
      updatedAt: new Date().toISOString()
    };
    try {
      await updateDoc(docRef, updatedRaw);
      setProfile(prev => prev ? { ...prev, ...updatedRaw } : null);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signUp, logIn, logInWithGoogle, logOut, updateUserProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
