import React, { useState } from 'react';
import { 
  Lock, 
  LogIn, 
  ShieldCheck, 
  UserCheck, 
  AlertCircle, 
  KeyRound,
  Eye,
  EyeOff,
  User,
  Shield,
  HelpCircle,
  Building2
} from 'lucide-react';
import { BgnLogo } from './BgnLogo';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';

interface LoginPageProps {
  onLoginSuccess?: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const { 
    loginPosyandu, 
    loginWithGoogle, 
    loginAdminWithPassword, 
    posyanduAccounts,
    posyanduList,
  } = useAuth();
  const { settings } = useSettings();

  // Default to 'kader' so visitors do not see the admin form by default
  const [activeTab, setActiveTab] = useState<'kader' | 'admin'>('kader');
  const [selectedPosyandu, setSelectedPosyandu] = useState<string>(posyanduList[0] || 'Posyandu Jayamukti');
  const [posyanduPassword, setPosyanduPassword] = useState('');
  
  // Administrator state (Zero leakage)
  const [adminIdentifier, setAdminIdentifier] = useState('');
  const [adminInputPassword, setAdminInputPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  
  const [errorMsg, setErrorMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Kader Posyandu Login
  const handleKaderLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSubmitting(true);

    try {
      const res = await loginPosyandu(selectedPosyandu, posyanduPassword);
      if (res.success) {
        if (onLoginSuccess) onLoginSuccess();
      } else {
        setErrorMsg(res.message || 'Kata sandi posyandu tidak cocok. Silakan coba lagi.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Terjadi kesalahan saat masuk ke sistem.');
    } finally {
      setSubmitting(false);
    }
  };

  // Google Login for authorized administrator
  const handleAdminGoogle = async () => {
    setErrorMsg('');
    setSubmitting(true);
    try {
      const res = await loginWithGoogle();
      if (res.success) {
        if (onLoginSuccess) onLoginSuccess();
      } else {
        setErrorMsg(res.message || 'Akses Ditolak: Akun Google ini tidak memiliki hak akses administrator.');
      }
    } catch (err: any) {
      console.warn('Google login issue:', err);
      setErrorMsg('Gagal memverifikasi akun Google. Silakan gunakan nama pengguna dan kata sandi.');
    } finally {
      setSubmitting(false);
    }
  };

  // Admin Password Login (Strict, no leakage)
  const handleAdminPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSubmitting(true);

    try {
      const res = await loginAdminWithPassword(adminInputPassword, adminIdentifier);
      if (res.success) {
        if (onLoginSuccess) onLoginSuccess();
      } else {
        setErrorMsg(res.message || 'Kredensial administrator tidak valid. Silakan periksa kembali.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal memverifikasi akun administrator.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-3 sm:p-4 selection:bg-blue-600 selection:text-white relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute inset-0 bg-[radial-gradient(#1e3a8a_1px,transparent_1px)] [background-size:24px_24px] opacity-20 pointer-events-none" />
      <div 
        className="absolute -top-40 -left-40 w-96 h-96 rounded-full blur-3xl opacity-20 pointer-events-none"
        style={{ backgroundColor: settings.primaryColor || '#1D4ED8' }}
      />
      <div 
        className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full blur-3xl opacity-20 pointer-events-none"
        style={{ backgroundColor: settings.primaryColor || '#1D4ED8' }}
      />

      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden relative z-10 animate-in fade-in zoom-in-95 duration-200">
        {/* Top Header Card - Clean & Confidential */}
        <div 
          className="p-6 text-white text-center flex flex-col items-center justify-center transition-colors relative"
          style={{ backgroundColor: settings.primaryColor || '#1D4ED8' }}
        >
          {/* Official Logo */}
          <div className="p-2 bg-white rounded-2xl shadow-md mb-3">
            {settings.logoDataUrl ? (
              <img 
                src={settings.logoDataUrl} 
                alt="Logo Instansi" 
                className="w-12 h-12 sm:w-14 sm:h-14 object-contain rounded-xl" 
              />
            ) : (
              <BgnLogo size={48} />
            )}
          </div>

          <h1 className="text-lg sm:text-xl font-black tracking-tight uppercase">
            {settings.appTitle || 'PM 3B SPPG JAYAMUKTI'}
          </h1>
          <p className="text-[11px] sm:text-xs font-semibold text-blue-100 tracking-wide mt-0.5">
            {settings.appSubtitle || 'Badan Gizi Nasional Republik Indonesia'}
          </p>
          
          {/* Neutral Status Badge (No email or identity exposed) */}
          <div className="flex items-center gap-1.5 mt-2.5 bg-white/20 backdrop-blur-xs px-3 py-1 rounded-full text-[10px] font-medium text-white">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Portal Masuk Sistem Terpadu</span>
          </div>
        </div>

        {/* Tab Toggle: Kader Posyandu vs Administrator */}
        <div className="flex border-b border-slate-200 bg-slate-50">
          <button
            type="button"
            onClick={() => {
              setActiveTab('kader');
              setErrorMsg('');
            }}
            className={`flex-1 py-3 text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              activeTab === 'kader'
                ? 'bg-white text-blue-700 border-b-2 border-blue-600 shadow-xs'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <UserCheck className="w-4 h-4 text-emerald-600" />
            <span>Petugas Posyandu</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('admin');
              setErrorMsg('');
            }}
            className={`flex-1 py-3 text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              activeTab === 'admin'
                ? 'bg-white text-blue-700 border-b-2 border-blue-600 shadow-xs'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-blue-600" />
            <span>Administrator</span>
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
              <div className="flex-1 leading-relaxed font-medium">
                <span>{errorMsg}</span>
              </div>
            </div>
          )}

          {activeTab === 'kader' ? (
            /* TAB 1: PETUGAS POSYANDU */
            <form onSubmit={handleKaderLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Pilih Wilayah Kerja Posyandu:
                </label>
                <div className="relative">
                  <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                  <select
                    value={selectedPosyandu}
                    onChange={(e) => setSelectedPosyandu(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-300 bg-white font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xs"
                  >
                    {posyanduList.map((pos) => (
                      <option key={pos} value={pos}>
                        {pos}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Kata Sandi Posyandu:
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={posyanduPassword}
                    onChange={(e) => setPosyanduPassword(e.target.value)}
                    placeholder="Masukkan kata sandi posyandu"
                    className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xs font-medium"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 transition"
                    aria-label="Toggle password visibility"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 rounded-xl font-bold text-white text-xs shadow-md transition hover:brightness-105 active:scale-98 flex items-center justify-center gap-2 mt-2"
                style={{ backgroundColor: settings.primaryColor || '#1D4ED8' }}
              >
                <LogIn className="w-4 h-4" />
                <span>{submitting ? 'Memverifikasi...' : 'Masuk ke Sistem Posyandu'}</span>
              </button>

              <div className="pt-2 text-center">
                <span className="text-[11px] text-slate-400">
                  Perlu bantuan akun posyandu? Hubungi administrator instansi SPPG Anda.
                </span>
              </div>
            </form>
          ) : (
            /* TAB 2: ADMINISTRATOR (Strict, Confidential, Zero Leakage) */
            <div className="space-y-4">
              <form onSubmit={handleAdminPasswordSubmit} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Nama Pengguna / ID Administrator:
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                    <input
                      type="text"
                      value={adminIdentifier}
                      onChange={(e) => setAdminIdentifier(e.target.value)}
                      placeholder="Masukkan ID atau username admin"
                      className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xs font-medium text-slate-800"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Kata Sandi Administrator:
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                    <input
                      type={showAdminPassword ? 'text' : 'password'}
                      value={adminInputPassword}
                      onChange={(e) => setAdminInputPassword(e.target.value)}
                      placeholder="Masukkan kata sandi akun"
                      className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xs font-medium text-slate-800"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowAdminPassword(!showAdminPassword)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 transition"
                      aria-label="Toggle password visibility"
                    >
                      {showAdminPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 rounded-xl font-bold text-white text-xs shadow-md transition hover:brightness-105 active:scale-98 flex items-center justify-center gap-2 mt-2"
                  style={{ backgroundColor: settings.primaryColor || '#1D4ED8' }}
                >
                  <Shield className="w-4 h-4" />
                  <span>{submitting ? 'Memverifikasi...' : 'Masuk sebagai Administrator'}</span>
                </button>
              </form>

              {/* Secure Google SSO Option (NO Email Address shown!) */}
              <div className="relative my-3 text-center">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200" />
                </div>
                <span className="relative bg-white px-2.5 text-[11px] font-medium text-slate-400">
                  atau
                </span>
              </div>

              <button
                type="button"
                onClick={handleAdminGoogle}
                disabled={submitting}
                className="w-full py-2.5 px-4 rounded-xl font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 text-xs flex items-center justify-center gap-2.5 transition shadow-xs hover:border-slate-400"
              >
                <img 
                  src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" 
                  alt="Google" 
                  className="w-4 h-4 shrink-0" 
                />
                <span>Masuk dengan Google</span>
              </button>

              <div className="pt-2 text-center">
                <p className="text-[10px] text-slate-400 leading-relaxed">
                  Akses ini khusus untuk pejabat & administrator resmi SPPG yang berwenang.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 text-center text-[10px] text-slate-400 font-medium">
          SPPG Badan Gizi Nasional • Sistem Informasi 3B & Posyandu
        </div>
      </div>
    </div>
  );
};
