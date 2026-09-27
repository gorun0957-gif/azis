import React, { useState } from 'react';
import { 
  FileSpreadsheet, 
  FileDown, 
  MapPin, 
  LogOut, 
  Palette, 
  Users, 
  KeyRound, 
  Building2, 
  ChevronDown,
  Sliders,
  ShieldCheck,
  Sparkles
} from 'lucide-react';
import { BgnLogo } from './BgnLogo';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { useLicense } from '../context/LicenseContext';

interface HeaderProps {
  onOpenBranding: () => void;
  onOpenExport: () => void;
  onOpenImport: () => void;
  onOpenCustomFields: () => void;
  onOpenLicense: () => void;
  activeTab: 'beneficiaries' | 'mapping' | 'accounts';
  setActiveTab: (tab: 'beneficiaries' | 'mapping' | 'accounts') => void;
  onOpenLogin: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenBranding,
  onOpenExport,
  onOpenImport,
  onOpenCustomFields,
  onOpenLicense,
  activeTab,
  setActiveTab,
  onOpenLogin,
}) => {
  const { session, isAdmin, activePosyandu, logout, posyanduList } = useAuth();
  const { settings } = useSettings();
  const { licenseState } = useLicense();
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs transition-all">
      {/* Top Banner Ribbon */}
      <div 
        className="text-white text-[11px] sm:text-xs font-semibold px-4 sm:px-6 py-1.5 flex flex-wrap items-center justify-between transition-colors shadow-inner"
        style={{ backgroundColor: settings.primaryColor || '#1D4ED8' }}
      >
        <div className="flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
          <span className="font-black tracking-wide truncate max-w-[220px] sm:max-w-none">
            {settings.appTitle || 'PM 3B SPPG JAYAMUKTI'}
          </span>
        </div>

        <div className="flex items-center gap-2 text-[10px] sm:text-xs">
          <button
            type="button"
            onClick={onOpenLicense}
            className="hidden sm:inline-flex items-center gap-1 bg-white/20 hover:bg-white/30 px-2 py-0.5 rounded text-white font-bold transition border border-white/25 cursor-pointer"
            title="Status Lisensi Sistem"
          >
            <ShieldCheck className="w-3 h-3 text-emerald-300" />
            <span>{licenseState.isActivated ? 'Lisensi Aktif' : 'Aktivasi'}</span>
          </button>

          <span className="bg-black/20 px-2 py-0.5 rounded text-white font-bold truncate max-w-[130px] sm:max-w-none">
            {isAdmin ? 'Super Admin' : activePosyandu}
          </span>
        </div>
      </div>

      {/* Main Top Bar (Zone 1: Brand, Zone 2: Navigation Tabs, Zone 3: Actions) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5">
        <div className="flex flex-row items-center justify-between gap-3">
          
          {/* ZONE 1: BRAND LOGO & TITLE */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="shrink-0 flex items-center justify-center p-1 bg-white rounded-xl shadow-xs border border-blue-100">
              {settings.logoDataUrl ? (
                <img 
                  src={settings.logoDataUrl} 
                  alt="Logo SPPG" 
                  className="w-9 h-9 sm:w-10 sm:h-10 object-contain rounded-lg"
                />
              ) : (
                <BgnLogo size={36} className="w-8 h-8 sm:w-9 sm:h-9" />
              )}
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-sm sm:text-base font-black text-slate-900 tracking-tight leading-tight truncate">
                  {settings.appTitle || 'PM 3B SPPG JAYAMUKTI'}
                </span>
                <span 
                  className="hidden sm:inline-flex items-center text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded text-white shrink-0"
                  style={{ backgroundColor: settings.primaryColor || '#1D4ED8' }}
                >
                  BGN
                </span>
              </div>
              <p className="text-[11px] font-semibold text-slate-500 truncate">
                {settings.appSubtitle || 'Badan Gizi Nasional'} • {posyanduList.length} Posyandu Binaan
              </p>
            </div>
          </div>

          {/* ZONE 3: ACTIONS & PROFILE */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Export Button */}
            <button
              onClick={onOpenExport}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-xl border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 transition shadow-xs"
              title="Ekspor Laporan ke Excel atau PDF"
            >
              <FileDown className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span className="hidden sm:inline">Ekspor</span>
            </button>

            {/* Import Button */}
            <button
              onClick={onOpenImport}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-xl border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 transition shadow-xs"
              title="Impor Data Massal dari Format Excel"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span className="hidden sm:inline">Impor</span>
            </button>

            {/* Admin-only: Kategori & Kolom Bebas (Satu-satunya Tombol Isian Bebas di Aplikasi) */}
            {isAdmin && (
              <button
                onClick={onOpenCustomFields}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl border border-blue-300 bg-blue-50 text-blue-800 hover:bg-blue-100 transition shadow-xs"
                title="Kelola Kategori & Kolom Isian Formulir Bebas (Tambah, Edit, Hapus)"
              >
                <Sliders className="w-3.5 h-3.5 text-blue-700 shrink-0" />
                <span className="hidden sm:inline">Isian Bebas</span>
              </button>
            )}

            {/* Lisensi Center Button */}
            <button
              onClick={onOpenLicense}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold rounded-xl border border-slate-300 bg-white text-slate-800 hover:bg-slate-50 transition shadow-xs"
              title="Status & Lisensi Sistem"
            >
              <KeyRound className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span className="hidden lg:inline">Lisensi</span>
            </button>

            {/* Admin-only: Tema & Logo */}
            {isAdmin && (
              <button
                onClick={onOpenBranding}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold rounded-xl text-white transition shadow-xs hover:brightness-105"
                style={{ backgroundColor: settings.primaryColor || '#1D4ED8' }}
                title="Kustomisasi Judul, Warna Tema, dan Upload Logo dari Galeri"
              >
                <Palette className="w-3.5 h-3.5 shrink-0" />
                <span className="hidden xl:inline">Tema & Logo</span>
              </button>
            )}

            {/* Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 transition"
              >
                <div 
                  className={`w-2 h-2 rounded-full shrink-0 ${isAdmin ? 'bg-blue-600' : 'bg-emerald-600'}`}
                />
                <span className="truncate max-w-[80px] sm:max-w-[130px]">
                  {isAdmin ? 'Admin' : `${activePosyandu?.replace('Posyandu ', '')}`}
                </span>
                <ChevronDown className="w-3 h-3 text-slate-500 shrink-0" />
              </button>

              {profileDropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 text-left animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-3.5 py-2 border-b border-slate-100">
                    <p className="text-[10px] font-semibold text-slate-400">Pengguna Aktif</p>
                    <p className="text-xs font-bold text-slate-900 truncate">
                      {session?.displayName || 'Pengguna SPPG'}
                    </p>
                    <p className="text-[11px] text-blue-700 font-semibold mt-0.5">
                      {isAdmin ? 'Peran: Administrator Utama' : `Posyandu: ${activePosyandu}`}
                    </p>
                  </div>

                  <div className="p-1 space-y-1">
                    <button
                      onClick={() => {
                        setProfileDropdownOpen(false);
                        onOpenLicense();
                      }}
                      className="w-full text-left px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl flex items-center gap-2"
                    >
                      <KeyRound className="w-3.5 h-3.5 text-amber-600" />
                      <span>Lisensi & Kode Izin SPPG</span>
                    </button>

                    <button
                      onClick={() => {
                        setProfileDropdownOpen(false);
                        onOpenLogin();
                      }}
                      className="w-full text-left px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl flex items-center gap-2"
                    >
                      <Building2 className="w-3.5 h-3.5 text-blue-600" />
                      <span>Ganti Akun / Login Posyandu</span>
                    </button>

                    <button
                      onClick={() => {
                        logout();
                        setProfileDropdownOpen(false);
                        onOpenLogin();
                      }}
                      className="w-full text-left px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl flex items-center gap-2"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Keluar (Logout)</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tab Navigation (Clean Touch Segmented Buttons) */}
        <div className="mt-2.5 flex items-center gap-1.5 border-t border-slate-100 pt-2 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveTab('beneficiaries')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl transition whitespace-nowrap shrink-0 ${
              activeTab === 'beneficiaries'
                ? 'text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
            style={{
              backgroundColor: activeTab === 'beneficiaries' ? (settings.primaryColor || '#1D4ED8') : 'transparent',
            }}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Data Sasaran PM 3B & Bebas</span>
          </button>

          <button
            onClick={() => setActiveTab('mapping')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl transition whitespace-nowrap shrink-0 ${
              activeTab === 'mapping'
                ? 'text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
            style={{
              backgroundColor: activeTab === 'mapping' ? (settings.primaryColor || '#1D4ED8') : 'transparent',
            }}
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>Peta Sebaran Wilayah</span>
          </button>

          {/* Tab Kelola Akun & Posyandu (Admin only) */}
          {isAdmin && (
            <button
              onClick={() => setActiveTab('accounts')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl transition whitespace-nowrap shrink-0 ${
                activeTab === 'accounts'
                  ? 'text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
              style={{
                backgroundColor: activeTab === 'accounts' ? (settings.primaryColor || '#1D4ED8') : 'transparent',
              }}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Kelola & Tambah Posyandu</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
