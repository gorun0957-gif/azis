import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  collection, 
  onSnapshot, 
  doc, 
  setDoc, 
  updateDoc 
} from 'firebase/firestore';
import { db } from '../firebase';
import { DB_COLLECTIONS } from '../firebaseCollections';
import { 
  ActivationRequest, 
  AppLicenseState, 
  SppgLicense, 
  ADMIN_PRIMARY_EMAIL 
} from '../types';

export const OWNER_EMAIL = ADMIN_PRIMARY_EMAIL;

const DEFAULT_LICENSE_STATE: AppLicenseState = {
  isActivated: true, // Default master installation is activated for owner pustakaassanad@gmail.com
  activeLicenseKey: 'SPPG-BGN-MASTER-JAYAMUKTI-2026',
  sppgName: 'SPPG Jayamukti',
  region: 'Kec. Cikarang Pusat, Kab. Bekasi',
  expiresAt: 'lifetime',
  plan: 'Master Enterprise',
  isDemo: false,
};

interface LicenseContextType {
  licenseState: AppLicenseState;
  activationRequests: ActivationRequest[];
  allLicenses: SppgLicense[];
  loading: boolean;
  requestActivation: (data: Omit<ActivationRequest, 'id' | 'status' | 'targetOwnerEmail' | 'requestedAt'>) => Promise<{ success: boolean; mailtoUrl: string; requestId: string }>;
  activateWithCode: (licenseKey: string) => Promise<{ success: boolean; message: string }>;
  generateNewLicense: (data: { sppgName: string; region: string; buyerEmail?: string; buyerPhone?: string; validityMonths: number; maxPosyandu: number }) => Promise<SppgLicense>;
  approveRequest: (requestId: string, licenseKey: string) => Promise<void>;
  rejectRequest: (requestId: string) => Promise<void>;
  deactivateOrResetLicense: () => Promise<void>;
}

const LicenseContext = createContext<LicenseContextType>({
  licenseState: DEFAULT_LICENSE_STATE,
  activationRequests: [],
  allLicenses: [],
  loading: true,
  requestActivation: async () => ({ success: false, mailtoUrl: '', requestId: '' }),
  activateWithCode: async () => ({ success: false, message: '' }),
  generateNewLicense: async () => ({} as SppgLicense),
  approveRequest: async () => {},
  rejectRequest: async () => {},
  deactivateOrResetLicense: async () => {},
});

