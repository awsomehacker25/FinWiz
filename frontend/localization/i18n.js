import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';

const resources = {
  en: {
    translation: {
      // Common
      welcome: "Welcome",
      login: "Login",
      signup: "Sign Up",
      email: "Email",
      password: "Password",
      name: "Name",
      save: "Save",
      cancel: "Cancel",
      edit: "Edit",
      delete: "Delete",
      loading: "Loading...",
      error: "Error",
      success: "Success",
      logout: "Logout",
      profile: "Profile",
      settings: "Settings",
      language: "Language",
      back: "Back",
      next: "Next",
      done: "Done",
      
      // Home Screen
      "home.title": "Dashboard",
      "home.totalIncome": "Total Income",
      "home.goalProgress": "Goal Progress",
      "home.lessonsCompleted": "Lessons Completed",
      "home.communityThreads": "Community Threads",
      "home.quickActions": "Quick Actions",
      "home.trackIncome": "Track Income",
      "home.setGoals": "Set Goals",
      "home.learnFinance": "Learn Finance",
      "home.joinCommunity": "Join Community",
      
      // Login Screen
      "login.title": "Welcome Back",
      "login.subtitle": "Your Smart Financial Assistant",
      "login.forgotPassword": "Forgot Password?",
      "login.noAccount": "Don't have an account?",
      "login.signUpNow": "Sign up now",
      "login.validation.fillFields": "Please fill in all fields",
      "login.validation.invalidEmail": "Please enter a valid email address",
      "login.validation.passwordLength": "Password must be at least 6 characters long",
      "login.error.noAccount": "No account found with this email.",
      "login.error.noPassword": "This account does not have a password set.",
      "login.error.incorrectPassword": "Incorrect password.",
      
      // Sign Up Screen
      "signup.title": "Create Account",
      "signup.subtitle": "Join thousands of users managing their finances",
      "signup.confirmPassword": "Confirm Password",
      "signup.hasAccount": "Already have an account?",
      "signup.loginNow": "Login now",
      "signup.validation.passwordMismatch": "Passwords do not match",
      "signup.success": "Account created successfully!",
      
      // Profile Setup
      "profileSetup.title": "Set Up Your Profile",
      "profileSetup.subtitle": "Help us personalize your experience",
      "profileSetup.age": "Age",
      "profileSetup.location": "Location",
      "profileSetup.occupation": "Occupation",
      "profileSetup.incomeRange": "Monthly Income Range",
      "profileSetup.financialGoals": "Financial Goals",
      "profileSetup.experience": "Financial Experience Level",
      "profileSetup.complete": "Complete Setup",
      
      // Income Tracker
      "income.title": "Income Tracker",
      "income.addIncome": "Add Income",
      "income.amount": "Amount",
      "income.source": "Source",
      "income.date": "Date",
      "income.description": "Description",
      "income.totalThisMonth": "Total This Month",
      "income.recentEntries": "Recent Entries",
      
      // Savings Goals
      "goals.title": "Savings Goals",
      "goals.addGoal": "Add New Goal",
      "goals.goalName": "Goal Name",
      "goals.targetAmount": "Target Amount",
      "goals.currentAmount": "Current Amount",
      "goals.targetDate": "Target Date",
      "goals.progress": "Progress",
      "goals.completed": "Completed",
      "goals.inProgress": "In Progress",
      
      // Literacy Hub
      "literacy.title": "Financial Literacy",
      "literacy.subtitle": "Expand your financial knowledge",
      "literacy.beginner": "Beginner",
      "literacy.intermediate": "Intermediate",
      "literacy.advanced": "Advanced",
      "literacy.startLesson": "Start Lesson",
      "literacy.continueLesson": "Continue Lesson",
      "literacy.completedLessons": "Completed Lessons",
      
      // Community
      "community.title": "Support Community",
      "community.subtitle": "Connect with fellow learners",
      "community.newPost": "New Post",
      "community.reply": "Reply",
      "community.likes": "Likes",
      "community.replies": "Replies",
      "community.trending": "Trending",
      "community.recent": "Recent",
      
      // Language Selection
      "language.selectLanguage": "Select Language",
      "language.english": "English",
      "language.spanish": "Español",
      "language.french": "Français",
      "language.german": "Deutsch",
      "language.chinese": "中文",
      "language.japanese": "日本語"
    }
  },
  es: {
    translation: {
      // Common
      welcome: "Bienvenido",
      login: "Iniciar sesión",
      signup: "Regístrate",
      email: "Correo electrónico",
      password: "Contraseña",
      name: "Nombre",
      save: "Guardar",
      cancel: "Cancelar",
      edit: "Editar",
      delete: "Eliminar",
      loading: "Cargando...",
      error: "Error",
      success: "Éxito",
      logout: "Cerrar sesión",
      profile: "Perfil",
      settings: "Configuración",
      language: "Idioma",
      back: "Atrás",
      next: "Siguiente",
      done: "Hecho",
      
      // Home Screen
      "home.title": "Panel de control",
      "home.totalIncome": "Ingresos totales",
      "home.goalProgress": "Progreso de metas",
      "home.lessonsCompleted": "Lecciones completadas",
      "home.communityThreads": "Hilos de la comunidad",
      "home.quickActions": "Acciones rápidas",
      "home.trackIncome": "Rastrear ingresos",
      "home.setGoals": "Establecer metas",
      "home.learnFinance": "Aprender finanzas",
      "home.joinCommunity": "Unirse a la comunidad",
      
      // Login Screen
      "login.title": "Bienvenido de nuevo",
      "login.subtitle": "Tu asistente financiero inteligente",
      "login.forgotPassword": "¿Olvidaste tu contraseña?",
      "login.noAccount": "¿No tienes una cuenta?",
      "login.signUpNow": "Regístrate ahora",
      "login.validation.fillFields": "Por favor, completa todos los campos",
      "login.validation.invalidEmail": "Por favor, ingresa una dirección de correo válida",
      "login.validation.passwordLength": "La contraseña debe tener al menos 6 caracteres",
      "login.error.noAccount": "No se encontró una cuenta con este correo.",
      "login.error.noPassword": "Esta cuenta no tiene una contraseña establecida.",
      "login.error.incorrectPassword": "Contraseña incorrecta.",
      
      // Sign Up Screen
      "signup.title": "Crear cuenta",
      "signup.subtitle": "Únete a miles de usuarios gestionando sus finanzas",
      "signup.confirmPassword": "Confirmar contraseña",
      "signup.hasAccount": "¿Ya tienes una cuenta?",
      "signup.loginNow": "Inicia sesión ahora",
      "signup.validation.passwordMismatch": "Las contraseñas no coinciden",
      "signup.success": "¡Cuenta creada exitosamente!",
      
      // Profile Setup
      "profileSetup.title": "Configura tu perfil",
      "profileSetup.subtitle": "Ayúdanos a personalizar tu experiencia",
      "profileSetup.age": "Edad",
      "profileSetup.location": "Ubicación",
      "profileSetup.occupation": "Ocupación",
      "profileSetup.incomeRange": "Rango de ingresos mensuales",
      "profileSetup.financialGoals": "Metas financieras",
      "profileSetup.experience": "Nivel de experiencia financiera",
      "profileSetup.complete": "Completar configuración",
      
      // Income Tracker
      "income.title": "Rastreador de ingresos",
      "income.addIncome": "Agregar ingreso",
      "income.amount": "Cantidad",
      "income.source": "Fuente",
      "income.date": "Fecha",
      "income.description": "Descripción",
      "income.totalThisMonth": "Total este mes",
      "income.recentEntries": "Entradas recientes",
      
      // Savings Goals
      "goals.title": "Metas de ahorro",
      "goals.addGoal": "Agregar nueva meta",
      "goals.goalName": "Nombre de la meta",
      "goals.targetAmount": "Cantidad objetivo",
      "goals.currentAmount": "Cantidad actual",
      "goals.targetDate": "Fecha objetivo",
      "goals.progress": "Progreso",
      "goals.completed": "Completado",
      "goals.inProgress": "En progreso",
      
      // Literacy Hub
      "literacy.title": "Educación financiera",
      "literacy.subtitle": "Amplía tu conocimiento financiero",
      "literacy.beginner": "Principiante",
      "literacy.intermediate": "Intermedio",
      "literacy.advanced": "Avanzado",
      "literacy.startLesson": "Iniciar lección",
      "literacy.continueLesson": "Continuar lección",
      "literacy.completedLessons": "Lecciones completadas",
      
      // Community
      "community.title": "Comunidad de apoyo",
      "community.subtitle": "Conecta con otros estudiantes",
      "community.newPost": "Nueva publicación",
      "community.reply": "Responder",
      "community.likes": "Me gusta",
      "community.replies": "Respuestas",
      "community.trending": "Tendencias",
      "community.recent": "Reciente",
      
      // Language Selection
      "language.selectLanguage": "Seleccionar idioma",
      "language.english": "English",
      "language.spanish": "Español",
      "language.french": "Français",
      "language.german": "Deutsch",
      "language.chinese": "中文",
      "language.japanese": "日本語"
    }
  },
  fr: {
    translation: {
      // Common
      welcome: "Bienvenue",
      login: "Se connecter",
      signup: "S'inscrire",
      email: "E-mail",
      password: "Mot de passe",
      name: "Nom",
      save: "Enregistrer",
      cancel: "Annuler",
      edit: "Modifier",
      delete: "Supprimer",
      loading: "Chargement...",
      error: "Erreur",
      success: "Succès",
      logout: "Se déconnecter",
      profile: "Profil",
      settings: "Paramètres",
      language: "Langue",
      back: "Retour",
      next: "Suivant",
      done: "Terminé",
      
      // Home Screen
      "home.title": "Tableau de bord",
      "home.totalIncome": "Revenu total",
      "home.goalProgress": "Progrès des objectifs",
      "home.lessonsCompleted": "Leçons terminées",
      "home.communityThreads": "Fils de discussion",
      "home.quickActions": "Actions rapides",
      "home.trackIncome": "Suivre les revenus",
      "home.setGoals": "Définir des objectifs",
      "home.learnFinance": "Apprendre la finance",
      "home.joinCommunity": "Rejoindre la communauté",
      
      // Login Screen
      "login.title": "Bon retour",
      "login.subtitle": "Votre assistant financier intelligent",
      "login.forgotPassword": "Mot de passe oublié ?",
      "login.noAccount": "Vous n'avez pas de compte ?",
      "login.signUpNow": "Inscrivez-vous maintenant",
      "login.validation.fillFields": "Veuillez remplir tous les champs",
      "login.validation.invalidEmail": "Veuillez saisir une adresse e-mail valide",
      "login.validation.passwordLength": "Le mot de passe doit contenir au moins 6 caractères",
      "login.error.noAccount": "Aucun compte trouvé avec cet e-mail.",
      "login.error.noPassword": "Ce compte n'a pas de mot de passe défini.",
      "login.error.incorrectPassword": "Mot de passe incorrect.",
      
      // Language Selection
      "language.selectLanguage": "Sélectionner la langue",
      "language.english": "English",
      "language.spanish": "Español", 
      "language.french": "Français",
      "language.german": "Deutsch",
      "language.chinese": "中文",
      "language.japanese": "日本語"
    }
  },
  de: {
    translation: {
      // Common
      welcome: "Willkommen",
      login: "Anmelden",
      signup: "Registrieren",
      email: "E-Mail",
      password: "Passwort",
      name: "Name",
      save: "Speichern",
      cancel: "Abbrechen",
      edit: "Bearbeiten",
      delete: "Löschen",
      loading: "Laden...",
      error: "Fehler",
      success: "Erfolg",
      logout: "Abmelden",
      profile: "Profil",
      settings: "Einstellungen",
      language: "Sprache",
      back: "Zurück",
      next: "Weiter",
      done: "Fertig",
      
      // Language Selection
      "language.selectLanguage": "Sprache auswählen",
      "language.english": "English",
      "language.spanish": "Español",
      "language.french": "Français", 
      "language.german": "Deutsch",
      "language.chinese": "中文",
      "language.japanese": "日本語"
    }
  },
  zh: {
    translation: {
      // Common
      welcome: "欢迎",
      login: "登录",
      signup: "注册",
      email: "邮箱",
      password: "密码",
      name: "姓名",
      save: "保存",
      cancel: "取消",
      edit: "编辑",
      delete: "删除",
      loading: "加载中...",
      error: "错误",
      success: "成功",
      logout: "退出登录",
      profile: "个人资料",
      settings: "设置",
      language: "语言",
      back: "返回",
      next: "下一步",
      done: "完成",
      
      // Language Selection
      "language.selectLanguage": "选择语言",
      "language.english": "English",
      "language.spanish": "Español",
      "language.french": "Français",
      "language.german": "Deutsch",
      "language.chinese": "中文",
      "language.japanese": "日本語"
    }
  },
  ja: {
    translation: {
      // Common
      welcome: "ようこそ",
      login: "ログイン",
      signup: "新規登録",
      email: "メール",
      password: "パスワード",
      name: "名前",
      save: "保存",
      cancel: "キャンセル",
      edit: "編集",
      delete: "削除",
      loading: "読み込み中...",
      error: "エラー",
      success: "成功",
      logout: "ログアウト",
      profile: "プロフィール",
      settings: "設定",
      language: "言語",
      back: "戻る",
      next: "次へ",
      done: "完了",
      
      // Language Selection
      "language.selectLanguage": "言語を選択",
      "language.english": "English",
      "language.spanish": "Español",
      "language.french": "Français",
      "language.german": "Deutsch",
      "language.chinese": "中文",
      "language.japanese": "日本語"
    }
  }
};

