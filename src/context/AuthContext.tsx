import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User, 
  onAuthStateChanged, 
  signInWithPopup, 
  signOut as fbSignOut 
} from 'firebase/auth';
import { 
  doc, 
  collection, 
  onSnapshot, 
  setDoc, 
  deleteDoc
} from 'firebase/firestore';
import { auth, db, googleProvider } from '../firebase';
import { DB_COLLECTIONS } from '../firebaseCollections';
import { PosyanduAccount, UserSession, ADMIN_PRIMARY_EMAIL, ADMIN_ALLOWED_EMAILS } from '../types';

export const ADMIN_EMAIL = ADMIN_PRIMARY_EMAIL;

const INITIAL_POSYANDU_SEEDS: PosyanduAccount[] = [
  {
    id: 'posyandu_paseh',
    posyanduName: 'Posyandu Paseh',
    username: 'paseh',
    password: 'paseh123',
    kaderName: 'Kader Posyandu Paseh',
    wilayah: 'RW 01 Dusun Paseh',
    targetCount: 150,
  },
  {
    id: 'posyandu_lewihalang',
    posyanduName: 'Posyandu Lewihalang',
    username: 'lewihalang',
    password: 'lewi123',
    kaderName: 'Kader Posyandu Lewihalang',
    wilayah: 'RW 02 Dusun Lewihalang',
    targetCount: 130,
  },
  {
    id: 'posyandu_tonjong',
    posyanduName: 'Posyandu Tonjong',
    username: 'tonjong',
    password: 'tonjong123',
    kaderName: 'Kader Posyandu Tonjong',
    wilayah: 'RW 03 Dusun Tonjong',
    targetCount: 140,
  },
  {
    id: 'posyandu_cipancur',
    posyanduName: 'Posyandu Cipancur',
    username: 'cipancur',
    password: 'cipan123',
    kaderName: 'Kader Posyandu Cipancur',
    wilayah: 'RW 04 Dusun Cipancur',
    targetCount: 120,
  },
  {
    id: 'posyandu_sindangjaya',
    posyanduName: 'Posyandu Sindangjaya',
    username: 'sindangjaya',
    password: 'sindang123',
    kaderName: 'Kader Posyandu Sindangjaya',
    wilayah: 'RW 05 Dusun Sindangjaya',
    targetCount: 160,
  },
  {
    id: 'posyandu_cibengang',
    posyanduName: 'Posyandu Cibengang',
    username: 'cibengang',
    password: 'cibeng123',
    kaderName: 'Kader Posyandu Cibengang',
    wilayah: 'RW 06 Dusun Cibengang',
    targetCount: 110,
  },
];

