import React, { useState } from 'react';
import { 
  X, 
  FileDown, 
  FileSpreadsheet, 
  FileText, 
  Building2,
  Sliders
} from 'lucide-react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Beneficiary } from '../types';
import { calculateAge } from '../utils/ageCalculator';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { useCustomFields } from '../context/CustomFieldsContext';

interface ExportReportsModalProps {
  isOpen: boolean;
  onClose: () => void;
  beneficiaries: Beneficiary[];
}

export const ExportReportsModal: React.FC<ExportReportsModalProps> = ({
  isOpen,
  onClose,
  beneficiaries,
}) => {
  const { session, isAdmin, activePosyandu, posyanduList } = useAuth();
  const { settings } = useSettings();
  const { categories, customFields } = useCustomFields();

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedPosyandu, setSelectedPosyandu] = useState<string>(activePosyandu || 'all');
  const [isExporting, setIsExporting] = useState(false);

  if (!isOpen) return null;

  const getFilteredData = () => {
    let list = beneficiaries;
    if (activePosyandu && !isAdmin) {
      list = list.filter((b) => b.posyandu === activePosyandu);
    } else if (selectedPosyandu !== 'all') {
      list = list.filter((b) => b.posyandu === selectedPosyandu);
    }
    if (selectedCategory !== 'all') {
      list = list.filter((b) => b.category === selectedCategory);
    }

    return list.map((b, idx) => {
      const age = calculateAge(b.birthDate);
      const categoryObj = categories.find((c) => c.code.toLowerCase() === b.category.toLowerCase());
      const catLabel = categoryObj ? categoryObj.name : b.category.toUpperCase();

      return {
        no: idx + 1,
        nik: b.nik,
        name: b.name,
        category: catLabel,
        posyandu: b.posyandu,
        gender: b.gender,
        birthDate: b.birthDate,
        age: age.text,
        address: b.address,
        officer: b.createdByName || 'Petugas SPPG',
        customData: b.customData || {},
      };
    });
  };

  // Export to Excel (.xlsx) including dynamic custom fields!
  const handleExportExcel = () => {
    setIsExporting(true);
    try {
      const data = getFilteredData();

      const excelRows = data.map((d) => {
        const baseRow: Record<string, any> = {
          'No': d.no,
          'NIK': d.nik,
          'Nama Lengkap': d.name,
          'Kategori Sasaran': d.category,
          'Wilayah Posyandu': d.posyandu,
          'Jenis Kelamin': d.gender,
          'Tanggal Lahir': d.birthDate,
          'Usia Terhitung': d.age,
          'Alamat Lengkap': d.address,
        };

        // Add dynamic custom fields as columns
        customFields.forEach((cf) => {
          const val = d.customData[cf.key];
          baseRow[`${cf.label} ${cf.unit ? `(${cf.unit})` : ''}`] = val !== undefined && val !== null ? val : '-';
        });

        baseRow['Petugas Penginput'] = d.officer;
        return baseRow;
      });

      const worksheet = XLSX.utils.json_to_sheet(excelRows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Data Sasaran SPPG');

      // Rekapitulasi Sheet
      const summaryData = [
        { 'Parameter': 'Aplikasi & Satuan', 'Nilai': settings.appTitle || 'PM 3B SPPG JAYAMUKTI' },
        { 'Parameter': 'Tanggal Unduh Laporan', 'Nilai': new Date().toLocaleDateString('id-ID') },
        { 'Parameter': 'Filter Wilayah Posyandu', 'Nilai': selectedPosyandu === 'all' ? `Semua (${posyanduList.length} Posyandu)` : selectedPosyandu },
        { 'Parameter': 'Total Sasaran Terdata', 'Nilai': `${data.length} Jiwa` },
      ];

      // Add dynamic category counts in executive summary
      categories.forEach((cat) => {
        const count = data.filter((d) => d.category.toLowerCase().includes(cat.code.toLowerCase()) || d.category.toLowerCase().includes(cat.name.toLowerCase())).length;
        summaryData.push({ 'Parameter': `Jumlah ${cat.name}`, 'Nilai': `${count} Orang` });
      });

      const summarySheet = XLSX.utils.json_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(workbook, summarySheet, 'Ringkasan Eksekutif');

      const fileName = `Laporan_SPPG_${(settings.appTitle || 'PM_3B').replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(workbook, fileName);
    } finally {
      setIsExporting(false);
    }
  };

  // Export to PDF (.pdf)
  const handleExportPDF = () => {
    setIsExporting(true);
    try {
      const data = getFilteredData();
      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
      });

      // Header Banner Ribbon
      doc.setFillColor(29, 78, 216); // Primary Navy Blue
      doc.rect(0, 0, 297, 7, 'F');

      // Header Text Kop Surat Resmi BGN
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.setTextColor(15, 23, 42);
      doc.text('BADAN GIZI NASIONAL (BGN) REPUBLIK INDONESIA', 148.5, 16, { align: 'center' });

      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(29, 78, 216);
      doc.text(settings.appTitle || 'SPPG PM 3B', 148.5, 22, { align: 'center' });

      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 116, 139);
      doc.text(`Wilayah: ${posyanduList.slice(0, 6).join(' • ')}`, 148.5, 27, { align: 'center' });

      doc.setDrawColor(203, 213, 225);
      doc.setLineWidth(0.5);
      doc.line(14, 30, 283, 30);

      // Meta info
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text('LAPORAN RESMI PENDATAAN SASARAN PEMENUHAN GIZI', 14, 36);

      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(71, 85, 105);
      doc.text(`Posyandu: ${selectedPosyandu === 'all' ? 'Semua Posyandu Binaan' : selectedPosyandu} | Total: ${data.length} Sasaran | Tanggal: ${new Date().toLocaleDateString('id-ID')}`, 14, 41);

      const tableHeaders = [
        ['No', 'NIK', 'Nama Lengkap', 'Kategori', 'Posyandu', 'JK', 'Usia', 'Alamat Lengkap', 'Petugas']
      ];

      const tableRows = data.map((d) => [
        d.no,
        d.nik,
        d.name,
        d.category,
        d.posyandu,
        d.gender,
        d.age,
        d.address,
        d.officer,
      ]);

      autoTable(doc, {
        head: tableHeaders,
        body: tableRows,
        startY: 44,
        theme: 'striped',
        styles: {
          fontSize: 7.5,
          cellPadding: 2,
          textColor: [30, 41, 59],
        },
        headStyles: {
          fillColor: [29, 78, 216],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
        },
        columnStyles: {
          0: { cellWidth: 10 },
          1: { cellWidth: 35, fontStyle: 'bold' },
          2: { cellWidth: 42, fontStyle: 'bold' },
          3: { cellWidth: 26 },
          4: { cellWidth: 32 },
          5: { cellWidth: 12 },
          6: { cellWidth: 22 },
          7: { cellWidth: 60 },
          8: { cellWidth: 30 },
        },
      });

      // Signature Block
      const finalY = (doc as any).lastAutoTable?.finalY || 160;
      if (finalY < 170) {
        doc.setFontSize(8.5);
        doc.setTextColor(51, 65, 85);
        
        doc.text('Mengetahui,', 220, finalY + 12);
        doc.text('Koordinator Wilayah SPPG', 220, finalY + 17);
        doc.text('( .................................................. )', 220, finalY + 36);

        doc.text('Petugas Pelaksana,', 40, finalY + 12);
        doc.text('Kader Posyandu SPPG', 40, finalY + 17);
        doc.text(`( ${session?.displayName || 'Petugas'} )`, 40, finalY + 36);
      }

      const fileName = `Laporan_SPPG_${(settings.appTitle || 'PM_3B').replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg flex flex-col my-auto overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header Modal */}
        <div 
          className="px-6 py-4 flex items-center justify-between text-white"
          style={{ backgroundColor: settings.primaryColor || '#1D4ED8' }}
        >
          <div className="flex items-center gap-2.5">
            <FileDown className="w-5 h-5" />
            <div>
              <h2 className="text-base font-bold">Ekspor Laporan Pendataan Sasaran</h2>
              <p className="text-xs text-white/80">Dokumentasi Resmi SPPG • Badan Gizi Nasional</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/20 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4 text-xs text-slate-700">
          {/* Posyandu Filter */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">
              Pilih Wilayah Posyandu
            </label>
            {isAdmin ? (
              <select
                value={selectedPosyandu}
                onChange={(e) => setSelectedPosyandu(e.target.value)}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 font-bold bg-white text-slate-800 focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Semua Posyandu ({posyanduList.length} Posyandu)</option>
                {posyanduList.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            ) : (
              <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-200 font-bold text-blue-900">
                {activePosyandu}
              </div>
            )}
          </div>

          {/* Category Filter */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">
              Filter Kategori Sasaran
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 font-medium bg-white text-slate-800 focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Semua Kategori ({categories.length} Kategori)</option>
              {categories.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.icon} {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-600 text-[11px] space-y-1">
            <div className="flex justify-between font-bold text-slate-800 text-xs">
              <span>Total Data Siap Diekspor:</span>
              <span className="text-blue-700">{getFilteredData().length} Sasaran</span>
            </div>
            <p className="text-slate-500">
              Mencakup semua data kolom standar dan {customFields.length} kolom isian bebas yang telah diatur oleh admin.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              type="button"
              disabled={isExporting}
              onClick={handleExportExcel}
              className="p-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex flex-col items-center justify-center gap-1 shadow-md transition disabled:opacity-50"
            >
              <FileSpreadsheet className="w-5 h-5" />
              <span className="text-xs">Unduh Excel (.xlsx)</span>
              <span className="text-[10px] font-normal text-emerald-100">Lengkap dengan Rekap</span>
            </button>

            <button
              type="button"
              disabled={isExporting}
              onClick={handleExportPDF}
              className="p-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold flex flex-col items-center justify-center gap-1 shadow-md transition disabled:opacity-50"
            >
              <FileText className="w-5 h-5" />
              <span className="text-xs">Unduh PDF (.pdf)</span>
              <span className="text-[10px] font-normal text-blue-100">Kop Resmi & Tanda Tangan</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-xl transition"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
