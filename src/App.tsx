import React, { useState, useEffect } from 'react';
import { 
  collection, 
  onSnapshot, 
  doc, 
  setDoc, 
  deleteDoc, 
  writeBatch 
} from 'firebase/firestore';
import { db } from './firebase';
import { DB_COLLECTIONS } from './firebaseCollections';
import { Beneficiary } from './types';
import { AuthProvider, useAuth, ADMIN_EMAIL } from './context/AuthContext';
import { SettingsProvider, useSettings } from './context/SettingsContext';
import { CustomFieldsProvider } from './context/CustomFieldsContext';
import { LicenseProvider } from './context/LicenseContext';
import { Header } from './components/Header';
import { BeneficiaryList } from './components/BeneficiaryList';
import { MappingModal } from './components/MappingModal';
import { PosyanduAccountsManager } from './components/PosyanduAccountsManager';
import { LoginPage } from './components/LoginPage';
import { BeneficiaryFormModal } from './components/BeneficiaryFormModal';
import { ExcelImportModal } from './components/ExcelImportModal';
import { ExportReportsModal } from './components/ExportReportsModal';
import { AdminBrandingModal } from './components/AdminBrandingModal';
import { CustomFieldsManagerModal } from './components/CustomFieldsManagerModal';
import { LicenseManagerModal } from './components/LicenseManagerModal';
import { 
  Sparkles, 
  AlertTriangle, 
  Loader2, 
  Database,
  Trash2,
  KeyRound
} from 'lucide-react';

const INITIAL_SAMPLE_SEEDS = [
  {
    nik: '3216011204230001',
    name: 'Muhammad Arka Pratama',
    category: 'balita',
    posyandu: 'Posyandu Paseh',
    birthDate: '2023-04-12',
    gender: 'L' as const,
    address: 'RT 02 / RW 01 Dekat Lapangan Paseh',
    customData: {
      berat_badan: 11.2,
      tinggi_badan: 84.5,
      lingkar_lila: 14.5,
      status_gizi: 'Gizi Baik (Normal)',
      no_telepon_wa: '081234567890',
    },
    createdBy: 'posyandu_paseh',
    createdByName: 'Kader Posyandu Paseh',
  },
  {
    nik: '3216015509220002',
    name: 'Aisyah Putri Azzahra',
    category: 'balita',
    posyandu: 'Posyandu Lewihalang',
    birthDate: '2022-09-15',
    gender: 'P' as const,
    address: 'RT 03 / RW 01 Blok C No. 19',
    customData: {
      berat_badan: 12.8,
      tinggi_badan: 89.0,
      lingkar_lila: 15.0,
      status_gizi: 'Gizi Baik (Normal)',
      no_telepon_wa: '081398765432',
    },
    createdBy: 'posyandu_lewihalang',
    createdByName: 'Kader Posyandu Lewihalang',
  },
  {
    nik: '3216014207970003',
    name: 'Nurul Hidayati',
    category: 'bumil',
    posyandu: 'Posyandu Tonjong',
    birthDate: '1997-07-14',
    gender: 'P' as const,
    address: 'RT 06 / RW 02 Gang Mawar No. 8',
    customData: {
      berat_badan: 58.0,
      tinggi_badan: 158.0,
      lingkar_lila: 24.5,
      status_gizi: 'Gizi Baik (Normal)',
      no_telepon_wa: '085712345678',
    },
    createdBy: 'posyandu_tonjong',
    createdByName: 'Kader Posyandu Tonjong',
  },
  {
    nik: '3216016801940004',
    name: 'Dewi Sartika',
    category: 'busui',
    posyandu: 'Posyandu Cipancur',
    birthDate: '1994-01-28',
    gender: 'P' as const,
    address: 'RT 07 / RW 02 Rumah Pagar Hitam',
    customData: {
      berat_badan: 54.0,
      tinggi_badan: 155.0,
      status_gizi: 'Gizi Baik (Normal)',
      no_telepon_wa: '081299887766',
    },
    createdBy: 'posyandu_cipancur',
    createdByName: 'Kader Posyandu Cipancur',
  },
  {
    nik: '3216017001910005',
    name: 'Ibu Siti Aminah',
    category: 'kader',
    posyandu: 'Posyandu Sindangjaya',
    birthDate: '1991-01-10',
    gender: 'P' as const,
    address: 'RT 04 / RW 02 Depan Balai Dusun',
    customData: {
      no_telepon_wa: '082155443322',
    },
    createdBy: 'posyandu_sindangjaya',
    createdByName: 'Kader Posyandu Sindangjaya',
  },
  {
    nik: '3216012005240006',
    name: 'Kenzo Alfarizqi',
    category: 'balita',
    posyandu: 'Posyandu Cibengang',
    birthDate: '2024-05-20',
    gender: 'L' as const,
    address: 'RT 01 / RW 03 Dekat Masjid Al-Huda',
    customData: {
      berat_badan: 8.5,
      tinggi_badan: 72.0,
      lingkar_lila: 13.8,
      status_gizi: 'Beresiko Stunting',
      no_telepon_wa: '087811223344',
    },
    createdBy: 'posyandu_cibengang',
    createdByName: 'Kader Posyandu Cibengang',
  },
];

