import React, { useState, useEffect } from 'react';
import { 
  X, 
  AlertCircle, 
  Loader2, 
  Calendar,
  Sparkles,
  Sliders,
  Lock,
  Plus,
  Edit3,
  Trash2,
  Check,
  CheckCircle2
} from 'lucide-react';
import { Beneficiary, Gender, CustomField, CustomFieldType } from '../types';
import { calculateAge } from '../utils/ageCalculator';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { useCustomFields } from '../context/CustomFieldsContext';

interface BeneficiaryFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (beneficiaryData: Omit<Beneficiary, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  initialData?: Beneficiary | null;
}

export const BeneficiaryFormModal: React.FC<BeneficiaryFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
}) => {
  const { session, isAdmin, activePosyandu, posyanduList } = useAuth();
  const { settings } = useSettings();
  const { categories, customFields, addField, updateField, deleteField } = useCustomFields();

  const [category, setCategory] = useState<string>(categories[0]?.code || 'balita');
  const [posyandu, setPosyandu] = useState<string>(activePosyandu || posyanduList[0] || 'Posyandu Jayamukti');
  const [nik, setNik] = useState('');
  const [name, setName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [gender, setGender] = useState<Gender>('L');
  const [address, setAddress] = useState('');
  const [customData, setCustomData] = useState<Record<string, any>>({});
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Inline Quick Field Editor State
  const [quickFieldModalOpen, setQuickFieldModalOpen] = useState(false);
  const [editingCustomField, setEditingCustomField] = useState<CustomField | null>(null);
  const [quickFieldLabel, setQuickFieldLabel] = useState('');
  const [quickFieldType, setQuickFieldType] = useState<CustomFieldType>('text');
  const [quickFieldUnit, setQuickFieldUnit] = useState('');
  const [quickFieldOptions, setQuickFieldOptions] = useState('');
  const [quickFieldRequired, setQuickFieldRequired] = useState(false);
  const [quickFieldScope, setQuickFieldScope] = useState('all');
  const [quickFieldSaving, setQuickFieldSaving] = useState(false);
  const [quickFieldError, setQuickFieldError] = useState('');

  useEffect(() => {
    if (initialData) {
      setCategory(initialData.category || categories[0]?.code || 'balita');
      setPosyandu(initialData.posyandu || activePosyandu || posyanduList[0] || 'Posyandu');
      setNik(initialData.nik || '');
      setName(initialData.name || '');
      setBirthDate(initialData.birthDate || '');
      setGender(initialData.gender || 'L');
      setAddress(initialData.address || '');
      setCustomData(initialData.customData || {});
    } else {
      setCategory(categories[0]?.code || 'balita');
      setPosyandu(activePosyandu || posyanduList[0] || 'Posyandu');
      setNik('');
      setName('');
      setBirthDate('');
      setGender('L');
      setAddress('');
      setCustomData({});
    }
    setErrorMsg('');
  }, [initialData, isOpen, activePosyandu, categories, posyanduList]);

  // Gender automatic handling for bumil & busui
  const handleCategorySelect = (catCode: string) => {
    setCategory(catCode);
    if (catCode === 'bumil' || catCode === 'busui') {
      setGender('P');
    }
  };

  const handleCustomFieldChange = (key: string, value: any) => {
    setCustomData((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  // Filter custom fields: Kunci isian kader jika kategori kader dipilih (jangan minta lingkar lila/gizi balita)
  const isKaderCategory = category.toLowerCase() === 'kader';
  const applicableCustomFields = customFields.filter((f) => {
    if (isKaderCategory) {
      // Kunci isian antropometri balita/bumil untuk kader
      const childOnlyKeys = ['berat_badan', 'tinggi_badan', 'lingkar_lila', 'status_gizi'];
      if (childOnlyKeys.includes(f.key)) return false;
    }
    return f.categoryScope === 'all' || f.categoryScope === category;
  });

  const ageResult = birthDate ? calculateAge(birthDate) : null;

  // Open inline modal to add field
  const handleOpenAddCustomField = () => {
    setEditingCustomField(null);
    setQuickFieldLabel('');
    setQuickFieldType('text');
    setQuickFieldUnit('');
    setQuickFieldOptions('');
    setQuickFieldRequired(false);
    setQuickFieldScope('all');
    setQuickFieldError('');
    setQuickFieldModalOpen(true);
  };

  // Open inline modal to edit field
  const handleOpenEditCustomField = (f: CustomField) => {
    setEditingCustomField(f);
    setQuickFieldLabel(f.label);
    setQuickFieldType(f.type);
    setQuickFieldUnit(f.unit || '');
    setQuickFieldOptions(f.options?.join(', ') || '');
    setQuickFieldRequired(f.required || false);
    setQuickFieldScope(f.categoryScope || 'all');
    setQuickFieldError('');
    setQuickFieldModalOpen(true);
  };

  // Save quick custom field
  const handleSaveQuickCustomField = async (e: React.FormEvent) => {
    e.preventDefault();
    setQuickFieldError('');
    const cleanLabel = quickFieldLabel.trim();
    if (!cleanLabel) {
      setQuickFieldError('Label nama kolom wajib diisi.');
      return;
    }

    const cleanKey = cleanLabel.toLowerCase().replace(/[^a-z0-9]/g, '_');
    const optionsArray = quickFieldType === 'select'
      ? quickFieldOptions.split(',').map((o) => o.trim()).filter(Boolean)
      : [];

    setQuickFieldSaving(true);
    try {
      if (editingCustomField) {
        await updateField(editingCustomField.id, {
          label: cleanLabel,
          type: quickFieldType,
          unit: quickFieldUnit.trim(),
          options: optionsArray,
          categoryScope: quickFieldScope,
          required: Boolean(quickFieldRequired),
        });
      } else {
        await addField({
          label: cleanLabel,
          key: cleanKey,
          type: quickFieldType,
          unit: quickFieldUnit.trim(),
          options: optionsArray,
          categoryScope: quickFieldScope,
          required: Boolean(quickFieldRequired),
          order: customFields.length + 1,
          description: '',
        });
      }
      setQuickFieldModalOpen(false);
      setEditingCustomField(null);
    } catch (err: any) {
      setQuickFieldError(err.message || 'Gagal menyimpan kolom formulir.');
    } finally {
      setQuickFieldSaving(false);
    }
  };

  // Delete quick custom field without window.confirm (which is blocked in iframes)
  const handleDeleteCustomField = async (fieldId: string) => {
    try {
      await deleteField(fieldId);
    } catch (err) {
      console.error('Delete field error:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const cleanNik = nik.trim();
    // KUNCI ISIAN NIK 16 ANGKA
    if (cleanNik.length !== 16) {
      setErrorMsg(`NIK wajib tepat 16 digit angka (saat ini ${cleanNik.length} angka). Sesuai standar KTP/KK Republik Indonesia.`);
      return;
    }

    if (!name.trim()) {
      setErrorMsg('Nama lengkap harus diisi.');
      return;
    }

    if (!birthDate) {
      setErrorMsg('Tanggal lahir harus diisi.');
      return;
    }

    if (!address.trim()) {
      setErrorMsg('Alamat lengkap harus diisi.');
      return;
    }

    // Validate required custom fields
    for (const f of applicableCustomFields) {
      if (f.required && (customData[f.key] === undefined || customData[f.key] === '')) {
        setErrorMsg(`Kolom "${f.label}" wajib diisi.`);
        return;
      }
    }

    setSubmitting(true);
    try {
      await onSubmit({
        nik: cleanNik,
        name: name.trim(),
        category,
        posyandu,
        birthDate,
        gender: (category === 'bumil' || category === 'busui') ? 'P' : gender,
        address: address.trim(),
        customData,
        createdBy: session?.uid || 'kader_default',
        createdByName: session?.displayName || 'Kader SPPG',
      });
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal menyimpan data.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-xl border border-slate-200 w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-auto flex flex-col max-h-[92vh]">
        
        {/* Header Modal */}
        <div 
          className="px-6 py-4 flex items-center justify-between text-white shrink-0"
          style={{ backgroundColor: settings.primaryColor || '#1D4ED8' }}
        >
          <div>
            <h2 className="text-base font-bold">
              {initialData ? 'Ubah Data Penerima Manfaat' : 'Tambah Penerima Manfaat / Sasaran'}
            </h2>
            <p className="text-xs text-white/80">
              {posyandu} • {settings.appTitle || 'SPPG Badan Gizi Nasional'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/20 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 text-xs text-slate-800 overflow-y-auto flex-1">
          {errorMsg && (
            <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* KUNCI ISIAN KADER: Wilayah Posyandu & Petugas Kader Terkunci Otomatis */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-2xl bg-blue-50/70 border border-blue-200">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                <span>Wilayah Posyandu:</span>
                {!isAdmin && (
                  <span className="text-[10px] text-blue-700 font-bold flex items-center gap-0.5">
                    <Lock className="w-3 h-3" /> Terkunci
                  </span>
                )}
              </label>
              {isAdmin ? (
                <select
                  value={posyandu}
                  onChange={(e) => setPosyandu(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-300 bg-white font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 text-xs shadow-2xs"
                >
                  {posyanduList.map((pos) => (
                    <option key={pos} value={pos}>
                      {pos}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="px-3 py-2 rounded-xl bg-white border border-blue-300 font-bold text-blue-900 text-xs flex items-center justify-between shadow-2xs">
                  <span>{posyandu}</span>
                  <span className="text-[10px] text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded font-bold">
                    🔒 Terkunci
                  </span>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                <span>Petugas Kader Pendata:</span>
                <span className="text-[10px] text-blue-700 font-bold flex items-center gap-0.5">
                  <Lock className="w-3 h-3" /> Terkunci
                </span>
              </label>
              <div className="px-3 py-2 rounded-xl bg-white border border-blue-300 font-bold text-slate-800 text-xs flex items-center justify-between shadow-2xs">
                <span className="truncate">{session?.displayName || 'Kader SPPG'}</span>
                <span className="text-[10px] text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded font-bold shrink-0">
                  🔒 Terkunci
                </span>
              </div>
            </div>
          </div>

          {/* 1. Kategori Sasaran Penerima */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-700">
                1. Kategori Sasaran Penerima ({categories.length} Kategori):
              </label>
              <span className="text-[10px] text-slate-400">Pilih salah satu</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {categories.map((cat) => {
                const isSelected = category === cat.code;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => handleCategorySelect(cat.code)}
                    className={`py-2 px-2 rounded-xl border text-center transition font-bold flex flex-col items-center justify-center gap-0.5 ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50 text-blue-900 ring-2 ring-blue-500/30'
                        : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <span className="text-xl leading-none">{cat.icon}</span>
                    <span className="text-[11px] truncate w-full">{cat.name.split(' ')[0]}</span>
                  </button>
                );
              })}
            </div>

            {isKaderCategory && (
              <div className="mt-2 p-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] flex items-center gap-2">
                <Lock className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Kategori Kader Terpilih: Isian pengukuran balita/gizi dikunci dan disesuaikan khusus profil kader.</span>
              </div>
            )}
          </div>

          {/* 2. NIK & Nama Lengkap: KUNCI ISIAN NIK 16 ANGKA */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="font-bold text-slate-700 flex items-center gap-1">
                  <span>2. NIK / No. KTP/KK</span>
                  <span className="text-rose-500">*</span>
                </label>
                {/* Status Indicator NIK 16 Angka */}
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1 transition ${
                  nik.length === 16 
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                    : nik.length > 0 
                    ? 'bg-amber-100 text-amber-800 border border-amber-300' 
                    : 'bg-slate-100 text-slate-500'
                }`}>
                  {nik.length === 16 ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-600" />
                      <span>16 Digit Valid</span>
                    </>
                  ) : (
                    <span>{nik.length}/16 Angka</span>
                  )}
                </span>
              </div>
              <input
                type="text"
                inputMode="numeric"
                maxLength={16}
                value={nik}
                onChange={(e) => setNik(e.target.value.replace(/\D/g, '').slice(0, 16))}
                placeholder="Contoh: 3216011204230001"
                className={`w-full px-3 py-2 rounded-xl border focus:ring-2 focus:ring-blue-500 text-xs font-mono font-bold tracking-wider transition ${
                  nik.length === 16
                    ? 'border-emerald-400 bg-emerald-50/30 text-emerald-900'
                    : nik.length > 0
                    ? 'border-amber-400 bg-amber-50/20 text-slate-900'
                    : 'border-slate-300'
                }`}
                required
              />
              <p className="text-[10px] text-slate-400 mt-1">
                Wajib tepat 16 angka (hanya menerima angka).
              </p>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="font-bold text-slate-700">3. Nama Lengkap</label>
                <span className="text-rose-500">*</span>
              </div>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Contoh: Siti Aisyah"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 text-xs font-semibold"
                required
              />
            </div>
          </div>

          {/* 3. Tanggal Lahir & Jenis Kelamin */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-200">
            <div>
              <label className="font-bold text-slate-700 block mb-1">4. Tanggal Lahir</label>
              <input
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
                className="w-full px-3 py-1.5 rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-blue-500 text-xs font-mono"
                required
              />
              {ageResult && (
                <div className="mt-1 text-[10px] font-bold text-blue-800 bg-blue-100 px-2 py-0.5 rounded-md inline-block">
                  Umur: {ageResult.text}
                </div>
              )}
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">5. Jenis Kelamin</label>
              {category === 'bumil' || category === 'busui' ? (
                <div className="py-2 px-3 rounded-xl bg-pink-50 border border-pink-200 text-pink-700 font-bold text-xs">
                  Perempuan (P)
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setGender('L')}
                    className={`py-1.5 px-2 rounded-xl border text-xs font-bold transition ${
                      gender === 'L'
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-slate-300 bg-white text-slate-600'
                    }`}
                  >
                    Laki-laki (L)
                  </button>
                  <button
                    type="button"
                    onClick={() => setGender('P')}
                    className={`py-1.5 px-2 rounded-xl border text-xs font-bold transition ${
                      gender === 'P'
                        ? 'border-rose-500 bg-rose-50 text-rose-700'
                        : 'border-slate-300 bg-white text-slate-600'
                    }`}
                  >
                    Perempuan (P)
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* 4. Alamat Lengkap */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">6. Alamat Lengkap & Patokan</label>
            <textarea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Contoh: RT 02 / RW 01, Dekat Lapangan atau Musholla"
              rows={2}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 text-xs"
              required
            />
          </div>

          {/* 5. KOLOM ISIAN FORMULIR BEBAS (DAPAT DIEDIT, DITAMBAH, MAUPUN DIHAPUS) */}
          <div className="pt-2 border-t border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                <Sliders className="w-4 h-4 text-blue-600" />
                <span>Kolom Isian Bebas ({applicableCustomFields.length}):</span>
              </div>

              {/* Tombol Tambah Kolom Isian Bebas Langsung di Formulir */}
              <button
                type="button"
                onClick={handleOpenAddCustomField}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold rounded-lg bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition"
                title="Tambah Kolom Isian Baru ke Formulir"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Kolom</span>
              </button>
            </div>

            {applicableCustomFields.length === 0 ? (
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center text-slate-500 text-xs">
                Belum ada kolom isian bebas untuk kategori ini.{' '}
                <button
                  type="button"
                  onClick={handleOpenAddCustomField}
                  className="text-blue-600 font-bold underline"
                >
                  Tambah sekarang
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50/80 p-3.5 rounded-2xl border border-slate-200">
                {applicableCustomFields.map((field) => {
                  const currentValue = customData[field.key] ?? '';

                  return (
                    <div key={field.id} className={field.type === 'text' ? 'sm:col-span-2' : ''}>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-[11px] font-bold text-slate-700 truncate max-w-[200px]">
                          {field.label} {field.unit && `(${field.unit})`}
                          {field.required && <span className="text-rose-600 ml-0.5">*</span>}
                        </label>

                        {/* Aksi Edit & Hapus Kolom Isian Bebas */}
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleOpenEditCustomField(field)}
                            className="p-1 rounded text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition"
                            title={`Edit Kolom "${field.label}"`}
                          >
                            <Edit3 className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteCustomField(field.id)}
                            className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                            title={`Hapus Kolom "${field.label}"`}
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      {/* Number input */}
                      {field.type === 'number' && (
                        <div className="relative">
                          <input
                            type="number"
                            step="any"
                            value={currentValue}
                            onChange={(e) => handleCustomFieldChange(field.key, e.target.value)}
                            placeholder="0.0"
                            className="w-full px-3 py-1.5 rounded-xl border border-slate-300 bg-white text-xs font-mono font-bold text-slate-800 focus:ring-2 focus:ring-blue-500"
                            required={field.required}
                          />
                          {field.unit && (
                            <span className="absolute right-3 top-1.5 text-[11px] text-slate-400 font-bold">
                              {field.unit}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Text input */}
                      {field.type === 'text' && (
                        <input
                          type="text"
                          value={currentValue}
                          onChange={(e) => handleCustomFieldChange(field.key, e.target.value)}
                          placeholder={`Masukkan ${field.label}...`}
                          className="w-full px-3 py-1.5 rounded-xl border border-slate-300 bg-white text-xs text-slate-800 focus:ring-2 focus:ring-blue-500"
                          required={field.required}
                        />
                      )}

                      {/* Select Dropdown */}
                      {field.type === 'select' && (
                        <select
                          value={currentValue}
                          onChange={(e) => handleCustomFieldChange(field.key, e.target.value)}
                          className="w-full px-3 py-1.5 rounded-xl border border-slate-300 bg-white text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500"
                          required={field.required}
                        >
                          <option value="">-- Pilih {field.label} --</option>
                          {field.options?.map((opt) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                      )}

                      {/* Date input */}
                      {field.type === 'date' && (
                        <input
                          type="date"
                          value={currentValue}
                          onChange={(e) => handleCustomFieldChange(field.key, e.target.value)}
                          className="w-full px-3 py-1.5 rounded-xl border border-slate-300 bg-white text-xs font-mono text-slate-800 focus:ring-2 focus:ring-blue-500"
                          required={field.required}
                        />
                      )}

                      {/* Boolean switch */}
                      {field.type === 'boolean' && (
                        <div className="flex items-center gap-2 mt-1">
                          <button
                            type="button"
                            onClick={() => handleCustomFieldChange(field.key, true)}
                            className={`px-3 py-1 rounded-lg border text-xs font-bold transition ${
                              currentValue === true
                                ? 'bg-emerald-600 text-white border-emerald-600'
                                : 'bg-white text-slate-600 border-slate-300'
                            }`}
                          >
                            Ya
                          </button>
                          <button
                            type="button"
                            onClick={() => handleCustomFieldChange(field.key, false)}
                            className={`px-3 py-1 rounded-lg border text-xs font-bold transition ${
                              currentValue === false
                                ? 'bg-slate-700 text-white border-slate-700'
                                : 'bg-white text-slate-600 border-slate-300'
                            }`}
                          >
                            Tidak
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer Submit */}
          <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold transition"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2 rounded-xl text-white font-bold shadow-md hover:brightness-105 active:scale-98 transition flex items-center gap-2"
              style={{ backgroundColor: settings.primaryColor || '#1D4ED8' }}
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{initialData ? 'Simpan Perubahan' : 'Simpan Data Sasaran'}</span>
            </button>
          </div>
        </form>

        {/* MODAL INLINE: TAMBAH / EDIT KOLOM ISIAN BEBAS */}
        {quickFieldModalOpen && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-3 bg-black/60 backdrop-blur-2xs">
            <div className="bg-white rounded-2xl shadow-2xl border border-slate-300 w-full max-w-md p-5 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
                <div className="flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-blue-600" />
                  <h3 className="font-bold text-sm text-slate-900">
                    {editingCustomField ? 'Edit Kolom Formulir' : 'Tambah Kolom Isian Baru'}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setQuickFieldModalOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {quickFieldError && (
                <div className="mb-3 p-2 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                  {quickFieldError}
                </div>
              )}

              <form onSubmit={handleSaveQuickCustomField} className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nama / Label Kolom:</label>
                  <input
                    type="text"
                    value={quickFieldLabel}
                    onChange={(e) => setQuickFieldLabel(e.target.value)}
                    placeholder="Contoh: No. BPJS, Lingkar Kepala, Keluhan"
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500 font-semibold"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Tipe Isian:</label>
                    <select
                      value={quickFieldType}
                      onChange={(e) => setQuickFieldType(e.target.value as CustomFieldType)}
                      className="w-full px-3 py-1.5 rounded-xl border border-slate-300 text-xs bg-white font-semibold"
                    >
                      <option value="text">Teks Bebas</option>
                      <option value="number">Angka / Pengukuran</option>
                      <option value="select">Pilihan (Dropdown)</option>
                      <option value="date">Tanggal</option>
                      <option value="boolean">Ya / Tidak</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Satuan (Opsional):</label>
                    <input
                      type="text"
                      value={quickFieldUnit}
                      onChange={(e) => setQuickFieldUnit(e.target.value)}
                      placeholder="Contoh: cm, kg, mm"
                      className="w-full px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-mono"
                    />
                  </div>
                </div>

                {quickFieldType === 'select' && (
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Pilihan Dropdown (Pisahkan koma):
                    </label>
                    <input
                      type="text"
                      value={quickFieldOptions}
                      onChange={(e) => setQuickFieldOptions(e.target.value)}
                      placeholder="Contoh: Sangat Baik, Normal, Perlu Perhatian"
                      className="w-full px-3 py-1.5 rounded-xl border border-slate-300 text-xs"
                      required
                    />
                  </div>
                )}

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Berlaku untuk:</label>
                  <select
                    value={quickFieldScope}
                    onChange={(e) => setQuickFieldScope(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-300 text-xs bg-white font-semibold"
                  >
                    <option value="all">Semua Kategori Sasaran</option>
                    {categories.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.icon} Khusus {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700">
                    <input
                      type="checkbox"
                      checked={quickFieldRequired}
                      onChange={(e) => setQuickFieldRequired(e.target.checked)}
                      className="w-4 h-4 rounded text-blue-600"
                    />
                    <span>Wajib diisi saat input data</span>
                  </label>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setQuickFieldModalOpen(false)}
                    className="px-3 py-1.5 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={quickFieldSaving}
                    className="px-4 py-1.5 rounded-xl text-white font-bold shadow-xs hover:brightness-105"
                    style={{ backgroundColor: settings.primaryColor || '#1D4ED8' }}
                  >
                    {quickFieldSaving ? 'Menyimpan...' : editingCustomField ? 'Simpan Perubahan' : 'Tambah Kolom'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
