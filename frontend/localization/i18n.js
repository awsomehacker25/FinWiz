import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import * as SecureStore from 'expo-secure-store';

// Keep in sync with the language options offered in ProfileSetupScreen.
export const SUPPORTED_LANGUAGES = [
  { code: 'en', label: 'English', nativeLabel: 'English' },
  { code: 'es', label: 'Spanish', nativeLabel: 'Español' },
  { code: 'zh', label: 'Mandarin', nativeLabel: '中文' },
  { code: 'hi', label: 'Hindi', nativeLabel: 'हिन्दी' },
];

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
      view_income_details: "View income details",
      total_spending: "Total Spending",
      view_spending_details: "View spending details",
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
      get_help_from_others: "Get help from others",
      view_dashboard: "View Dashboard",
      analyze_financial_data: "Analyze your financial data",
      find_financial_institutions: "Find Financial Institutions",
      locate_nearby_banks: "Locate nearby banks and services",

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
      ai_error_fallback: "Sorry, I encountered an error. Please try again.",

      // Language picker
      select_language: "Select Language"
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
      view_income_details: "Ver Detalles de Ingresos",
      total_spending: "Gastos totales",
      view_spending_details: "Ver Detalles de Gastos",
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
      get_help_from_others: "Obtén ayuda de otros",
      view_dashboard: "Ver Panel de Control",
      analyze_financial_data: "Analiza tus datos financieros",
      find_financial_institutions: "Encontrar Instituciones Financieras",
      locate_nearby_banks: "Localiza bancos y servicios cercanos",

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
      ai_error_fallback: "Lo siento, encontré un error. Por favor, inténtalo de nuevo.",

      // Language picker
      select_language: "Seleccionar idioma"
    }
  },
  zh: {
    translation: {
      welcome_back: "欢迎回来，",
      user: "用户",
      profile_settings: "个人资料设置",
      account_security: "账户安全",
      help_support: "帮助与支持",
      about: "关于",
      logout: "退出登录",
      logout_confirm: "您确定要退出登录吗？",
      cancel: "取消",

      financial_overview: "财务概览",
      total_income: "总收入",
      view_income_details: "查看收入详情",
      total_spending: "总支出",
      view_spending_details: "查看支出详情",
      savings_goals: "储蓄目标",
      overall_progress: "总体进度",
      financial_literacy: "理财教育",
      lessons_completed: "已完成课程",
      community: "社区",
      active_discussions: "活跃讨论",

      quick_actions: "快捷操作",
      track_new_income: "记录新收入",
      record_latest_earnings: "记录您的最新收入",
      add_new_expense: "添加新支出",
      record_your_spending: "记录您的支出",
      set_new_savings_goal: "设置新储蓄目标",
      create_new_financial_target: "创建新的财务目标",
      start_new_lesson: "开始新课程",
      learn_about_personal_finance: "了解个人理财知识",
      ask_community_question: "向社区提问",
      get_help_from_others: "获得他人帮助",
      view_dashboard: "查看仪表盘",
      analyze_financial_data: "分析您的财务数据",
      find_financial_institutions: "查找金融机构",
      locate_nearby_banks: "查找附近的银行和服务",

      // AI Chat / Financial Coach
      ai_coach_title: "AI理财教练",
      ai_coach_subtitle: "获取个性化理财建议",
      ai_welcome_title: "问我任何关于您财务的问题！",
      ai_welcome_subtext: "我可以帮助您制定预算、设定储蓄目标、了解消费习惯等。",
      ai_thinking: "思考中...",
      ai_placeholder: "询问您的财务问题...",
      clear_chat: "清除聊天",
      clear_chat_confirm: "您确定要清除聊天记录吗？",
      clear: "清除",
      ai_error_fallback: "抱歉，出现了错误，请重试。",

      // Language picker
      select_language: "选择语言"
    }
  },
  hi: {
    translation: {
      welcome_back: "वापसी पर स्वागत है,",
      user: "उपयोगकर्ता",
      profile_settings: "प्रोफ़ाइल सेटिंग्स",
      account_security: "खाता सुरक्षा",
      help_support: "सहायता और समर्थन",
      about: "के बारे में",
      logout: "लॉग आउट",
      logout_confirm: "क्या आप वाकई लॉग आउट करना चाहते हैं?",
      cancel: "रद्द करें",

      financial_overview: "वित्तीय अवलोकन",
      total_income: "कुल आय",
      view_income_details: "आय विवरण देखें",
      total_spending: "कुल खर्च",
      view_spending_details: "खर्च विवरण देखें",
      savings_goals: "बचत लक्ष्य",
      overall_progress: "समग्र प्रगति",
      financial_literacy: "वित्तीय साक्षरता",
      lessons_completed: "पूर्ण किए गए पाठ",
      community: "समुदाय",
      active_discussions: "सक्रिय चर्चाएं",

      quick_actions: "त्वरित कार्य",
      track_new_income: "नई आय दर्ज करें",
      record_latest_earnings: "अपनी नवीनतम कमाई दर्ज करें",
      add_new_expense: "नया खर्च जोड़ें",
      record_your_spending: "अपना खर्च दर्ज करें",
      set_new_savings_goal: "नया बचत लक्ष्य सेट करें",
      create_new_financial_target: "एक नया वित्तीय लक्ष्य बनाएं",
      start_new_lesson: "नया पाठ शुरू करें",
      learn_about_personal_finance: "व्यक्तिगत वित्त के बारे में जानें",
      ask_community_question: "समुदाय से प्रश्न पूछें",
      get_help_from_others: "दूसरों से सहायता प्राप्त करें",
      view_dashboard: "डैशबोर्ड देखें",
      analyze_financial_data: "अपने वित्तीय डेटा का विश्लेषण करें",
      find_financial_institutions: "वित्तीय संस्थान खोजें",
      locate_nearby_banks: "आस-पास के बैंक और सेवाएं खोजें",

      // AI Chat / Financial Coach
      ai_coach_title: "एआई वित्तीय कोच",
      ai_coach_subtitle: "व्यक्तिगत वित्तीय सलाह प्राप्त करें",
      ai_welcome_title: "अपने वित्त के बारे में मुझसे कुछ भी पूछें!",
      ai_welcome_subtext: "मैं बजट बनाने, बचत लक्ष्य, खर्च की आदतों और बहुत कुछ में मदद कर सकता हूं।",
      ai_thinking: "सोच रहा हूं...",
      ai_placeholder: "अपने वित्त के बारे में पूछें...",
      clear_chat: "चैट साफ़ करें",
      clear_chat_confirm: "क्या आप वाकई चैट इतिहास साफ़ करना चाहते हैं?",
      clear: "साफ़ करें",
      ai_error_fallback: "क्षमा करें, एक त्रुटि हुई। कृपया पुनः प्रयास करें।",

      // Language picker
      select_language: "भाषा चुनें"
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
