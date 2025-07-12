import React, { useContext, useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';

export default function HomeScreen({ navigation }) {
  const { user } = useContext(AuthContext);
  const [summary, setSummary] = useState({
    totalIncome: 0,
    goalProgress: 0,
    lessonsCompleted: 0,
    communityThreads: 0
  });

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
        <Text style={styles.welcomeText}>Welcome back,</Text>
        <Text style={styles.nameText}>{user?.name || 'User'}</Text>
      </View>

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
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
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