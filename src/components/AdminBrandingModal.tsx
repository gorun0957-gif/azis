import React, { useState } from 'react';
import { 
  X, 
  Palette, 
  Upload, 
  Image as ImageIcon, 
  Check, 
  Loader2, 
  RotateCcw,
  Trash2
} from 'lucide-react';
import { useSettings } from '../context/SettingsContext';
import { BgnLogo } from './BgnLogo';

interface AdminBrandingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const BLUE_COLOR_PRESETS = [
  { name: 'Biru BGN Resmi', hex: '#1D4ED8' },
  { name: 'Biru Laut Dalam', hex: '#1E40AF' },
  { name: 'Biru Langit Cerah', hex: '#0284C7' },
  { name: 'Biru Cyan Pelayanan', hex: '#0891B2' },
  { name: 'Navy Eksekutif', hex: '#0F172A' },
  { name: 'Hijau Daun BGN', hex: '#059669' },
  { name: 'Indigo Posyandu', hex: '#4338CA' },
  { name: 'Teal Modern', hex: '#0D9488' },
];

export const AdminBrandingModal: React.FC<AdminBrandingModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { settings, updateSettings } = useSettings();

  const [title, setTitle] = useState(settings.appTitle || 'PM 3B SPPG JAYAMUKTI');
  const [subtitle, setSubtitle] = useState(settings.appSubtitle || 'Badan Gizi Nasional');
  const [primaryColor, setPrimaryColor] = useState(settings.primaryColor || '#1D4ED8');
  const [logoDataUrl, setLogoDataUrl] = useState(settings.logoDataUrl || '');
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  // Handle uploading logo directly from device gallery (NO URL)
  const handleLogoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // Compress and scale down to max 256x256 to fit neatly in Firestore
        const canvas = document.createElement('canvas');
        const MAX_DIM = 256;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_DIM) {
            height = Math.round((height * MAX_DIM) / width);
            width = MAX_DIM;
          }
        } else {
          if (height > MAX_DIM) {
            width = Math.round((width * MAX_DIM) / height);
            height = MAX_DIM;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/png', 0.9);
          setLogoDataUrl(compressedDataUrl);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSavedSuccess(false);

    try {
      await updateSettings({
        appTitle: title.trim(),
        appSubtitle: subtitle.trim(),
        primaryColor,
        logoDataUrl,
      });
      setSavedSuccess(true);
      setTimeout(() => {
        setSavedSuccess(false);
        onClose();
      }, 1200);
    } catch (err) {
      console.error('Failed to update settings:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleResetDefaults = () => {
    setTitle('PM 3B SPPG JAYAMUKTI');
    setSubtitle('Badan Gizi Nasional');
    setPrimaryColor('#1D4ED8');
    setLogoDataUrl('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg max-h-[92vh] flex flex-col my-auto overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header Modal */}
        <div 
          className="px-6 py-4 flex items-center justify-between text-white"
          style={{ backgroundColor: primaryColor }}
        >
          <div className="flex items-center gap-2.5">
            <Palette className="w-5 h-5" />
            <div>
              <h2 className="text-base font-bold">Kustomisasi Tema & Logo Aplikasi</h2>
              <p className="text-[11px] text-white/80">Khusus Administrator SPPG Jayamukti</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/20 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-6 overflow-y-auto space-y-4 text-xs text-slate-700">
          {/* Live Preview */}
          <div className="p-3.5 rounded-2xl bg-slate-100 border border-slate-200 space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Pratinjau Langsung Header Aplikasi:
            </span>
            <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
              <div className="p-1 rounded-xl bg-slate-50 border border-slate-200 shrink-0">
                {logoDataUrl ? (
                  <img src={logoDataUrl} alt="Logo" className="w-10 h-10 object-contain rounded-lg" />
                ) : (
                  <BgnLogo size={40} />
                )}
              </div>
              <div className="overflow-hidden">
                <h4 className="font-black text-slate-900 text-sm truncate">{title}</h4>
                <p className="text-[11px] text-slate-500 font-semibold truncate">{subtitle}</p>
              </div>
            </div>
          </div>

          {/* Upload Logo dari Galeri Perangkat (Bukan URL!) */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1.5">
              Upload Logo dari Galeri Perangkat (Foto/Gambar)
            </label>
            <div className="flex items-center gap-3">
              <label className="flex-1 border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-xl p-3 text-center cursor-pointer transition bg-slate-50 hover:bg-blue-50/50 flex items-center justify-center gap-2">
                <Upload className="w-4 h-4 text-blue-600" />
                <span className="font-bold text-blue-700">Pilih Gambar dari Galeri HP / Komputer</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoFileChange}
                  className="hidden"
                />
              </label>

              {logoDataUrl && (
                <button
                  type="button"
                  onClick={() => setLogoDataUrl('')}
                  className="p-2.5 rounded-xl border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100 transition"
                  title="Gunakan Logo Standar BGN"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
            <p className="text-[10px] text-slate-400 mt-1">
              *Gambar otomatis dikompres dan disimpan ke database tanpa perlu menginput link/URL.
            </p>
          </div>

          {/* Judul Aplikasi */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">
              Judul Header Aplikasi
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 font-black text-slate-900 focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* Subjudul Aplikasi */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">
              Tulisan Kecil di Bawah Judul
            </label>
            <input
              type="text"
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 font-semibold text-slate-700 focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* Pilihan Warna Tema Biru */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1.5">
              Pilihan Warna Tampilan (Tema Biru & Variasi):
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-2">
              {BLUE_COLOR_PRESETS.map((p) => (
                <button
                  type="button"
                  key={p.hex}
                  onClick={() => setPrimaryColor(p.hex)}
                  className={`p-2 rounded-xl border flex items-center gap-1.5 transition ${
                    primaryColor === p.hex
                      ? 'border-slate-900 ring-2 ring-blue-400 font-bold bg-slate-50'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <span
                    className="w-3.5 h-3.5 rounded-full shrink-0 shadow-xs"
                    style={{ backgroundColor: p.hex }}
                  />
                  <span className="text-[10px] truncate">{p.name}</span>
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-slate-500 text-[11px]">Kustom Hex:</span>
              <input
                type="color"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="w-7 h-7 rounded border border-slate-300 cursor-pointer p-0"
              />
              <input
                type="text"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="w-24 px-2 py-1 font-mono text-xs rounded-lg border border-slate-300 text-center uppercase"
              />
            </div>
          </div>

          {savedSuccess && (
            <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>Pengaturan berhasil disimpan dan aktif di semua perangkat!</span>
            </div>
          )}

          {/* Footer */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
            <button
              type="button"
              onClick={handleResetDefaults}
              className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset Standar BGN</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2 text-xs font-bold text-white rounded-xl shadow-md transition flex items-center gap-1.5"
                style={{ backgroundColor: primaryColor }}
              >
                {saving ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Menyimpan...</span>
                  </>
                ) : (
                  <span>Terapkan & Simpan</span>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
