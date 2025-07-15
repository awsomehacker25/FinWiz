import React, { useContext, useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Modal, Animated } from 'react-native';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';

export default function HomeScreen({ navigation }) {
  const { user, logout } = useContext(AuthContext);
  const [summary, setSummary] = useState({
    totalIncome: 0,
    goalProgress: 0,
    lessonsCompleted: 0,
    communityThreads: 0
  });
  const [profileModalVisible, setProfileModalVisible] = useState(false);

  useEffect(() => {
    loadSummaryData();
  }, [user]);

  const loadSummaryData = async () => {
    if (user) {
      try {
        const [incomeRes, goalsRes, lessonsRes, communityRes] = await Promise.all([
          api.get(`/income?userId=${user.id}`),
          api.get(`/goals?userId=${user.id}`),
          api.get('/literacy/progress'),
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
          ? goals.reduce((sum, goal) => 
              sum + (Number(goal?.saved || 0) / Number(goal?.target || 1)), 0
            ) / goals.length 
          : 0;

        // Update summary with proper null checks
        setSummary({
          totalIncome: totalIncome,
          goalProgress: Math.min(goalProgress * 100, 100), // Cap at 100%
          lessonsCompleted: lessonsRes?.data?.completed || 0,
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

  const DashboardCard = ({ title, value, subtitle, icon, onPress, color }) => (
    <TouchableOpacity style={[styles.card, { borderLeftColor: color }]} onPress={onPress}>
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle}>{title}</Text>
        <Text style={[styles.cardValue, { color }]}>{value}</Text>
        <Text style={styles.cardSubtitle}>{subtitle}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View>
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

      <View style={styles.grid}>
        <DashboardCard
          title="Total Income"
          value={`$${summary.totalIncome.toFixed(2)}`}
          subtitle="View income details"
          color="#4CAF50"
          onPress={() => navigation.navigate('IncomeTracker')}
        />
        
        <DashboardCard
          title="Savings Goals"
          value={`${Math.round(summary.goalProgress)}%`}
          subtitle="Overall progress"
          color="#2196F3"
          onPress={() => navigation.navigate('SavingsGoals')}
        />

        <DashboardCard
          title="Financial Literacy"
          value={summary.lessonsCompleted.toString()}
          subtitle="Lessons completed"
          color="#9C27B0"
          onPress={() => navigation.navigate('LiteracyHub')}
        />

        <DashboardCard
          title="Community"
          value={summary.communityThreads.toString()}
          subtitle="Active discussions"
          color="#FF9800"
          onPress={() => navigation.navigate('SupportCommunity')}
        />
      </View>

      <View style={styles.quickActions}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => navigation.navigate('IncomeTracker')}
        >
          <Text style={styles.actionButtonText}>Track New Income</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => navigation.navigate('SavingsGoals')}
        >
          <Text style={styles.actionButtonText}>Set New Savings Goal</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => navigation.navigate('LiteracyHub')}
        >
          <Text style={styles.actionButtonText}>Start New Lesson</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => navigation.navigate('SupportCommunity')}
        >
          <Text style={styles.actionButtonText}>Ask Community Question</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 20,
    paddingTop: 40,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  profileButton: {
    padding: 4,
  },
  profileIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#4CAF50',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileIconText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  sidebar: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 280,
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: -2, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  sidebarHeader: {
    padding: 24,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    alignItems: 'center',
  },
  profileAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#4CAF50',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  profileInitial: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  profileName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    color: '#666',
  },
  sidebarMenu: {
    padding: 16,
  },
  menuItem: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 4,
  },
  menuItemText: {
    fontSize: 16,
    color: '#2c3e50',
    fontWeight: '500',
  },
  menuDivider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 16,
  },
  logoutMenuItem: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#fff5f5',
  },
  logoutMenuItemText: {
    fontSize: 16,
    color: '#f44336',
    fontWeight: '500',
  },
  welcomeText: {
    fontSize: 16,
    color: '#666',
  },
  nameText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  grid: {
    padding: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  card: {
    width: '47%',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    borderLeftWidth: 4,
  },
  cardContent: {
    gap: 8,
  },
  cardTitle: {
    fontSize: 14,
    color: '#666',
  },
  cardValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  cardSubtitle: {
    fontSize: 12,
    color: '#999',
  },
  quickActions: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 12,
  },
  actionButton: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  actionButtonText: {
    fontSize: 16,
    color: '#2c3e50',
    fontWeight: '500',
  },
});