import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import * as SecureStore from 'expo-secure-store';

const resources = {
  en: {
    translation: {
      welcome_back: "Welcome back,",
      user: "User",
      profile_settings: "Profile Settings",
      account_security: "Account Security",
      help_support: "Help & Support",
      about: "About",
      logout: "Logout",
      logout_confirm: "Are you sure you want to logout?",
      cancel: "Cancel",

      financial_overview: "Financial Overview",
      total_income: "Total Income",
      this_month: "This month",
      total_spending: "Total Spending",
      savings_goals: "Savings Goals",
      overall_progress: "Overall progress",
      financial_literacy: "Financial Literacy",
      lessons_completed: "Lessons completed",
      community: "Community",
      active_discussions: "Active discussions",

      quick_actions: "Quick Actions",
      track_new_income: "Track New Income",
      record_latest_earnings: "Record your latest earnings",
      add_new_expense: "Add New Expense",
      record_your_spending: "Record your spending",
      set_new_savings_goal: "Set New Savings Goal",
      create_new_financial_target: "Create a new financial target",
      start_new_lesson: "Start New Lesson",
      learn_about_personal_finance: "Learn about personal finance",
      ask_community_question: "Ask Community Question",
      get_help_from_others: "Get help from others"
      ,
      // AI Chat / Financial Coach
      ai_coach_title: "AI Financial Coach",
      ai_coach_subtitle: "Get personalized financial advice",
      ai_welcome_title: "Ask me anything about your finances!",
      ai_welcome_subtext: "I can help with budgeting, savings goals, spending habits, and more.",
      ai_thinking: "Thinking...",
      ai_placeholder: "Ask about your finances...",
      clear_chat: "Clear Chat",
      clear_chat_confirm: "Are you sure you want to clear the chat history?",
      clear: "Clear",
      ai_error_fallback: "Sorry, I encountered an error. Please try again."
    }
  },
  es: {
    translation: {
      welcome_back: "¡Bienvenido de nuevo,",
      user: "Usuario",
      profile_settings: "Configuración de perfil",
      account_security: "Seguridad de la cuenta",
      help_support: "Ayuda y soporte",
      about: "Acerca de",
      logout: "Cerrar sesión",
      logout_confirm: "¿Estás seguro de que deseas cerrar sesión?",
      cancel: "Cancelar",

      financial_overview: "Resumen financiero",
      total_income: "Ingresos totales",
      this_month: "Este mes",
      total_spending: "Gastos totales",
      savings_goals: "Metas de ahorro",
      overall_progress: "Progreso general",
      financial_literacy: "Educación financiera",
      lessons_completed: "Lecciones completadas",
      community: "Comunidad",
      active_discussions: "Discusiones activas",

      quick_actions: "Acciones rápidas",
      track_new_income: "Registrar nuevo ingreso",
      record_latest_earnings: "Registra tus últimos ingresos",
      add_new_expense: "Agregar nuevo gasto",
      record_your_spending: "Registra tus gastos",
      set_new_savings_goal: "Establecer nueva meta de ahorro",
      create_new_financial_target: "Crea un nuevo objetivo financiero",
      start_new_lesson: "Comenzar nueva lección",
      learn_about_personal_finance: "Aprende sobre finanzas personales",
      ask_community_question: "Hacer una pregunta a la comunidad",
      get_help_from_others: "Obtén ayuda de otros"
      ,
      // AI Chat / Financial Coach
      ai_coach_title: "Entrenador Financiero AI",
      ai_coach_subtitle: "Obtén consejos financieros personalizados",
      ai_welcome_title: "¡Pregúntame cualquier cosa sobre tus finanzas!",
      ai_welcome_subtext: "Puedo ayudar con presupuestos, metas de ahorro, hábitos de gasto y más.",
      ai_thinking: "Pensando...",
      ai_placeholder: "Pregunta sobre tus finanzas...",
      clear_chat: "Borrar chat",
      clear_chat_confirm: "¿Estás seguro de que deseas borrar el historial de chat?",
      clear: "Borrar",
      ai_error_fallback: "Lo siento, encontré un error. Por favor, inténtalo de nuevo."
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

// Try to load saved language from SecureStore and apply it.
(async () => {
  try {
    const saved = await SecureStore.getItemAsync('appLanguage');
    const initial = saved || (Localization.locale || 'en').split('-')[0];
    if (initial && i18n.language !== initial) {
      await i18n.changeLanguage(initial);
    }
  } catch (err) {
    // ignore -- fallback will be used
    console.warn('i18n: failed to load saved language', err);
  }
})();

export const setAppLanguage = async (lang) => {
  try {
    await SecureStore.setItemAsync('appLanguage', lang);
    await i18n.changeLanguage(lang);
  } catch (err) {
    console.warn('i18n: failed to set language', err);
  }
};

export const getAppLanguage = async () => {
  try {
    return await SecureStore.getItemAsync('appLanguage');
  } catch (err) {
    return null;
  }
};

export default i18n;