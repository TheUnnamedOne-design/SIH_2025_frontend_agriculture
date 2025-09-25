import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import all translation files
import en from '../locales/en.json';
import hi from '../locales/hi.json';
import te from '../locales/te.json';
import ta from '../locales/ta.json';
import ml from '../locales/ml.json';
import kn from '../locales/kn.json';
import bn from '../locales/bn.json';
import pa from '../locales/pa.json';


const STORAGE_KEY = 'user-language';

// Custom language detector
const languageDetector = {
  type: 'languageDetector' as const,
  async: true,
  detect: async (callback: (lang: string) => void) => {
    try {
      // First priority: Saved user preference
      const savedLanguage = await AsyncStorage.getItem(STORAGE_KEY);
      if (savedLanguage) {
        callback(savedLanguage);
        return;
      }
      
      // Second priority: Device language
      const deviceLanguage = Localization.getLocales()[0]?.languageCode || 'en';
      const supportedLanguages = ['en', 'hi', 'te', 'ta', 'ml', 'kn', 'bn', 'pa'];
      const languageToUse = supportedLanguages.includes(deviceLanguage) ? deviceLanguage : 'en';
      
      callback(languageToUse);
    } catch (error) {
      console.log('Language detection error:', error);
      callback('en'); // Fallback to English
    }
  },
  init: () => {},
  cacheUserLanguage: async (language: string) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, language);
    } catch (error) {
      console.log('Error saving language:', error);
    }
  },
};

// Initialize i18n
i18n
  .use(languageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      hi: { translation: hi },
      te: { translation: te },
      ta: { translation: ta },
      ml: { translation: ml },
      kn: { translation: kn },
      bn: { translation: bn },
      pa: { translation: pa },

    },
    fallbackLng: 'en',
    debug: __DEV__,
    interpolation: {
      escapeValue: false, // React already escapes values
    },
    react: {
      useSuspense: false, // Important for React Native
    },
  });

export default i18n;
