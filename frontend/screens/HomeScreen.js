import React, { useContext, useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Modal, Animated, StatusBar } from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import api, { getLiteracyProgress } from '../services/api';
import LanguageSelector from '../components/LanguageSelector';
 
export default function HomeScreen({ navigation }) {
  const { user, logout } = useContext(AuthContext);
  const { t } = useTranslation();
  const [summary, setSummary] = useState({
    totalIncome: 0,
    goalProgress: 0,
    lessonsCompleted: 0,
    communityThreads: 0
  });
  const [profileModalVisible, setProfileModalVisible] = useState(false);
  const [languageSelectorVisible, setLanguageSelectorVisible] = useState(false);
 
  useEffect(() => {
    loadSummaryData();
    const unsubscribe = navigation.addListener('focus', () => {
      loadSummaryData();
    });
    return unsubscribe;
  }, [user, navigation]);

  const loadSummaryData = async () => {
    if (user) {
      try {
        const [incomeRes, goalsRes, literacyProgress, communityRes] = await Promise.all([
          api.get(`/income?userId=${user.id}`),
          api.get(`/goals?userId=${user.id}`),
          getLiteracyProgress(user.email || user.id),
          api.get('/community')
        ]);

        // Handle income calculation with null checks
        const incomeData = Array.isArray(incomeRes?.data) ? incomeRes.data : [];
        const totalIncome = incomeData.reduce((sum, entry) => 
          sum + (Number(entry?.amount) || 0), 0
        );

        // Handle goals calculation with null checks
        const goals = Array.isArray(goalsRes?.data) ? goalsRes.data : [];
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
          goalProgress: Math.min(goalProgress * 100, 100), // Cap at 100%
          lessonsCompleted,
          communityThreads: Array.isArray(communityRes?.data) ? communityRes.data.length : 0
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
      'Are you sure you want to logout?',
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
 
  const ProfileSidebar = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={profileModalVisible}
      onRequestClose={() => setProfileModalVisible(false)}
    >
      <TouchableOpacity
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={() => setProfileModalVisible(false)}
      >
        <View style={styles.sidebar}>
          <View style={styles.sidebarHeader}>
            <View style={styles.profileAvatar}>
              <Text style={styles.profileInitial}>
                {user?.firstName ? user.firstName.charAt(0).toUpperCase() : 'U'}
              </Text>
            </View>
            <Text style={styles.profileName}>
              {user?.firstName ? `${user.firstName} ${user.lastName || ''}` : 'User'}
            </Text>
            <Text style={styles.profileEmail}>{user?.email || 'user@example.com'}</Text>
          </View>
 
          <View style={styles.sidebarMenu}>
            <TouchableOpacity style={styles.menuItem}>
              <Text style={styles.menuItemText}>{t('profile')} {t('settings')}</Text>
            </TouchableOpacity>
           
            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => {
                setProfileModalVisible(false);
                setLanguageSelectorVisible(true);
              }}
            >
              <Text style={styles.menuItemText}>{t('language')}</Text>
            </TouchableOpacity>
           
            <TouchableOpacity style={styles.menuItem}>
              <Text style={styles.menuItemText}>Account Security</Text>
            </TouchableOpacity>
           
            <TouchableOpacity style={styles.menuItem}>
              <Text style={styles.menuItemText}>Help & Support</Text>
            </TouchableOpacity>
           
            <TouchableOpacity style={styles.menuItem}>
              <Text style={styles.menuItemText}>About</Text>
            </TouchableOpacity>
           
            <View style={styles.menuDivider} />
           
            <TouchableOpacity style={styles.logoutMenuItem} onPress={handleLogout}>
              <Text style={styles.logoutMenuItemText}>{t('logout')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    </Modal>
  );
 
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
            <Text style={styles.cardIconText}>{icon}</Text>
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
        <Text style={styles.quickActionIconText}>{icon}</Text>
      </View>
      <View style={styles.quickActionContent}>
        <Text style={styles.quickActionTitle}>{title}</Text>
        <Text style={styles.quickActionSubtitle}>{subtitle}</Text>
      </View>
      <Text style={styles.quickActionArrow}>›</Text>
    </TouchableOpacity>
  );
 
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#244662" />
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View style={styles.welcomeSection}>
              <Text style={styles.welcomeText}>{t('welcome')},</Text>
              <Text style={styles.nameText}>{user?.firstName ? `${user.firstName} ${user.lastName || ''}` : 'User'}</Text>
            </View>
            <TouchableOpacity style={styles.profileButton} onPress={() => setProfileModalVisible(true)}>
              <View style={styles.profileIcon}>
                <Text style={styles.profileIconText}>
                  {user?.firstName ? user.firstName.charAt(0).toUpperCase() : 'U'}
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
 
        <ProfileSidebar />
 
        <View style={styles.dashboardSection}>
          <Text style={styles.sectionTitle}>{t('home.title')}</Text>
          <View style={styles.grid}>
            <DashboardCard
              title={t('home.totalIncome')}
              value={`$${summary.totalIncome.toFixed(2)}`}
              subtitle="This month"
              icon="💰"
              color="#2E7D32"
              gradient="#f8fff8"
              onPress={() => navigation.navigate('IncomeTracker')}
            />
           
            <DashboardCard
              title={t('home.goalProgress')}
              value={`${Math.round(summary.goalProgress)}%`}
              subtitle="Overall progress"
              icon="🎯"
              color="#1565C0"
              gradient="#f8fbff"
              onPress={() => navigation.navigate('SavingsGoals')}
            />
 
            <DashboardCard
              title={t('home.lessonsCompleted')}
              value={summary.lessonsCompleted.toString()}
              subtitle="Lessons completed"
              icon="📚"
              color="#6A1B9A"
              gradient="#fdf8ff"
              onPress={() => navigation.navigate('LiteracyHub')}
            />
 
            <DashboardCard
              title={t('home.communityThreads')}
              value={summary.communityThreads.toString()}
              subtitle="Active discussions"
              icon="💬"
              color="#E65100"
              gradient="#fff8f0"
              onPress={() => navigation.navigate('SupportCommunity')}
            />
          </View>
        </View>
 
        <View style={styles.quickActionsSection}>
          <Text style={styles.sectionTitle}>{t('home.quickActions')}</Text>
          <View style={styles.quickActionsContainer}>
            <QuickActionButton
              title={t('home.trackIncome')}
              subtitle="Record your latest earnings"
              icon="➕"
              color="#2E7D32"
              onPress={() => navigation.navigate('IncomeTracker')}
            />
           
            <QuickActionButton
              title={t('home.setGoals')}
              subtitle="Create a new financial target"
              icon="🎯"
              color="#1565C0"
              onPress={() => navigation.navigate('SavingsGoals')}
            />
           
            <QuickActionButton
              title={t('home.learnFinance')}
              subtitle="Learn about personal finance"
              icon="📖"
              color="#6A1B9A"
              onPress={() => navigation.navigate('LiteracyHub')}
            />
 
            <QuickActionButton
              title={t('home.joinCommunity')}
              subtitle="Get help from others"
              icon="💭"
              color="#E65100"
              onPress={() => navigation.navigate('SupportCommunity')}
            />
          </View>
        </View>
 
        <View style={styles.bottomSpacer} />
      </ScrollView>
      
      <LanguageSelector 
        visible={languageSelectorVisible}
        onClose={() => setLanguageSelectorVisible(false)}
        onLanguageChange={() => {
          // Reload data after language change to show updated UI
          loadSummaryData();
        }}
      />
    </View>
  );
}
 
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#244662',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 32,
    backgroundColor: '#244662',
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
    backgroundColor: '#3F51B5',
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
    backgroundColor: '#FFFFFF',
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
    borderBottomColor: '#E3F2FD',
    alignItems: 'center',
    backgroundColor: '#F5F9FF',
  },
  profileAvatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#3F51B5',
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
    color: '#1A237E',
    marginBottom: 6,
  },
  profileEmail: {
    fontSize: 14,
    color: '#546E7A',
  },
  sidebarMenu: {
    padding: 20,
  },
  menuItem: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: '#F8FAFF',
  },
  menuItemText: {
    fontSize: 16,
    color: '#1A237E',
    fontWeight: '600',
  },
  menuDivider: {
    height: 1,
    backgroundColor: '#E3F2FD',
    marginVertical: 20,
  },
  logoutMenuItem: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: '#FFEBEE',
  },
  logoutMenuItemText: {
    fontSize: 16,
    color: '#D32F2F',
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
    color: '#546E7A',
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
    color: '#78909C',
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
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 6,
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
    color: '#1A237E',
    marginBottom: 4,
  },
  quickActionSubtitle: {
    fontSize: 14,
    color: '#546E7A',
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
});