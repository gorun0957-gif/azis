import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Plus, 
  Edit3, 
  Trash2, 
  Building2, 
  MapPin, 
  LayoutGrid,
  Table as TableIcon,
  Sliders,
  ChevronRight,
  Info,
  X
} from 'lucide-react';
import { Beneficiary } from '../types';
import { calculateAge, formatIndoDate } from '../utils/ageCalculator';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { useCustomFields } from '../context/CustomFieldsContext';

interface BeneficiaryListProps {
  beneficiaries: Beneficiary[];
  onAddClick: () => void;
  onEditClick: (b: Beneficiary) => void;
  onDeleteClick: (id: string, name: string) => void;
  onBulkDeleteClick?: (ids: string[]) => void;
  onOpenCustomFieldsModal?: () => void;
  loading: boolean;
}

export const BeneficiaryList: React.FC<BeneficiaryListProps> = ({
  beneficiaries,
  onAddClick,
  onEditClick,
  onDeleteClick,
  onBulkDeleteClick,
  onOpenCustomFieldsModal,
  loading,
}) => {
  const { isAdmin, isKader, activePosyandu, posyanduList } = useAuth();
  const { settings } = useSettings();
  const { categories, customFields } = useCustomFields();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedPosyandu, setSelectedPosyandu] = useState<string>(activePosyandu || 'all');
  const [viewMode, setViewMode] = useState<'auto' | 'cards' | 'table'>('auto');

  // State untuk centang massal
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Modal Detail Isian Kustom
  const [detailBeneficiary, setDetailBeneficiary] = useState<Beneficiary | null>(null);

  // Filter list
  const filteredBeneficiaries = useMemo(() => {
    return beneficiaries.filter((item) => {
      if (isKader && activePosyandu && item.posyandu !== activePosyandu) {
        return false;
      }
      if (isAdmin && selectedPosyandu !== 'all' && item.posyandu !== selectedPosyandu) {
        return false;
      }
      if (selectedCategory !== 'all' && item.category !== selectedCategory) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesNik = item.nik.toLowerCase().includes(q);
        const matchesName = item.name.toLowerCase().includes(q);
        const matchesAddress = item.address.toLowerCase().includes(q);
        const matchesPos = item.posyandu.toLowerCase().includes(q);
        return matchesNik || matchesName || matchesAddress || matchesPos;
      }
      return true;
    });
  }, [beneficiaries, selectedCategory, selectedPosyandu, searchQuery, isKader, activePosyandu, isAdmin]);

  const visibleIds = useMemo(() => {
    return filteredBeneficiaries.map((b) => b.id).filter(Boolean) as string[];
  }, [filteredBeneficiaries]);

  const isAllSelected = useMemo(() => {
    if (visibleIds.length === 0) return false;
    return visibleIds.every((id) => selectedIds.includes(id));
  }, [visibleIds, selectedIds]);

  const isSomeSelected = useMemo(() => {
    return selectedIds.length > 0 && !isAllSelected;
  }, [selectedIds, isAllSelected]);

  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds((prev) => prev.filter((id) => !visibleIds.includes(id)));
    } else {
      setSelectedIds((prev) => Array.from(new Set([...prev, ...visibleIds])));
    }
  };

  const handleToggleRow = (id?: string) => {
    if (!id) return;
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleClearSelection = () => {
    setSelectedIds([]);
  };

  // Dynamic KPI Stats according to all active categories
  const statsByCategory = useMemo(() => {
    const counts: Record<string, number> = {};
    categories.forEach((c) => { counts[c.code] = 0; });

    filteredBeneficiaries.forEach((b) => {
      if (counts[b.category] !== undefined) {
        counts[b.category]++;
      } else {
        counts[b.category] = (counts[b.category] || 0) + 1;
      }
    });

    return {
      total: filteredBeneficiaries.length,
      counts,
    };
  }, [filteredBeneficiaries, categories]);

  const getCategoryDetails = (code: string) => {
    const match = categories.find((c) => c.code.toLowerCase() === code.toLowerCase());
    if (match) return match;
    return {
      name: code.toUpperCase(),
      icon: '📋',
      badgeColor: 'blue' as const,
    };
  };

  const renderCategoryBadge = (code: string) => {
    const cat = getCategoryDetails(code);
    const colorClasses: Record<string, string> = {
      blue: 'bg-blue-50 text-blue-800 border-blue-200',
      pink: 'bg-pink-50 text-pink-800 border-pink-200',
      purple: 'bg-purple-50 text-purple-800 border-purple-200',
      emerald: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      amber: 'bg-amber-50 text-amber-800 border-amber-200',
      rose: 'bg-rose-50 text-rose-800 border-rose-200',
      indigo: 'bg-indigo-50 text-indigo-800 border-indigo-200',
      teal: 'bg-teal-50 text-teal-800 border-teal-200',
    };
    const cls = colorClasses[cat.badgeColor || 'blue'] || colorClasses.blue;

    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[11px] font-bold border ${cls}`}>
        <span>{cat.icon}</span>
        <span>{cat.name.split(' ')[0]}</span>
      </span>
    );
  };

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* Top Banner & Quick Actions */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <div 
            className="p-2.5 rounded-2xl text-white shrink-0 shadow-xs"
            style={{ backgroundColor: settings.primaryColor || '#1D4ED8' }}
          >
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm sm:text-base font-black text-slate-900">
                {isAdmin ? 'Konsol Terpadu Administrator SPPG' : `Petugas Kader: ${activePosyandu}`}
              </h3>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                isAdmin ? 'bg-blue-100 text-blue-800' : 'bg-emerald-100 text-emerald-800'
              }`}>
                {isAdmin ? `${posyanduList.length} Posyandu` : activePosyandu}
              </span>
            </div>
            <p className="text-xs text-slate-500 line-clamp-1">
              {isAdmin 
                ? `Pendataan sasaran 3B & kategori bebas di ${posyanduList.length} posyandu binaan.` 
                : `Pendataan sasaran di wilayah kerja ${activePosyandu}.`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onAddClick}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-white text-xs font-bold shadow-md hover:brightness-105 active:scale-98 transition shrink-0"
            style={{ backgroundColor: settings.primaryColor || '#1D4ED8' }}
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Sasaran</span>
          </button>
        </div>
      </div>

      {/* Dynamic KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-3">
        {/* Total Sasaran */}
        <div className="p-3 sm:p-3.5 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500">Total Sasaran</span>
          <div className="text-2xl font-black text-slate-900 mt-1 tabular-nums">
            {statsByCategory.total}
          </div>
        </div>

        {/* Dynamic Categories Metrics */}
        {categories.slice(0, 4).map((cat) => (
          <div key={cat.id} className="p-3 sm:p-3.5 rounded-2xl bg-white border border-slate-200 shadow-xs">
            <span className="text-[11px] font-semibold text-slate-700 truncate block">
              {cat.icon} {cat.name.split(' ')[0]}
            </span>
            <div className="text-2xl font-black text-slate-900 mt-1 tabular-nums">
              {statsByCategory.counts[cat.code] || 0}
            </div>
          </div>
        ))}
      </div>

      {/* Filter and Search Bar */}
      <div className="p-3 sm:p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2.5">
        <div className="flex flex-col sm:flex-row gap-2">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari NIK, Nama, Alamat, atau Posyandu..."
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Posyandu Select for Admin */}
          {isAdmin && (
            <div className="w-full sm:w-auto shrink-0">
              <select
                value={selectedPosyandu}
                onChange={(e) => setSelectedPosyandu(e.target.value)}
                className="w-full sm:w-auto px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white font-bold text-slate-700 focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Semua Posyandu ({posyanduList.length})</option>
                {posyanduList.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Category Pills & Layout Switcher */}
        <div className="flex items-center justify-between gap-2 overflow-x-auto pt-1 border-t border-slate-100">
          <div className="flex items-center gap-1 overflow-x-auto scrollbar-none pb-0.5">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1 text-xs font-bold rounded-xl whitespace-nowrap transition ${
                selectedCategory === 'all'
                  ? 'text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
              style={{
                backgroundColor: selectedCategory === 'all' ? (settings.primaryColor || '#1D4ED8') : undefined,
              }}
            >
              Semua ({filteredBeneficiaries.length})
            </button>

            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.code)}
                className={`px-2.5 py-1 text-xs font-bold rounded-xl whitespace-nowrap transition flex items-center gap-1 ${
                  selectedCategory === cat.code
                    ? 'text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
                style={{
                  backgroundColor: selectedCategory === cat.code ? (settings.primaryColor || '#1D4ED8') : undefined,
                }}
              >
                <span>{cat.icon}</span>
                <span>{cat.name.split(' ')[0]}</span>
              </button>
            ))}
          </div>

          {/* View mode toggle */}
          <div className="hidden sm:flex items-center gap-1 shrink-0 bg-slate-100 p-0.5 rounded-lg border border-slate-200">
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-md text-xs font-semibold flex items-center gap-1 transition ${
                viewMode === 'table' || viewMode === 'auto'
                  ? 'bg-white shadow-xs text-blue-700 font-bold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Tampilan Tabel Data"
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Tabel</span>
            </button>
            <button
              onClick={() => setViewMode('cards')}
              className={`p-1.5 rounded-md text-xs font-semibold flex items-center gap-1 transition ${
                viewMode === 'cards'
                  ? 'bg-white shadow-xs text-blue-700 font-bold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Tampilan Kartu Ringkas"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Kartu</span>
            </button>
          </div>
        </div>
      </div>

      {/* BILAH AKSI HAPUS MASSAL */}
      {selectedIds.length > 0 && (
        <div className="p-3.5 rounded-2xl bg-rose-50 border-2 border-rose-300 shadow-md flex flex-wrap items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-xl bg-rose-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
              {selectedIds.length}
            </span>
            <div>
              <p className="text-xs font-bold text-rose-950">
                {selectedIds.length} Data Sasaran Terpilih
              </p>
              <p className="text-[11px] text-rose-700">
                Hapus sekaligus secara massal tanpa perlu mengklik satu per satu.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleToggleSelectAll}
              className="px-3 py-1.5 text-xs font-semibold text-rose-800 bg-white border border-rose-200 hover:bg-rose-100 rounded-xl transition"
            >
              {isAllSelected ? 'Batalkan Pilih Semua' : `Pilih Semua (${filteredBeneficiaries.length})`}
            </button>

            <button
              type="button"
              onClick={handleClearSelection}
              className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-white rounded-xl transition"
            >
              Batal
            </button>

            <button
              type="button"
              onClick={() => onBulkDeleteClick && onBulkDeleteClick(selectedIds)}
              className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 active:scale-98 rounded-xl shadow-md transition flex items-center gap-1.5"
            >
              <Trash2 className="w-4 h-4" />
              <span>Hapus Massal ({selectedIds.length} Data)</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      {loading ? (
        <div className="p-10 text-center bg-white rounded-3xl border border-slate-200">
          <div className="inline-block w-6 h-6 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mb-2" />
          <p className="text-xs text-slate-500 font-medium">Memuat data real-time...</p>
        </div>
      ) : filteredBeneficiaries.length === 0 ? (
        <div className="p-10 text-center bg-white rounded-3xl border border-dashed border-slate-300">
          <p className="text-sm font-bold text-slate-800">Belum ada data sasaran atau penerima manfaat</p>
          <p className="text-xs text-slate-500 mt-1 mb-4">
            Mulai tambahkan sasaran baru dengan kategori atau kolom bebas sesuai kebutuhan.
          </p>
          <button
            onClick={onAddClick}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-white text-xs font-bold shadow-md hover:brightness-105"
            style={{ backgroundColor: settings.primaryColor || '#1D4ED8' }}
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Data Sekarang</span>
          </button>
        </div>
      ) : (
        <>
          {/* 1. MOBILE RESPONSIVE CARDS VIEW */}
          <div className={`space-y-3 ${viewMode === 'table' ? 'hidden' : 'block md:hidden'}`}>
            <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs">
              <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  onChange={handleToggleSelectAll}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                />
                <span>Pilih Semua Data ({filteredBeneficiaries.length})</span>
              </label>
              {selectedIds.length > 0 && (
                <span className="text-[11px] font-bold text-rose-600">
                  {selectedIds.length} dipilih
                </span>
              )}
            </div>

            {filteredBeneficiaries.map((b) => {
              const age = calculateAge(b.birthDate);
              const isChecked = b.id ? selectedIds.includes(b.id) : false;
              const hasCustomData = b.customData && Object.keys(b.customData).length > 0;

              return (
                <div 
                  key={b.id || b.nik}
                  className={`rounded-2xl border p-4 shadow-xs space-y-2.5 transition-colors ${
                    isChecked 
                      ? 'bg-blue-50/70 border-blue-400 ring-1 ring-blue-400' 
                      : 'bg-white border-slate-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2.5">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleToggleRow(b.id)}
                        className="w-4 h-4 mt-1 rounded text-blue-600 focus:ring-blue-500 cursor-pointer shrink-0"
                      />
                      <div>
                        <span className="font-mono text-[11px] font-bold text-slate-500">
                          {b.nik}
                        </span>
                        <h4 className="text-sm font-black text-slate-900 leading-tight">
                          {b.name}
                        </h4>
                      </div>
                    </div>
                    <div className="shrink-0">{renderCategoryBadge(b.category)}</div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 border-t border-slate-100">
                    <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                      <span className="text-slate-400 block text-[10px]">Wilayah Posyandu</span>
                      <strong className="text-slate-800 font-bold">{b.posyandu}</strong>
                    </div>
                    <div className="bg-blue-50/70 p-2 rounded-xl border border-blue-100">
                      <span className="text-blue-500 block text-[10px]">Usia & Kelamin</span>
                      <strong className="text-blue-900 font-bold tabular-nums">{age.text} ({b.gender})</strong>
                    </div>
                  </div>

                  <div className="text-[11px] text-slate-600 flex items-start gap-1.5 bg-slate-50 p-2 rounded-xl">
                    <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                    <span className="line-clamp-2">{b.address}</span>
                  </div>

                  {/* Custom Attributes Preview */}
                  {hasCustomData && (
                    <div className="p-2 rounded-xl bg-slate-50 border border-slate-200 text-[11px] space-y-1">
                      <div className="flex items-center justify-between text-slate-500 font-bold text-[10px]">
                        <span>ISIAN DATA TAMBAHAN</span>
                        <button
                          type="button"
                          onClick={() => setDetailBeneficiary(b)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          Lihat Lengkap →
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {Object.entries(b.customData || {}).slice(0, 3).map(([k, v]) => {
                          const fieldDef = customFields.find((f) => f.key === k);
                          const label = fieldDef?.label || k.replace(/_/g, ' ');
                          return (
                            <span key={k} className="px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-700 text-[10px] font-semibold">
                              <strong>{label}:</strong> {String(v)} {fieldDef?.unit}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                    <span className="text-[10px] text-slate-400">
                      Oleh: {b.createdByName || 'Petugas'}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => onEditClick(b)}
                        className="px-2.5 py-1.5 rounded-lg text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 transition flex items-center gap-1"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Ubah</span>
                      </button>
                      <button
                        onClick={() => onDeleteClick(b.id || '', b.name)}
                        className="px-2.5 py-1.5 rounded-lg text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 transition flex items-center gap-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Hapus</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* 2. DESKTOP & TABLET TABLE VIEW */}
          <div className={`bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden ${
            viewMode === 'cards' ? 'hidden' : 'hidden md:block'
          }`}>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-slate-600 uppercase tracking-wider font-bold text-[11px] border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-3 w-10 text-center">
                      <div className="flex items-center justify-center">
                        <input
                          type="checkbox"
                          checked={isAllSelected}
                          ref={(input) => {
                            if (input) input.indeterminate = isSomeSelected;
                          }}
                          onChange={handleToggleSelectAll}
                          className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500 cursor-pointer"
                          title={isAllSelected ? 'Batalkan pilihan semua' : 'Centang seluruh data'}
                        />
                      </div>
                    </th>
                    <th className="py-3 px-4">NIK</th>
                    <th className="py-3 px-4">Nama Lengkap</th>
                    <th className="py-3 px-4">Kategori Sasaran</th>
                    <th className="py-3 px-4">Wilayah Posyandu</th>
                    <th className="py-3 px-4">Tgl Lahir / Usia</th>
                    <th className="py-3 px-4">JK</th>
                    <th className="py-3 px-4">Alamat Lengkap</th>
                    <th className="py-3 px-4">Isian Tambahan</th>
                    <th className="py-3 px-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredBeneficiaries.map((b) => {
                    const age = calculateAge(b.birthDate);
                    const isChecked = b.id ? selectedIds.includes(b.id) : false;
                    const hasCustomData = b.customData && Object.keys(b.customData).length > 0;

                    return (
                      <tr 
                        key={b.id || b.nik} 
                        className={`transition-colors ${
                          isChecked 
                            ? 'bg-blue-50/80 hover:bg-blue-100/70' 
                            : 'hover:bg-slate-50/80'
                        }`}
                      >
                        <td className="py-3 px-3 text-center">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleToggleRow(b.id)}
                            className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500 cursor-pointer"
                          />
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-slate-900 whitespace-nowrap">
                          {b.nik}
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-800 text-sm">
                          {b.name}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          {renderCategoryBadge(b.category)}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className="font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200">
                            {b.posyandu}
                          </span>
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className="font-bold text-blue-900 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 tabular-nums">
                            {age.text}
                          </span>
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            {formatIndoDate(b.birthDate)}
                          </div>
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap font-bold">
                          {b.gender === 'L' ? (
                            <span className="text-blue-700">L</span>
                          ) : (
                            <span className="text-rose-700">P</span>
                          )}
                        </td>
                        <td className="py-3 px-4 max-w-xs text-slate-600">
                          {b.address}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          {hasCustomData ? (
                            <button
                              type="button"
                              onClick={() => setDetailBeneficiary(b)}
                              className="px-2 py-1 rounded-md bg-blue-50 hover:bg-blue-100 text-blue-800 text-[10px] font-bold border border-blue-200 flex items-center gap-1"
                            >
                              <Info className="w-3 h-3 text-blue-600" />
                              <span>{Object.keys(b.customData || {}).length} Atribut Data</span>
                            </button>
                          ) : (
                            <span className="text-slate-400 text-[11px]">-</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-1">
                            <button
                              onClick={() => onEditClick(b)}
                              className="p-1.5 rounded-lg text-slate-600 hover:text-blue-700 hover:bg-blue-50 transition"
                              title="Ubah Data"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => onDeleteClick(b.id || '', b.name)}
                              className="p-1.5 rounded-lg text-slate-600 hover:text-rose-700 hover:bg-rose-50 transition"
                              title="Hapus Data Ini"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* MODAL DETAIL ATRIBUT KUSTOM LENGKAP */}
      {detailBeneficiary && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-xl border border-slate-200 max-w-md w-full p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div>
                <h3 className="font-bold text-sm text-slate-900">
                  Rincian Atribut Tambahan: {detailBeneficiary.name}
                </h3>
                <p className="text-[11px] text-slate-500 font-mono">
                  NIK: {detailBeneficiary.nik} • {detailBeneficiary.posyandu}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setDetailBeneficiary(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              {Object.entries(detailBeneficiary.customData || {}).map(([key, val]) => {
                const def = customFields.find((f) => f.key === key);
                const label = def?.label || key.replace(/_/g, ' ');
                return (
                  <div key={key} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-700">{label}:</span>
                    <span className="font-mono font-bold text-blue-900">
                      {String(val)} {def?.unit && <span className="font-normal text-slate-500">({def.unit})</span>}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setDetailBeneficiary(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white shadow-xs"
                style={{ backgroundColor: settings.primaryColor || '#1D4ED8' }}
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
