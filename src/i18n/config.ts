import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

// Dynamically import all JSON translation files
const modules = import.meta.glob('./locales/*/*.json', { eager: true });

const resources: any = {};

for (const path in modules) {
  // path is like './locales/en/common.json'
  const matched = path.match(/\.\/locales\/(.*)\/(.*)\.json$/);
  if (matched) {
    const lang = matched[1];
    const ns = matched[2];
    if (!resources[lang]) resources[lang] = {};
    resources[lang][ns] = (modules[path] as any).default;
  }
}

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: "en",
    defaultNS: "common",
    // Adding standard namespaces to avoid warnings
    ns: ["common", "auth", "loan", "interview", "ocr", "dashboard"],
    interpolation: {
      escapeValue: false, // react already protects from xss
    },
    detection: {
      // Use the existing localStorage key 'lang' to match the old implementation
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'lang',
    }
  });

export default i18n;
