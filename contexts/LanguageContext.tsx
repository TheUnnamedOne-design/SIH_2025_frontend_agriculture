import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Localization from 'expo-localization';

interface Translations {
  [key: string]: {
    [key: string]: string;
  };
}

interface LanguageContextType {
  currentLanguage: string;
  translations: { [key: string]: string };
  changeLanguage: (language: string) => void;
  t: (key: string) => string;
  availableLanguages: { code: string; name: string; flag: string }[];
}

const translations: Translations = {
  en: {
    // Common UI Elements
    login: 'Login',
    profile: 'Profile',
    home: 'Home',
    chat: 'Chat',
    call: 'Call',
    faq: 'FAQ',
    farmerHelpline: 'Farmer Helpline',
    agriculturalAssistance: 'Your agricultural assistance platform',
    welcomeFarmer: 'Welcome, Farmer!',
    continue: 'Continue',
    close: 'Close',
    selectLanguage: 'Select Language',
    
    // Login Screen
    enterPhoneNumber: 'Enter your phone number to continue',
    phoneNumberLogin: 'Phone Number Login',
    enterYourPhoneNumber: 'Enter your phone number',
    invalidPhoneNumber: 'Invalid Phone Number',
    pleaseEnterValidPhone: 'Please enter a valid 10-digit phone number',
    loginSuccessful: 'Login Successful',
    welcomeToFarmerHelpline: 'Welcome to Farmer Helpline!',
    
    // Profile Screen
    accountAndSchemes: 'Your account and government schemes',
    farmerName: 'Farmer Name',
    farmSize: 'Farm Size',
    governmentSchemes: 'Government Schemes',
    eligible: 'Eligible',
    applied: 'Applied',
    approved: 'Approved',
    eligibility: 'Eligibility',
  },
  
  hi: {
    // Common UI Elements
    login: '[translate:लॉगिन]',
    profile: '[translate:प्रोफ़ाइल]',
    home: '[translate:होम]',
    chat: '[translate:चैट]',
    call: '[translate:कॉल]',
    faq: '[translate:सामान्य प्रश्न]',
    farmerHelpline: '[translate:किसान हेल्पलाइन]',
    agriculturalAssistance: '[translate:आपका कृषि सहायता प्लेटफॉर्म]',
    welcomeFarmer: '[translate:स्वागत है, किसान!]',
    continue: '[translate:जारी रखें]',
    close: '[translate:बंद करें]',
    selectLanguage: '[translate:भाषा चुनें]',
    
    // Login Screen
    enterPhoneNumber: '[translate:जारी रखने के लिए अपना फोन नंबर दर्ज करें]',
    phoneNumberLogin: '[translate:फोन नंबर लॉगिन]',
    enterYourPhoneNumber: '[translate:अपना फोन नंबर दर्ज करें]',
    invalidPhoneNumber: '[translate:अमान्य फोन नंबर]',
    pleaseEnterValidPhone: '[translate:कृपया एक मान्य 10-अंकीय फोन नंबर दर्ज करें]',
    loginSuccessful: '[translate:लॉगिन सफल]',
    welcomeToFarmerHelpline: '[translate:किसान हेल्पलाइन में आपका स्वागत है!]',
    
    // Profile Screen
    accountAndSchemes: '[translate:आपका खाता और सरकारी योजनाएं]',
    farmerName: '[translate:किसान का नाम]',
    farmSize: '[translate:खेत का आकार]',
    governmentSchemes: '[translate:सरकारी योजनाएं]',
    eligible: '[translate:योग्य]',
    applied: '[translate:आवेदन किया गया]',
    approved: '[translate:स्वीकृत]',
    eligibility: '[translate:योग्यता]',
  },
  
  te: {
    // Common UI Elements
    login: '[translate:లాగిన్]',
    profile: '[translate:ప్రొఫైల్]',
    home: '[translate:హోమ్]',
    chat: '[translate:చాట్]',
    call: '[translate:కాల్]',
    faq: '[translate:సాధారణ ప్రశ్నలు]',
    farmerHelpline: '[translate:రైతు హెల్ప్‌లైన్]',
    agriculturalAssistance: '[translate:మీ వ్యవసాయ సహాయ వేదిక]',
    welcomeFarmer: '[translate:స్వాగతం, రైతు!]',
    continue: '[translate:కొనసాగించు]',
    close: '[translate:మూసివేయి]',
    selectLanguage: '[translate:భాషను ఎంచుకోండి]',
    
    // Login Screen
    enterPhoneNumber: '[translate:కొనసాగించడానికి మీ ఫోన్ నంబర్ని నమోదు చేయండి]',
    phoneNumberLogin: '[translate:ఫోన్ నంబర్ లాగిన్]',
    enterYourPhoneNumber: '[translate:మీ ఫోన్ నంబర్ని నమోదు చేయండి]',
    invalidPhoneNumber: '[translate:చెల్లని ఫోన్ నంబర్]',
    pleaseEnterValidPhone: '[translate:దయచేసి చెల్లుబాటు అయ్యే 10-అంకెల ఫోన్ నంబర్ని నమోదు చేయండి]',
    loginSuccessful: '[translate:లాగిన్ విజయవంతం]',
    welcomeToFarmerHelpline: '[translate:రైతు హెల్ప్‌లైన్‌కు స్వాగతం!]',
    
    // Profile Screen
    accountAndSchemes: '[translate:మీ ఖాతా మరియు ప్రభుత్వ పథకాలు]',
    farmerName: '[translate:రైతు పేరు]',
    farmSize: '[translate:పొలం పరిమాణం]',
    governmentSchemes: '[translate:ప్రభుత్వ పథకాలు]',
    eligible: '[translate:అర్హత]',
    applied: '[translate:దరఖాస్తు చేసింది]',
    approved: '[translate:ఆమోదించబడింది]',
    eligibility: '[translate:అర్హత]',
  },
  
  ta: {
    // Common UI Elements
    login: '[translate:உள்நுழைவு]',
    profile: '[translate:சுயவிவரம்]',
    home: '[translate:முகப்பு]',
    chat: '[translate:அரட்டை]',
    call: '[translate:அழைப்பு]',
    faq: '[translate:அடிக்கடி கேட்கப்படும் கேள்விகள்]',
    farmerHelpline: '[translate:விவசாயி உதவி எண்]',
    agriculturalAssistance: '[translate:உங்கள் விவசாய உதவி தளம்]',
    welcomeFarmer: '[translate:வரவேற்கிறோம், விவசாயி!]',
    continue: '[translate:தொடரவும்]',
    close: '[translate:மூடு]',
    selectLanguage: '[translate:மொழியைத் தேர்ந்தெடுக்கவும்]',
    
    // Login Screen
    enterPhoneNumber: '[translate:தொடர உங்கள் தொலைபேசி எண்ணை உள்ளிடவும்]',
    phoneNumberLogin: '[translate:தொலைபேசி எண் உள்நுழைவு]',
    enterYourPhoneNumber: '[translate:உங்கள் தொலைபேசி எண்ணை உள்ளிடவும்]',
    invalidPhoneNumber: '[translate:தவறான தொலைபேசி எண்]',
    pleaseEnterValidPhone: '[translate:தயவுசெய்து சரியான 10-இலக்க தொலைபேசி எண்ணை உள்ளிடவும்]',
    loginSuccessful: '[translate:உள்நுழைவு வெற்றிகரமாக]',
    welcomeToFarmerHelpline: '[translate:விவசாயி உதவி எண்ணுக்கு வரவேற்கிறோம்!]',
    
    // Profile Screen
    accountAndSchemes: '[translate:உங்கள் கணக்கு மற்றும் அரசு திட்டங்கள்]',
    farmerName: '[translate:விவசாயியின் பெயர்]',
    farmSize: '[translate:பண்ணையின் அளவு]',
    governmentSchemes: '[translate:அரசு திட்டங்கள்]',
    eligible: '[translate:தகுதியானது]',
    applied: '[translate:விண்ணப்பித்தது]',
    approved: '[translate:அங்கீகரிக்கப்பட்டது]',
    eligibility: '[translate:தகுதி]',
  },
  
  ml: {
    // Common UI Elements
    login: '[translate:ലോഗിൻ]',
    profile: '[translate:പ്രൊഫൈൽ]',
    home: '[translate:ഹോം]',
    chat: '[translate:ചാറ്റ്]',
    call: '[translate:കോൾ]',
    faq: '[translate:പതിവ് ചോദ്യങ്ങൾ]',
    farmerHelpline: '[translate:കർഷക സഹായ ഹോട്ട്‌ലൈൻ]',
    agriculturalAssistance: '[translate:നിങ്ങളുടെ കാർഷിക സഹായ പ്ലാറ്റ്‌ഫോം]',
    welcomeFarmer: '[translate:സ്വാഗതം, കർഷകാ!]',
    continue: '[translate:തുടരുക]',
    close: '[translate:അടയ്ക്കുക]',
    selectLanguage: '[translate:ഭാഷ തിരഞ്ഞെടുക്കുക]',
    
    // Login Screen
    enterPhoneNumber: '[translate:തുടരാൻ നിങ്ങളുടെ ഫോൺ നമ്പർ നൽകുക]',
    phoneNumberLogin: '[translate:ഫോൺ നമ്പർ ലോഗിൻ]',
    enterYourPhoneNumber: '[translate:നിങ്ങളുടെ ഫോൺ നമ്പർ നൽകുക]',
    invalidPhoneNumber: '[translate:അസാധുവായ ഫോൺ നമ്പർ]',
    pleaseEnterValidPhone: '[translate:ദയവായി സാധുവായ 10-അക്ക ഫോൺ നമ്പർ നൽകുക]',
    loginSuccessful: '[translate:ലോഗിൻ വിജയകരം]',
    welcomeToFarmerHelpline: '[translate:കർഷക സഹായ ഹോട്ട്‌ലൈനിലേക്ക് സ്വാഗതം!]',
    
    // Profile Screen
    accountAndSchemes: '[translate:നിങ്ങളുടെ അക്കൗണ്ടും സർക്കാർ പദ്ധതികളും]',
    farmerName: '[translate:കർഷകന്റെ പേര്]',
    farmSize: '[translate:ഫാമിന്റെ വലുപ്പം]',
    governmentSchemes: '[translate:സർക്കാർ പദ്ധതികൾ]',
    eligible: '[translate:യോഗ്യത]',
    applied: '[translate:അപേക്ഷിച്ചു]',
    approved: '[translate:അനുമതി കിട്ടി]',
    eligibility: '[translate:യോഗ്യത]',
  },
  
  kn: {
    // Common UI Elements
    login: '[translate:ಲಾಗಿನ್]',
    profile: '[translate:ಪ್ರೊಫೈಲ್]',
    home: '[translate:ಮುಖ್ಯ]',
    chat: '[translate:ಚಾಟ್]',
    call: '[translate:ಕರೆ]',
    faq: '[translate:ಆಗಾಗ್ಗೆ ಕೇಳುವ ಪ್ರಶ್ನೆಗಳು]',
    farmerHelpline: '[translate:ರೈತ ಸಹಾಯವಾಣಿ]',
    agriculturalAssistance: '[translate:ನಿಮ್ಮ ಕೃಷಿ ಸಹಾಯ ವೇದಿಕೆ]',
    welcomeFarmer: '[translate:ಸ್ವಾಗತ, ರೈತ!]',
    continue: '[translate:ಮುಂದುವರಿಸು]',
    close: '[translate:ಮುಚ್ಚು]',
    selectLanguage: '[translate:ಭಾಷೆಯನ್ನು ಆಯ್ಕೆಮಾಡಿ]',
    
    // Login Screen
    enterPhoneNumber: '[translate:ಮುಂದುವರಿಸಲು ನಿಮ್ಮ ಫೋನ್ ಸಂಖ್ಯೆಯನ್ನು ನಮೂದಿಸಿ]',
    phoneNumberLogin: '[translate:ಫೋನ್ ಸಂಖ್ಯೆ ಲಾಗಿನ್]',
    enterYourPhoneNumber: '[translate:ನಿಮ್ಮ ಫೋನ್ ಸಂಖ್ಯೆಯನ್ನು ನಮೂದಿಸಿ]',
    invalidPhoneNumber: '[translate:ಅಮಾನ್ಯವಾದ ಫೋನ್ ಸಂಖ್ಯೆ]',
    pleaseEnterValidPhone: '[translate:ದಯವಿಟ್ಟು ಮಾನ್ಯವಾದ 10-ಅಂಕಿಯ ಫೋನ್ ಸಂಖ್ಯೆಯನ್ನು ನಮೂದಿಸಿ]',
    loginSuccessful: '[translate:ಲಾಗಿನ್ ಯಶಸ್ವಿ]',
    welcomeToFarmerHelpline: '[translate:ರೈತ ಸಹಾಯವಾಣಿಗೆ ಸ್ವಾಗತ!]',
    
    // Profile Screen
    accountAndSchemes: '[translate:ನಿಮ್ಮ ಖಾತೆ ಮತ್ತು ಸರ್ಕಾರಿ ಯೋಜನೆಗಳು]',
    farmerName: '[translate:ರೈತನ ಹೆಸರು]',
    farmSize: '[translate:ಫಾರ್ಮ್ ಗಾತ್ರ]',
    governmentSchemes: '[translate:ಸರ್ಕಾರಿ ಯೋಜನೆಗಳು]',
    eligible: '[translate:ಅರ್ಹ]',
    applied: '[translate:ಅರ್ಜಿ ಸಲ್ಲಿಸಲಾಗಿದೆ]',
    approved: '[translate:ಅನುಮೋದಿಸಲಾಗಿದೆ]',
    eligibility: '[translate:ಅರ್ಹತೆ]',
  },
  
  bn: {
    // Common UI Elements
    login: '[translate:লগইন]',
    profile: '[translate:প্রোফাইল]',
    home: '[translate:হোম]',
    chat: '[translate:চ্যাট]',
    call: '[translate:কল]',
    faq: '[translate:প্রায়শই জিজ্ঞাসিত প্রশ্নাবলী]',
    farmerHelpline: '[translate:কৃষক সহায়তা হটলাইন]',
    agriculturalAssistance: '[translate:আপনার কৃষি সহায়তা প্ল্যাটফর্ম]',
    welcomeFarmer: '[translate:স্বাগতম, কৃষক!]',
    continue: '[translate:চালিয়ে যান]',
    close: '[translate:বন্ধ]',
    selectLanguage: '[translate:ভাষা নির্বাচন করুন]',
    
    // Login Screen
    enterPhoneNumber: '[translate:এগিয়ে যেতে আপনার ফোন নম্বর লিখুন]',
    phoneNumberLogin: '[translate:ফোন নম্বর লগইন]',
    enterYourPhoneNumber: '[translate:আপনার ফোন নম্বর লিখুন]',
    invalidPhoneNumber: '[translate:অবৈধ ফোন নম্বর]',
    pleaseEnterValidPhone: '[translate:অনুগ্রহ করে একটি বৈধ ১০-সংখ্যার ফোন নম্বর লিখুন]',
    loginSuccessful: '[translate:লগইন সফল]',
    welcomeToFarmerHelpline: '[translate:কৃষক সহায়তা হটলাইনে স্বাগতম!]',
    
    // Profile Screen
    accountAndSchemes: '[translate:আপনার অ্যাকাউন্ট এবং সরকারি প্রকল্প]',
    farmerName: '[translate:কৃষকের নাম]',
    farmSize: '[translate:খামারের আকার]',
    governmentSchemes: '[translate:সরকারি প্রকল্প]',
    eligible: '[translate:যোগ্য]',
    applied: '[translate:আবেদন করেছেন]',
    approved: '[translate:অনুমোদিত]',
    eligibility: '[translate:যোগ্যতা]',
  },
  
  pa: {
    // Common UI Elements
    login: '[translate:ਲਾਗਇਨ]',
    profile: '[translate:ਪ੍ਰੋਫਾਈਲ]',
    home: '[translate:ਹੋਮ]',
    chat: '[translate:ਚੈਟ]',
    call: '[translate:ਕਾਲ]',
    faq: '[translate:ਅਕਸਰ ਪੁੱਛੇ ਜਾਣ ਵਾਲੇ ਸਵਾਲ]',
    farmerHelpline: '[translate:ਕਿਸਾਨ ਹੈਲਪਲਾਈਨ]',
    agriculturalAssistance: '[translate:ਤੁਹਾਡਾ ਖੇਤੀਬਾੜੀ ਸਹਾਇਤਾ ਪਲੇਟਫਾਰਮ]',
    welcomeFarmer: '[translate:ਜੀ ਆਇਆਂ ਨੂੰ, ਕਿਸਾਨ!]',
    continue: '[translate:ਜਾਰੀ ਰੱਖੋ]',
    close: '[translate:ਬੰਦ ਕਰੋ]',
    selectLanguage: '[translate:ਭਾਸ਼ਾ ਚੁਣੋ]',
    
    // Login Screen
    enterPhoneNumber: '[translate:ਜਾਰੀ ਰੱਖਣ ਲਈ ਆਪਣਾ ਫੋਨ ਨੰਬਰ ਦਾਖਲ ਕਰੋ]',
    phoneNumberLogin: '[translate:ਫੋਨ ਨੰਬਰ ਲਾਗਇਨ]',
    enterYourPhoneNumber: '[translate:ਆਪਣਾ ਫੋਨ ਨੰਬਰ ਦਾਖਲ ਕਰੋ]',
    invalidPhoneNumber: '[translate:ਗਲਤ ਫੋਨ ਨੰਬਰ]',
    pleaseEnterValidPhone: '[translate:ਕਿਰਪਾ ਕਰਕੇ ਇੱਕ ਵੈਧ 10-ਅੰਕੀ ਫੋਨ ਨੰਬਰ ਦਾਖਲ ਕਰੋ]',
    loginSuccessful: '[translate:ਲਾਗਇਨ ਸਫਲ]',
    welcomeToFarmerHelpline: '[translate:ਕਿਸਾਨ ਹੈਲਪਲਾਈਨ ਵਿੱਚ ਜੀ ਆਇਆਂ ਨੂੰ!]',
    
    // Profile Screen
    accountAndSchemes: '[translate:ਤੁਹਾਡਾ ਖਾਤਾ ਅਤੇ ਸਰਕਾਰੀ ਸਕੀਮਾਂ]',
    farmerName: '[translate:ਕਿਸਾਨ ਦਾ ਨਾਮ]',
    farmSize: '[translate:ਫਾਰਮ ਦਾ ਆਕਾਰ]',
    governmentSchemes: '[translate:ਸਰਕਾਰੀ ਸਕੀਮਾਂ]',
    eligible: '[translate:ਯੋਗ]',
    applied: '[translate:ਅਰਜ਼ੀ ਦਿੱਤੀ]',
    approved: '[translate:ਮਨਜ਼ੂਰ]',
    eligibility: '[translate:ਯੋਗਤਾ]',
  },
};

