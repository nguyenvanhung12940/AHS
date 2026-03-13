import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from './types';
import { auth, db } from './firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

interface AuthContextType {
  user: User | null;
  logout: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Check if user exists in Firestore
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          setUser({
            id: firebaseUser.uid,
            ...userDoc.data() as Omit<User, 'id'>
          });
        } else {
          // Create a default user profile if it doesn't exist
          // Default to teacher unless it's the owner email
          const role = firebaseUser.email === "hainguyenbtm.070589@gmail.com" ? 'admin' : 'teacher';
          const newUser: Omit<User, 'id'> = {
            email: firebaseUser.email || '',
            name: firebaseUser.displayName || 'User',
            role: role as 'admin' | 'teacher'
          };
          await setDoc(userDocRef, newUser);
          setUser({
            id: firebaseUser.uid,
            ...newUser
          });
        }
      } else {
        setUser(null);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const logout = async () => {
    await signOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
