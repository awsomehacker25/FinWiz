import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';

const resources = {
  en: {
    translation: {
      welcome: "Welcome",
      login: "Login",
      signup: "Sign Up"
    }
  },
  es: {
    translation: {
      welcome: "Bienvenido",
      login: "Iniciar sesión",
      signup: "Regístrate"
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: (Localization.locale || 'en').split('-')[0],
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n; 