import { registerRootComponent } from "expo";
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import 'intl-pluralrules';
import { I18nextProvider } from 'react-i18next';
import i18n from './localization/i18n';
import AuthProvider from './context/AuthContext';
import HomeScreen from './screens/HomeScreen';
import LoginScreen from './screens/LoginScreen';
import SignUpScreen from './screens/SignUpScreen';
import ProfileSetupScreen from './screens/ProfileSetupScreen';
import IncomeTrackerScreen from './screens/IncomeTrackerScreen';
import SavingsGoalsScreen from './screens/SavingsGoalsScreen';
import LiteracyHubScreen from './screens/LiteracyHubScreen';
import SupportCommunityScreen from './screens/SupportCommunityScreen';


const Stack = createStackNavigator();

export default function App() {
  return (
    <I18nextProvider i18n={i18n}>
      <AuthProvider>
        <NavigationContainer>
          <Stack.Navigator 
            initialRouteName="Login"
            screenOptions={{
              headerStyle: {
                backgroundColor: '#17384a',
                shadowColor: 'transparent', // Remove shadow on iOS
                elevation: 0, // Remove shadow on Android
              },
              headerTintColor: '#ffffff',
              headerTitleStyle: {
                fontWeight: 'bold',
              },
              headerTitle: '', // Remove title from all screens
            }}
          >
            <Stack.Screen 
              name="Login" 
              component={LoginScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen 
              name="SignUp" 
              component={SignUpScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen 
              name="ProfileSetup" 
              component={ProfileSetupScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen 
              name="Home" 
              component={HomeScreen}
              options={{ 
                headerShown: false,
                gestureEnabled: false,
                headerLeft: null
              }}
            />
            <Stack.Screen 
              name="IncomeTracker" 
              component={IncomeTrackerScreen}
              options={{ headerTitle: '' }}
            />
            <Stack.Screen 
              name="SavingsGoals" 
              component={SavingsGoalsScreen}
              options={{ headerTitle: '' }}
            />
            <Stack.Screen 
              name="LiteracyHub" 
              component={LiteracyHubScreen}
              options={{ headerTitle: '' }}
            />
            <Stack.Screen 
              name="SupportCommunity" 
              component={SupportCommunityScreen}
              options={{ headerTitle: '' }}
            />
          </Stack.Navigator>
        </NavigationContainer>
      </AuthProvider>
    </I18nextProvider>
  );
} 
registerRootComponent(App);