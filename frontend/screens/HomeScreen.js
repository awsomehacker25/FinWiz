import React, { useContext, useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Modal, Animated, StatusBar } from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { MaterialIcons } from '@expo/vector-icons';
import api, { getLiteracyProgress } from '../services/api';
import AIChatModal from '../components/AIChatModal';
 
export default function HomeScreen({ navigation }) {
  const { user, logout } = useContext(AuthContext);
  const [summary, setSummary] = useState({
    totalIncome: 0,
    goalProgress: 0,
    lessonsCompleted: 0,
    communityThreads: 0
  });
  const [profileModalVisible, setProfileModalVisible] = useState(false);
  const [aiChatVisible, setAiChatVisible] = useState(false);
 
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
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
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
              <Text style={styles.menuItemText}>Profile Settings</Text>
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
              <Text style={styles.logoutMenuItemText}>Logout</Text>
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
              <Text style={styles.welcomeText}>Welcome back,</Text>
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
          <Text style={styles.sectionTitle}>Financial Overview</Text>
          <View style={styles.grid}>
            <DashboardCard
              title="Total Income"
              value={`$${summary.totalIncome.toFixed(2)}`}
              subtitle="This month"
              icon="account-balance-wallet"
              color="#4CAF50"
              gradient="#0f2a3a"
              onPress={() => navigation.navigate('IncomeTracker')}
            />
           
            <DashboardCard
              title="Savings Goals"
              value={`${Math.round(summary.goalProgress)}%`}
              subtitle="Overall progress"
              icon="trending-up"
              color="#3B82F6"
              gradient="#0f2a3a"
              onPress={() => navigation.navigate('SavingsGoals')}
            />

            <DashboardCard
              title="Financial Literacy"
              value={summary.lessonsCompleted.toString()}
              subtitle="Lessons completed"
              icon="school"
              color="#9C27B0"
              gradient="#0f2a3a"
              onPress={() => navigation.navigate('LiteracyHub')}
            />

            <DashboardCard
              title="Community"
              value={summary.communityThreads.toString()}
              subtitle="Active discussions"
              icon="forum"
              color="#FF9800"
              gradient="#0f2a3a"
              onPress={() => navigation.navigate('SupportCommunity')}
            />
          </View>
        </View>
 
        <View style={styles.quickActionsSection}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActionsContainer}>
            <QuickActionButton
              title="Track New Income"
              subtitle="Record your latest earnings"
              icon="add"
              color="#4CAF50"
              onPress={() => navigation.navigate('IncomeTracker')}
            />
           
            <QuickActionButton
              title="Set New Savings Goal"
              subtitle="Create a new financial target"
              icon="savings"
              color="#3B82F6"
              onPress={() => navigation.navigate('SavingsGoals')}
            />
           
            <QuickActionButton
              title="Start New Lesson"
              subtitle="Learn about personal finance"
              icon="menu-book"
              color="#9C27B0"
              onPress={() => navigation.navigate('LiteracyHub')}
            />

            <QuickActionButton
              title="Ask Community Question"
              subtitle="Get help from others"
              icon="question-answer"
              color="#FF9800"
              onPress={() => navigation.navigate('SupportCommunity')}
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
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: '#1f4a62',
  },
  menuItemText: {
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
});