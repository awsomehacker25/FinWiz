import React, { useContext, useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Modal, Animated, StatusBar } from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { MaterialIcons } from '@expo/vector-icons';
import { getIncomeEntries, getSpendingEntries, getSavingsGoals, getLiteracyProgress, getCommunityThreads } from '../services/api';
import AIChatModal from '../components/AIChatModal';
import AccountSecurityModal from '../components/AccountSecurityModal';
import { useTranslation } from 'react-i18next';
import i18n, { setAppLanguage, getAppLanguage, SUPPORTED_LANGUAGES } from '../localization/i18n';

export default function HomeScreen({ navigation }) {
  const { user, logout } = useContext(AuthContext);
  const [summary, setSummary] = useState({
    totalIncome: 0,
    totalSpending: 0,
    goalProgress: 0,
    lessonsCompleted: 0,
    communityThreads: 0
  });
  const [profileModalVisible, setProfileModalVisible] = useState(false);
  const [aiChatVisible, setAiChatVisible] = useState(false);
  const [languageModalVisible, setLanguageModalVisible] = useState(false);
  const [accountSecurityModalVisible, setAccountSecurityModalVisible] = useState(false);
  const { t } = useTranslation();
  const [language, setLanguage] = useState(i18n.language || 'en');

  useEffect(() => {
    if (language && i18n.language !== language) {
      i18n.changeLanguage(language).catch(() => {});
    }
  }, [language]);
 
  useEffect(() => {
    loadSummaryData();
    const unsubscribe = navigation.addListener('focus', () => {
      loadSummaryData();
    });
    return unsubscribe;
  }, [user, navigation]);

  useEffect(() => {
    // load persisted language
    (async () => {
      const saved = await getAppLanguage();
      if (saved && saved !== language) {
        setLanguage(saved);
      }
    })();
  }, []);

  const loadSummaryData = async () => {
    if (user) {
      try {
        const [incomeData, spendingData, goals, literacyProgress, communityThreads] = await Promise.all([
          getIncomeEntries(user.id),
          getSpendingEntries(user.id),
          getSavingsGoals(user.id),
          getLiteracyProgress(user.email || user.id),
          getCommunityThreads()
        ]);

        // Handle income calculation with null checks
        const totalIncome = incomeData.reduce((sum, entry) =>
          sum + (Number(entry?.amount) || 0), 0
        );

        // Handle spending calculation with null checks
        const totalSpending = spendingData.reduce((sum, entry) =>
          sum + (Number(entry?.amount) || 0), 0
        );

        // Handle goals calculation with null checks
        const goalProgress = goals.length > 0
          ? goals.reduce((sum, goal) => {
              const target = Number(goal?.target) || 0;
              const saved = Number(goal?.saved) || 0;
              return sum + (target > 0 ? saved / target : 0);
            }, 0) / goals.length 
          : 0;

        // Calculate completed lessons from literacyProgress
        let lessonsCompleted = 0;
        if (literacyProgress && literacyProgress.lessons) {
          lessonsCompleted = Object.values(literacyProgress.lessons).filter(l => l.completed).length;
        }

        setSummary({
          totalIncome: totalIncome,
          totalSpending: totalSpending,
          goalProgress: Math.min(goalProgress * 100, 100), // Cap at 100%
          lessonsCompleted,
          communityThreads: Array.isArray(communityThreads) ? communityThreads.length : 0
        });
      } catch (err) {
        console.error('Error loading summary:', err);
        // Keep the existing values on error
      }
    }
  };
 
  const handleLogout = () => {
    setProfileModalVisible(false);
    Alert.alert(
      t('logout'),
      t('logout_confirm'),
      [
        {
          text: t('cancel'),
          style: 'cancel',
        },
        {
          text: t('logout'),
          style: 'destructive',
          onPress: async () => {
            await logout();
            navigation.reset({
              index: 0,
              routes: [{ name: 'Login' }],
            });
          },
        },
      ]
    );
  };
 
  const handleProfileSettings = () => {
    setProfileModalVisible(false);
    navigation.navigate('ProfileSetup', { editing: true });
  };

  const handleAccountSecurity = () => {
    setProfileModalVisible(false);
    setAccountSecurityModalVisible(true);
  };

  const handleAccountDeleted = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'Login' }],
    });
  };

  const handleHelpSupport = () => {
    setProfileModalVisible(false);
    navigation.navigate('SupportCommunity');
  };

  const handleAbout = () => {
    setProfileModalVisible(false);
    Alert.alert(
      'About FinWiz',
      'FinWiz v1.0.0\n\nYour Smart Financial Assistant for immigrants and gig workers — track income and spending, set savings goals, build financial literacy, and connect with your community, all in one place.'
    );
  };

  const selectLanguage = async (code) => {
    // Close first — ProfileSidebar/LanguagePicker used to be redefined on
    // every render, which remounted the native Modal while it was still
    // open once this state change (and the i18next languageChanged event
    // it triggers) forced a re-render, freezing the app. They're now stable
    // module-level components, so this is just for a snappier close.
    setLanguageModalVisible(false);
    setLanguage(code);
    await setAppLanguage(code);
  };

  const currentLanguage = SUPPORTED_LANGUAGES.find(l => l.code === language) || SUPPORTED_LANGUAGES[0];

  const DashboardCard = ({ title, value, subtitle, icon, onPress, color, gradient }) => (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: gradient }]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.cardContent}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>{title}</Text>
          <View style={[styles.cardIcon, { backgroundColor: color }]}>
            <MaterialIcons name={icon} size={20} color="white" />
          </View>
        </View>
        <Text style={[styles.cardValue, { color }]}>{value}</Text>
        <Text style={styles.cardSubtitle}>{subtitle}</Text>
      </View>
    </TouchableOpacity>
  );
 
  const QuickActionButton = ({ title, subtitle, icon, onPress, color }) => (
    <TouchableOpacity
      style={styles.quickActionButton}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={[styles.quickActionIcon, { backgroundColor: color }]}>
        <MaterialIcons name={icon} size={20} color="white" />
      </View>
      <View style={styles.quickActionContent}>
        <Text style={styles.quickActionTitle}>{title}</Text>
        <Text style={styles.quickActionSubtitle}>{subtitle}</Text>
      </View>
      <MaterialIcons name="chevron-right" size={24} color="#88a2b6" />
    </TouchableOpacity>
  );
 
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#17384a" />
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View style={styles.welcomeSection}>
              <Text style={styles.welcomeText}>{t('welcome_back')}</Text>
              <Text style={styles.nameText}>{user?.firstName ? `${user.firstName} ${user.lastName || ''}` : t('user')}</Text>
            </View>
            <View style={{flexDirection: 'row', alignItems: 'center'}}>
              <TouchableOpacity style={styles.langButton} onPress={() => setLanguageModalVisible(true)}>
                <Text style={styles.langButtonText}>{currentLanguage.code.toUpperCase()}</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.profileButton} onPress={() => setProfileModalVisible(true)}>
              <View style={styles.profileIcon}>
                <Text style={styles.profileIconText}>
                  {user?.firstName ? user.firstName.charAt(0).toUpperCase() : 'U'}
                </Text>
              </View>
            </TouchableOpacity>
            </View>
          </View>
        </View>
 
        <ProfileSidebar
          visible={profileModalVisible}
          onClose={() => setProfileModalVisible(false)}
          user={user}
          t={t}
          onLogout={handleLogout}
          onProfileSettings={handleProfileSettings}
          onAccountSecurity={handleAccountSecurity}
          onHelpSupport={handleHelpSupport}
          onAbout={handleAbout}
        />
        <LanguagePicker
          visible={languageModalVisible}
          onClose={() => setLanguageModalVisible(false)}
          language={language}
          onSelect={selectLanguage}
          t={t}
        />
        <AccountSecurityModal
          visible={accountSecurityModalVisible}
          onClose={() => setAccountSecurityModalVisible(false)}
          user={user}
          onAccountDeleted={handleAccountDeleted}
        />

        <View style={styles.dashboardSection}>
          <Text style={styles.sectionTitle}>{t('financial_overview')}</Text>
          <View style={styles.grid}>
            <DashboardCard
              title={t('total_income')}
              value={`$${summary.totalIncome.toFixed(2)}`}
              subtitle={t('view_income_details')}
              icon="account-balance-wallet"
              color="#4CAF50"
              gradient="#0f2a3a"
              onPress={() => navigation.navigate('IncomeTracker')}
            />

            <DashboardCard
              title={t('total_spending')}
              value={`$${summary.totalSpending.toFixed(2)}`}
              subtitle={t('view_spending_details')}
              icon="shopping-cart"
              color="#ff6b6b"
              gradient="#0f2a3a"
              onPress={() => navigation.navigate('SpendingTracker')}
            />
           
            <DashboardCard
              title={t('savings_goals')}
              value={`${Math.round(summary.goalProgress)}%`}
              subtitle={t('overall_progress')}
              icon="trending-up"
              color="#3B82F6"
              gradient="#0f2a3a"
              onPress={() => navigation.navigate('SavingsGoals')}
            />

            <DashboardCard
              title={t('financial_literacy')}
              value={summary.lessonsCompleted.toString()}
              subtitle={t('lessons_completed')}
              icon="school"
              color="#9C27B0"
              gradient="#0f2a3a"
              onPress={() => navigation.navigate('LiteracyHub')}
            />

            <DashboardCard
              title={t('community')}
              value={summary.communityThreads.toString()}
              subtitle={t('active_discussions')}
              icon="forum"
              color="#FF9800"
              gradient="#0f2a3a"
              onPress={() => navigation.navigate('SupportCommunity')}
            />
          </View>
        </View>
 
        <View style={styles.quickActionsSection}>
          <Text style={styles.sectionTitle}>{t('quick_actions')}</Text>
          <View style={styles.quickActionsContainer}>
            <QuickActionButton
              title={t('track_new_income')}
              subtitle={t('record_latest_earnings')}
              icon="add"
              color="#4CAF50"
              onPress={() => navigation.navigate('IncomeTracker')}
            />

            <QuickActionButton
              title={t('add_new_expense')}
              subtitle={t('record_your_spending')}
              icon="receipt"
              color="#ff6b6b"
              onPress={() => navigation.navigate('SpendingTracker')}
            />
           
            <QuickActionButton
              title={t('set_new_savings_goal')}
              subtitle={t('create_new_financial_target')}
              icon="savings"
              color="#3B82F6"
              onPress={() => navigation.navigate('SavingsGoals')}
            />
           
            <QuickActionButton
              title={t('start_new_lesson')}
              subtitle={t('learn_about_personal_finance')}
              icon="menu-book"
              color="#9C27B0"
              onPress={() => navigation.navigate('LiteracyHub')}
            />

            <QuickActionButton
              title={t('ask_community_question')}
              subtitle={t('get_help_from_others')}
              icon="question-answer"
              color="#FF9800"
              onPress={() => navigation.navigate('SupportCommunity')}
            />

            <QuickActionButton
              title={t('view_dashboard')}
              subtitle={t('analyze_financial_data')}
              icon="analytics"
              color="#607D8B"
              onPress={() => navigation.navigate('DataDashboard')}
            />

            <QuickActionButton
              title={t('find_financial_institutions')}
              subtitle={t('locate_nearby_banks')}
              icon="location-on"
              color="#00BCD4"
              onPress={() => navigation.navigate('FinancialInstitutions')}
            />
          </View>
        </View>
 
        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* AI Chat Floating Button */}
      <TouchableOpacity
        style={styles.aiChatButton}
        onPress={() => setAiChatVisible(true)}
        activeOpacity={0.8}
      >
        <MaterialIcons name="smart-toy" size={24} color="#ffffff" />
      </TouchableOpacity>

      {/* AI Chat Modal */}
      <AIChatModal
        visible={aiChatVisible}
        onClose={() => setAiChatVisible(false)}
      />
    </View>
  );
}

