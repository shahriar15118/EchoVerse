import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut, 
  User as FirebaseUser,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from '../lib/firebase';
import { User, UserRole } from '../types';

interface AuthContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signUpWithEmail: (email: string, pass: string, username: string, interests: string[]) => Promise<void>;
  signInWithEmail: (email: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (details: Partial<User>) => Promise<void>;
  onboardUser: (username: string, avatar: string, interests: string[]) => Promise<void>;
  addCoins: (amount: number) => Promise<void>;
  addXp: (amount: number) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Monitor Auth state changes
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (fUser) => {
      setFirebaseUser(fUser);
      if (fUser) {
        // Find existing custom profile
        const userRef = doc(db, 'users', fUser.uid);
        let profileSnap;
        try {
          profileSnap = await getDoc(userRef);
        } catch (error) {
          console.error("Auth error fetching user profile: ", error);
        }

        if (profileSnap && profileSnap.exists()) {
          // Listen to real-time profile developments (dynamic stats, balances, ranks)
          const unsubscribeProfile = onSnapshot(userRef, (snapshot) => {
            if (snapshot.exists()) {
              setUser(snapshot.data() as User);
            }
          }, (err) => {
            console.error("Firestore user profile live trigger failure: ", err);
          });
          setLoading(false);
          return () => unsubscribeProfile();
        } else {
          // User is authenticated but profile is not created yet (needs Onboarding)
          setUser(null);
          setLoading(false);
        }
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  // Compute Rank based on XP
  const calculateRank = (xp: number): string => {
    if (xp >= 75000) return 'Legend';
    if (xp >= 20000) return 'Archivist';
    if (xp >= 7500) return 'Master Detective';
    if (xp >= 2000) return 'Detective';
    if (xp >= 500) return 'Investigator';
    return 'Explorer';
  };

  // Google Sign-In
  const signInWithGoogle = async () => {
    setLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const fUser = result.user;
      
      // Determine if a profile already exists
      const userRef = doc(db, 'users', fUser.uid);
      const profileSnap = await getDoc(userRef);

      if (!profileSnap.exists()) {
        // Needs onboarding (username creation, avatar, interests)
        setUser(null);
      } else {
        setUser(profileSnap.data() as User);
      }
    } catch (err) {
      console.error("Google Authenticator checkout failed: ", err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Sign up with Email + Password
  const signUpWithEmail = async (email: string, pass: string, username: string, interests: string[]) => {
    setLoading(true);
    try {
      const resp = await createUserWithEmailAndPassword(auth, email, pass);
      const fUser = resp.user;
      
      // Immediately set initial setup document
      const userRef = doc(db, 'users', fUser.uid);
      const initialProfile: User = {
        uid: fUser.uid,
        username: username,
        email: email,
        avatar: `https://api.dicebear.com/7.x/pixel-art/svg?seed=${username}`,
        bio: "A newcomer to the EchoVerse multiplayer archives.",
        credibilityScore: 100,
        level: 1,
        rank: "Explorer",
        xp: 0,
        coins: 50, // 50 Welcome Coins!
        premium: false,
        role: "user" as UserRole,
        interests: interests,
        createdAt: new Date().toISOString(),
        purchasedRooms: []
      };

      await setDoc(userRef, initialProfile);
      setUser(initialProfile);
    } catch (err) {
      console.error("Email registration failed: ", err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Sign in with Email + Password
  const signInWithEmail = async (email: string, pass: string) => {
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, pass);
    } catch (err) {
      console.error("Email authorization code check failed: ", err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Complete User Onboarding Walkthrough
  const onboardUser = async (username: string, avatar: string, interests: string[]) => {
    if (!firebaseUser) throw new Error("Onboarding trigger denied: No active Auth user found.");
    
    setLoading(true);
    try {
      const userRef = doc(db, 'users', firebaseUser.uid);
      const newProfile: User = {
        uid: firebaseUser.uid,
        username: username,
        email: firebaseUser.email || `${username}@echoverse.io`,
        avatar: avatar || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${username}`,
        bio: "New Investigator diving deep into live memory trails.",
        credibilityScore: 100,
        level: 1,
        rank: "Explorer",
        xp: 0,
        coins: 100, // 100 welcome coins!
        premium: false,
        role: 'user' as UserRole,
        interests: interests,
        createdAt: new Date().toISOString(),
        purchasedRooms: []
      };

      await setDoc(userRef, newProfile);
      setUser(newProfile);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${firebaseUser.uid}`);
    } finally {
      setLoading(false);
    }
  };

  // Sign Out
  const logout = async () => {
    setLoading(true);
    try {
      await signOut(auth);
      setUser(null);
      setFirebaseUser(null);
    } catch (err) {
      console.error("Auth server logoff failed: ", err);
    } finally {
      setLoading(false);
    }
  };

  // Generic Profile settings update
  const updateProfile = async (details: Partial<User>) => {
    if (!firebaseUser) return;
    try {
      const userRef = doc(db, 'users', firebaseUser.uid);
      await updateDoc(userRef, details);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${firebaseUser.uid}`);
    }
  };

  // Economy Helper: Add Coins
  const addCoins = async (amount: number) => {
    if (!firebaseUser || !user) return;
    try {
      const userRef = doc(db, 'users', firebaseUser.uid);
      const newCoins = (user.coins || 0) + amount;
      await updateDoc(userRef, { coins: newCoins });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${firebaseUser.uid}`);
    }
  };

  // Game Engine helper: Earn XP
  const addXp = async (amount: number) => {
    if (!firebaseUser || !user) return;
    try {
      const userRef = doc(db, 'users', firebaseUser.uid);
      const newXp = (user.xp || 0) + amount;
      const newRank = calculateRank(newXp);
      
      // Calculate levels (e.g. level equals floor(xp / 1000) + 1 capped at level 60 or simplified 1-6)
      const computedLevel = Math.min(Math.floor(newXp / 1000) + 1, 6);

      await updateDoc(userRef, { 
        xp: newXp,
        rank: newRank,
        level: computedLevel
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${firebaseUser.uid}`);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      firebaseUser,
      loading,
      signInWithGoogle,
      signUpWithEmail,
      signInWithEmail,
      logout,
      updateProfile,
      onboardUser,
      addCoins,
      addXp
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be defined inside an AuthProvider scope.');
  }
  return context;
};
