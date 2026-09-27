import React, { useState } from 'react';
import { 
  X, 
  Layers, 
  Sliders, 
  Plus, 
  Edit3, 
  Trash2, 
  Check, 
  AlertCircle, 
  Sparkles,
  RotateCcw,
  Tag,
  Hash,
  Type,
  ListFilter,
  Calendar,
  ToggleLeft
} from 'lucide-react';
import { useCustomFields } from '../context/CustomFieldsContext';
import { useSettings } from '../context/SettingsContext';
import { CustomCategory, CustomField, CustomFieldType } from '../types';

interface CustomFieldsManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CustomFieldsManagerModal: React.FC<CustomFieldsManagerModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { settings } = useSettings();
  const { 
    categories, 
    customFields, 
    addCategory, 
    updateCategory, 
    deleteCategory, 
    addField, 
    updateField, 
    deleteField, 
    resetToDefaults 
  } = useCustomFields();

  const [activeTab, setActiveTab] = useState<'categories' | 'fields'>('categories');

  // Category Form State
  const [editingCategory, setEditingCategory] = useState<CustomCategory | null>(null);
  const [catName, setCatName] = useState('');
  const [catCode, setCatCode] = useState('');
  const [catIcon, setCatIcon] = useState('📋');
  const [catBadgeColor, setCatBadgeColor] = useState<CustomCategory['badgeColor']>('blue');
  const [catDesc, setCatDesc] = useState('');
  const [catError, setCatError] = useState('');
  const [isAddingCat, setIsAddingCat] = useState(false);

  // Field Form State
  const [editingField, setEditingField] = useState<CustomField | null>(null);
  const [fieldLabel, setFieldLabel] = useState('');
  const [fieldKey, setFieldKey] = useState('');
  const [fieldType, setFieldType] = useState<CustomFieldType>('text');
  const [fieldUnit, setFieldUnit] = useState('');
  const [fieldOptions, setFieldOptions] = useState('');
  const [fieldCategoryScope, setFieldCategoryScope] = useState('all');
  const [fieldRequired, setFieldRequired] = useState(false);
  const [fieldDesc, setFieldDesc] = useState('');
  const [fieldError, setFieldError] = useState('');
  const [isAddingField, setIsAddingField] = useState(false);

  if (!isOpen) return null;

  // Category Handlers
  const handleOpenAddCategory = () => {
    setEditingCategory(null);
    setCatName('');
    setCatCode('');
    setCatIcon('🎯');
    setCatBadgeColor('blue');
    setCatDesc('');
    setCatError('');
    setIsAddingCat(true);
  };

  const handleOpenEditCategory = (cat: CustomCategory) => {
    setEditingCategory(cat);
    setCatName(cat.name);
    setCatCode(cat.code);
    setCatIcon(cat.icon || '📋');
    setCatBadgeColor(cat.badgeColor || 'blue');
    setCatDesc(cat.description || '');
    setCatError('');
    setIsAddingCat(true);
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setCatError('');

    if (!catName.trim()) {
      setCatError('Nama kategori wajib diisi.');
      return;
    }

    const cleanCode = catCode.trim().toLowerCase().replace(/[^a-z0-9]/g, '_') || catName.trim().toLowerCase().replace(/[^a-z0-9]/g, '_');

    try {
      if (editingCategory) {
        await updateCategory(editingCategory.id, {
          name: catName.trim(),
          icon: catIcon.trim() || '📋',
          badgeColor: catBadgeColor,
          description: catDesc.trim(),
        });
      } else {
        await addCategory({
          name: catName.trim(),
          code: cleanCode,
          icon: catIcon.trim() || '📋',
          badgeColor: catBadgeColor,
          description: catDesc.trim(),
          isDefault: false,
        });
      }
      setIsAddingCat(false);
      setEditingCategory(null);
    } catch (err: any) {
      setCatError(err.message || 'Gagal menyimpan kategori.');
    }
  };

  // Field Handlers
  const handleOpenAddField = () => {
    setEditingField(null);
    setFieldLabel('');
    setFieldKey('');
    setFieldType('text');
    setFieldUnit('');
    setFieldOptions('');
    setFieldCategoryScope('all');
    setFieldRequired(false);
    setFieldDesc('');
    setFieldError('');
    setIsAddingField(true);
  };

  const handleOpenEditField = (f: CustomField) => {
    setEditingField(f);
    setFieldLabel(f.label);
    setFieldKey(f.key);
    setFieldType(f.type);
    setFieldUnit(f.unit || '');
    setFieldOptions(f.options?.join(', ') || '');
    setFieldCategoryScope(f.categoryScope || 'all');
    setFieldRequired(f.required || false);
    setFieldDesc(f.description || '');
    setFieldError('');
    setIsAddingField(true);
  };

  const handleSaveField = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldError('');

    if (!fieldLabel.trim()) {
      setFieldError('Label kolom wajib diisi.');
      return;
    }

    const cleanKey = fieldKey.trim().toLowerCase().replace(/[^a-z0-9]/g, '_') || fieldLabel.trim().toLowerCase().replace(/[^a-z0-9]/g, '_');
    const optionsArray = fieldType === 'select'
      ? fieldOptions.split(',').map((o) => o.trim()).filter(Boolean)
      : [];

    try {
      if (editingField) {
        await updateField(editingField.id, {
          label: fieldLabel.trim(),
          type: fieldType,
          unit: fieldUnit.trim(),
          options: optionsArray,
          categoryScope: fieldCategoryScope,
          required: Boolean(fieldRequired),
          description: fieldDesc.trim(),
        });
      } else {
        await addField({
          label: fieldLabel.trim(),
          key: cleanKey,
          type: fieldType,
          unit: fieldUnit.trim(),
          options: optionsArray,
          categoryScope: fieldCategoryScope,
          required: Boolean(fieldRequired),
          order: customFields.length + 1,
          description: fieldDesc.trim(),
        });
      }
      setIsAddingField(false);
      setEditingField(null);
    } catch (err: any) {
      setFieldError(err.message || 'Gagal menyimpan kolom data.');
    }
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
            <Sliders className="w-5 h-5" />
            <div>
              <h2 className="text-base font-bold">Kategori & Isian Data Bebas (Tanpa Batasan)</h2>
              <p className="text-xs text-white/80">
                Admin bebas menambah kategori sasaran dan kolom formulir baru sesuai kebutuhan SPPG
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

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 pt-2 shrink-0">
          <button
            onClick={() => { setActiveTab('categories'); setIsAddingCat(false); }}
            className={`pb-2.5 px-4 text-xs font-bold transition flex items-center gap-1.5 border-b-2 ${
              activeTab === 'categories'
                ? 'border-blue-600 text-blue-700 bg-white rounded-t-xl shadow-xs'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Tag className="w-4 h-4" />
            <span>Kategori Sasaran ({categories.length})</span>
          </button>

          <button
            onClick={() => { setActiveTab('fields'); setIsAddingField(false); }}
            className={`pb-2.5 px-4 text-xs font-bold transition flex items-center gap-1.5 border-b-2 ${
              activeTab === 'fields'
                ? 'border-blue-600 text-blue-700 bg-white rounded-t-xl shadow-xs'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Kolom Isian Formulir Bebas ({customFields.length})</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs text-slate-700 flex-1">
          
          {/* TAB 1: KATEGORI SASARAN DINAMIS */}
          {activeTab === 'categories' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-blue-50/70 p-3.5 rounded-2xl border border-blue-200">
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">Kelola Kategori Sasaran Penerima</h4>
                  <p className="text-[11px] text-slate-600">
                    Tidak hanya 3B (Balita, Bumil, Busui, Kader), Anda bisa menambahkan kategori baru seperti Lansia, Remaja Putri, Stunting, Catin, dll.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleOpenAddCategory}
                  className="px-3.5 py-2 rounded-xl text-white font-bold text-xs flex items-center gap-1.5 shrink-0 shadow-xs hover:brightness-105"
                  style={{ backgroundColor: settings.primaryColor || '#1D4ED8' }}
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambah Kategori Baru</span>
                </button>
              </div>

              {/* Form Tambah/Edit Kategori */}
              {isAddingCat && (
                <form onSubmit={handleSaveCategory} className="p-4 rounded-2xl border-2 border-blue-300 bg-white shadow-md space-y-3 animate-in fade-in">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="font-bold text-slate-900 text-sm">
                      {editingCategory ? 'Edit Kategori Sasaran' : 'Buat Kategori Sasaran Baru'}
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsAddingCat(false)}
                      className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {catError && (
                    <div className="p-2 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-1.5">
                      <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                      <span>{catError}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2">
                      <label className="block font-bold text-slate-700 mb-1">Nama Kategori</label>
                      <input
                        type="text"
                        value={catName}
                        onChange={(e) => {
                          setCatName(e.target.value);
                          if (!editingCategory && !catCode) {
                            setCatCode(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '_'));
                          }
                        }}
                        placeholder="Contoh: Lansia Berisiko / Remaja Putri Anemia"
                        className="w-full px-3 py-1.5 rounded-xl border border-slate-300 font-bold text-slate-900 text-xs focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Emoji / Ikon</label>
                      <input
                        type="text"
                        value={catIcon}
                        onChange={(e) => setCatIcon(e.target.value)}
                        placeholder="Contoh: 👵 atau 🩸"
                        className="w-full px-3 py-1.5 rounded-xl border border-slate-300 text-center text-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Kode Unik (ID)</label>
                      <input
                        type="text"
                        value={catCode}
                        disabled={!!editingCategory}
                        onChange={(e) => setCatCode(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '_'))}
                        placeholder="Contoh: lansia_risti"
                        className="w-full px-3 py-1.5 rounded-xl border border-slate-300 font-mono text-xs text-slate-800 disabled:bg-slate-100"
                        required
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Warna Badge Tampilan</label>
                      <select
                        value={catBadgeColor}
                        onChange={(e) => setCatBadgeColor(e.target.value as any)}
                        className="w-full px-3 py-1.5 rounded-xl border border-slate-300 bg-white font-bold text-xs"
                      >
                        <option value="blue">🔵 Biru (Default)</option>
                        <option value="pink">🌸 Pink / Merah Muda</option>
                        <option value="purple">🟣 Ungu</option>
                        <option value="emerald">🟢 Hijau Emerald</option>
                        <option value="amber">🟠 Amber / Kuning Emas</option>
                        <option value="rose">🔴 Merah Rose</option>
                        <option value="indigo">🟣 Indigo / Biru Malam</option>
                        <option value="teal">🌊 Teal / Toska</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Deskripsi Kategori</label>
                    <input
                      type="text"
                      value={catDesc}
                      onChange={(e) => setCatDesc(e.target.value)}
                      placeholder="Keterangan singkat kelompok sasaran penerima manfaat..."
                      className="w-full px-3 py-1.5 rounded-xl border border-slate-300 text-xs"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsAddingCat(false)}
                      className="px-3 py-1.5 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 rounded-xl text-white font-bold shadow-xs hover:brightness-105"
                      style={{ backgroundColor: settings.primaryColor || '#1D4ED8' }}
                    >
                      {editingCategory ? 'Simpan Perubahan' : 'Buat Kategori'}
                    </button>
                  </div>
                </form>
              )}

              {/* Grid Kategori Tersedia */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {categories.map((c) => (
                  <div 
                    key={c.id} 
                    className="p-3.5 rounded-2xl border border-slate-200 bg-white shadow-xs flex items-start justify-between gap-3 hover:border-slate-300 transition"
                  >
                    <div className="flex items-start gap-2.5">
                      <span className="text-2xl p-1.5 bg-slate-50 rounded-xl border border-slate-200 leading-none">
                        {c.icon}
                      </span>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h4 className="font-bold text-slate-900 text-xs">{c.name}</h4>
                          {c.isDefault && (
                            <span className="text-[9px] font-bold bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">
                              Bawaan
                            </span>
                          )}
                        </div>
                        <p className="font-mono text-[10px] text-blue-700 font-semibold mt-0.5">
                          kode: {c.code}
                        </p>
                        {c.description && (
                          <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">
                            {c.description}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleOpenEditCategory(c)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition"
                        title="Edit Kategori"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      {!c.isDefault && (
                        <button
                          type="button"
                          onClick={() => deleteCategory(c.id)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition"
                          title="Hapus Kategori"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: KOLOM ISIAN DATA FORMULIR BEBAS */}
          {activeTab === 'fields' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-emerald-50/70 p-3.5 rounded-2xl border border-emerald-200">
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">Kelola Kolom Formulir Bebas (Custom Fields)</h4>
                  <p className="text-[11px] text-slate-600">
                    Admin dapat menambah kolom baru seperti Berat Badan, Tinggi Badan, LiLA, Hb, Gol Darah, Status PMT, dsb. Kolom ini langsung muncul di form input dan laporan.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleOpenAddField}
                  className="px-3.5 py-2 rounded-xl text-white font-bold text-xs flex items-center gap-1.5 shrink-0 shadow-xs hover:brightness-105"
                  style={{ backgroundColor: settings.primaryColor || '#1D4ED8' }}
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambah Kolom Isian Baru</span>
                </button>
              </div>

              {/* Form Tambah/Edit Field */}
              {isAddingField && (
                <form onSubmit={handleSaveField} className="p-4 rounded-2xl border-2 border-emerald-300 bg-white shadow-md space-y-3 animate-in fade-in">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="font-bold text-slate-900 text-sm">
                      {editingField ? 'Edit Kolom Isian' : 'Buat Kolom Isian Formulir Baru'}
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsAddingField(false)}
                      className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {fieldError && (
                    <div className="p-2 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-1.5">
                      <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                      <span>{fieldError}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2">
                      <label className="block font-bold text-slate-700 mb-1">Nama / Label Kolom</label>
                      <input
                        type="text"
                        value={fieldLabel}
                        onChange={(e) => {
                          setFieldLabel(e.target.value);
                          if (!editingField && !fieldKey) {
                            setFieldKey(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '_'));
                          }
                        }}
                        placeholder="Contoh: Berat Badan / Status Pemberian PMT"
                        className="w-full px-3 py-1.5 rounded-xl border border-slate-300 font-bold text-slate-900 text-xs focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Tipe Input Data</label>
                      <select
                        value={fieldType}
                        onChange={(e) => setFieldType(e.target.value as CustomFieldType)}
                        className="w-full px-3 py-1.5 rounded-xl border border-slate-300 bg-white font-bold text-xs"
                      >
                        <option value="text">📝 Teks Bebas</option>
                        <option value="number">🔢 Angka / Nilai</option>
                        <option value="select">🔽 Pilihan Dropdown</option>
                        <option value="date">📅 Tanggal</option>
                        <option value="boolean">🔘 Ya / Tidak (Boolean)</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Key Identitas (Database)</label>
                      <input
                        type="text"
                        value={fieldKey}
                        disabled={!!editingField}
                        onChange={(e) => setFieldKey(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '_'))}
                        placeholder="Contoh: berat_badan_kg"
                        className="w-full px-3 py-1.5 rounded-xl border border-slate-300 font-mono text-xs disabled:bg-slate-100"
                        required
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Satuan (Opsional)</label>
                      <input
                        type="text"
                        value={fieldUnit}
                        onChange={(e) => setFieldUnit(e.target.value)}
                        placeholder="Contoh: kg, cm, mmHg"
                        className="w-full px-3 py-1.5 rounded-xl border border-slate-300 text-xs"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Berlaku untuk Kategori</label>
                      <select
                        value={fieldCategoryScope}
                        onChange={(e) => setFieldCategoryScope(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-xl border border-slate-300 bg-white font-bold text-xs"
                      >
                        <option value="all">Semua Kategori</option>
                        {categories.map((c) => (
                          <option key={c.code} value={c.code}>
                            {c.icon} Khusus {c.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {fieldType === 'select' && (
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Daftar Pilihan Dropdown (Pisahkan dengan tanda koma)
                      </label>
                      <input
                        type="text"
                        value={fieldOptions}
                        onChange={(e) => setFieldOptions(e.target.value)}
                        placeholder="Contoh: Normal, Stunting, Gizi Kurang, Gizi Lebih"
                        className="w-full px-3 py-1.5 rounded-xl border border-slate-300 text-xs"
                        required
                      />
                    </div>
                  )}

                  <div className="flex items-center gap-4 pt-1">
                    <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700">
                      <input
                        type="checkbox"
                        checked={fieldRequired}
                        onChange={(e) => setFieldRequired(e.target.checked)}
                        className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                      />
                      <span>Wajib diisi oleh kader saat input</span>
                    </label>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsAddingField(false)}
                      className="px-3 py-1.5 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 rounded-xl text-white font-bold shadow-xs hover:brightness-105"
                      style={{ backgroundColor: settings.primaryColor || '#1D4ED8' }}
                    >
                      {editingField ? 'Simpan Perubahan' : 'Buat Kolom Isian'}
                    </button>
                  </div>
                </form>
              )}

              {/* List Kolom Isian Tersedia */}
              <div className="space-y-2">
                {customFields.map((f, idx) => (
                  <div
                    key={f.id}
                    className="p-3 rounded-2xl border border-slate-200 bg-white shadow-xs flex items-center justify-between gap-3 hover:border-slate-300 transition"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-lg bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-slate-900 text-xs">{f.label}</h4>
                          {f.unit && (
                            <span className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 font-mono text-[10px] font-bold border border-blue-200">
                              satuan: {f.unit}
                            </span>
                          )}
                          <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded uppercase font-semibold">
                            tipe: {f.type}
                          </span>
                          {f.required && (
                            <span className="text-[9px] bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded font-bold">
                              Wajib
                            </span>
                          )}
                        </div>
                        <p className="font-mono text-[10px] text-slate-400 mt-0.5">
                          field: {f.key} • scope: {f.categoryScope === 'all' ? 'Semua Kategori' : f.categoryScope}
                          {f.options && ` • opsi (${f.options.length}): ${f.options.join(', ')}`}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleOpenEditField(f)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition"
                        title="Edit Kolom Isian"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteField(f.id)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition"
                        title="Hapus Kolom Isian"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={resetToDefaults}
            className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 font-semibold"
            title="Kembalikan ke kategori 3B dan kolom standar BGN"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset Kategori & Kolom Default</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-bold text-white rounded-xl shadow-xs transition"
            style={{ backgroundColor: settings.primaryColor || '#1D4ED8' }}
          >
            Selesai
          </button>
        </div>
      </div>
    </div>
  );
};
