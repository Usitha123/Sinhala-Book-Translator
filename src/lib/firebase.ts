import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAnalytics, isSupported, Analytics } from 'firebase/analytics';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged, 
  User,
  Auth
} from 'firebase/auth';
import { 
  getFirestore, 
  Firestore, 
  doc, 
  setDoc, 
  getDoc, 
  collection, 
  query, 
  where, 
  getDocs,
  serverTimestamp 
} from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import { UserProfile } from '../types';

// Safely access env vars in Vite / Next.js
const metaEnv = (import.meta as any).env || {};

export const defaultFirebaseConfig = {
  apiKey: metaEnv.VITE_FIREBASE_API_KEY || metaEnv.NEXT_PUBLIC_FIREBASE_API_KEY || "",
  authDomain: "sinhalabook-translator.firebaseapp.com",
  projectId: "sinhalabook-translator",
  storageBucket: "sinhalabook-translator.firebasestorage.app",
  messagingSenderId: "2040681866",
  appId: "1:2040681866:web:21a217152a93accda76473",
  measurementId: "G-H2PC3B2NSR"
};

const firebaseConfig = {
  apiKey: metaEnv.VITE_FIREBASE_API_KEY || metaEnv.NEXT_PUBLIC_FIREBASE_API_KEY || defaultFirebaseConfig.apiKey,
  authDomain: metaEnv.VITE_FIREBASE_AUTH_DOMAIN || metaEnv.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || defaultFirebaseConfig.authDomain,
  projectId: metaEnv.VITE_FIREBASE_PROJECT_ID || metaEnv.NEXT_PUBLIC_FIREBASE_PROJECT_ID || defaultFirebaseConfig.projectId,
  storageBucket: metaEnv.VITE_FIREBASE_STORAGE_BUCKET || metaEnv.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || defaultFirebaseConfig.storageBucket,
  messagingSenderId: metaEnv.VITE_FIREBASE_MESSAGING_SENDER_ID || metaEnv.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || defaultFirebaseConfig.messagingSenderId,
  appId: metaEnv.VITE_FIREBASE_APP_ID || metaEnv.NEXT_PUBLIC_FIREBASE_APP_ID || defaultFirebaseConfig.appId,
  measurementId: metaEnv.VITE_FIREBASE_MEASUREMENT_ID || metaEnv.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || defaultFirebaseConfig.measurementId,
};

export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey && 
  firebaseConfig.projectId && 
  firebaseConfig.apiKey !== 'YOUR_API_KEY'
);

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let storage: FirebaseStorage | null = null;
let googleProvider: GoogleAuthProvider | null = null;
let analytics: Analytics | null = null;

if (isFirebaseConfigured) {
  try {
    app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);
    googleProvider = new GoogleAuthProvider();
    googleProvider.setCustomParameters({ prompt: 'select_account' });

    // Initialize Analytics if supported in environment (client-side browser)
    if (typeof window !== 'undefined' && app) {
      isSupported().then(supported => {
        if (supported && app) {
          analytics = getAnalytics(app);
        }
      }).catch(err => {
        console.warn('Firebase analytics initialization skipped:', err);
      });
    }
  } catch (err) {
    console.warn('Firebase initialization error, using local fallback:', err);
  }
}

export { app, auth, db, storage, googleProvider, analytics };

// Local session key for fallback and immediate session restore
const LOCAL_USER_KEY = 'sinhalabook_current_user';

export async function signInWithGooglePopup(): Promise<UserProfile> {
  if (isFirebaseConfigured && auth && googleProvider) {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      const profile: UserProfile = {
        uid: user.uid,
        email: user.email || '',
        displayName: user.displayName || 'Google User',
        photoURL: user.photoURL || undefined,
        hasGeminiKey: Boolean(localStorage.getItem('sinhalabook_gemini_api_key')),
        preferredStyle: 'general',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      if (db) {
        try {
          const userRef = doc(db, 'users', user.uid);
          const existing = await getDoc(userRef);
          if (existing.exists()) {
            const data = existing.data() as Partial<UserProfile>;
            profile.hasGeminiKey = data.hasGeminiKey || profile.hasGeminiKey;
            profile.preferredStyle = data.preferredStyle || 'general';
          } else {
            await setDoc(userRef, {
              ...profile,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            });
          }
        } catch (e) {
          console.warn('Error saving user profile to Firestore:', e);
        }
      }

      localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(profile));
      return profile;
    } catch (error: any) {
      console.error('Google Sign In failed:', error);
      throw error;
    }
  }

  // Fallback demo/preview Google sign-in using actual user info if available
  const fallbackUser: UserProfile = {
    uid: 'google-user-1029384756',
    email: 'Usithakalyana@gmail.com',
    displayName: 'Usitha Kalyana',
    photoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    hasGeminiKey: Boolean(localStorage.getItem('sinhalabook_gemini_api_key')),
    preferredStyle: 'general',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(fallbackUser));
  return fallbackUser;
}

export function getCurrentStoredUser(): UserProfile | null {
  try {
    const raw = localStorage.getItem(LOCAL_USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export async function signOutUser(): Promise<void> {
  if (auth) {
    try {
      await signOut(auth);
    } catch (e) {
      console.warn('Firebase sign out error:', e);
    }
  }
  localStorage.removeItem(LOCAL_USER_KEY);
}

export function onAuthChange(callback: (user: UserProfile | null) => void): () => void {
  // If Firebase Auth is configured, listen to real Auth state changes
  if (isFirebaseConfigured && auth) {
    return onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        const profile: UserProfile = {
          uid: firebaseUser.uid,
          email: firebaseUser.email || '',
          displayName: firebaseUser.displayName || 'Google User',
          photoURL: firebaseUser.photoURL || undefined,
          hasGeminiKey: Boolean(localStorage.getItem('sinhalabook_gemini_api_key')),
          preferredStyle: 'general',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(profile));
        callback(profile);
      } else {
        const stored = getCurrentStoredUser();
        callback(stored);
      }
    });
  }

  // Otherwise check local storage
  const stored = getCurrentStoredUser();
  callback(stored);
  return () => {};
}