const availableLanguages = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'hi', name: '[translate:हिंदी]', flag: '🇮🇳' },
  { code: 'te', name: '[translate:తెలుగు]', flag: '🇮🇳' },
  { code: 'ta', name: '[translate:தமிழ்]', flag: '🇮🇳' },
  { code: 'ml', name: '[translate:മലയാളം]', flag: '🇮🇳' },
  { code: 'kn', name: '[translate:ಕನ್ನಡ]', flag: '🇮🇳' },
  { code: 'bn', name: '[translate:বাংলা]', flag: '🇧🇩' },
  { code: 'pa', name: '[translate:ਪੰਜਾਬੀ]', flag: '🇮🇳' },
];

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [currentLanguage, setCurrentLanguage] = useState('en');

  useEffect(() => {
    loadSavedLanguage();
  }, []);

  const loadSavedLanguage = async () => {
    try {
      const savedLanguage = await AsyncStorage.getItem('app_language');
      if (savedLanguage) {
        setCurrentLanguage(savedLanguage);
      } else {
        // Use device language as fallback
        const deviceLocale = Localization.getLocales()[0]?.languageCode || 'en';
        const supportedLanguage = availableLanguages.find(lang => lang.code === deviceLocale)?.code || 'en';
        setCurrentLanguage(supportedLanguage);
      }
    } catch (error) {
      console.log('Error loading saved language:', error);
    }
  };

  const changeLanguage = async (language: string) => {
    try {
      await AsyncStorage.setItem('app_language', language);
      setCurrentLanguage(language);
    } catch (error) {
      console.log('Error saving language:', error);
    }
  };

  const t = (key: string): string => {
    return translations[currentLanguage]?.[key] || translations['en'][key] || key;
  };

  const value: LanguageContextType = {
    currentLanguage,
    translations: translations[currentLanguage] || translations['en'],
    changeLanguage,
    t,
    availableLanguages,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}