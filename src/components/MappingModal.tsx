import React, { useState, useMemo } from 'react';
import { 
  MapPin, 
  Navigation, 
  ExternalLink, 
  Building2, 
  Compass
} from 'lucide-react';
import { Beneficiary } from '../types';
import { calculateAge } from '../utils/ageCalculator';
import { useSettings } from '../context/SettingsContext';
import { useAuth } from '../context/AuthContext';
import { useCustomFields } from '../context/CustomFieldsContext';

interface MappingModalProps {
  beneficiaries: Beneficiary[];
}

export const MappingModal: React.FC<MappingModalProps> = ({
  beneficiaries,
}) => {
  const { settings } = useSettings();
  const { posyanduList } = useAuth();
  const { categories } = useCustomFields();

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedPosyandu, setSelectedPosyandu] = useState<string>('all');
  const [activeBeneficiary, setActiveBeneficiary] = useState<Beneficiary | null>(null);

  // Grouping by dynamic Posyandus
  const posyanduStats = useMemo(() => {
    return posyanduList.map((posName) => {
      const items = beneficiaries.filter((b) => b.posyandu === posName);
      return {
        posName,
        total: items.length,
        items,
      };
    });
  }, [beneficiaries, posyanduList]);

  // Filtered pins
  const filteredPins = useMemo(() => {
    return beneficiaries.filter((b) => {
      if (selectedCategory !== 'all' && b.category !== selectedCategory) return false;
      if (selectedPosyandu !== 'all' && b.posyandu !== selectedPosyandu) return false;
      return true;
    });
  }, [beneficiaries, selectedCategory, selectedPosyandu]);

  const getCategoryDetails = (code: string) => {
    const match = categories.find((c) => c.code.toLowerCase() === code.toLowerCase());
    if (match) return match;
    return { name: code.toUpperCase(), icon: '📋', badgeColor: 'blue' };
  };

  return (
    <div className="space-y-5">
      {/* Header Banner */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div 
            className="p-3 rounded-2xl text-white shadow-xs"
            style={{ backgroundColor: settings.primaryColor || '#1D4ED8' }}
          >
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Pemetaan Spasial Sebaran Sasaran Wilayah
            </h2>
            <p className="text-xs text-slate-500">
              Visualisasi sebaran sasaran penerima manfaat di {posyanduList.length} Posyandu binaan SPPG.
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-xl border border-slate-300 font-bold bg-white text-slate-700"
          >
            <option value="all">Semua Kategori ({categories.length})</option>
            {categories.map((c) => (
              <option key={c.code} value={c.code}>
                {c.icon} {c.name.split(' ')[0]}
              </option>
            ))}
          </select>

          <select
            value={selectedPosyandu}
            onChange={(e) => setSelectedPosyandu(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-xl border border-slate-300 font-bold bg-white text-slate-700"
          >
            <option value="all">Semua Posyandu ({posyanduList.length})</option>
            {posyanduList.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Dynamic Posyandu Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        {posyanduStats.map((p) => (
          <div
            key={p.posName}
            onClick={() => setSelectedPosyandu(selectedPosyandu === p.posName ? 'all' : p.posName)}
            className={`p-3 rounded-2xl border transition cursor-pointer text-left ${
              selectedPosyandu === p.posName
                ? 'bg-blue-50 border-blue-600 shadow-xs ring-1 ring-blue-500/30'
                : 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
            }`}
          >
            <span className="text-xs font-black text-slate-800 line-clamp-1">{p.posName}</span>
            <div className="text-xl font-black text-blue-900 mt-1 tabular-nums">
              {p.total} <span className="text-xs font-normal text-slate-500">Jiwa</span>
            </div>
          </div>
        ))}
      </div>

      {/* Spatial Visualizer & Detail Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 bg-slate-900 rounded-3xl p-5 shadow-lg border border-slate-800 relative overflow-hidden flex flex-col min-h-[380px]">
          {/* Radar Header */}
          <div className="flex items-center justify-between text-white text-xs mb-3 z-10">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-400 animate-ping" />
              <span className="font-bold tracking-wider uppercase">RADAR SEBARAN WILAYAH SPPG</span>
            </div>
            <div className="flex items-center gap-2 text-[10px] text-slate-400">
              <span>{posyanduList.length} Posyandu Terintegrasi</span>
            </div>
          </div>

          {/* Grid Background */}
          <div className="absolute inset-0 opacity-15 pointer-events-none bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:20px_20px]" />

          {/* Center SPPG Station */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-none z-10">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 border-2 border-blue-300 shadow-xl flex items-center justify-center text-white text-base">
              🏢
            </div>
            <span className="text-[10px] font-bold text-blue-200 bg-slate-950/80 px-2 py-0.5 rounded-md mt-1 border border-blue-800">
              {settings.appTitle || 'SPPG PUSAT'}
            </span>
          </div>

          {/* Pins */}
          <div className="flex-1 relative z-20 min-h-[280px]">
            {filteredPins.length === 0 ? (
              <div className="flex items-center justify-center h-full text-slate-500 text-xs">
                Tidak ada data pada posyandu atau kategori yang dipilih.
              </div>
            ) : (
              filteredPins.map((b, idx) => {
                const angle = (idx * 137.5) * (Math.PI / 180);
                const radius = 20 + ((idx * 17) % 36);
                const topPercent = 50 + radius * Math.sin(angle);
                const leftPercent = 50 + radius * Math.cos(angle);

                const isSelected = activeBeneficiary?.nik === b.nik;
                const catInfo = getCategoryDetails(b.category);

                return (
                  <button
                    key={(b.id || b.nik) + idx}
                    onClick={() => setActiveBeneficiary(b)}
                    style={{ top: `${topPercent}%`, left: `${leftPercent}%` }}
                    className={`absolute -translate-x-1/2 -translate-y-1/2 p-1.5 rounded-full border-2 transition-all cursor-pointer bg-blue-500 border-white shadow-md ${
                      isSelected ? 'ring-4 ring-white scale-125 z-30 bg-blue-600' : 'hover:scale-120'
                    }`}
                    title={`${b.name} (${catInfo.name}) - ${b.posyandu}`}
                  >
                    <span className="text-[10px] block leading-none">
                      {catInfo.icon}
                    </span>
                  </button>
                );
              })
            )}
          </div>

          <div className="text-[10px] text-slate-400 flex items-center justify-between border-t border-slate-800 pt-2 z-10">
            <span>{settings.appTitle || 'SPPG'} • Badan Gizi Nasional</span>
            <span>Titik Terdata: {filteredPins.length} Sasaran</span>
          </div>
        </div>

        {/* Detail Selected Card */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <MapPin className="w-4 h-4 text-blue-600" />
              <h3 className="text-sm font-bold text-slate-900">Detail Sasaran</h3>
            </div>

            {activeBeneficiary ? (
              <div className="mt-4 space-y-3 text-xs">
                <div>
                  <span className="font-mono text-xs font-bold text-slate-500">
                    {activeBeneficiary.nik}
                  </span>
                  <h4 className="text-base font-black text-slate-900 mt-0.5">
                    {activeBeneficiary.name}
                  </h4>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 font-bold uppercase text-[10px]">
                      {getCategoryDetails(activeBeneficiary.category).name}
                    </span>
                    <span className="text-blue-900 font-bold bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200 tabular-nums">
                      Usia: {calculateAge(activeBeneficiary.birthDate).text}
                    </span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <div className="font-bold text-blue-900">
                    🏥 {activeBeneficiary.posyandu}
                  </div>
                  <p className="text-slate-600">
                    {activeBeneficiary.address}
                  </p>
                </div>

                <div className="text-[11px] text-slate-400">
                  Petugas: <strong>{activeBeneficiary.createdByName || 'Kader'}</strong>
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-slate-400 text-xs">
                <MapPin className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                <p className="font-medium text-slate-600">Pilih titik pada radar peta</p>
                <p className="text-[11px] mt-1">untuk melihat detail lengkap penerima manfaat.</p>
              </div>
            )}
          </div>

          {activeBeneficiary && (
            <div className="pt-3 border-t border-slate-100">
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${activeBeneficiary.address}, ${activeBeneficiary.posyandu}`)}`}
                target="_blank"
                rel="noreferrer"
                className="w-full py-2.5 px-4 text-xs font-bold text-white rounded-xl shadow-md flex items-center justify-center gap-2 transition hover:brightness-105"
                style={{ backgroundColor: settings.primaryColor || '#1D4ED8' }}
              >
                <Navigation className="w-3.5 h-3.5" />
                <span>Navigasi Google Maps</span>
                <ExternalLink className="w-3 h-3 opacity-80" />
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
