import React, { createContext, useContext, useEffect, useState } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { DB_COLLECTIONS } from '../firebaseCollections';
import { 
  CustomCategory, 
  CustomField, 
  DEFAULT_CATEGORIES, 
  DEFAULT_CUSTOM_FIELDS 
} from '../types';

interface CustomFieldsContextType {
  categories: CustomCategory[];
  customFields: CustomField[];
  loading: boolean;
  addCategory: (category: Omit<CustomCategory, 'id'>) => Promise<void>;
  updateCategory: (id: string, updates: Partial<CustomCategory>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  addField: (field: Omit<CustomField, 'id'>) => Promise<void>;
  updateField: (id: string, updates: Partial<CustomField>) => Promise<void>;
  deleteField: (id: string) => Promise<void>;
  resetToDefaults: () => Promise<void>;
  getCategoryByCode: (code: string) => CustomCategory | undefined;
}

const LOCAL_STORAGE_FIELDS_KEY = 'sppg_gorun_custom_fields_v2';
const LOCAL_STORAGE_CATS_KEY = 'sppg_gorun_custom_cats_v2';

const CustomFieldsContext = createContext<CustomFieldsContextType>({
  categories: DEFAULT_CATEGORIES,
  customFields: DEFAULT_CUSTOM_FIELDS,
  loading: true,
  addCategory: async () => {},
  updateCategory: async () => {},
  deleteCategory: async () => {},
  addField: async () => {},
  updateField: async () => {},
  deleteField: async () => {},
  resetToDefaults: async () => {},
  getCategoryByCode: () => undefined,
});

export const CustomFieldsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Initialize from LocalStorage for instantaneous rendering
  const [categories, setCategories] = useState<CustomCategory[]>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_CATS_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return DEFAULT_CATEGORIES;
      }
    }
    return DEFAULT_CATEGORIES;
  });

  const [customFields, setCustomFields] = useState<CustomField[]>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_FIELDS_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return DEFAULT_CUSTOM_FIELDS;
      }
    }
    return DEFAULT_CUSTOM_FIELDS;
  });

  const [loading, setLoading] = useState(true);

  // Sync Categories with Firestore Master Document (NEVER REVERTS)
  useEffect(() => {
    const catDocRef = doc(db, DB_COLLECTIONS.SETTINGS, 'custom_categories_config');
    const unsub = onSnapshot(
      catDocRef,
      async (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          if (Array.isArray(data.categories)) {
            setCategories(data.categories);
            localStorage.setItem(LOCAL_STORAGE_CATS_KEY, JSON.stringify(data.categories));
          }
        } else {
          // Initialize once with defaults
          await setDoc(catDocRef, {
            categories: DEFAULT_CATEGORIES,
            initialized: true,
            updatedAt: new Date().toISOString(),
          }).catch((err) => console.warn('Cat init notice:', err.message));
          setCategories(DEFAULT_CATEGORIES);
          localStorage.setItem(LOCAL_STORAGE_CATS_KEY, JSON.stringify(DEFAULT_CATEGORIES));
        }
      },
      (err) => {
        console.warn('Categories config snapshot notice:', err.message);
      }
    );

    return () => unsub();
  }, []);

  // Sync Custom Fields with Firestore Master Document (NEVER REVERTS ON DELETE)
  useEffect(() => {
    const fieldDocRef = doc(db, DB_COLLECTIONS.SETTINGS, 'custom_form_fields');
    const unsub = onSnapshot(
      fieldDocRef,
      async (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          if (Array.isArray(data.fields)) {
            // Even if data.fields is [] (all deleted by user), respect it!
            setCustomFields(data.fields);
            localStorage.setItem(LOCAL_STORAGE_FIELDS_KEY, JSON.stringify(data.fields));
          }
        } else {
          // Initialize once with defaults
          await setDoc(fieldDocRef, {
            fields: DEFAULT_CUSTOM_FIELDS,
            initialized: true,
            updatedAt: new Date().toISOString(),
          }).catch((err) => console.warn('Field init notice:', err.message));
          setCustomFields(DEFAULT_CUSTOM_FIELDS);
          localStorage.setItem(LOCAL_STORAGE_FIELDS_KEY, JSON.stringify(DEFAULT_CUSTOM_FIELDS));
        }
        setLoading(false);
      },
      (err) => {
        console.warn('Fields config snapshot notice:', err.message);
        setLoading(false);
      }
    );

    return () => unsub();
  }, []);

  // Add Category
  const addCategory = async (catData: Omit<CustomCategory, 'id'>) => {
    const sanitizedCode = catData.code.trim().toLowerCase().replace(/[^a-z0-9]/g, '_');
    const id = 'cat_' + sanitizedCode;
    const cleanPayload: CustomCategory = {
      ...catData,
      id,
      code: sanitizedCode,
      name: catData.name.trim(),
      icon: catData.icon || '📋',
      badgeColor: catData.badgeColor || 'blue',
      description: catData.description?.trim() || '',
      createdAt: new Date().toISOString(),
    };

    const nextCats = [...categories.filter((c) => c.id !== id), cleanPayload];
    setCategories(nextCats);
    localStorage.setItem(LOCAL_STORAGE_CATS_KEY, JSON.stringify(nextCats));

    const catDocRef = doc(db, DB_COLLECTIONS.SETTINGS, 'custom_categories_config');
    await setDoc(catDocRef, {
      categories: nextCats,
      initialized: true,
      updatedAt: new Date().toISOString(),
    }, { merge: true });
  };

  // Update Category
  const updateCategory = async (id: string, updates: Partial<CustomCategory>) => {
    const nextCats = categories.map((c) => {
      if (c.id !== id) return c;
      return {
        ...c,
        ...updates,
        name: updates.name !== undefined ? updates.name.trim() : c.name,
        icon: updates.icon !== undefined ? updates.icon : c.icon,
        badgeColor: updates.badgeColor !== undefined ? updates.badgeColor : c.badgeColor,
        description: updates.description !== undefined ? updates.description.trim() : (c.description || ''),
      };
    });

    setCategories(nextCats);
    localStorage.setItem(LOCAL_STORAGE_CATS_KEY, JSON.stringify(nextCats));

    const catDocRef = doc(db, DB_COLLECTIONS.SETTINGS, 'custom_categories_config');
    await setDoc(catDocRef, {
      categories: nextCats,
      initialized: true,
      updatedAt: new Date().toISOString(),
    }, { merge: true });
  };

  // Delete Category
  const deleteCategory = async (id: string) => {
    const nextCats = categories.filter((c) => c.id !== id);
    setCategories(nextCats);
    localStorage.setItem(LOCAL_STORAGE_CATS_KEY, JSON.stringify(nextCats));

    const catDocRef = doc(db, DB_COLLECTIONS.SETTINGS, 'custom_categories_config');
    await setDoc(catDocRef, {
      categories: nextCats,
      initialized: true,
      updatedAt: new Date().toISOString(),
    }, { merge: true });
  };

  // Add Custom Field (NEVER REVERTS)
  const addField = async (fieldData: Omit<CustomField, 'id'>) => {
    const sanitizedKey = fieldData.key.trim().toLowerCase().replace(/[^a-z0-9]/g, '_');
    const id = 'field_' + sanitizedKey;
    const cleanPayload: CustomField = {
      ...fieldData,
      id,
      key: sanitizedKey,
      label: fieldData.label.trim(),
      unit: fieldData.unit?.trim() || '',
      description: fieldData.description?.trim() || '',
      options: Array.isArray(fieldData.options) ? fieldData.options : [],
      required: Boolean(fieldData.required),
      categoryScope: fieldData.categoryScope || 'all',
      order: fieldData.order ?? customFields.length + 1,
    };

    const nextFields = [...customFields.filter((f) => f.id !== id), cleanPayload].sort(
      (a, b) => (a.order || 0) - (b.order || 0)
    );

    setCustomFields(nextFields);
    localStorage.setItem(LOCAL_STORAGE_FIELDS_KEY, JSON.stringify(nextFields));

    const fieldDocRef = doc(db, DB_COLLECTIONS.SETTINGS, 'custom_form_fields');
    await setDoc(fieldDocRef, {
      fields: nextFields,
      initialized: true,
      updatedAt: new Date().toISOString(),
    }, { merge: true });
  };

  // Update Custom Field (NEVER REVERTS)
  const updateField = async (id: string, updates: Partial<CustomField>) => {
    const nextFields = customFields.map((f) => {
      if (f.id !== id) return f;
      return {
        ...f,
        label: updates.label !== undefined ? updates.label.trim() : f.label,
        type: updates.type !== undefined ? updates.type : f.type,
        unit: updates.unit !== undefined ? updates.unit.trim() : f.unit,
        description: updates.description !== undefined ? updates.description.trim() : (f.description || ''),
        options: updates.options !== undefined ? updates.options : f.options,
        categoryScope: updates.categoryScope !== undefined ? updates.categoryScope : f.categoryScope,
        required: updates.required !== undefined ? Boolean(updates.required) : f.required,
        order: updates.order !== undefined ? Number(updates.order) : f.order,
      };
    }).sort((a, b) => (a.order || 0) - (b.order || 0));

    setCustomFields(nextFields);
    localStorage.setItem(LOCAL_STORAGE_FIELDS_KEY, JSON.stringify(nextFields));

    const fieldDocRef = doc(db, DB_COLLECTIONS.SETTINGS, 'custom_form_fields');
    await setDoc(fieldDocRef, {
      fields: nextFields,
      initialized: true,
      updatedAt: new Date().toISOString(),
    }, { merge: true });
  };

  // Delete Custom Field (STAYS DELETED PERMANENTLY, NEVER REVERTS)
  const deleteField = async (id: string) => {
    const nextFields = customFields.filter((f) => f.id !== id);
    setCustomFields(nextFields);
    localStorage.setItem(LOCAL_STORAGE_FIELDS_KEY, JSON.stringify(nextFields));

    const fieldDocRef = doc(db, DB_COLLECTIONS.SETTINGS, 'custom_form_fields');
    await setDoc(fieldDocRef, {
      fields: nextFields,
      initialized: true,
      updatedAt: new Date().toISOString(),
    }, { merge: true });
  };

  // Explicit User Reset to Defaults
  const resetToDefaults = async () => {
    setCategories(DEFAULT_CATEGORIES);
    setCustomFields(DEFAULT_CUSTOM_FIELDS);
    localStorage.setItem(LOCAL_STORAGE_CATS_KEY, JSON.stringify(DEFAULT_CATEGORIES));
    localStorage.setItem(LOCAL_STORAGE_FIELDS_KEY, JSON.stringify(DEFAULT_CUSTOM_FIELDS));

    const catDocRef = doc(db, DB_COLLECTIONS.SETTINGS, 'custom_categories_config');
    const fieldDocRef = doc(db, DB_COLLECTIONS.SETTINGS, 'custom_form_fields');

    await setDoc(catDocRef, {
      categories: DEFAULT_CATEGORIES,
      initialized: true,
      updatedAt: new Date().toISOString(),
    });

    await setDoc(fieldDocRef, {
      fields: DEFAULT_CUSTOM_FIELDS,
      initialized: true,
      updatedAt: new Date().toISOString(),
    });
  };

  const getCategoryByCode = (code: string) => {
    return categories.find((c) => c.code.toLowerCase() === code.toLowerCase());
  };

  return (
    <CustomFieldsContext.Provider
      value={{
        categories,
        customFields,
        loading,
        addCategory,
        updateCategory,
        deleteCategory,
        addField,
        updateField,
        deleteField,
        resetToDefaults,
        getCategoryByCode,
      }}
    >
      {children}
    </CustomFieldsContext.Provider>
  );
};

export const useCustomFields = () => useContext(CustomFieldsContext);