function MainApp() {
  const { session, isAdmin, posyanduList } = useAuth();
  const { settings } = useSettings();

  // Tab State: beneficiaries | mapping | accounts
  const [activeTab, setActiveTab] = useState<'beneficiaries' | 'mapping' | 'accounts'>('beneficiaries');

  // Modals
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingBeneficiary, setEditingBeneficiary] = useState<Beneficiary | null>(null);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isBrandingOpen, setIsBrandingOpen] = useState(false);
  const [isCustomFieldsOpen, setIsCustomFieldsOpen] = useState(false);
  const [isLicenseOpen, setIsLicenseOpen] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{ id: string; name: string } | null>(null);

  // Bulk Delete State
  const [bulkDeleteIds, setBulkDeleteIds] = useState<string[] | null>(null);
  const [bulkDeleting, setBulkDeleting] = useState(false);

  // Beneficiaries
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);

  // Firestore real-time listener
  useEffect(() => {
    setDataLoading(true);
    const colRef = collection(db, DB_COLLECTIONS.BENEFICIARIES);

    const unsub = onSnapshot(
      colRef,
      (snapshot) => {
        const items: Beneficiary[] = [];
        snapshot.forEach((d) => {
          items.push({ id: d.id, ...(d.data() as Omit<Beneficiary, 'id'>) });
        });
        setBeneficiaries(items);
        setDataLoading(false);
      },
      (err) => {
        console.warn('Beneficiaries snapshot warning:', err.message);
        setDataLoading(false);
      }
    );

    return () => unsub();
  }, []);

  // Seed sample data helper
  const handleSeedSampleData = async () => {
    setSeeding(true);
    try {
      const batch = writeBatch(db);
      const now = new Date().toISOString();

      INITIAL_SAMPLE_SEEDS.forEach((item) => {
        const docRef = doc(collection(db, DB_COLLECTIONS.BENEFICIARIES));
        batch.set(docRef, {
          ...item,
          createdAt: now,
          updatedAt: now,
        });
      });

      await batch.commit();
    } catch (err) {
      console.error('Seed error:', err);
    } finally {
      setSeeding(false);
    }
  };

  // Add / Edit Beneficiary
  const handleSaveBeneficiary = async (
    data: Omit<Beneficiary, 'id' | 'createdAt' | 'updatedAt'>
  ) => {
    const now = new Date().toISOString();
    const activeUid = session?.uid || 'kader_default';
    const activeName = session?.displayName || 'Kader SPPG';

    const payload = {
      ...data,
      createdBy: activeUid,
      createdByName: activeName,
    };

    if (editingBeneficiary?.id) {
      const docRef = doc(db, DB_COLLECTIONS.BENEFICIARIES, editingBeneficiary.id);
      await setDoc(docRef, { ...payload, updatedAt: now }, { merge: true });
    } else {
      const newDocRef = doc(collection(db, DB_COLLECTIONS.BENEFICIARIES));
      await setDoc(newDocRef, { ...payload, createdAt: now, updatedAt: now });
    }
  };

  // Delete Single Beneficiary
  const handleConfirmDelete = async () => {
    if (!deleteConfirmation) return;
    try {
      await deleteDoc(doc(db, DB_COLLECTIONS.BENEFICIARIES, deleteConfirmation.id));
      setDeleteConfirmation(null);
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  // Hapus Massal (Bulk Delete)
  const handleConfirmBulkDelete = async () => {
    if (!bulkDeleteIds || bulkDeleteIds.length === 0) return;
    setBulkDeleting(true);
    try {
      const chunkSize = 450;
      for (let i = 0; i < bulkDeleteIds.length; i += chunkSize) {
        const chunk = bulkDeleteIds.slice(i, i + chunkSize);
        const batch = writeBatch(db);
        chunk.forEach((id) => {
          batch.delete(doc(db, DB_COLLECTIONS.BENEFICIARIES, id));
        });
        await batch.commit();
      }
      setBulkDeleteIds(null);
    } catch (err) {
      console.error('Bulk delete error:', err);
    } finally {
      setBulkDeleting(false);
    }
  };

  // Bulk Import
  const handleBulkImport = async (
    items: Omit<Beneficiary, 'id' | 'createdAt' | 'updatedAt'>[]
  ): Promise<number> => {
    const batch = writeBatch(db);
    const now = new Date().toISOString();

    items.forEach((item) => {
      const docRef = doc(collection(db, DB_COLLECTIONS.BENEFICIARIES));
      batch.set(docRef, {
        ...item,
        createdAt: now,
        updatedAt: now,
      });
    });

    await batch.commit();
    return items.length;
  };

  // If user is not logged in or explicitly wants login screen
  if (!session || showLoginModal) {
    return <LoginPage onLoginSuccess={() => setShowLoginModal(false)} />;
  }

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-800 font-sans flex flex-col selection:bg-blue-600 selection:text-white">
      {/* Header */}
      <Header
        onOpenBranding={() => setIsBrandingOpen(true)}
        onOpenExport={() => setIsExportOpen(true)}
        onOpenImport={() => setIsImportOpen(true)}
        onOpenCustomFields={() => setIsCustomFieldsOpen(true)}
        onOpenLicense={() => setIsLicenseOpen(true)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenLogin={() => setShowLoginModal(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-5 space-y-5">
        {/* Seed Helper Banner if empty */}
        {beneficiaries.length === 0 && !dataLoading && (
          <div className="p-4 rounded-3xl bg-blue-50 border border-blue-200 text-blue-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-3">
              <Database className="w-5 h-5 text-blue-600 shrink-0" />
              <div>
                <h4 className="text-xs font-bold">Database Belum Memiliki Data Sasaran</h4>
                <p className="text-[11px] text-blue-700">
                  Muat data contoh terstruktur untuk langsung melihat simulasi pendataan sasaran gizi SPPG.
                </p>
              </div>
            </div>
            <button
              onClick={handleSeedSampleData}
              disabled={seeding}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition flex items-center gap-1.5 shrink-0 shadow-xs disabled:opacity-50"
            >
              {seeding ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Menyiapkan Data...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Muat Data Contoh Sasaran SPPG</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* Tab 1: Beneficiary List */}
        {activeTab === 'beneficiaries' && (
          <BeneficiaryList
            beneficiaries={beneficiaries}
            onAddClick={() => {
              setEditingBeneficiary(null);
              setIsFormOpen(true);
            }}
            onEditClick={(b) => {
              setEditingBeneficiary(b);
              setIsFormOpen(true);
            }}
            onDeleteClick={(id, name) => setDeleteConfirmation({ id, name })}
            onBulkDeleteClick={(ids) => setBulkDeleteIds(ids)}
            onOpenCustomFieldsModal={() => setIsCustomFieldsOpen(true)}
            loading={dataLoading}
          />
        )}

        {/* Tab 2: Spatial Mapping View */}
        {activeTab === 'mapping' && (
          <MappingModal beneficiaries={beneficiaries} />
        )}

        {/* Tab 3: Kelola Akun & Posyandu (Admin Only) */}
        {activeTab === 'accounts' && isAdmin && (
          <PosyanduAccountsManager />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-3.5 px-6 text-center text-xs text-slate-500 mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-1.5">
          <p>
            © {new Date().getFullYear()} <strong>{settings.appTitle || 'PM 3B SPPG JAYAMUKTI'}</strong>
          </p>
          <div className="flex items-center gap-2 text-[11px] text-slate-400">
            <button
              onClick={() => setIsLicenseOpen(true)}
              className="hover:text-blue-600 font-semibold"
            >
              Status Lisensi Sistem
            </button>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <BeneficiaryFormModal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingBeneficiary(null);
        }}
        onSubmit={handleSaveBeneficiary}
        initialData={editingBeneficiary}
      />

      <ExcelImportModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onImportSuccess={handleBulkImport}
      />

      <ExportReportsModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        beneficiaries={beneficiaries}
      />

      {isAdmin && (
        <AdminBrandingModal
          isOpen={isBrandingOpen}
          onClose={() => setIsBrandingOpen(false)}
        />
      )}

      {isAdmin && (
        <CustomFieldsManagerModal
          isOpen={isCustomFieldsOpen}
          onClose={() => setIsCustomFieldsOpen(false)}
        />
      )}

      <LicenseManagerModal
        isOpen={isLicenseOpen}
        onClose={() => setIsLicenseOpen(false)}
      />

      {/* Delete Single Confirmation */}
      {deleteConfirmation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-xl border border-slate-200 max-w-sm w-full p-5 text-center space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 mx-auto flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Hapus Data Sasaran?</h3>
              <p className="text-xs text-slate-500 mt-1">
                Apakah Anda yakin ingin menghapus data <strong>{deleteConfirmation.name}</strong>?
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setDeleteConfirmation(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
              >
                Batal
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-md transition"
              >
                Hapus Sekarang
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Delete Modal */}
      {bulkDeleteIds && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-md w-full p-6 text-center space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-14 h-14 rounded-full bg-rose-100 text-rose-600 mx-auto flex items-center justify-center">
              <Trash2 className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                Hapus Massal {bulkDeleteIds.length} Data Sekaligus?
              </h3>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                Tindakan ini akan menghapus <strong>{bulkDeleteIds.length} data sasaran yang dicentang</strong> secara permanen dari database Firebase. Data yang sudah dihapus tidak dapat dipulihkan kembali.
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                disabled={bulkDeleting}
                onClick={() => setBulkDeleteIds(null)}
                className="px-5 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
              >
                Batalkan
              </button>
              <button
                type="button"
                disabled={bulkDeleting}
                onClick={handleConfirmBulkDelete}
                className="px-5 py-2.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 active:scale-98 rounded-xl shadow-md transition flex items-center gap-2 disabled:opacity-50"
              >
                {bulkDeleting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Menghapus {bulkDeleteIds.length} Data...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>Ya, Hapus {bulkDeleteIds.length} Data Sekaligus</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <SettingsProvider>
        <CustomFieldsProvider>
          <LicenseProvider>
            <MainApp />
          </LicenseProvider>
        </CustomFieldsProvider>
      </SettingsProvider>
    </AuthProvider>
  );
}
