import React, { createContext, useContext, useEffect, useState } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { DB_COLLECTIONS } from '../firebaseCollections';
import { AppSettings } from '../types';

interface SettingsContextType {
  settings: AppSettings;
  updateSettings: (newSettings: Partial<AppSettings>) => Promise<void>;
  loading: boolean;
}

const DEFAULT_SETTINGS: AppSettings = {
  appTitle: 'PM 3B SPPG JAYAMUKTI',
  appSubtitle: 'Badan Gizi Nasional',
  logoDataUrl: '',
  bgnLogoDataUrl: '',
  primaryColor: '#1D4ED8', // Warna Biru Pelayanan BGN
};

const SettingsContext = createContext<SettingsContextType>({
  settings: DEFAULT_SETTINGS,
  updateSettings: async () => {},
  loading: false,
});

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem('sppg_gorun_settings_v1');
    if (saved) {
      try {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
      } catch {
        return DEFAULT_SETTINGS;
      }
    }
    return DEFAULT_SETTINGS;
  });
  const [loading, setLoading] = useState(true);

  // Apply primary color to document styles
  useEffect(() => {
    const color = settings.primaryColor || '#1D4ED8';
    document.documentElement.style.setProperty('--color-primary', color);
  }, [settings.primaryColor]);

  // Real-time listener to isolated Firestore settings doc
  useEffect(() => {
    const settingsDocRef = doc(db, DB_COLLECTIONS.SETTINGS, 'global_config');
    const unsubscribe = onSnapshot(
      settingsDocRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data() as AppSettings;
          setSettings((prev) => ({
            ...prev,
            ...data,
          }));
          localStorage.setItem('sppg_gorun_settings_v1', JSON.stringify(data));
        }
        setLoading(false);
      },
      (error) => {
        console.warn('Settings snapshot notice:', error.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const updateSettings = async (newSettings: Partial<AppSettings>) => {
    const updated: AppSettings = {
      ...settings,
      ...newSettings,
      updatedAt: new Date().toISOString(),
    };
    setSettings(updated);
    localStorage.setItem('sppg_gorun_settings_v1', JSON.stringify(updated));

    try {
      const settingsDocRef = doc(db, DB_COLLECTIONS.SETTINGS, 'global_config');
      await setDoc(settingsDocRef, updated, { merge: true });
    } catch (error) {
      console.error('Failed to update settings in Firestore:', error);
      handleFirestoreError(error, OperationType.WRITE, `${DB_COLLECTIONS.SETTINGS}/global_config`);
    }
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, loading }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => useContext(SettingsContext);
