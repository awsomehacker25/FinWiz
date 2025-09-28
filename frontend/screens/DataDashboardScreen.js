import React, { useContext, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, ActivityIndicator } from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { BarChart, PieChart, LineChart } from 'react-native-chart-kit';
import { MaterialIcons } from '@expo/vector-icons';
import { Svg, Rect, Text as SvgText, G, Line } from 'react-native-svg';
import api, { getLiteracyProgress } from '../services/api';
import { useTranslation } from 'react-i18next';

const screenWidth = Dimensions.get('window').width;

export default function DataDashboardScreen({ navigation }) {
  const { user } = useContext(AuthContext);
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({
    income: [],
    spending: [],
    goals: [],
    literacy: { lessons: {} },
    community: []
  });

  useEffect(() => {
    loadDashboardData();
  }, [user]);

  const loadDashboardData = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const [incomeRes, spendingRes, goalsRes, literacyRes, communityRes] = await Promise.all([
        api.get(`/income?userId=${user.id}`),
        api.get(`/spending?userId=${user.id}`),
        api.get(`/goals?userId=${user.id}`),
        getLiteracyProgress(user.email || user.id),
        api.get('/community')
      ]);

      setDashboardData({
        income: Array.isArray(incomeRes?.data) ? incomeRes.data : [],
        spending: Array.isArray(spendingRes?.data) ? spendingRes.data : [],
        goals: Array.isArray(goalsRes?.data) ? goalsRes.data : [],
        literacy: literacyRes || { lessons: {} },
        community: Array.isArray(communityRes?.data) ? communityRes.data : []
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Process data for charts
  const getMonthlyIncomeSpending = () => {
    const monthlyData = {};
    const now = new Date();

    // Initialize last 6 months
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      monthlyData[key] = { income: 0, spending: 0 };
    }

    // Aggregate income - handle different possible data formats and date parsing
    dashboardData.income.forEach(entry => {
      if (entry.date) {
        let date;
        try {
          // Handle different date formats
          if (typeof entry.date === 'string') {
            date = new Date(entry.date);
          } else if (entry.date instanceof Date) {
            date = entry.date;
          } else {
            return; // Skip invalid dates
          }

          // Check if date is valid
          if (isNaN(date.getTime())) return;

          const key = date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
          if (monthlyData[key]) {
            monthlyData[key].income += Number(entry.amount) || 0;
          }
        } catch (error) {
          console.warn('Error parsing income date:', entry.date, error);
        }
      }
    });

    // Aggregate spending - handle different possible data formats and date parsing
    dashboardData.spending.forEach(entry => {
      if (entry.date) {
        let date;
        try {
          // Handle different date formats
          if (typeof entry.date === 'string') {
            date = new Date(entry.date);
          } else if (entry.date instanceof Date) {
            date = entry.date;
          } else {
            return; // Skip invalid dates
          }

          // Check if date is valid
          if (isNaN(date.getTime())) return;

          const key = date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
          if (monthlyData[key]) {
            // Handle both 'amount' and 'price' fields, and ensure it's a number
            const amount = Number(entry.amount) || Number(entry.price) || 0;
            monthlyData[key].spending += amount;
          }
        } catch (error) {
          console.warn('Error parsing spending date:', entry.date, error);
        }
      }
    });

    return Object.entries(monthlyData).map(([month, data]) => ({
      month,
      income: data.income,
      spending: data.spending
    }));
  };

  const getSpendingCategories = () => {
    const categories = {};
    dashboardData.spending.forEach(entry => {
      const category = entry.category || entry.type || 'Other';
      const amount = Number(entry.amount) || Number(entry.price) || 0;
      categories[category] = (categories[category] || 0) + amount;
    });

    const colorPalette = [
      '#FF6B6B', // Red
      '#4CAF50', // Green
      '#FF9800', // Orange
      '#9C27B0', // Purple
      '#3B82F6', // Blue
      '#FFC107', // Yellow
      '#E91E63', // Pink
      '#00BCD4', // Cyan
      '#8BC34A', // Light Green
      '#FF5722'  // Deep Orange
    ];

    return Object.entries(categories)
      .map(([name, amount], index) => ({ 
        name, 
        amount, 
        color: colorPalette[index % colorPalette.length], 
        legendFontColor: '#FFFFFF' 
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 6); // Top 6 categories
  };

  const getSavingsProgress = () => {
    return dashboardData.goals.map(goal => ({
      name: goal.goalName || 'Unnamed Goal',
      progress: goal.target ? ((goal.saved || 0) / goal.target) * 100 : 0,
      target: goal.target || 0,
      saved: goal.saved || 0,
      deadline: goal.deadline
    }));
  };

  const getLiteracyData = () => {
    const lessons = dashboardData.literacy.lessons || {};
    const completed = Object.values(lessons).filter(l => l.completed).length;
    const total = Object.keys(lessons).length;
    return { completed, total, percentage: total > 0 ? (completed / total) * 100 : 0 };
  };

  const renderStackedBarChart = (data) => {
    if (!data || data.length === 0) return null;

    const chartWidth = screenWidth - 48;
    const chartHeight = 350; // Increased height for more space
    const padding = 60; // Increased padding for y-axis labels
    const barWidth = (chartWidth - padding * 2) / data.length;
    const maxValue = Math.max(...data.map(d => d.income + d.spending));

    if (maxValue === 0) return null; // No data to display

    return (
      <Svg width={chartWidth} height={chartHeight}>
        {/* Y-axis grid lines and labels */}
        {[0, 0.2, 0.4, 0.6, 0.8, 1].map((ratio, i) => {
          const value = maxValue * ratio;
          const y = chartHeight - padding - (chartHeight - padding * 2) * ratio;
          return (
            <G key={i}>
              {/* Grid line */}
              <Line
                x1={padding}
                y1={y}
                x2={chartWidth - padding}
                y2={y}
                stroke="#B0BEC5"
                strokeWidth={1}
                opacity={0.3}
              />
              {/* Label */}
              <SvgText
                x={padding - 10}
                y={y + 4}
                fontSize="12"
                fill="#FFFFFF"
                textAnchor="end"
              >
                {value.toFixed(0)}
              </SvgText>
            </G>
          );
        })}

        {data.map((item, index) => {
          const x = padding + index * barWidth + barWidth * 0.1;
          const barHeight = (chartHeight - padding * 2) * ((item.income + item.spending) / maxValue);
          const spendingHeight = (chartHeight - padding * 2) * (item.spending / maxValue);
          const incomeHeight = (chartHeight - padding * 2) * (item.income / maxValue);
          const y = chartHeight - padding - barHeight;

          return (
            <G key={index}>
              {/* Spending part (bottom) */}
              <Rect
                x={x}
                y={chartHeight - padding - spendingHeight}
                width={barWidth * 0.8}
                height={spendingHeight}
                fill="#FF6B6B"
              />
              {/* Income part (top) */}
              <Rect
                x={x}
                y={y}
                width={barWidth * 0.8}
                height={incomeHeight}
                fill="#4CAF50"
              />
              {/* Month label */}
              <SvgText
                x={x + barWidth * 0.4}
                y={chartHeight - 10}
                fontSize="12"
                fill="#FFFFFF"
                textAnchor="middle"
              >
                {item.month}
              </SvgText>
            </G>
          );
        })}

        {/* Legend */}
        <G>
          <Rect x={padding} y={10} width={12} height={12} fill="#4CAF50" />
          <SvgText x={padding + 16} y={20} fontSize="12" fill="#FFFFFF">Income</SvgText>
          <Rect x={padding + 80} y={10} width={12} height={12} fill="#FF6B6B" />
          <SvgText x={padding + 96} y={20} fontSize="12" fill="#FFFFFF">Spending</SvgText>
        </G>
      </Svg>
    );
  };

  const chartConfig = {
    backgroundColor: '#17384a',
    backgroundGradientFrom: '#17384a',
    backgroundGradientTo: '#17384a',
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForLabels: {
      fontSize: 12,
    },
  };

  const insights = () => {
    const totalIncome = dashboardData.income.reduce((sum, entry) => sum + (Number(entry.amount) || 0), 0);
    const totalSpending = dashboardData.spending.reduce((sum, entry) => sum + (Number(entry.amount) || 0), 0);
    const totalSaved = dashboardData.goals.reduce((sum, goal) => sum + (Number(goal.saved) || 0), 0);
    const literacy = getLiteracyData();
    const communityThreads = dashboardData.community.length;

    // Calculate proper savings rate: (income - spending) / income * 100
    const savingsRate = totalIncome > 0 ? (((totalIncome - totalSpending) / totalIncome) * 100) : 0;

    return [
      {
        title: 'Total Balance',
        value: `$${(totalIncome - totalSpending).toLocaleString()}`,
        icon: 'account-balance-wallet',
        color: totalIncome - totalSpending >= 0 ? '#4CAF50' : '#FF6B6B'
      },
      {
        title: 'Savings Rate',
        value: `${savingsRate.toFixed(1)}%`,
        icon: 'savings',
        color: savingsRate >= 20 ? '#4CAF50' : savingsRate >= 10 ? '#FF9800' : '#FF6B6B'
      },
      {
        title: 'Financial Literacy',
        value: `${literacy.completed}/${literacy.total} lessons`,
        icon: 'school',
        color: '#9C27B0'
      },
      {
        title: 'Community Activity',
        value: `${communityThreads} threads`,
        icon: 'forum',
        color: '#FF9800'
      }
    ];
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    );
  }

  const monthlyData = getMonthlyIncomeSpending();
  const spendingCategories = getSpendingCategories();
  const savingsGoals = getSavingsProgress();

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Financial Dashboard</Text>
        <Text style={styles.headerSubtitle}>Your financial overview at a glance</Text>
      </View>

      {/* Insights Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Insights</Text>
        <View style={styles.insightsGrid}>
          {insights().map((insight, index) => (
            <View key={index} style={styles.insightCard}>
              <View style={[styles.insightIcon, { backgroundColor: insight.color + '20' }]}>
                <MaterialIcons name={insight.icon} size={24} color={insight.color} />
              </View>
              <View style={styles.insightContent}>
                <Text style={styles.insightValue}>{insight.value}</Text>
                <Text style={styles.insightTitle}>{insight.title}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* Monthly Income vs Spending Chart */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Income vs Spending (Last 6 Months)</Text>
        <View style={styles.chartContainer}>
          {monthlyData.some(d => d.income > 0 || d.spending > 0) ? (
            renderStackedBarChart(monthlyData)
          ) : (
            <View style={styles.noDataContainer}>
              <MaterialIcons name="bar-chart" size={48} color="#B0BEC5" />
              <Text style={styles.noDataText}>No income or spending data available</Text>
              <Text style={styles.noDataSubtext}>Start tracking your finances to see your progress here</Text>
            </View>
          )}
        </View>
      </View>

      {/* Spending Categories Pie Chart */}
      {spendingCategories.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Spending by Category</Text>
          <View style={styles.chartContainer}>
            <PieChart
              data={spendingCategories}
              width={screenWidth - 48}
              height={220}
              chartConfig={chartConfig}
              accessor="amount"
              backgroundColor="transparent"
              paddingLeft="15"
              absolute
            />
          </View>
        </View>
      )}

      {/* Savings Goals Progress */}
      {savingsGoals.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Savings Goals Progress</Text>
          <View style={styles.goalsContainer}>
            {savingsGoals.map((goal, index) => {
              const remaining = goal.target - goal.saved;
              const isCompleted = goal.progress >= 100;
              const daysLeft = goal.deadline ? Math.ceil((new Date(goal.deadline) - new Date()) / (1000 * 60 * 60 * 24)) : null;

              return (
                <View key={index} style={[styles.goalItem, isCompleted && styles.goalCompleted]}>
                  <View style={styles.goalHeader}>
                    <View style={styles.goalTitleRow}>
                      <MaterialIcons
                        name={isCompleted ? "check-circle" : "radio-button-unchecked"}
                        size={20}
                        color={isCompleted ? "#4CAF50" : "#3B82F6"}
                      />
                      <Text style={[styles.goalName, isCompleted && styles.goalNameCompleted]}>
                        {goal.name || `Goal ${index + 1}`}
                      </Text>
                    </View>
                    <Text style={[styles.goalProgress, isCompleted && styles.goalProgressCompleted]}>
                      {goal.progress.toFixed(1)}%
                    </Text>
                  </View>

                  <View style={styles.progressBar}>
                    <View
                      style={[styles.progressFill, {
                        width: `${Math.min(goal.progress, 100)}%`,
                        backgroundColor: isCompleted ? "#4CAF50" : "#3B82F6"
                      }]}
                    />
                  </View>

                  <View style={styles.goalDetails}>
                    <View style={styles.goalAmountRow}>
                      <Text style={styles.goalAmount}>
                        ${goal.saved.toLocaleString()} saved
                      </Text>
                      <Text style={styles.goalTarget}>
                        of ${goal.target.toLocaleString()}
                      </Text>
                    </View>

                    {remaining > 0 && (
                      <Text style={styles.goalRemaining}>
                        ${remaining.toLocaleString()} remaining
                      </Text>
                    )}

                    {daysLeft !== null && daysLeft > 0 && (
                      <Text style={[styles.goalDeadline, daysLeft < 30 && styles.goalDeadlineUrgent]}>
                        {daysLeft} days left
                      </Text>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      )}

      {/* Literacy Progress */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Financial Literacy Progress</Text>
        <View style={styles.literacyContainer}>
          <View style={styles.literacyCard}>
            <MaterialIcons name="school" size={48} color="#9C27B0" />
            <View style={styles.literacyContent}>
              <Text style={styles.literacyValue}>
                {getLiteracyData().completed} / {getLiteracyData().total}
              </Text>
              <Text style={styles.literacyLabel}>Lessons Completed</Text>
              <Text style={styles.literacyPercentage}>
                {getLiteracyData().percentage.toFixed(1)}% Complete
              </Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#17384a',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#17384a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: 16,
    marginTop: 16,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 32,
    backgroundColor: '#17384a',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#B0BEC5',
  },
  section: {
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
  insightsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  insightCard: {
    width: '47%',
    backgroundColor: '#0f2a3a',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  insightIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  insightContent: {
    flex: 1,
  },
  insightValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  insightTitle: {
    fontSize: 12,
    color: '#cfe0ee',
    fontWeight: '500',
  },
  chartContainer: {
    backgroundColor: '#0f2a3a',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  chart: {
    borderRadius: 16,
  },
  noDataContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  noDataText: {
    fontSize: 16,
    color: '#B0BEC5',
    marginTop: 16,
    textAlign: 'center',
  },
  noDataSubtext: {
    fontSize: 14,
    color: '#607D8B',
    marginTop: 8,
    textAlign: 'center',
  },
  goalsContainer: {
    gap: 16,
  },
  goalItem: {
    backgroundColor: '#0f2a3a',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  goalCompleted: {
    borderColor: 'rgba(76, 175, 80, 0.3)',
    backgroundColor: 'rgba(76, 175, 80, 0.05)',
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  goalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  goalName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 8,
    flex: 1,
  },
  goalNameCompleted: {
    color: '#4CAF50',
    textDecorationLine: 'line-through',
  },
  goalProgress: {
    fontSize: 16,
    color: '#3B82F6',
    fontWeight: '700',
  },
  goalProgressCompleted: {
    color: '#4CAF50',
  },
  progressBar: {
    height: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 5,
    marginBottom: 16,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#3B82F6',
    borderRadius: 5,
  },
  goalDetails: {
    gap: 8,
  },
  goalAmountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  goalAmount: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '600',
  },
  goalTarget: {
    fontSize: 14,
    color: '#cfe0ee',
  },
  goalRemaining: {
    fontSize: 12,
    color: '#FF9800',
    fontWeight: '500',
  },
  goalDeadline: {
    fontSize: 12,
    color: '#B0BEC5',
    fontStyle: 'italic',
  },
  goalDeadlineUrgent: {
    color: '#FF6B6B',
    fontWeight: '600',
  },
  literacyContainer: {
    backgroundColor: '#0f2a3a',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  literacyCard: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  literacyContent: {
    flex: 1,
    marginLeft: 16,
  },
  literacyValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  literacyLabel: {
    fontSize: 14,
    color: '#cfe0ee',
    marginBottom: 8,
  },
  literacyPercentage: {
    fontSize: 16,
    color: '#9C27B0',
    fontWeight: '600',
  },
  bottomSpacer: {
    height: 40,
  },
});