import React, { useState, useMemo } from 'react';
import { 
  X, 
  Upload, 
  FileSpreadsheet, 
  Download, 
  CheckCircle2, 
  AlertTriangle, 
  Loader2, 
  Sparkles, 
  Edit3, 
  Trash2, 
  Save, 
  Check 
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { Beneficiary, Gender } from '../types';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { useCustomFields } from '../context/CustomFieldsContext';

interface ExcelImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess: (importedBeneficiaries: Omit<Beneficiary, 'id' | 'createdAt' | 'updatedAt'>[]) => Promise<number>;
}

interface ParsedRow {
  index: number;
  nik: string;
  name: string;
  category: string;
  posyandu: string;
  birthDate: string;
  gender: Gender;
  address: string;
  isValid: boolean;
  validationError?: string;
  customData?: Record<string, any>;
}

// Smart parser for diverse Excel date representations
function normalizeDate(raw: string): string {
  if (!raw) return '';
  raw = String(raw).trim();

  // Excel serial number
  if (/^\d{4,5}(\.\d+)?$/.test(raw)) {
    const num = parseFloat(raw);
    const date = new Date(Math.round((num - 25569) * 86400 * 1000));
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0];
    }
  }

  // Already standard YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    return raw;
  }

  // YYYY/MM/DD or YYYY.MM.DD
  const ymdMatch = raw.match(/^(\d{4})[\/.](\d{1,2})[\/.](\d{1,2})$/);
  if (ymdMatch) {
    const [, y, m, d] = ymdMatch;
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }

  // DD/MM/YYYY or DD-MM-YYYY or DD.MM.YYYY
  const dmyMatch = raw.match(/^(\d{1,2})[-\/.](\d{1,2})[-\/.](\d{4})$/);
  if (dmyMatch) {
    const [, d, m, y] = dmyMatch;
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }

  return raw;
}

function checkRowValidity(r: Omit<ParsedRow, 'isValid' | 'validationError'>): { isValid: boolean; validationError?: string } {
  const cleanNik = r.nik.trim().replace(/\D/g, '');
  if (cleanNik.length < 4) {
    return { isValid: false, validationError: `NIK minimal 4 digit (sekarang: ${cleanNik.length})` };
  }
  if (!r.name.trim()) {
    return { isValid: false, validationError: 'Nama lengkap belum diisi' };
  }
  if (!r.birthDate || !/^\d{4}-\d{2}-\d{2}$/.test(r.birthDate)) {
    return { isValid: false, validationError: 'Tgl lahir harus YYYY-MM-DD' };
  }
  if (!r.address.trim()) {
    return { isValid: false, validationError: 'Alamat lengkap belum diisi' };
  }
  return { isValid: true };
}