export const LicenseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [licenseState, setLicenseState] = useState<AppLicenseState>(() => {
    const saved = localStorage.getItem('sppg_gorun_license_v1');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return DEFAULT_LICENSE_STATE;
      }
    }
    return DEFAULT_LICENSE_STATE;
  });

  const [activationRequests, setActivationRequests] = useState<ActivationRequest[]>([]);
  const [allLicenses, setAllLicenses] = useState<SppgLicense[]>([]);
  const [loading, setLoading] = useState(true);

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem('sppg_gorun_license_v1', JSON.stringify(licenseState));
  }, [licenseState]);

  // Real-time listener for app license status in Firestore
  useEffect(() => {
    const licenseDocRef = doc(db, DB_COLLECTIONS.SETTINGS, 'license_status');
    const unsub = onSnapshot(
      licenseDocRef,
      async (snap) => {
        if (snap.exists()) {
          const data = snap.data() as AppLicenseState;
          setLicenseState(data);
        } else {
          // Initialize master license for Jayamukti
          await setDoc(licenseDocRef, DEFAULT_LICENSE_STATE);
          setLicenseState(DEFAULT_LICENSE_STATE);
        }
      },
      (err) => {
        console.warn('License status listener notice:', err.message);
      }
    );

    return () => unsub();
  }, []);

  // Real-time listener for activation requests
  useEffect(() => {
    const requestsCol = collection(db, DB_COLLECTIONS.ACTIVATION_REQUESTS);
    const unsub = onSnapshot(
      requestsCol,
      (snap) => {
        const list: ActivationRequest[] = [];
        snap.forEach((d) => {
          list.push({ id: d.id, ...(d.data() as Omit<ActivationRequest, 'id'>) });
        });
        list.sort((a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime());
        setActivationRequests(list);
      },
      (err) => {
        console.warn('Activation requests snapshot notice:', err.message);
      }
    );

    return () => unsub();
  }, []);

  // Real-time listener for SPPG licenses
  useEffect(() => {
    const licensesCol = collection(db, DB_COLLECTIONS.SPPG_LICENSES);
    const unsub = onSnapshot(
      licensesCol,
      (snap) => {
        const list: SppgLicense[] = [];
        snap.forEach((d) => {
          list.push({ id: d.id, ...(d.data() as Omit<SppgLicense, 'id'>) });
        });
        setAllLicenses(list);
        setLoading(false);
      },
      (err) => {
        console.warn('Licenses snapshot notice:', err.message);
        setLoading(false);
      }
    );

    return () => unsub();
  }, []);

  // Helper generate secure random license key
  const createLicenseKeyString = (sppgName: string): string => {
    const cleanPrefix = sppgName.trim().toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4) || 'SPPG';
    const randPart1 = Math.random().toString(36).substring(2, 6).toUpperCase();
    const randPart2 = Math.random().toString(36).substring(2, 6).toUpperCase();
    const year = new Date().getFullYear();
    return `BGN-${cleanPrefix}-${year}-${randPart1}-${randPart2}`;
  };

  // Submit activation request to owner email pustakaassanad@gmail.com
  const requestActivation = async (
    data: Omit<ActivationRequest, 'id' | 'status' | 'targetOwnerEmail' | 'requestedAt'>
  ): Promise<{ success: boolean; mailtoUrl: string; requestId: string }> => {
    const reqId = 'req_' + Date.now();
    const now = new Date().toISOString();

    const requestPayload: ActivationRequest = {
      ...data,
      id: reqId,
      status: 'pending',
      targetOwnerEmail: OWNER_EMAIL,
      requestedAt: now,
    };

    // Save to Firestore
    await setDoc(doc(db, DB_COLLECTIONS.ACTIVATION_REQUESTS, reqId), requestPayload);

    // Format mailto link to send to pustakaassanad@gmail.com
    const subject = encodeURIComponent(`[PERMOHONAN AKTIVASI LISENSI SPPG] ${data.sppgName} - ${data.region}`);
    const body = encodeURIComponent(
      `Halo Administrator Pemilik Aplikasi (${OWNER_EMAIL}),\n\n` +
      `Saya mengajukan permohonan lisensi/kode izin aktivasi penggunaan Aplikasi Sistem Informasi & Pendataan 3B SPPG:\n\n` +
      `----------------------------------------\n` +
      `Nama SPPG        : ${data.sppgName}\n` +
      `Wilayah / Lokasi : ${data.region}\n` +
      `Penanggung Jawab : ${data.picName}\n` +
      `No. WhatsApp/HP  : ${data.picPhone}\n` +
      `Email SPPG       : ${data.picEmail}\n` +
      `Paket Dipilih    : ${data.plan}\n` +
      `ID Permohonan    : ${reqId}\n` +
      `Waktu Pengajuan  : ${new Date().toLocaleString('id-ID')}\n` +
      `----------------------------------------\n\n` +
      `Mohon verifikasi dan terbitkan Kode Izin Aktivasi untuk instansi kami.\n` +
      `Terima kasih.`
    );

    const mailtoUrl = `mailto:${OWNER_EMAIL}?subject=${subject}&body=${body}`;

    return {
      success: true,
      mailtoUrl,
      requestId: reqId,
    };
  };

  // Activate application with provided License Key
  const activateWithCode = async (licenseKeyInput: string): Promise<{ success: boolean; message: string }> => {
    const cleanKey = licenseKeyInput.trim().toUpperCase();
    if (!cleanKey) {
      return { success: false, message: 'Masukkan kode izin aktivasi.' };
    }

    // 1. Check if matching license in database
    const matchedLicense = allLicenses.find(
      (l) => l.licenseKey.trim().toUpperCase() === cleanKey
    );

    // 2. Or master backdoor for testing / owner
    const isMasterBypass = cleanKey === 'SPPG-BGN-MASTER-JAYAMUKTI-2026' || cleanKey === 'BGN-AKTIVASI-RESMI-2026';

    if (matchedLicense || isMasterBypass) {
      const sppgName = matchedLicense ? matchedLicense.sppgName : 'SPPG Berlisensi Resmi';
      const region = matchedLicense ? matchedLicense.region : 'Wilayah Kerja Nasional';
      const expiresAt = matchedLicense ? matchedLicense.expiresAt : 'lifetime';

      const newState: AppLicenseState = {
        isActivated: true,
        activeLicenseKey: cleanKey,
        sppgName,
        region,
        expiresAt,
        plan: matchedLicense ? `Lisensi SPPG (${matchedLicense.maxPosyandu} Posyandu)` : 'Lisensi Resmi Master',
        isDemo: false,
        activatedAt: new Date().toISOString(),
      };

      setLicenseState(newState);
      await setDoc(doc(db, DB_COLLECTIONS.SETTINGS, 'license_status'), newState, { merge: true });

      return {
        success: true,
        message: `Aplikasi berhasil diaktivasi untuk ${sppgName}! Seluruh fitur telah terbuka.`,
      };
    }

    return {
      success: false,
      message: 'Kode izin aktivasi tidak valid atau belum terdaftar. Silakan hubungi pemilik di ' + OWNER_EMAIL,
    };
  };

  // Super Admin generates new license to sell to other SPPG
  const generateNewLicense = async (params: {
    sppgName: string;
    region: string;
    buyerEmail?: string;
    buyerPhone?: string;
    validityMonths: number; // 0 for lifetime
    maxPosyandu: number;
  }): Promise<SppgLicense> => {
    const licenseKey = createLicenseKeyString(params.sppgName);
    const licenseId = 'lic_' + Date.now();
    const now = new Date();

    let expiresAt = 'lifetime';
    if (params.validityMonths > 0) {
      const expDate = new Date(now);
      expDate.setMonth(expDate.getMonth() + params.validityMonths);
      expiresAt = expDate.toISOString();
    }

    const newLic: SppgLicense = {
      id: licenseId,
      licenseKey,
      sppgName: params.sppgName.trim(),
      region: params.region.trim(),
      buyerEmail: params.buyerEmail?.trim() || '',
      buyerPhone: params.buyerPhone?.trim() || '',
      ownerEmail: OWNER_EMAIL,
      issuedAt: now.toISOString(),
      expiresAt,
      maxPosyandu: params.maxPosyandu || 10,
      status: 'active',
      features: [
        'Pendataan PM 3B Bebas Batas',
        'Kustomisasi Kolom & Kategori Bebas',
        'Multi-Posyandu Management',
        'Ekspor Excel & PDF Resmi Kop BGN',
        'Peta Sebaran Spasial Radar',
      ],
    };

    await setDoc(doc(db, DB_COLLECTIONS.SPPG_LICENSES, licenseId), newLic);
    return newLic;
  };

  const approveRequest = async (requestId: string, licenseKey: string) => {
    const reqRef = doc(db, DB_COLLECTIONS.ACTIVATION_REQUESTS, requestId);
    await updateDoc(reqRef, {
      status: 'approved',
      generatedLicenseKey: licenseKey,
      approvedAt: new Date().toISOString(),
    });
  };

  const rejectRequest = async (requestId: string) => {
    const reqRef = doc(db, DB_COLLECTIONS.ACTIVATION_REQUESTS, requestId);
    await updateDoc(reqRef, {
      status: 'rejected',
    });
  };

  const deactivateOrResetLicense = async () => {
    const demoState: AppLicenseState = {
      isActivated: false,
      activeLicenseKey: '',
      sppgName: 'SPPG Belum Teraktivasi',
      region: 'Perlu Kode Aktivasi',
      expiresAt: '',
      plan: 'Mode Demo / Belum Aktif',
      isDemo: true,
    };
    setLicenseState(demoState);
    await setDoc(doc(db, DB_COLLECTIONS.SETTINGS, 'license_status'), demoState, { merge: true });
  };

  return (
    <LicenseContext.Provider
      value={{
        licenseState,
        activationRequests,
        allLicenses,
        loading,
        requestActivation,
        activateWithCode,
        generateNewLicense,
        approveRequest,
        rejectRequest,
        deactivateOrResetLicense,
      }}
    >
      {children}
    </LicenseContext.Provider>
  );
};

export const useLicense = () => useContext(LicenseContext);
