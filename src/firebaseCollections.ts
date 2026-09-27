/**
 * ISOLATED FIRESTORE DATABASE COLLECTIONS
 * Dedicated namespace for the new standalone SPPG application (gorun0957@gmail.com).
 * This completely isolates this application from legacy projects (bababuna190522@gmail.com).
 */
export const DB_COLLECTIONS = {
  BENEFICIARIES: 'sppg_v2_beneficiaries',
  POSYANDU_ACCOUNTS: 'sppg_v2_posyanduAccounts',
  CUSTOM_CATEGORIES: 'sppg_v2_customCategories',
  CUSTOM_FIELDS: 'sppg_v2_customFields',
  SETTINGS: 'sppg_v2_settings',
  ACTIVATION_REQUESTS: 'sppg_v2_activationRequests',
  SPPG_LICENSES: 'sppg_v2_sppgLicenses',
  USERS: 'sppg_v2_users',
  ADMINS: 'sppg_v2_admins',
} as const;
