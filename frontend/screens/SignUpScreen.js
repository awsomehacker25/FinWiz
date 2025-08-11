import React, { useContext, useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet, Alert, ScrollView, SafeAreaView, Image } from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { upsertUserProfile } from '../services/api';

export default function SignUpScreen({ navigation }) {
  const { login } = useContext(AuthContext);
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateForm = () => {
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.password || !formData.confirmPassword) {
      Alert.alert(t('error'), t('login.validation.fillFields'));
      return false;
    }

    if (!validateEmail(formData.email)) {
      Alert.alert(t('error'), t('login.validation.invalidEmail'));
      return false;
    }

    if (formData.password.length < 6) {
      Alert.alert(t('error'), t('login.validation.passwordLength'));
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      Alert.alert(t('error'), t('signup.validation.passwordMismatch'));
      return false;
    }

    return true;
  };

  const handleSignUp = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      // TODO: Integrate with Azure AD B2C for actual registration
      // For now, we'll simulate a successful registration
      const userData = {
        email: formData.email,
        firstName: formData.firstName,
        lastName: formData.lastName,
        isNewUser: true, // Flag to indicate this is a new user
        password: formData.password, // Store password in user context
      };
      await login(userData);
      // Upsert initial profile
      await upsertUserProfile({
        id: formData.email, // Use email as unique id for now
        email: formData.email,
        firstName: formData.firstName,
        lastName: formData.lastName,
        password: formData.password // Store password in user profile
      });
    } catch (error) {
      Alert.alert(t('error'), error.message || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.logoContainer}>
          <Image
            source={require('../assets/finwiz-logo.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
          <Text style={styles.appName}>FinWiz</Text>
          <Text style={styles.tagline}>{t('login.subtitle')}</Text>
        </View>
 
        <View style={styles.form}>
          <View style={styles.nameRow}>
            <View style={[styles.inputContainer, styles.halfWidth]}>
              <Text style={styles.label}>{t('name')}</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter first name"
                value={formData.firstName}
                onChangeText={(text) => setFormData({...formData, firstName: text})}
                autoCapitalize="words"
                placeholderTextColor="#B0BEC5"
              />
            </View>
 
            <View style={[styles.inputContainer, styles.halfWidth]}>
              <Text style={styles.label}>Last Name</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter last name"
                value={formData.lastName}
                onChangeText={(text) => setFormData({...formData, lastName: text})}
                autoCapitalize="words"
                placeholderTextColor="#B0BEC5"
              />
            </View>
          </View>
 
          <View style={styles.inputContainer}>
            <Text style={styles.label}>{t('email')}</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your email"
              value={formData.email}
              onChangeText={(text) => setFormData({...formData, email: text})}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              placeholderTextColor="#B0BEC5"
            />
          </View>
 
          <View style={styles.inputContainer}>
            <Text style={styles.label}>{t('password')}</Text>
            <TextInput
              style={styles.input}
              placeholder="Create a password"
              value={formData.password}
              onChangeText={(text) => setFormData({...formData, password: text})}
              secureTextEntry
              placeholderTextColor="#B0BEC5"
            />
          </View>
 
          <View style={styles.inputContainer}>
            <Text style={styles.label}>{t('signup.confirmPassword')}</Text>
            <TextInput
              style={styles.input}
              placeholder="Confirm your password"
              value={formData.confirmPassword}
              onChangeText={(text) => setFormData({...formData, confirmPassword: text})}
              secureTextEntry
              placeholderTextColor="#B0BEC5"
            />
          </View>
 
          <TouchableOpacity
            style={[styles.signUpButton, loading && styles.signUpButtonDisabled]}
            onPress={handleSignUp}
            disabled={loading}
          >
            <Text style={styles.signUpButtonText}>
              {loading ? t('loading') : t('signup.title')}
            </Text>
          </TouchableOpacity>
 
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.dividerLine} />
          </View>
 
          <TouchableOpacity style={styles.socialButton}>
            <Text style={styles.socialIcon}>G</Text>
            <Text style={styles.socialButtonText}>Sign up with Google</Text>
          </TouchableOpacity>
        </View>
 
        <View style={styles.footer}>
          <Text style={styles.footerText}>{t('signup.hasAccount')} </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={styles.loginText}>{t('signup.loginNow')}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
 
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#244662',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    paddingBottom: 8,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 48,
    marginBottom: 48,
  },
  logoCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#1A237E',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  logoImage: {
    width: 120,
    height: 120,
    marginBottom: 16,
  },
  appName: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
    letterSpacing: 1,
  },
  tagline: {
    fontSize: 16,
    color: '#B0BEC5',
    textAlign: 'center',
  },
  form: {
    gap: 16,
  },
  nameRow: {
    flexDirection: 'row',
    gap: 12,
  },
  inputContainer: {
    gap: 8,
  },
  halfWidth: {
    flex: 1,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E3F2FD',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  signUpButton: {
    backgroundColor: '#3F51B5',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  signUpButtonDisabled: {
    backgroundColor: '#7986CB',
  },
  signUpButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#546E7A',
  },
  dividerText: {
    marginHorizontal: 16,
    color: '#B0BEC5',
    fontSize: 14,
    fontWeight: '500',
  },
  socialButton: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E3F2FD',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  socialIcon: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#DB4437',
  },
  socialButtonText: {
    color: '#1A237E',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 'auto',
    paddingTop: 16,
    paddingBottom: 16,
  },
  footerText: {
    color: '#B0BEC5',
    fontSize: 14,
  },
  loginText: {
    color: '#64B5F6',
    fontSize: 14,
    fontWeight: '600',
  },
});