// Function to get saved language from AsyncStorage
const getStoredLanguage = async () => {
  try {
    const storedLanguage = await AsyncStorage.getItem('userLanguage');
    return storedLanguage || (Localization.locale || 'en').split('-')[0];
  } catch (error) {
    return (Localization.locale || 'en').split('-')[0];
  }
};

// Function to save language to AsyncStorage
export const saveLanguage = async (language) => {
  try {
    await AsyncStorage.setItem('userLanguage', language);
    i18n.changeLanguage(language);
  } catch (error) {
    console.error('Error saving language:', error);
  }
};

// Function to get available languages
export const getAvailableLanguages = () => {
  return [
    { code: 'en', name: 'English', nativeName: 'English' },
    { code: 'es', name: 'Spanish', nativeName: 'Español' },
    { code: 'fr', name: 'French', nativeName: 'Français' },
    { code: 'de', name: 'German', nativeName: 'Deutsch' },
    { code: 'zh', name: 'Chinese', nativeName: '中文' },
    { code: 'ja', name: 'Japanese', nativeName: '日本語' }
  ];
};

// Initialize i18n
const initI18n = async () => {
  const storedLanguage = await getStoredLanguage();
  
  i18n
    .use(initReactI18next)
    .init({
      resources,
      lng: storedLanguage,
      fallbackLng: 'en',
      interpolation: {
        escapeValue: false
      },
      react: {
        useSuspense: false
      }
    });
};

// Initialize the i18n system
initI18n();

export default i18n; 