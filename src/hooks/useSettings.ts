import { useState, useEffect } from 'react';
import { api } from '@/services/api';

interface SiteSettings {
  site_name?: string;
  site_description?: string;
  whatsapp_number?: string;
  contact_email?: string;
  cover_image?: string;
  logo_url?: string;
  hero_title?: string;
  hero_subtitle?: string;
}

// Cache com revalidação (5 minutos)
let cachedSettings: SiteSettings | null = null;
let cacheTimestamp: number = 0;
const CACHE_TTL = 5 * 60 * 1000;

// Cache for bot phone number
let cachedBotPhoneNumber: string | null = null;

export function useSettings() {
  const [settings, setSettings] = useState<SiteSettings>(cachedSettings || {});
  const [loading, setLoading] = useState(!cachedSettings);

  useEffect(() => {
    const isCacheValid = cachedSettings && (Date.now() - cacheTimestamp < CACHE_TTL);
    
    if (isCacheValid) {
      setSettings(cachedSettings!);
      setLoading(false);
      return;
    }

    const fetchSettings = async () => {
      try {
        // Fetch settings from API
        const data = await api.getSettings();
        console.log('📋 Settings carregados:', data);
        
        // If no whatsapp_number in settings, try to get from bot
        if (!data.whatsapp_number) {
          try {
            const botStatus = await api.getWhatsAppBotStatus();
            if (botStatus?.phoneNumber) {
              data.whatsapp_number = botStatus.phoneNumber;
              cachedBotPhoneNumber = botStatus.phoneNumber;
              console.log('📱 Número do bot detectado:', botStatus.phoneNumber);
            }
          } catch (botError) {
            // Bot may not be connected, use cached number if available
            if (cachedBotPhoneNumber) {
              data.whatsapp_number = cachedBotPhoneNumber;
            }
            console.log('Bot não conectado, usando fallback');
          }
        }
        
        cachedSettings = data;
        cacheTimestamp = Date.now();
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

