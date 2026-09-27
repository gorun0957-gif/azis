import React, { useState } from 'react';
import { 
  Building2, 
  KeyRound, 
  UserCheck, 
  Save, 
  Check, 
  Eye, 
  EyeOff, 
  LogIn, 
  ShieldAlert,
  Lock,
  Plus,
  Trash2,
  Edit3,
  X,
  AlertCircle,
  Users
} from 'lucide-react';
import { useAuth, ADMIN_EMAIL } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { PosyanduAccount } from '../types';

export const PosyanduAccountsManager: React.FC = () => {
  const { 
    posyanduAccounts, 
    addPosyanduAccount,
    updatePosyanduAccount, 
    deletePosyanduAccount,
    loginPosyandu, 
    adminPassword, 
    updateAdminPassword 
  } = useAuth();
  const { settings } = useSettings();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<{ [id: string]: Partial<PosyanduAccount> }>({});
  const [visiblePasswords, setVisiblePasswords] = useState<{ [id: string]: boolean }>({});
  const [saveSuccessId, setSaveSuccessId] = useState<string | null>(null);

  // New Posyandu Modal / Form
  const [isAddingPosyandu, setIsAddingPosyandu] = useState(false);
  const [newPosName, setNewPosName] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newKaderName, setNewKaderName] = useState('');
  const [newWilayah, setNewWilayah] = useState('');
  const [newTargetCount, setNewTargetCount] = useState<number>(100);
  const [newPosError, setNewPosError] = useState('');
  const [newPosSubmitting, setNewPosSubmitting] = useState(false);

  // Delete Posyandu confirmation
  const [posyanduToDelete, setPosyanduToDelete] = useState<PosyanduAccount | null>(null);

  // Admin Master Password form
  const [newAdminPass, setNewAdminPass] = useState(adminPassword);
  const [showAdminPass, setShowAdminPass] = useState(false);
  const [adminPassSaving, setAdminPassSaving] = useState(false);
  const [adminPassSaved, setAdminPassSaved] = useState(false);

  const getAccountForm = (acc: PosyanduAccount) => {
    return {
      username: formData[acc.id]?.username !== undefined ? formData[acc.id]?.username : acc.username,
      password: formData[acc.id]?.password !== undefined ? formData[acc.id]?.password : acc.password,
      kaderName: formData[acc.id]?.kaderName !== undefined ? formData[acc.id]?.kaderName : (acc.kaderName || `Kader ${acc.posyanduName}`),
      wilayah: formData[acc.id]?.wilayah !== undefined ? formData[acc.id]?.wilayah : (acc.wilayah || ''),
      targetCount: formData[acc.id]?.targetCount !== undefined ? formData[acc.id]?.targetCount : (acc.targetCount || 100),
    };
  };

  const handleFieldChange = (id: string, field: keyof PosyanduAccount, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [id]: {
        ...(prev[id] || {}),
        [field]: value,
      },
    }));
  };

  const handleSave = async (acc: PosyanduAccount) => {
    const current = getAccountForm(acc);
    setEditingId(acc.id);
    try {
      await updatePosyanduAccount(acc.id, {
        username: current.username?.trim(),
        password: current.password?.trim(),
        kaderName: current.kaderName?.trim(),
        wilayah: current.wilayah?.trim(),
        targetCount: Number(current.targetCount) || 100,
      });
      setSaveSuccessId(acc.id);
      setTimeout(() => setSaveSuccessId(null), 2000);
    } catch (err) {
      console.error('Failed to update account:', err);
    } finally {
      setEditingId(null);
    }
  };

  const handleQuickLoginAs = async (acc: PosyanduAccount) => {
    await loginPosyandu(acc.posyanduName, acc.password);
  };

  const handleSaveAdminPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdminPass.trim()) return;
    setAdminPassSaving(true);
    try {
      await updateAdminPassword(newAdminPass.trim());
      setAdminPassSaved(true);
      setTimeout(() => setAdminPassSaved(false), 2500);
    } catch (err) {
      console.error('Failed to update admin password:', err);
    } finally {
      setAdminPassSaving(false);
    }
  };

  const handleCreatePosyandu = async (e: React.FormEvent) => {
    e.preventDefault();
    setNewPosError('');

    if (!newPosName.trim()) {
      setNewPosError('Nama Posyandu wajib diisi.');
      return;
    }
    if (!newUsername.trim()) {
      setNewPosError('Username login wajib diisi.');
      return;
    }
    if (!newPassword.trim()) {
      setNewPosError('Kata sandi login wajib diisi.');
      return;
    }

    setNewPosSubmitting(true);
    try {
      await addPosyanduAccount({
        posyanduName: newPosName.trim(),
        username: newUsername.trim().toLowerCase(),
        password: newPassword.trim(),
        kaderName: newKaderName.trim() || `Kader ${newPosName.trim()}`,
        wilayah: newWilayah.trim(),
        targetCount: newTargetCount || 100,
      });

      // Reset Form
      setNewPosName('');
      setNewUsername('');
      setNewPassword('');
      setNewKaderName('');
      setNewWilayah('');
      setIsAddingPosyandu(false);
    } catch (err: any) {
      setNewPosError(err.message || 'Gagal menambahkan Posyandu.');
    } finally {
      setNewPosSubmitting(false);
    }
  };

  const handleDeletePosyandu = async () => {
    if (!posyanduToDelete) return;
    try {
      await deletePosyanduAccount(posyanduToDelete.id);
      setPosyanduToDelete(null);
    } catch (err) {
      console.error('Failed to delete posyandu:', err);
    }
  };

  return (
    <div className="space-y-5">
      {/* Top Banner & Quick Add */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div 
            className="p-3 rounded-2xl text-white shadow-xs"
            style={{ backgroundColor: settings.primaryColor || '#1D4ED8' }}
          >
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Pengelolaan & Penambahan Wilayah Posyandu
            </h2>
            <p className="text-xs text-slate-500">
              Admin berhak menambah Posyandu baru tanpa batas, mengatur kredensial login kader, dan wilayah kerja.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsAddingPosyandu(true)}
          className="w-full sm:w-auto px-4 py-2 rounded-xl text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md hover:brightness-105 transition shrink-0"
          style={{ backgroundColor: settings.primaryColor || '#1D4ED8' }}
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Posyandu Baru</span>
        </button>
      </div>

      {/* MODAL / FORM TAMBAH POSYANDU BARU */}
      {isAddingPosyandu && (
        <div className="p-5 rounded-3xl bg-blue-50/80 border-2 border-blue-300 shadow-md space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between border-b border-blue-200 pb-2">
            <div className="flex items-center gap-2">
              <Plus className="w-4 h-4 text-blue-700 font-bold" />
              <h3 className="font-bold text-slate-900 text-sm">Formulir Tambah Wilayah Posyandu Baru</h3>
            </div>
            <button
              type="button"
              onClick={() => setIsAddingPosyandu(false)}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {newPosError && (
            <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{newPosError}</span>
            </div>
          )}

          <form onSubmit={handleCreatePosyandu} className="space-y-3 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  1. Nama Posyandu
                </label>
                <input
                  type="text"
                  value={newPosName}
                  onChange={(e) => {
                    setNewPosName(e.target.value);
                    if (!newUsername) {
                      setNewUsername(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '').replace('posyandu', ''));
                    }
                  }}
                  placeholder="Contoh: Posyandu Mawar 1 / Posyandu Cempaka"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-bold text-slate-900 text-xs focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  2. Wilayah / RW / Dusun
                </label>
                <input
                  type="text"
                  value={newWilayah}
                  onChange={(e) => setNewWilayah(e.target.value)}
                  placeholder="Contoh: RW 07 Dusun Jayabakti"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-800 text-xs focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  3. Username Login Kader
                </label>
                <input
                  type="text"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                  placeholder="Contoh: mawar1"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-mono font-bold text-slate-800 text-xs focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  4. Kata Sandi Login Kader
                </label>
                <input
                  type="text"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Contoh: mawar123"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-mono font-bold text-slate-800 text-xs focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  5. Target Sasaran (Jiwa)
                </label>
                <input
                  type="number"
                  value={newTargetCount}
                  onChange={(e) => setNewTargetCount(Number(e.target.value))}
                  placeholder="100"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-mono font-bold text-slate-800 text-xs focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                6. Nama Kader Penanggung Jawab
              </label>
              <input
                type="text"
                value={newKaderName}
                onChange={(e) => setNewKaderName(e.target.value)}
                placeholder="Contoh: Ibu Rina Marlina"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-800 text-xs focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-blue-200">
              <button
                type="button"
                onClick={() => setIsAddingPosyandu(false)}
                className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-200 font-semibold"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={newPosSubmitting}
                className="px-5 py-2 rounded-xl text-white font-bold text-xs shadow-md transition flex items-center gap-1.5 hover:brightness-105 disabled:opacity-50"
                style={{ backgroundColor: settings.primaryColor || '#1D4ED8' }}
              >
                <Plus className="w-4 h-4" />
                <span>{newPosSubmitting ? 'Menyimpan...' : 'Tambahkan Posyandu ke Sistem'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Admin Security Card (Owner: pustakaassanad@gmail.com) */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-slate-900 to-blue-950 text-white shadow-md border border-slate-800">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-bold text-white">Keamanan Administrator SPPG</h3>
            </div>
            <p className="text-xs text-slate-300">
              Email Super Admin: <strong className="text-emerald-400">{ADMIN_EMAIL}</strong>
            </p>
          </div>

          <form onSubmit={handleSaveAdminPassword} className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-56">
              <input
                type={showAdminPass ? 'text' : 'password'}
                value={newAdminPass}
                onChange={(e) => setNewAdminPass(e.target.value)}
                placeholder="Kata sandi rahasia admin"
                className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-800 border border-slate-700 text-white font-mono focus:ring-2 focus:ring-blue-400 pr-8"
                required
              />
              <button
                type="button"
                onClick={() => setShowAdminPass(!showAdminPass)}
                className="absolute right-2 top-2 text-slate-400 hover:text-white"
              >
                {showAdminPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>

            <button
              type="submit"
              disabled={adminPassSaving}
              className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 font-bold text-xs text-white shadow-xs transition flex items-center gap-1.5 disabled:opacity-50"
            >
              {adminPassSaved ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-300" />
                  <span>Sandi Diperbarui!</span>
                </>
              ) : (
                <>
                  <Lock className="w-3.5 h-3.5" />
                  <span>Ubah Sandi Admin</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Grid of Posyandu Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {posyanduAccounts.map((acc, index) => {
          const form = getAccountForm(acc);
          const isShowPass = visiblePasswords[acc.id] || false;
          const isSaving = editingId === acc.id;
          const isSaved = saveSuccessId === acc.id;

          return (
            <div 
              key={acc.id}
              className="bg-white rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition flex flex-col justify-between overflow-hidden"
            >
              {/* Card Header */}
              <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-black text-xs flex items-center justify-center shrink-0">
                    {index + 1}
                  </span>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900">{acc.posyanduName}</h3>
                    {acc.wilayah && (
                      <span className="text-[10px] text-slate-500 font-medium">{acc.wilayah}</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleQuickLoginAs(acc)}
                    className="text-[11px] font-bold text-blue-600 hover:text-blue-800 bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-200 flex items-center gap-1 transition"
                    title="Simulasi masuk langsung sebagai posyandu ini"
                  >
                    <LogIn className="w-3 h-3" />
                    <span>Uji Masuk</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPosyanduToDelete(acc)}
                    className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                    title="Hapus Posyandu ini"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Card Fields */}
              <div className="p-4 space-y-3 text-xs">
                {/* Username */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Username Login:
                  </label>
                  <input
                    type="text"
                    value={form.username}
                    onChange={(e) => handleFieldChange(acc.id, 'username', e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-300 font-mono font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 text-xs"
                  />
                </div>

                {/* Password */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Kata Sandi (Password):
                  </label>
                  <div className="relative">
                    <input
                      type={isShowPass ? 'text' : 'password'}
                      value={form.password}
                      onChange={(e) => handleFieldChange(acc.id, 'password', e.target.value)}
                      className="w-full px-3 py-1.5 rounded-xl border border-slate-300 font-mono font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 pr-9 text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => setVisiblePasswords({ ...visiblePasswords, [acc.id]: !isShowPass })}
                      className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600"
                    >
                      {isShowPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* Kader & Wilayah */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Kader PIC:
                    </label>
                    <input
                      type="text"
                      value={form.kaderName}
                      onChange={(e) => handleFieldChange(acc.id, 'kaderName', e.target.value)}
                      placeholder="Nama Kader"
                      className="w-full px-2.5 py-1.5 rounded-xl border border-slate-300 text-slate-800 focus:ring-2 focus:ring-blue-500 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Wilayah / RW:
                    </label>
                    <input
                      type="text"
                      value={form.wilayah}
                      onChange={(e) => handleFieldChange(acc.id, 'wilayah', e.target.value)}
                      placeholder="RW 01"
                      className="w-full px-2.5 py-1.5 rounded-xl border border-slate-300 text-slate-800 focus:ring-2 focus:ring-blue-500 text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Card Footer */}
              <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[10px] text-slate-400">
                  {isSaved ? (
                    <span className="text-emerald-600 font-bold flex items-center gap-1">
                      <Check className="w-3 h-3" /> Tersimpan!
                    </span>
                  ) : (
                    'Kredensial Aktif'
                  )}
                </span>

                <button
                  type="button"
                  disabled={isSaving}
                  onClick={() => handleSave(acc)}
                  className="px-3 py-1.5 rounded-xl text-white font-bold text-xs shadow-xs transition flex items-center gap-1.5 hover:brightness-105 disabled:opacity-50"
                  style={{ backgroundColor: settings.primaryColor || '#1D4ED8' }}
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isSaving ? 'Menyimpan...' : 'Simpan Akun'}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Delete Confirmation Modal */}
      {posyanduToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-xl border border-slate-200 max-w-sm w-full p-5 text-center space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 mx-auto flex items-center justify-center">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Hapus Wilayah Posyandu?</h3>
              <p className="text-xs text-slate-500 mt-1">
                Apakah Anda yakin ingin menghapus akun dan wilayah <strong>{posyanduToDelete.posyanduName}</strong>?
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setPosyanduToDelete(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleDeletePosyandu}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-md transition"
              >
                Hapus Sekarang
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
