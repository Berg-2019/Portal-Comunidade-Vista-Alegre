import { useState, useEffect } from 'react';
import { api } from '@/services/api';

interface SiteSettings {
  site_name?: string;
  site_description?: string;
  whatsapp_number?: string;
  contact_email?: string;
  cover_image?: string;
}

let cachedSettings: SiteSettings | null = null;

export function useSettings() {
  const [settings, setSettings] = useState<SiteSettings>(cachedSettings || {});
  const [loading, setLoading] = useState(!cachedSettings);

  useEffect(() => {
    if (cachedSettings) {
      setSettings(cachedSettings);
      setLoading(false);
      return;
    }

    const fetchSettings = async () => {
      try {
        const data = await api.getSettings();
        cachedSettings = data;
        setSettings(data);
      } catch (error) {
        console.error('Erro ao carregar configurações:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const getWhatsAppLink = (message?: string): string | undefined => {
    const number = settings.whatsapp_number || '';
    if (!number) return undefined;
    const cleanNumber = number.replace(/\D/g, '');
    if (!cleanNumber) return undefined;
    if (message) {
      return `https://wa.me/${cleanNumber}?text=${encodeURIComponent(message)}`;
    }
    return `https://wa.me/${cleanNumber}`;
  };

  return { settings, loading, getWhatsAppLink };
}