// Module-level (not redefined per HomeScreen render) so React preserves
// their identity across re-renders — redefining a component that wraps a
// native Modal inside another component's render body causes the Modal to
// remount whenever the parent re-renders while it's still open (e.g. from
// the state change or i18next event a selection inside it triggers), which
// can freeze the app.
const ProfileSidebar = ({ visible, onClose, user, t, onLogout, onProfileSettings, onAccountSecurity, onHelpSupport, onAbout }) => (
  <Modal
    animationType="slide"
    transparent={true}
    visible={visible}
    onRequestClose={onClose}
  >
    <TouchableOpacity
      style={styles.modalOverlay}
      activeOpacity={1}
      onPress={onClose}
    >
      <View style={styles.sidebar}>
        <View style={styles.sidebarHeader}>
          <View style={styles.profileAvatar}>
            <Text style={styles.profileInitial}>
              {user?.firstName ? user.firstName.charAt(0).toUpperCase() : 'U'}
            </Text>
          </View>
          <Text style={styles.profileName}>
            {user?.firstName ? `${user.firstName} ${user.lastName || ''}` : t('user')}
          </Text>
          <Text style={styles.profileEmail}>{user?.email || 'user@example.com'}</Text>
        </View>

        <View style={styles.sidebarMenu}>
          <TouchableOpacity style={styles.menuItem} onPress={onProfileSettings}>
            <MaterialIcons name="person" size={20} color="#cfe0ee" style={styles.menuItemIcon} />
            <Text style={styles.menuItemText}>{t('profile_settings')}</Text>
            <MaterialIcons name="chevron-right" size={20} color="#546E7A" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={onAccountSecurity}>
            <MaterialIcons name="lock" size={20} color="#cfe0ee" style={styles.menuItemIcon} />
            <Text style={styles.menuItemText}>{t('account_security')}</Text>
            <MaterialIcons name="chevron-right" size={20} color="#546E7A" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={onHelpSupport}>
            <MaterialIcons name="forum" size={20} color="#cfe0ee" style={styles.menuItemIcon} />
            <Text style={styles.menuItemText}>{t('help_support')}</Text>
            <MaterialIcons name="chevron-right" size={20} color="#546E7A" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={onAbout}>
            <MaterialIcons name="info" size={20} color="#cfe0ee" style={styles.menuItemIcon} />
            <Text style={styles.menuItemText}>{t('about')}</Text>
            <MaterialIcons name="chevron-right" size={20} color="#546E7A" />
          </TouchableOpacity>

          <View style={styles.menuDivider} />

          <TouchableOpacity style={styles.logoutMenuItem} onPress={onLogout}>
            <MaterialIcons name="logout" size={20} color="#f44336" style={styles.menuItemIcon} />
            <Text style={styles.logoutMenuItemText}>{t('logout')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  </Modal>
);

const LanguagePicker = ({ visible, onClose, language, onSelect, t }) => (
  <Modal
    animationType="fade"
    transparent={true}
    visible={visible}
    onRequestClose={onClose}
  >
    <TouchableOpacity
      style={styles.modalOverlay}
      activeOpacity={1}
      onPress={onClose}
    >
      <View style={styles.languageModal}>
        <Text style={styles.languageModalTitle}>{t('select_language')}</Text>
        {SUPPORTED_LANGUAGES.map((lang) => (
          <TouchableOpacity
            key={lang.code}
            style={styles.languageOption}
            onPress={() => onSelect(lang.code)}
          >
            <View>
              <Text style={styles.languageOptionLabel}>{lang.nativeLabel}</Text>
              <Text style={styles.languageOptionSubLabel}>{lang.label}</Text>
            </View>
            {lang.code === language && (
              <MaterialIcons name="check" size={20} color="#3B82F6" />
            )}
          </TouchableOpacity>
        ))}
      </View>
    </TouchableOpacity>
  </Modal>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#17384a',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 32,
    backgroundColor: '#17384a',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  welcomeSection: {
    flex: 1,
  },
  welcomeText: {
    fontSize: 16,
    color: '#B0BEC5',
    marginBottom: 4,
  },
  nameText: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  profileButton: {
    padding: 4,
  },
  profileIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#25577A',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  profileIconText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  sidebar: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 300,
    backgroundColor: '#0f2a3a',
    shadowColor: '#000',
    shadowOffset: { width: -4, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 12,
  },
  sidebarHeader: {
    padding: 24,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#2a5f7b',
    alignItems: 'center',
    backgroundColor: '#17384a',
  },
  profileAvatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  profileInitial: {
    color: 'white',
    fontSize: 28,
    fontWeight: 'bold',
  },
  profileName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 6,
  },
  profileEmail: {
    fontSize: 14,
    color: '#cfe0ee',
  },
  sidebarMenu: {
    padding: 20,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: '#1f4a62',
  },
  menuItemIcon: {
    marginRight: 12,
  },
  menuItemText: {
    flex: 1,
    fontSize: 16,
    color: '#cfe0ee',
    fontWeight: '600',
  },
  menuDivider: {
    height: 1,
    backgroundColor: '#2a5f7b',
    marginVertical: 20,
  },
  logoutMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: '#d32f2f20',
  },
  logoutMenuItemText: {
    fontSize: 16,
    color: '#f44336',
    fontWeight: '600',
  },
  dashboardSection: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 20,
    letterSpacing: 0.5,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  card: {
    width: '47%',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  cardContent: {
    gap: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 14,
    color: '#FFFF',
    fontWeight: '600',
    flex: 1,
  },
  cardIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardIconText: {
    fontSize: 16,
  },
  cardValue: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  cardSubtitle: {
    fontSize: 12,
    color: '#cfe0ee',
    fontWeight: '500',
  },
  quickActionsSection: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  quickActionsContainer: {
    gap: 12,
  },
  quickActionButton: {
    backgroundColor: '#0f2a3a',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  quickActionIconText: {
    fontSize: 20,
  },
  quickActionContent: {
    flex: 1,
  },
  quickActionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 4,
  },
  quickActionSubtitle: {
    fontSize: 14,
    color: '#cfe0ee',
    fontWeight: '500',
  },
  quickActionArrow: {
    fontSize: 24,
    color: '#B0BEC5',
    fontWeight: '300',
  },
  bottomSpacer: {
    height: 40,
  },
  aiChatButton: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  langButton: {
    marginRight: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2a5f7b',
    backgroundColor: '#0f2a3a',
    alignItems: 'center',
    justifyContent: 'center'
  },
  langButtonText: {
    color: '#cfe0ee',
    fontWeight: '700'
  },
  languageModal: {
    backgroundColor: '#0f2a3a',
    borderRadius: 16,
    marginHorizontal: 32,
    padding: 20,
    alignSelf: 'center',
    marginTop: 'auto',
    marginBottom: 'auto',
    width: '80%',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  languageModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  languageOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginBottom: 4,
  },
  languageOptionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  languageOptionSubLabel: {
    fontSize: 13,
    color: '#cfe0ee',
    marginTop: 2,
  },
});