export const ExcelImportModal: React.FC<ExcelImportModalProps> = ({
  isOpen,
  onClose,
  onImportSuccess,
}) => {
  const { session, activePosyandu, posyanduList } = useAuth();
  const { settings } = useSettings();
  const { categories, customFields } = useCustomFields();

  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [fileName, setFileName] = useState('');
  const [importing, setImporting] = useState(false);
  const [successCount, setSuccessCount] = useState<number | null>(null);
  const [generalError, setGeneralError] = useState('');

  // Row Filter (Semua / Error / Valid)
  const [filterStatus, setFilterStatus] = useState<'all' | 'error' | 'valid'>('all');

  // Row Editor State
  const [editingRow, setEditingRow] = useState<ParsedRow | null>(null);

  const displayRows = useMemo(() => {
    if (filterStatus === 'error') return parsedRows.filter((r) => !r.isValid);
    if (filterStatus === 'valid') return parsedRows.filter((r) => r.isValid);
    return parsedRows;
  }, [parsedRows, filterStatus]);

  // Unduh template dinamis
  const handleDownloadTemplate = (withSampleData = false) => {
    const defaultPos = activePosyandu || posyanduList[0] || 'Posyandu Jayamukti';
    const catCodes = categories.map((c) => c.code).join('/');

    const templateData = withSampleData
      ? [
          {
            'NIK (Nomor Identitas)': '3216012405230001',
            'Nama Lengkap': 'Ahmad Fauzi',
            'Kategori': 'balita',
            'Posyandu': defaultPos,
            'Tanggal Lahir (YYYY-MM-DD)': '2023-05-14',
            'Jenis Kelamin (L/P)': 'L',
            'Alamat Lengkap': 'RT 02 / RW 01 Dekat Lapangan',
          },
          {
            'NIK (Nomor Identitas)': '3216014508980002',
            'Nama Lengkap': 'Dewi Lestari',
            'Kategori': 'bumil',
            'Posyandu': defaultPos,
            'Tanggal Lahir (YYYY-MM-DD)': '1998-08-25',
            'Jenis Kelamin (L/P)': 'P',
            'Alamat Lengkap': 'RT 06 / RW 02 Depan Musholla',
          },
        ]
      : [
          {
            'NIK (Nomor Identitas)': '3216xxxxxxxxxxxx',
            'Nama Lengkap': 'Nama Lengkap Sasaran',
            'Kategori': catCodes,
            'Posyandu': defaultPos,
            'Tanggal Lahir (YYYY-MM-DD)': '2023-01-01',
            'Jenis Kelamin (L/P)': 'L / P',
            'Alamat Lengkap': 'Alamat detail',
          },
        ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Data Sasaran SPPG');
    
    worksheet['!cols'] = [
      { wch: 22 },
      { wch: 25 },
      { wch: 20 },
      { wch: 25 },
      { wch: 20 },
      { wch: 15 },
      { wch: 40 },
    ];

    const filename = withSampleData
      ? 'Contoh_Data_Sasaran_SPPG.xlsx'
      : 'Template_Import_Sasaran_SPPG.xlsx';

    XLSX.writeFile(workbook, filename);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setGeneralError('');
    setSuccessCount(null);
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();

    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsName = wb.SheetNames[0];
        const ws = wb.Sheets[wsName];
        const rawJson: any[] = XLSX.utils.sheet_to_json(ws);

        if (!rawJson || rawJson.length === 0) {
          setGeneralError('File Excel kosong atau format tidak terbaca.');
          return;
        }

        const parsed: ParsedRow[] = rawJson.map((row, index) => {
          const nikRaw = String(
            row['NIK (Nomor Identitas)'] || row['NIK (16 Digit)'] || row['NIK'] || row['nik'] || ''
          ).trim().replace(/\D/g, '');

          const nameRaw = String(
            row['Nama Lengkap'] || row['Nama'] || row['nama'] || ''
          ).trim();

          const catRaw = String(
            row['Kategori'] || row['Kategori (balita/bumil/busui/kader)'] || row['kategori'] || ''
          ).toLowerCase().trim();

          let category = 'balita';
          const matchedCategory = categories.find((c) => 
            catRaw.includes(c.code.toLowerCase()) || 
            catRaw.includes(c.name.toLowerCase().split(' ')[0])
          );
          if (matchedCategory) {
            category = matchedCategory.code;
          } else if (catRaw) {
            category = catRaw.replace(/[^a-z0-9_]/g, '_');
          }

          const posRaw = String(
            row['Posyandu'] || row['Wilayah Posyandu'] || row['posyandu'] || ''
          ).trim();

          let matchedPos = activePosyandu || posyanduList[0] || 'Posyandu Jayamukti';
          const foundPos = posyanduList.find((p) => 
            posRaw.toLowerCase().includes(p.toLowerCase().replace('posyandu ', ''))
          );
          if (foundPos) matchedPos = foundPos;

          const rawBirth = String(
            row['Tanggal Lahir (YYYY-MM-DD)'] || row['Tanggal Lahir'] || row['birthDate'] || ''
          ).trim();

          const birthDate = normalizeDate(rawBirth);

          let gender: Gender = 'L';
          const genderRaw = String(
            row['Jenis Kelamin (L/P)'] || row['Jenis Kelamin'] || row['JK'] || ''
          ).toUpperCase().trim();
          if (genderRaw.startsWith('P') || category === 'bumil' || category === 'busui') {
            gender = 'P';
          }

          const address = String(
            row['Alamat Lengkap'] || row['Alamat'] || row['alamat'] || ''
          ).trim();

          const check = checkRowValidity({
            index: index + 1,
            nik: nikRaw,
            name: nameRaw,
            category,
            posyandu: matchedPos,
            birthDate,
            gender,
            address,
          });

          return {
            index: index + 1,
            nik: nikRaw,
            name: nameRaw,
            category,
            posyandu: matchedPos,
            birthDate,
            gender,
            address,
            isValid: check.isValid,
            validationError: check.validationError,
          };
        });

        setParsedRows(parsed);
      } catch (err: any) {
        setGeneralError(`Gagal membaca file: ${err.message}`);
      }
    };

    reader.readAsBinaryString(file);
  };

  const handleSaveRowEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRow) return;

    const check = checkRowValidity(editingRow);
    const updatedRow: ParsedRow = {
      ...editingRow,
      isValid: check.isValid,
      validationError: check.validationError,
    };

    setParsedRows((prev) =>
      prev.map((r) => (r.index === updatedRow.index ? updatedRow : r))
    );

    setEditingRow(null);
  };

  const handleDeleteRow = (index: number) => {
    setParsedRows((prev) => prev.filter((r) => r.index !== index));
  };

  const handleProcessImport = async () => {
    const validRows = parsedRows.filter((r) => r.isValid);
    if (validRows.length === 0) {
      setGeneralError('Tidak ada data valid yang dapat diimpor.');
      return;
    }

    setImporting(true);
    setGeneralError('');
    try {
      const beneficiariesToSave: Omit<Beneficiary, 'id' | 'createdAt' | 'updatedAt'>[] = validRows.map((r) => ({
        nik: r.nik,
        name: r.name,
        category: r.category,
        posyandu: r.posyandu,
        birthDate: r.birthDate,
        gender: r.gender,
        address: r.address,
        createdBy: session?.uid || 'kader_import',
        createdByName: session?.displayName || 'Petugas SPPG',
      }));

      const count = await onImportSuccess(beneficiariesToSave);
      setSuccessCount(count);
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err: any) {
      setGeneralError(err.message || 'Gagal menyimpan data massal.');
    } finally {
      setImporting(false);
    }
  };

  const validCount = parsedRows.filter((r) => r.isValid).length;
  const errorCount = parsedRows.filter((r) => !r.isValid).length;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-xl border border-slate-200 w-full max-w-3xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-auto flex flex-col max-h-[92vh]">
        
        {/* Header Modal */}
        <div 
          className="px-5 py-3.5 flex items-center justify-between text-white shrink-0"
          style={{ backgroundColor: settings.primaryColor || '#1D4ED8' }}
        >
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5" />
            <h2 className="text-sm sm:text-base font-bold">Impor Massal Data Sasaran SPPG via Excel</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/20 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-5 space-y-4 text-xs text-slate-700 overflow-y-auto flex-1">
          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <p className="font-bold text-slate-800 text-xs">Format Excel Sasaran SPPG</p>
              <p className="text-[11px] text-slate-500">Mendukung {categories.length} Kategori Sasaran & {posyanduList.length} Posyandu</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleDownloadTemplate(false)}
                className="px-3 py-1.5 rounded-xl bg-white border border-slate-300 font-bold text-slate-700 hover:bg-slate-100 flex items-center gap-1"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Template Kosong</span>
              </button>
              <button
                type="button"
                onClick={() => handleDownloadTemplate(true)}
                className="px-3 py-1.5 rounded-xl bg-blue-50 border border-blue-300 font-bold text-blue-800 hover:bg-blue-100 flex items-center gap-1"
              >
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                <span>Contoh Data</span>
              </button>
            </div>
          </div>

          {/* Upload Input */}
          <div className="border-2 border-dashed border-slate-300 rounded-2xl p-4 sm:p-5 text-center bg-slate-50/50">
            <Upload className="w-6 h-6 mx-auto mb-1 text-slate-400" />
            <p className="font-bold text-slate-800">Pilih File Excel (.xlsx, .xls)</p>
            <label className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 text-white font-bold cursor-pointer hover:bg-slate-800 transition">
              <span>Pilih File</span>
              <input
                type="file"
                accept=".xlsx, .xls"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
            {fileName && (
              <p className="text-xs font-semibold text-blue-700 mt-2">
                Terpilih: <strong>{fileName}</strong>
              </p>
            )}
          </div>

          {generalError && (
            <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{generalError}</span>
            </div>
          )}

          {successCount !== null && (
            <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Berhasil menyimpan {successCount} sasaran ke database!</span>
            </div>
          )}

          {parsedRows.length > 0 && (
            <div className="space-y-2.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2">
                <div>
                  <h4 className="font-bold text-slate-800 text-sm">
                    Data Terbaca ({parsedRows.length} baris)
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Koreksi data baris jika ada yang salah sebelum disimpan.
                  </p>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setFilterStatus('all')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                      filterStatus === 'all'
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Semua ({parsedRows.length})
                  </button>

                  {errorCount > 0 && (
                    <button
                      type="button"
                      onClick={() => setFilterStatus('error')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                        filterStatus === 'error'
                          ? 'bg-rose-600 text-white shadow-xs'
                          : 'bg-rose-100 text-rose-800 hover:bg-rose-200'
                      }`}
                    >
                      <AlertTriangle className="w-3 h-3" />
                      <span>Perlu Diperbaiki ({errorCount})</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => setFilterStatus('valid')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                      filterStatus === 'valid'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                    }`}
                  >
                    Valid ({validCount})
                  </button>
                </div>
              </div>

              {/* Table Preview */}
              <div className="max-h-60 overflow-y-auto border border-slate-200 rounded-2xl">
                <table className="w-full text-left text-[11px] text-slate-700">
                  <thead className="bg-slate-100 sticky top-0 font-bold border-b border-slate-200">
                    <tr>
                      <th className="py-2 px-2.5">No</th>
                      <th className="py-2 px-2.5">NIK</th>
                      <th className="py-2 px-2.5">Nama</th>
                      <th className="py-2 px-2.5">Kategori</th>
                      <th className="py-2 px-2.5">Posyandu</th>
                      <th className="py-2 px-2.5">Tgl Lahir</th>
                      <th className="py-2 px-2.5">Status</th>
                      <th className="py-2 px-2.5 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {displayRows.map((r) => (
                      <tr 
                        key={r.index} 
                        className={`transition-colors ${
                          !r.isValid ? 'bg-rose-50/70 hover:bg-rose-100/60' : 'hover:bg-slate-50'
                        }`}
                      >
                        <td className="py-2 px-2.5 font-bold text-slate-400">{r.index}</td>
                        <td className="py-2 px-2.5 font-mono font-bold text-slate-900 whitespace-nowrap">{r.nik}</td>
                        <td className="py-2 px-2.5 font-semibold text-slate-800">{r.name}</td>
                        <td className="py-2 px-2.5 capitalize font-bold text-blue-900">{r.category}</td>
                        <td className="py-2 px-2.5 whitespace-nowrap">{r.posyandu}</td>
                        <td className="py-2 px-2.5 font-mono whitespace-nowrap">{r.birthDate || '-'}</td>
                        <td className="py-2 px-2.5 whitespace-nowrap">
                          {r.isValid ? (
                            <span className="text-emerald-700 font-bold flex items-center gap-1">
                              <Check className="w-3.5 h-3.5" /> Valid
                            </span>
                          ) : (
                            <span className="text-rose-600 font-bold bg-rose-100 px-2 py-0.5 rounded text-[10px]">
                              {r.validationError}
                            </span>
                          )}
                        </td>
                        <td className="py-2 px-2.5 text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => setEditingRow(r)}
                              className="px-2 py-1 rounded-lg text-[10px] font-bold bg-slate-100 text-blue-700 hover:bg-blue-50"
                            >
                              <Edit3 className="w-3 h-3 inline mr-0.5" />
                              <span>Edit</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteRow(r.index)}
                              className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-xl transition"
          >
            Tutup
          </button>

          <button
            type="button"
            disabled={validCount === 0 || importing}
            onClick={handleProcessImport}
            className="px-4 py-2 text-xs font-bold text-white rounded-xl shadow-md transition flex items-center gap-1.5 disabled:opacity-50 hover:brightness-105"
            style={{ backgroundColor: settings.primaryColor || '#1D4ED8' }}
          >
            {importing ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Menyimpan ke Database...</span>
              </>
            ) : (
              <span>Simpan {validCount} Data Valid ke Database</span>
            )}
          </button>
        </div>
      </div>

      {/* MODAL EDIT BARIS DATA */}
      {editingRow && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-md p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-sm text-slate-900">
                Perbaiki Data Baris #{editingRow.index}
              </h3>
              <button
                type="button"
                onClick={() => setEditingRow(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveRowEdit} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">NIK</label>
                <input
                  type="text"
                  value={editingRow.nik}
                  onChange={(e) => setEditingRow({ ...editingRow, nik: e.target.value.replace(/\D/g, '') })}
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-300 font-mono font-bold text-slate-900 text-xs"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Nama Lengkap</label>
                <input
                  type="text"
                  value={editingRow.name}
                  onChange={(e) => setEditingRow({ ...editingRow, name: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-300 font-bold text-slate-900 text-xs"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Kategori</label>
                  <select
                    value={editingRow.category}
                    onChange={(e) => {
                      const newCat = e.target.value;
                      setEditingRow({
                        ...editingRow,
                        category: newCat,
                        gender: (newCat === 'bumil' || newCat === 'busui') ? 'P' : editingRow.gender,
                      });
                    }}
                    className="w-full px-2.5 py-1.5 rounded-xl border border-slate-300 bg-white font-bold text-xs"
                  >
                    {categories.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.icon} {c.name.split(' ')[0]}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Wilayah Posyandu</label>
                  <select
                    value={editingRow.posyandu}
                    onChange={(e) => setEditingRow({ ...editingRow, posyandu: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded-xl border border-slate-300 bg-white font-bold text-xs"
                  >
                    {posyanduList.map((pos) => (
                      <option key={pos} value={pos}>
                        {pos}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tanggal Lahir</label>
                  <input
                    type="date"
                    value={editingRow.birthDate}
                    onChange={(e) => setEditingRow({ ...editingRow, birthDate: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded-xl border border-slate-300 bg-white font-mono text-xs"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Jenis Kelamin</label>
                  <select
                    value={editingRow.gender}
                    onChange={(e) => setEditingRow({ ...editingRow, gender: e.target.value as Gender })}
                    className="w-full px-2.5 py-1.5 rounded-xl border border-slate-300 bg-white font-bold text-xs"
                  >
                    <option value="L">Laki-laki (L)</option>
                    <option value="P">Perempuan (P)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Alamat Lengkap</label>
                <textarea
                  rows={2}
                  value={editingRow.address}
                  onChange={(e) => setEditingRow({ ...editingRow, address: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-300 text-xs"
                  required
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingRow(null)}
                  className="px-3.5 py-1.5 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl text-white font-bold shadow-md transition flex items-center gap-1 hover:brightness-105"
                  style={{ backgroundColor: settings.primaryColor || '#1D4ED8' }}
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Simpan Perubahan</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
