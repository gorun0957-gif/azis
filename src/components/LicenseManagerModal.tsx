import React, { useState } from 'react';
import { 
  X, 
  KeyRound, 
  ShieldCheck, 
  Mail, 
  Send, 
  CheckCircle2, 
  AlertCircle, 
  Copy, 
  Check, 
  ExternalLink, 
  Building2, 
  Sparkles, 
  Clock, 
  Users, 
  FileText,
  BadgeAlert,
  HelpCircle,
  PhoneCall
} from 'lucide-react';
import { useLicense, OWNER_EMAIL } from '../context/LicenseContext';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';

interface LicenseManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LicenseManagerModal: React.FC<LicenseManagerModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { settings } = useSettings();
  const { isAdmin, session } = useAuth();
  const { 
    licenseState, 
    activationRequests, 
    allLicenses, 
    requestActivation, 
    activateWithCode, 
    generateNewLicense, 
    approveRequest, 
    rejectRequest 
  } = useLicense();

  const [activeTab, setActiveTab] = useState<'status' | 'request' | 'admin_center'>('status');

  // Activate Code Form
  const [inputCode, setInputCode] = useState('');
  const [activating, setActivating] = useState(false);
  const [activationResult, setActivationResult] = useState<{ success: boolean; message: string } | null>(null);

  // Request Form
  const [reqSppgName, setReqSppgName] = useState('');
  const [reqRegion, setReqRegion] = useState('');
  const [reqPicName, setReqPicName] = useState('');
  const [reqPicPhone, setReqPicPhone] = useState('');
  const [reqPicEmail, setReqPicEmail] = useState('');
  const [reqPlan, setReqPlan] = useState('Lisensi Tahunan SPPG (10 Posyandu)');
  const [requestSending, setRequestSending] = useState(false);
  const [requestSentInfo, setRequestSentInfo] = useState<{ mailtoUrl: string; reqId: string } | null>(null);
  const [requestError, setRequestError] = useState('');

  // Super Admin Generator Form
  const [genSppgName, setGenSppgName] = useState('');
  const [genRegion, setGenRegion] = useState('');
  const [genBuyerEmail, setGenBuyerEmail] = useState('');
  const [genBuyerPhone, setGenBuyerPhone] = useState('');
  const [genMonths, setGenMonths] = useState<number>(12); // 12 bulan (1 tahun)
  const [genMaxPosyandu, setGenMaxPosyandu] = useState<number>(10);
  const [generatedLicResult, setGeneratedLicResult] = useState<string | null>(null);

  // Clipboard copied helper
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(text);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleActivateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActivating(true);
    setActivationResult(null);

    try {
      const res = await activateWithCode(inputCode);
      setActivationResult(res);
      if (res.success) {
        setInputCode('');
      }
    } catch (err: any) {
      setActivationResult({
        success: false,
        message: err.message || 'Terjadi kesalahan saat memverifikasi kode aktivasi.',
      });
    } finally {
      setActivating(false);
    }
  };

  const handleSendRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setRequestError('');
    setRequestSending(true);

    if (!reqSppgName.trim() || !reqRegion.trim() || !reqPicName.trim() || !reqPicPhone.trim()) {
      setRequestError('Lengkapi semua kolom formulir permohonan lisensi.');
      setRequestSending(false);
      return;
    }

    try {
      const res = await requestActivation({
        sppgName: reqSppgName.trim(),
        region: reqRegion.trim(),
        picName: reqPicName.trim(),
        picPhone: reqPicPhone.trim(),
        picEmail: reqPicEmail.trim(),
        plan: reqPlan,
      });

      setRequestSentInfo({ mailtoUrl: res.mailtoUrl, reqId: res.requestId });
      // Reset form
      setReqSppgName('');
      setReqRegion('');
      setReqPicName('');
      setReqPicPhone('');
      setReqPicEmail('');
    } catch (err: any) {
      setRequestError(err.message || 'Gagal mengirimkan permohonan.');
    } finally {
      setRequestSending(false);
    }
  };

  const handleGenerateLicense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!genSppgName.trim() || !genRegion.trim()) return;

    try {
      const lic = await generateNewLicense({
        sppgName: genSppgName.trim(),
        region: genRegion.trim(),
        buyerEmail: genBuyerEmail.trim() || undefined,
        buyerPhone: genBuyerPhone.trim() || undefined,
        validityMonths: genMonths,
        maxPosyandu: genMaxPosyandu,
      });

      setGeneratedLicResult(lic.licenseKey);
      setGenSppgName('');
      setGenRegion('');
      setGenBuyerEmail('');
      setGenBuyerPhone('');
    } catch (err: any) {
      console.error('Failed to generate license:', err);
    }
  };

  const handleQuickApproveRequest = async (reqId: string, sppgName: string, region: string, buyerEmail?: string) => {
    const lic = await generateNewLicense({
      sppgName,
      region,
      buyerEmail,
      validityMonths: 12,
      maxPosyandu: 10,
    });
    await approveRequest(reqId, lic.licenseKey);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-auto flex flex-col max-h-[92vh]">
        
        {/* Header Modal */}
        <div 
          className="px-6 py-4 flex items-center justify-between text-white shrink-0"
          style={{ backgroundColor: settings.primaryColor || '#1D4ED8' }}
        >
          <div className="flex items-center gap-2.5">
            <KeyRound className="w-5 h-5" />
            <div>
              <h2 className="text-base font-bold">Pusat Lisensi & Aktivasi</h2>
              <p className="text-xs text-white/80">
                Pengaturan Status & Validasi Lisensi Sistem
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/20 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 pt-2 shrink-0 overflow-x-auto">
          <button
            onClick={() => setActiveTab('status')}
            className={`pb-2.5 px-4 text-xs font-bold transition flex items-center gap-1.5 border-b-2 whitespace-nowrap ${
              activeTab === 'status'
                ? 'border-blue-600 text-blue-700 bg-white rounded-t-xl shadow-xs'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Status & Input Kode</span>
          </button>

          <button
            onClick={() => setActiveTab('request')}
            className={`pb-2.5 px-4 text-xs font-bold transition flex items-center gap-1.5 border-b-2 whitespace-nowrap ${
              activeTab === 'request'
                ? 'border-blue-600 text-blue-700 bg-white rounded-t-xl shadow-xs'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Mail className="w-4 h-4" />
            <span>Permohonan Aktivasi Lisensi</span>
          </button>

          {isAdmin && (
            <button
              onClick={() => setActiveTab('admin_center')}
              className={`pb-2.5 px-4 text-xs font-bold transition flex items-center gap-1.5 border-b-2 whitespace-nowrap ${
                activeTab === 'admin_center'
                  ? 'border-blue-600 text-blue-700 bg-white rounded-t-xl shadow-xs'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>Pusat Kontrol Admin</span>
              {activationRequests.filter((r) => r.status === 'pending').length > 0 && (
                <span className="w-4 h-4 rounded-full bg-rose-600 text-white text-[10px] font-bold flex items-center justify-center">
                  {activationRequests.filter((r) => r.status === 'pending').length}
                </span>
              )}
            </button>
          )}
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs text-slate-700 flex-1">
          
          {/* TAB 1: STATUS & INPUT KODE */}
          {activeTab === 'status' && (
            <div className="space-y-4">
              {/* Status Card */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 to-blue-950 text-white shadow-md border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-xs uppercase font-bold text-slate-300">Status Lisensi Sistem:</span>
                  </div>
                  <h3 className="text-base font-black text-white">
                    {licenseState.isActivated ? '✅ LISENSI RESMI AKTIF & TERDAFTAR' : '⚠️ MODE DEMO / BELUM DIAKTIFKAN'}
                  </h3>
                  <p className="text-[11px] text-slate-300">
                    Status Operasional: <strong>Sistem Terverifikasi & Siap Digunakan</strong>
                  </p>
                </div>

                <div className="bg-white/10 p-3 rounded-xl border border-white/20 text-center shrink-0 w-full sm:w-auto">
                  <span className="text-[10px] text-slate-300 block">Masa Berlaku</span>
                  <span className="text-xs font-black text-emerald-300 uppercase">
                    {licenseState.expiresAt === 'lifetime' ? 'Seumur Hidup (Permanen)' : licenseState.expiresAt ? new Date(licenseState.expiresAt).toLocaleDateString('id-ID') : 'Perlu Aktivasi'}
                  </span>
                  <span className="text-[10px] text-blue-200 block mt-0.5">{licenseState.plan}</span>
                </div>
              </div>

              {/* Form Input Kode Aktivasi Baru */}
              <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">Aktivasi atau Perbarui Kode Izin</h4>
                  <p className="text-[11px] text-slate-500">
                    Masukkan kode lisensi resmi di bawah ini untuk mengaktifkan atau memperbarui status sistem Anda.
                  </p>
                </div>

                {activationResult && (
                  <div className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
                    activationResult.success 
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-800' 
                      : 'bg-rose-50 border-rose-300 text-rose-800'
                  }`}>
                    {activationResult.success ? (
                      <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                    ) : (
                      <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                    )}
                    <span>{activationResult.message}</span>
                  </div>
                )}

                <form onSubmit={handleActivateSubmit} className="space-y-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Kode Izin Aktivasi
                    </label>
                    <input
                      type="text"
                      value={inputCode}
                      onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                      placeholder="Masukkan kode lisensi..."
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-mono font-bold tracking-wider text-slate-900 text-sm focus:ring-2 focus:ring-blue-500 uppercase"
                      required
                    />
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <button
                      type="button"
                      onClick={() => setActiveTab('request')}
                      className="text-xs text-blue-600 hover:text-blue-800 font-semibold"
                    >
                      Belum memiliki kode izin? Ajukan permohonan →
                    </button>

                    <button
                      type="submit"
                      disabled={activating}
                      className="px-5 py-2.5 rounded-xl text-white font-bold text-xs shadow-md transition flex items-center gap-2 hover:brightness-105 disabled:opacity-50"
                      style={{ backgroundColor: settings.primaryColor || '#1D4ED8' }}
                    >
                      <ShieldCheck className="w-4 h-4" />
                      <span>{activating ? 'Memverifikasi...' : 'Aktivasi Sistem Sekarang'}</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* TAB 2: PERMOHONAN AKTIVASI DARI SPPG LAIN */}
          {activeTab === 'request' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-blue-600 text-white shrink-0">
                    <Send className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-blue-950 text-sm">
                      Formulir Permohonan Izin / Pembelian Lisensi SPPG
                    </h4>
                    <p className="text-[11px] text-blue-800 mt-0.5 leading-relaxed">
                      Lengkapi data instansi Anda. Permohonan beserta rincian kontak akan <strong>otomatis diteruskan ke administrator</strong> untuk penerbitan kode izin aktivasi.
                    </p>
                  </div>
                </div>
              </div>

              {requestSentInfo && (
                <div className="p-4 rounded-2xl bg-emerald-50 border-2 border-emerald-300 text-emerald-900 space-y-2 animate-in fade-in">
                  <div className="flex items-center gap-2 font-bold text-sm text-emerald-800">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    <span>Permohonan Aktivasi Berhasil Didaftarkan!</span>
                  </div>
                  <p className="text-xs">
                    Permintaan lisensi dengan ID <strong>{requestSentInfo.reqId}</strong> telah tercatat di server database dan disiapkan untuk verifikasi administrator.
                  </p>
                  <div className="pt-2 flex flex-wrap items-center gap-2">
                    <a
                      href={requestSentInfo.mailtoUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs"
                    >
                      <Mail className="w-4 h-4" />
                      <span>Buka Aplikasi Email & Kirim Permohonan</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                    <button
                      type="button"
                      onClick={() => setRequestSentInfo(null)}
                      className="px-3 py-2 rounded-xl bg-white border border-emerald-300 text-emerald-800 text-xs font-semibold hover:bg-emerald-100"
                    >
                      Tutup Pesan
                    </button>
                  </div>
                </div>
              )}

              {requestError && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                  <span>{requestError}</span>
                </div>
              )}

              <form onSubmit={handleSendRequest} className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      1. Nama SPPG Pemohon
                    </label>
                    <input
                      type="text"
                      value={reqSppgName}
                      onChange={(e) => setReqSppgName(e.target.value)}
                      placeholder="Contoh: SPPG Cibatu / SPPG Sukabumi Barat"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold text-slate-900 text-xs focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      2. Wilayah / Kabupaten / Provinsi
                    </label>
                    <input
                      type="text"
                      value={reqRegion}
                      onChange={(e) => setReqRegion(e.target.value)}
                      placeholder="Contoh: Kab. Sukabumi, Jawa Barat"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 text-xs focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      3. Nama Penanggung Jawab (PIC)
                    </label>
                    <input
                      type="text"
                      value={reqPicName}
                      onChange={(e) => setReqPicName(e.target.value)}
                      placeholder="Contoh: Dr. H. Rahmat Hidayat"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 text-xs focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      4. No. WhatsApp / HP Aktif
                    </label>
                    <input
                      type="tel"
                      value={reqPicPhone}
                      onChange={(e) => setReqPicPhone(e.target.value)}
                      placeholder="Contoh: 0812xxxxxxxx"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono text-slate-900 text-xs focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      5. Email SPPG Pemohon
                    </label>
                    <input
                      type="email"
                      value={reqPicEmail}
                      onChange={(e) => setReqPicEmail(e.target.value)}
                      placeholder="Contoh: sppg.cibatu@gmail.com"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 text-xs focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    6. Paket Lisensi yang Diajukan
                  </label>
                  <select
                    value={reqPlan}
                    onChange={(e) => setReqPlan(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-bold text-slate-800 text-xs"
                  >
                    <option value="Lisensi Tahunan SPPG (10 Posyandu)">
                      Lisensi Tahunan SPPG Standar (Hingga 10 Posyandu) - 1 Tahun
                    </option>
                    <option value="Lisensi Multi-Wilayah Pro (25 Posyandu)">
                      Lisensi Multi-Wilayah Pro (Hingga 25 Posyandu) - 2 Tahun
                    </option>
                    <option value="Lisensi Enterprise Wilayah SPPG (Permanen/Lifetime)">
                      Lisensi Enterprise Wilayah (Posyandu Tanpa Batas) - Seumur Hidup
                    </option>
                  </select>
                </div>

                <div className="pt-2 flex items-center justify-between border-t border-slate-100">
                  <span className="text-[11px] text-slate-500">
                    Pemberitahuan diteruskan ke: <strong>{OWNER_EMAIL}</strong>
                  </span>

                  <button
                    type="submit"
                    disabled={requestSending}
                    className="px-5 py-2.5 rounded-xl text-white font-bold text-xs shadow-md transition flex items-center gap-2 hover:brightness-105 disabled:opacity-50"
                    style={{ backgroundColor: settings.primaryColor || '#1D4ED8' }}
                  >
                    <Send className="w-4 h-4" />
                    <span>{requestSending ? 'Mengirim...' : 'Kirim Permohonan ke Pemilik Aplikasi'}</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 3: PUSAT KONTROL SUPER ADMIN (pustakaassanad@gmail.com) */}
          {activeTab === 'admin_center' && isAdmin && (
            <div className="space-y-5">
              {/* Super Admin Identification Banner */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-900 via-indigo-950 to-slate-900 text-white shadow-md border border-blue-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-xs text-amber-300 font-bold uppercase tracking-wide">
                    <Sparkles className="w-4 h-4" />
                    <span>Konsol Pemilik Aplikasi (Super Admin)</span>
                  </div>
                  <h3 className="text-base font-black text-white">
                    {OWNER_EMAIL}
                  </h3>
                  <p className="text-[11px] text-blue-200">
                    Kelola penjualan kode izin aktivasi, persetujuan permohonan SPPG wilayah lain, dan penerbitan lisensi resmi.
                  </p>
                </div>

                <span className="text-xs font-bold px-3 py-1 rounded-full bg-white/20 text-white border border-white/30 shrink-0">
                  {allLicenses.length} Lisensi Terbit
                </span>
              </div>

              {/* 1. Generator Lisensi Baru */}
              <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-900 text-sm">
                    Terbitkan Kode Lisensi Baru untuk SPPG Pembeli
                  </h4>
                  <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                    Generator Resmi
                  </span>
                </div>

                {generatedLicResult && (
                  <div className="p-3.5 rounded-xl bg-emerald-50 border-2 border-emerald-300 space-y-2">
                    <span className="text-xs font-bold text-emerald-900 block">
                      Kode Izin Aktivasi Berhasil Dibuat:
                    </span>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        readOnly
                        value={generatedLicResult}
                        className="w-full px-3 py-2 rounded-lg bg-white border border-emerald-300 font-mono font-black text-sm text-emerald-900"
                      />
                      <button
                        type="button"
                        onClick={() => handleCopy(generatedLicResult)}
                        className="px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1 shrink-0"
                      >
                        {copiedKey === generatedLicResult ? (
                          <>
                            <Check className="w-4 h-4" />
                            <span>Tersalin!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4" />
                            <span>Salin Kode</span>
                          </>
                        )}
                      </button>
                    </div>
                    <p className="text-[11px] text-emerald-700">
                      Kirimkan kode ini kepada instansi SPPG pembeli untuk mereka masukkan di menu aktivasi.
                    </p>
                  </div>
                )}

                <form onSubmit={handleGenerateLicense} className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Nama SPPG Pembeli</label>
                      <input
                        type="text"
                        value={genSppgName}
                        onChange={(e) => setGenSppgName(e.target.value)}
                        placeholder="Contoh: SPPG Sukabumi Selatan"
                        className="w-full px-3 py-1.5 rounded-xl border border-slate-300 font-bold text-xs"
                        required
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Wilayah / Kabupaten</label>
                      <input
                        type="text"
                        value={genRegion}
                        onChange={(e) => setGenRegion(e.target.value)}
                        placeholder="Contoh: Kab. Sukabumi"
                        className="w-full px-3 py-1.5 rounded-xl border border-slate-300 text-xs"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Email Pembeli (Opsional)</label>
                      <input
                        type="email"
                        value={genBuyerEmail}
                        onChange={(e) => setGenBuyerEmail(e.target.value)}
                        placeholder="email.pembeli@sppg.id"
                        className="w-full px-3 py-1.5 rounded-xl border border-slate-300 text-xs"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Masa Berlaku</label>
                      <select
                        value={genMonths}
                        onChange={(e) => setGenMonths(Number(e.target.value))}
                        className="w-full px-3 py-1.5 rounded-xl border border-slate-300 bg-white font-bold text-xs"
                      >
                        <option value={6}>6 Bulan</option>
                        <option value={12}>1 Tahun (12 Bulan)</option>
                        <option value={24}>2 Tahun (24 Bulan)</option>
                        <option value={0}>Seumur Hidup / Permanen (Lifetime)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Batas Maks Posyandu</label>
                      <select
                        value={genMaxPosyandu}
                        onChange={(e) => setGenMaxPosyandu(Number(e.target.value))}
                        className="w-full px-3 py-1.5 rounded-xl border border-slate-300 bg-white font-bold text-xs"
                      >
                        <option value={6}>6 Posyandu</option>
                        <option value={10}>10 Posyandu</option>
                        <option value={25}>25 Posyandu</option>
                        <option value={100}>Tanpa Batas (Unlimited)</option>
                      </select>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-xl text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-1.5 hover:brightness-105"
                    style={{ backgroundColor: settings.primaryColor || '#1D4ED8' }}
                  >
                    <KeyRound className="w-4 h-4" />
                    <span>Terbitkan Kode Izin Aktivasi SPPG Baru</span>
                  </button>
                </form>
              </div>

              {/* 2. Permohonan Masuk dari SPPG Lain */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-900 text-sm">
                    Daftar Permohonan Aktivasi Masuk ({activationRequests.length})
                  </h4>
                  <span className="text-[11px] text-slate-500">
                    Otomatis disinkronkan ke database Firestore
                  </span>
                </div>

                {activationRequests.length === 0 ? (
                  <div className="p-6 rounded-2xl border border-dashed border-slate-300 text-center text-slate-500 text-xs">
                    Belum ada permohonan lisensi dari SPPG lain.
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {activationRequests.map((req) => (
                      <div
                        key={req.id}
                        className={`p-3.5 rounded-2xl border transition ${
                          req.status === 'pending'
                            ? 'bg-amber-50/60 border-amber-300 shadow-xs'
                            : req.status === 'approved'
                            ? 'bg-emerald-50/60 border-emerald-300'
                            : 'bg-slate-50 border-slate-200'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <h5 className="font-bold text-slate-900 text-sm">{req.sppgName}</h5>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                                req.status === 'pending'
                                  ? 'bg-amber-200 text-amber-900'
                                  : req.status === 'approved'
                                  ? 'bg-emerald-200 text-emerald-900'
                                  : 'bg-rose-200 text-rose-900'
                              }`}>
                                {req.status === 'pending' ? '⏳ Menunggu Persetujuan' : req.status === 'approved' ? '✅ Disetujui' : '❌ Ditolak'}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-600 mt-0.5">
                              Wilayah: <strong>{req.region}</strong> • PIC: <strong>{req.picName}</strong> ({req.picPhone}) {req.picEmail && `• ${req.picEmail}`}
                            </p>
                            <p className="text-[10px] text-slate-400 mt-0.5">
                              Paket: {req.plan} • Diajukan: {new Date(req.requestedAt).toLocaleString('id-ID')}
                            </p>
                            {req.generatedLicenseKey && (
                              <div className="mt-1 flex items-center gap-1.5 font-mono text-[11px] font-bold text-emerald-800">
                                <span>Kode Lisensi: {req.generatedLicenseKey}</span>
                                <button
                                  type="button"
                                  onClick={() => handleCopy(req.generatedLicenseKey || '')}
                                  className="text-blue-600 hover:text-blue-800 text-[10px]"
                                >
                                  (Salin)
                                </button>
                              </div>
                            )}
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            {req.status === 'pending' && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleQuickApproveRequest(req.id, req.sppgName, req.region, req.picEmail)}
                                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1 shadow-xs"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                  <span>Setujui & Buat Kode</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => rejectRequest(req.id)}
                                  className="px-2.5 py-1.5 rounded-xl bg-slate-200 hover:bg-rose-100 text-rose-700 font-bold text-xs"
                                >
                                  Tolak
                                </button>
                              </>
                            )}

                            {req.picPhone && (
                              <a
                                href={`https://wa.me/${req.picPhone.replace(/\D/g, '')}?text=${encodeURIComponent(`Halo ${req.picName} dari ${req.sppgName}, berikut Kode Izin Aktivasi Aplikasi PM 3B SPPG Anda: ${req.generatedLicenseKey || ''}`)}`}
                                target="_blank"
                                rel="noreferrer"
                                className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200"
                                title="Kirim ke WhatsApp PIC"
                              >
                                <PhoneCall className="w-4 h-4" />
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-bold text-white rounded-xl shadow-xs transition"
            style={{ backgroundColor: settings.primaryColor || '#1D4ED8' }}
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
