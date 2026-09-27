export type Gender = 'L' | 'P';

export const ADMIN_PRIMARY_EMAIL = 'gorun0957@gmail.com';
export const ADMIN_ALLOWED_EMAILS = ['gorun0957@gmail.com', 'pustakaassanad@gmail.com'];

export interface CustomCategory {
  id: string;
  code: string;
  name: string;
  icon: string;
  badgeColor: 'blue' | 'pink' | 'purple' | 'emerald' | 'amber' | 'indigo' | 'rose' | 'teal';
  description?: string;
  isDefault?: boolean;
  createdAt?: string;
}

export const DEFAULT_CATEGORIES: CustomCategory[] = [
  {
    id: 'cat_balita',
    code: 'balita',
    name: 'Balita (Bawah Lima Tahun)',
    icon: '👶',
    badgeColor: 'blue',
    description: 'Sasaran balita 0-59 bulan untuk pemantauan tumbuh kembang dan stunting',
    isDefault: true,
  },
  {
    id: 'cat_bumil',
    code: 'bumil',
    name: 'Ibu Hamil (Bumil)',
    icon: '🤰',
    badgeColor: 'pink',
    description: 'Sasaran ibu hamil untuk pencegahan KEK dan anemia',
    isDefault: true,
  },
  {
    id: 'cat_busui',
    code: 'busui',
    name: 'Ibu Menyusui (Busui)',
    icon: '🤱',
    badgeColor: 'purple',
    description: 'Sasaran ibu menyusui 0-6 bulan (ASI Eksklusif) hingga 24 bulan',
    isDefault: true,
  },
  {
    id: 'cat_kader',
    code: 'kader',
    name: 'Kader Posyandu',
    icon: '🧕',
    badgeColor: 'emerald',
    description: 'Tenaga kader posyandu pelaksana pendataan dan pelayanan di lapangan',
    isDefault: true,
  },
];

export type CustomFieldType = 'text' | 'number' | 'select' | 'date' | 'boolean';

export interface CustomField {
  id: string;
  key: string;
  label: string;
  type: CustomFieldType;
  options?: string[]; // Pilihan untuk tipe select
  unit?: string; // e.g. kg, cm, mmHg, dsb
  categoryScope: string; // 'all' atau kode kategori tertentu
  required: boolean;
  order: number;
  description?: string;
}

export const DEFAULT_CUSTOM_FIELDS: CustomField[] = [
  {
    id: 'field_bb',
    key: 'berat_badan',
    label: 'Berat Badan',
    type: 'number',
    unit: 'kg',
    categoryScope: 'all',
    required: false,
    order: 1,
    description: 'Berat badan pengukuran terkini dalam kilogram',
  },
  {
    id: 'field_tb',
    key: 'tinggi_badan',
    label: 'Tinggi / Panjang Badan',
    type: 'number',
    unit: 'cm',
    categoryScope: 'all',
    required: false,
    order: 2,
    description: 'Tinggi atau panjang badan dalam centimeter',
  },
  {
    id: 'field_lila',
    key: 'lingkar_lila',
    label: 'Lingkar Lengan Atas (LiLA)',
    type: 'number',
    unit: 'cm',
    categoryScope: 'all',
    required: false,
    order: 3,
    description: 'Pengukuran LiLA untuk deteksi dini risiko KEK/Gizi Kurang',
  },
  {
    id: 'field_status_gizi',
    key: 'status_gizi',
    label: 'Status Gizi / Intervensi',
    type: 'select',
    options: ['Gizi Baik (Normal)', 'Beresiko Stunting', 'Stunting', 'Gizi Kurang', 'Gizi Lebih', 'Perlu PMT Tambahan'],
    categoryScope: 'all',
    required: false,
    order: 4,
    description: 'Klasifikasi gizi hasil pemeriksaan',
  },
  {
    id: 'field_no_hp',
    key: 'no_telepon_wa',
    label: 'No. WhatsApp / HP',
    type: 'text',
    categoryScope: 'all',
    required: false,
    order: 5,
    description: 'Nomor kontak aktif untuk koordinasi pemenuhan gizi SPPG',
  },
];

export const INITIAL_POSYANDU_NAMES = [
  'Posyandu Paseh',
  'Posyandu Lewihalang',
  'Posyandu Tonjong',
  'Posyandu Cipancur',
  'Posyandu Sindangjaya',
  'Posyandu Cibengang',
] as const;

export interface PosyanduAccount {
  id: string; // e.g. posyandu_paseh
  posyanduName: string;
  username: string;
  password: string;
  kaderName?: string;
  wilayah?: string;
  phone?: string;
  targetCount?: number;
  updatedAt?: string;
  updatedBy?: string;
}

export interface Beneficiary {
  id?: string;
  nik: string;
  name: string;
  category: string; // Dynamic category code (balita, bumil, busui, kader, or custom)
  birthDate: string; // YYYY-MM-DD
  gender: Gender;
  posyandu: string; // Dynamic Posyandu Name
  address: string;
  hamlet?: string;
  parentName?: string;
  phone?: string;
  notes?: string;
  latitude?: number;
  longitude?: number;
  customData?: Record<string, any>; // Bebas diisi oleh admin/kader sesuai definisi custom fields
  createdBy: string;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
}

export interface AppSettings {
  appTitle: string;
  appSubtitle: string;
  sppgName?: string;
  regionName?: string;
  logoDataUrl?: string;
  bgnLogoDataUrl?: string;
  primaryColor: string;
  ownerEmail?: string;
  updatedAt?: string;
  updatedBy?: string;
}

export interface UserSession {
  role: 'admin' | 'kader';
  posyanduName?: string;
  displayName: string;
  username?: string;
  email?: string;
  uid: string;
}

export interface ActivationRequest {
  id: string;
  sppgName: string;
  region: string;
  picName: string;
  picPhone: string;
  picEmail: string;
  plan: string;
  status: 'pending' | 'approved' | 'rejected';
  targetOwnerEmail: string; // pustakaassanad@gmail.com
  requestedAt: string;
  generatedLicenseKey?: string;
  approvedAt?: string;
  notes?: string;
}

export interface SppgLicense {
  id: string;
  licenseKey: string;
  sppgName: string;
  region: string;
  buyerEmail?: string;
  buyerPhone?: string;
  ownerEmail: string; // pustakaassanad@gmail.com
  issuedAt: string;
  expiresAt: string; // ISO date or 'lifetime'
  maxPosyandu: number;
  status: 'active' | 'suspended' | 'expired';
  features: string[];
}

export interface AppLicenseState {
  isActivated: boolean;
  activeLicenseKey: string;
  sppgName: string;
  region: string;
  expiresAt: string;
  plan: string;
  isDemo: boolean;
  activatedAt?: string;
}