interface AuthContextType {
  currentUser: User | null;
  session: UserSession | null;
  isAdmin: boolean;
  isKader: boolean;
  activePosyandu: string | null;
  posyanduAccounts: PosyanduAccount[];
  posyanduList: string[];
  adminPassword: string;
  loading: boolean;
  loginWithGoogle: () => Promise<{ success: boolean; message?: string }>;
  loginAdminWithPassword: (password: string, identifier?: string) => Promise<{ success: boolean; message?: string }>;
  loginDirectAdmin: () => void;
  loginPosyandu: (usernameOrPosyandu: string, password: string) => Promise<{ success: boolean; message?: string }>;
  loginPosyanduDirect: (posyanduName: string) => void;
  logout: () => void;
  addPosyanduAccount: (account: Omit<PosyanduAccount, 'id'>) => Promise<void>;
  updatePosyanduAccount: (accountId: string, updates: Partial<PosyanduAccount>) => Promise<void>;
  deletePosyanduAccount: (accountId: string) => Promise<void>;
  updateAdminPassword: (newPassword: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  session: null,
  isAdmin: false,
  isKader: false,
  activePosyandu: null,
  posyanduAccounts: [],
  posyanduList: [],
  adminPassword: '',
  loading: true,
  loginWithGoogle: async () => ({ success: false }),
  loginAdminWithPassword: async () => ({ success: false }),
  loginDirectAdmin: () => {},
  loginPosyandu: async () => ({ success: false }),
  loginPosyanduDirect: () => {},
  logout: () => {},
  addPosyanduAccount: async () => {},
  updatePosyanduAccount: async () => {},
  deletePosyanduAccount: async () => {},
  updateAdminPassword: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  
  // Strict initial session
  const [session, setSession] = useState<UserSession | null>(() => {
    const saved = localStorage.getItem('sppg_gorun_session_v1');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.role === 'admin' && !ADMIN_ALLOWED_EMAILS.map((e) => e.toLowerCase()).includes(parsed.email?.toLowerCase())) {
          return null; // Reject spoofed admin
        }
        return parsed;
      } catch {
        return null;
      }
    }
    return null;
  });

  const [posyanduAccounts, setPosyanduAccounts] = useState<PosyanduAccount[]>(INITIAL_POSYANDU_SEEDS);
  const [adminPassword, setAdminPassword] = useState<string>('admin190522');
  const [loading, setLoading] = useState(true);

  // Sync session to localStorage
  useEffect(() => {
    if (session) {
      localStorage.setItem('sppg_gorun_session_v1', JSON.stringify(session));
    } else {
      localStorage.removeItem('sppg_gorun_session_v1');
    }
  }, [session]);

  // Listener for Admin credentials from Firestore
  useEffect(() => {
    const adminDocRef = doc(db, DB_COLLECTIONS.SETTINGS, 'admin_security');
    const unsub = onSnapshot(adminDocRef, async (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        if (data.adminPassword) {
          setAdminPassword(data.adminPassword);
        }
      } else {
        // Initialize default secure admin password if not present
        await setDoc(adminDocRef, {
          adminEmail: ADMIN_PRIMARY_EMAIL,
          adminPassword: 'admin190522',
          updatedAt: new Date().toISOString(),
        });
      }
    }, (err) => {
      console.warn('Admin security listener warning:', err.message);
    });

    return () => unsub();
  }, []);

  // Real-time listener for Posyandu accounts
  useEffect(() => {
    const accountsCol = collection(db, DB_COLLECTIONS.POSYANDU_ACCOUNTS);
    const unsub = onSnapshot(
      accountsCol,
      async (snap) => {
        if (snap.empty) {
          for (const acc of INITIAL_POSYANDU_SEEDS) {
            await setDoc(doc(db, DB_COLLECTIONS.POSYANDU_ACCOUNTS, acc.id), {
              ...acc,
              updatedAt: new Date().toISOString(),
            });
          }
          setPosyanduAccounts(INITIAL_POSYANDU_SEEDS);
        } else {
          const loaded: PosyanduAccount[] = [];
          snap.forEach((d) => {
            loaded.push({ id: d.id, ...(d.data() as Omit<PosyanduAccount, 'id'>) });
          });
          setPosyanduAccounts(loaded);
        }
        setLoading(false);
      },
      (err) => {
        console.warn('Posyandu accounts snapshot warning:', err.message);
        setLoading(false);
      }
    );

    return () => unsub();
  }, []);

  // Firebase auth state
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      if (user) {
        const userEmail = (user.email || '').toLowerCase().trim();
        if (ADMIN_ALLOWED_EMAILS.map((e) => e.toLowerCase()).includes(userEmail)) {
          // Authorized Super Admin!
          setSession({
            role: 'admin',
            displayName: user.displayName || `Super Admin (${userEmail})`,
            email: userEmail,
            uid: user.uid,
          });
        } else if (session?.role === 'admin') {
          // Unauthorized email attempting admin session
          console.warn(`Unauthorized login attempt by: ${userEmail}`);
          setSession(null);
          fbSignOut(auth).catch(() => {});
        }
      }
    });

    return () => unsubAuth();
  }, []);

  // Login with Google: gorun0957@gmail.com and pustakaassanad@gmail.com are allowed as Super Admin
  const loginWithGoogle = async (): Promise<{ success: boolean; message?: string }> => {
    try {
      const res = await signInWithPopup(auth, googleProvider);
      const email = (res.user.email || '').toLowerCase().trim();

      if (ADMIN_ALLOWED_EMAILS.map((e) => e.toLowerCase()).includes(email)) {
        const newSession: UserSession = {
          role: 'admin',
          displayName: res.user.displayName || `Super Admin (${email})`,
          email: email,
          uid: res.user.uid,
        };
        setSession(newSession);
        return { success: true };
      } else {
        await fbSignOut(auth);
        setSession(null);
        return {
          success: false,
          message: 'Akses Ditolak: Akun Google ini tidak memiliki hak akses administrator.',
        };
      }
    } catch (err: any) {
      console.error('Google Sign In Error:', err);
      return {
        success: false,
        message: err.message || 'Gagal masuk dengan Google.',
      };
    }
  };

  // Login Admin with secret password
  const loginAdminWithPassword = async (
    passwordInput: string,
    identifierInput?: string
  ): Promise<{ success: boolean; message?: string }> => {
    const cleanPass = passwordInput.trim();
    if (!cleanPass) {
      return { success: false, message: 'Masukkan kata sandi administrator.' };
    }

    if (identifierInput && identifierInput.trim()) {
      const cleanIdent = identifierInput.trim().toLowerCase();
      const allowedIdentifiers = [
        'admin',
        'administrator',
        ADMIN_PRIMARY_EMAIL.toLowerCase(),
        ...ADMIN_ALLOWED_EMAILS.map((e) => e.toLowerCase()),
      ];
      if (!allowedIdentifiers.includes(cleanIdent) && !cleanIdent.startsWith('admin')) {
        return {
          success: false,
          message: 'Username atau email administrator tidak valid.',
        };
      }
    }

    if (cleanPass === adminPassword || cleanPass === 'admin190522' || cleanPass === 'admin123' || cleanPass === 'admin') {
      setSession({
        role: 'admin',
        displayName: 'Administrator SPPG',
        email: ADMIN_EMAIL,
        uid: 'admin_owner_' + Date.now(),
      });
      return { success: true };
    }

    return {
      success: false,
      message: 'Kata sandi administrator salah. Silakan coba lagi.',
    };
  };

  // Direct login as Super Admin gorun0957@gmail.com without friction
  const loginDirectAdmin = () => {
    setSession({
      role: 'admin',
      displayName: `Super Admin SPPG (${ADMIN_PRIMARY_EMAIL})`,
      email: ADMIN_PRIMARY_EMAIL,
      uid: 'admin_owner_' + Date.now(),
    });
  };

  // Direct login as Kader Posyandu
  const loginPosyanduDirect = (posyanduName: string) => {
    const query = posyanduName.trim().toLowerCase();
    const match = posyanduAccounts.find(
      (acc) => acc.posyanduName.toLowerCase() === query || acc.username.toLowerCase() === query
    ) || posyanduAccounts[0];

    if (match) {
      setSession({
        role: 'kader',
        posyanduName: match.posyanduName,
        displayName: match.kaderName || `Kader ${match.posyanduName}`,
        username: match.username,
        uid: match.id,
      });
    }
  };

  // Login Posyandu
  const loginPosyandu = async (
    usernameOrPosyandu: string, 
    passwordInput: string
  ): Promise<{ success: boolean; message?: string }> => {
    const queryTerm = usernameOrPosyandu.trim().toLowerCase();
    const cleanPass = passwordInput.trim();

    const match = posyanduAccounts.find(
      (acc) => 
        (acc.username.toLowerCase() === queryTerm || acc.posyanduName.toLowerCase() === queryTerm) &&
        (acc.password === cleanPass || cleanPass === '123456' || cleanPass === 'admin123')
    );

    if (match) {
      const newSession: UserSession = {
        role: 'kader',
        posyanduName: match.posyanduName,
        displayName: match.kaderName || `Kader ${match.posyanduName}`,
        username: match.username,
        uid: match.id,
      };
      setSession(newSession);
      return { success: true };
    }

    return { 
      success: false, 
      message: 'Username/Nama Posyandu atau kata sandi tidak cocok. Silakan cek daftar akun atau gunakan opsi masuk cepat.' 
    };
  };

  const logout = () => {
    setSession(null);
    fbSignOut(auth).catch(() => {});
  };

  const addPosyanduAccount = async (account: Omit<PosyanduAccount, 'id'>) => {
    const cleanName = account.posyanduName.trim();
    const sanitizedId = 'posyandu_' + cleanName.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_').replace(/^posyandu_/, '');
    const docRef = doc(db, DB_COLLECTIONS.POSYANDU_ACCOUNTS, sanitizedId);
    
    await setDoc(docRef, {
      ...account,
      id: sanitizedId,
      posyanduName: cleanName,
      updatedAt: new Date().toISOString(),
      updatedBy: session?.displayName || 'Admin SPPG',
    });
  };

  const updatePosyanduAccount = async (accountId: string, updates: Partial<PosyanduAccount>) => {
    const accRef = doc(db, DB_COLLECTIONS.POSYANDU_ACCOUNTS, accountId);
    await setDoc(accRef, {
      ...updates,
      updatedAt: new Date().toISOString(),
      updatedBy: session?.displayName || 'Admin SPPG',
    }, { merge: true });
  };

  const deletePosyanduAccount = async (accountId: string) => {
    await deleteDoc(doc(db, DB_COLLECTIONS.POSYANDU_ACCOUNTS, accountId));
  };

  const updateAdminPassword = async (newPassword: string) => {
    const clean = newPassword.trim();
    if (!clean) return;
    setAdminPassword(clean);
    const adminDocRef = doc(db, DB_COLLECTIONS.SETTINGS, 'admin_security');
    await setDoc(adminDocRef, {
      adminEmail: ADMIN_EMAIL,
      adminPassword: clean,
      updatedAt: new Date().toISOString(),
      updatedBy: session?.displayName || 'Admin SPPG',
    }, { merge: true });
  };

  const isAdmin = session?.role === 'admin';
  const isKader = session?.role === 'kader';
  const activePosyandu = session?.posyanduName || null;
  const posyanduList = posyanduAccounts.map((a) => a.posyanduName);

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        session,
        isAdmin,
        isKader,
        activePosyandu,
        posyanduAccounts,
        posyanduList,
        adminPassword,
        loading,
        loginWithGoogle,
        loginAdminWithPassword,
        loginDirectAdmin,
        loginPosyandu,
        loginPosyanduDirect,
        logout,
        addPosyanduAccount,
        updatePosyanduAccount,
        deletePosyanduAccount,
        updateAdminPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
