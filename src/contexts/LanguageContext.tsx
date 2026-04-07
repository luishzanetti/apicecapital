import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { en } from '@/locales/en';
import { pt } from '@/locales/pt';

export type Language = 'en' | 'pt' | 'es';

interface LanguageContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const translations: Record<Language, Record<string, unknown>> = { en, pt, es: en };
const LANGUAGE_STORAGE_KEY = 'app_language';

const getInitialLanguage = (): Language => {
    const saved = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (saved === 'en' || saved === 'pt' || saved === 'es') return saved;
    const browserLang = navigator.language.slice(0, 2);
    if (browserLang === 'pt') return 'pt';
    if (browserLang === 'es') return 'es';
    return 'en';
};

export function LanguageProvider({ children }: { children: ReactNode }) {
    const [language, setLanguageState] = useState<Language>(getInitialLanguage);

    useEffect(() => {
        document.documentElement.lang = language === 'pt' ? 'pt-BR' : language === 'es' ? 'es' : 'en';
    }, [language]);

    const setLanguage = (lang: Language) => {
        setLanguageState(lang);
        localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
    };

    const t = (key: string): string => {
        const keys = key.split('.');
        let value: unknown = translations[language];

        for (const k of keys) {
            if (!value || typeof value !== 'object' || !(k in value)) {
                value = undefined;
                break;
            }

            value = (value as Record<string, unknown>)[k];
        }

        // Return the key itself if translation not found (for debugging)
        return typeof value === 'string' ? value : key;
    };

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
}

export function useLanguage() {
    const context = useContext(LanguageContext);
    if (context === undefined) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
}
