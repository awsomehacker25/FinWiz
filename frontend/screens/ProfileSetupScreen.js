import React, { useState, useContext, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, Platform, SafeAreaView, ActivityIndicator } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { MaterialIcons } from '@expo/vector-icons';
import { AuthContext } from '../context/AuthContext';
import { upsertUserProfile, getUserProfileByEmail } from '../services/api';
import SpeechTextInput from '../components/SpeechTextInput';

const ProfileSetupScreen = ({ navigation, route }) => {
  const { user, login } = useContext(AuthContext);
  const isEditing = !!route?.params?.editing;
  const [loadingProfile, setLoadingProfile] = useState(isEditing);
  const [step, setStep] = useState(1);
  const [profile, setProfile] = useState({
    phoneNumber: '',
    age: '',
    occupation: '',
    visaStatus: 'student',
    preferredLanguage: 'english',
    educationLevel: 'bachelors',
    monthlyIncome: '',
    financialGoals: [],
    experience: 'beginner'
  });

  // When opened from Profile Settings (not first-time onboarding), load the
  // existing profile so the user is editing their real data, not blank defaults.
  useEffect(() => {
    if (!isEditing || !user?.email) return;
    (async () => {
      try {
        const existing = await getUserProfileByEmail(user.email);
        if (existing) {
          setProfile(prev => ({
            ...prev,
            phoneNumber: existing.phoneNumber ?? prev.phoneNumber,
            age: existing.age ?? prev.age,
            occupation: existing.occupation ?? prev.occupation,
            visaStatus: existing.visaStatus ?? prev.visaStatus,
            preferredLanguage: existing.preferredLanguage ?? prev.preferredLanguage,
            educationLevel: existing.educationLevel ?? prev.educationLevel,
            monthlyIncome: existing.monthlyIncome ?? prev.monthlyIncome,
            financialGoals: existing.financialGoals ?? prev.financialGoals,
            experience: existing.experience ?? prev.experience,
          }));
        }
      } catch (e) {
        // Fall back to blank defaults if the fetch fails.
      } finally {
        setLoadingProfile(false);
      }
    })();
  }, [isEditing, user?.email]);

  const financialGoalOptions = [
    'Save for Emergency Fund',
    'Build Credit Score',
    'Save for Education',
    'Prepare for Visa Fees',
    'Learn Financial Basics',
    'Start Investing'
  ];

  const experienceOptions = [
    { label: 'Beginner - New to finance', value: 'beginner' },
    { label: 'Intermediate - Some knowledge', value: 'intermediate' },
    { label: 'Advanced - Good understanding', value: 'advanced' },
    { label: 'Expert - Professional experience', value: 'expert' }
  ];

  const visaStatusOptions = [
    { label: 'Student (F-1)', value: 'student' },
    { label: 'Work Visa (H1-B)', value: 'h1b' },
    { label: 'Permanent Resident', value: 'permanent_resident' },
    { label: 'Citizen', value: 'citizen' },
    { label: 'Other', value: 'other' }
  ];

  const languageOptions = [
    { label: 'English', value: 'english' },
    { label: 'Spanish', value: 'spanish' },
    { label: 'Mandarin', value: 'mandarin' },
    { label: 'Hindi', value: 'hindi' }
  ];

  const educationOptions = [
    { label: 'High School', value: 'high_school' },
    { label: 'College', value: 'college' },
    { label: 'Associate\'s Degree', value: 'associates' },
    { label: 'Bachelor\'s Degree', value: 'bachelors' },
    { label: 'Master\'s Degree', value: 'masters' },
    { label: 'Doctorate', value: 'doctorate' },
    { label: 'Other', value: 'other' }
  ];

  const toggleGoal = (goal) => {
    setProfile(prev => ({
      ...prev,
      financialGoals: prev.financialGoals.includes(goal)
        ? prev.financialGoals.filter(g => g !== goal)
        : [...prev.financialGoals, goal]
    }));
  };

  const handleBack = () => {
    setStep(step - 1);
  };

  const handleNext = async () => {
    if (step === 1) {
      if (!profile.age) {
        Alert.alert('Required Field', 'Please enter your age');
        return;
      }
    }
    if (step === 3) {
      await handleSubmit();
    } else {
      // Upsert after each step
      try {
        await upsertUserProfile({
          id: user?.email, // Use email as unique id
          email: user?.email,
          firstName: user?.firstName,
          lastName: user?.lastName,
          ...profile
        });
      } catch (e) {
        Alert.alert('Error', e.message || 'Failed to save profile');
      }
      setStep(step + 1);
    }
  };

  const handleSubmit = async () => {
    try {
      if (!profile.occupation || !profile.monthlyIncome) {
        Alert.alert('Required Fields', 'Please fill in all required fields');
        return;
      }
      // API call to save profile
      await upsertUserProfile({
        id: user?.email,
        email: user?.email,
        firstName: user?.firstName,
        lastName: user?.lastName,
        ...profile
      });
      // Update user context to mark profile as complete
      await login({ ...user, isNewUser: false });
      if (isEditing) {
        // Return to wherever Profile Settings was opened from, rather than
        // replacing it with a second Home screen on the stack.
        navigation.goBack();
      } else {
        navigation.replace('Home');
      }
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to save profile');
    }
  };

  const renderStep1 = () => (
    <View style={styles.step}>
      <Text style={styles.stepTitle}>Basic Information</Text>
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Age *</Text>
        <SpeechTextInput
          inputStyle={styles.input}
          value={profile.age}
          onChangeText={(text) => setProfile({ ...profile, age: text })}
          placeholder="Enter your age"
          keyboardType="numeric"
          placeholderTextColor="#B0BEC5"
        />
      </View>
 
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Phone Number (Optional)</Text>
        <SpeechTextInput
          inputStyle={styles.input}
          value={profile.phoneNumber}
          onChangeText={(text) => setProfile({ ...profile, phoneNumber: text })}
          placeholder="Enter your phone number"
          keyboardType="phone-pad"
          placeholderTextColor="#B0BEC5"
        />
      </View>
 
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Education Level</Text>
        <View style={styles.pickerWrapper}>
          <Picker
            selectedValue={profile.educationLevel}
            onValueChange={(value) => setProfile(prev => ({ ...prev, educationLevel: value }))}
            style={[styles.picker, Platform.OS === 'ios' && styles.pickerIOS]}
            itemStyle={Platform.OS === 'ios' ? styles.pickerItemIOS : {}}
          >
            {educationOptions.map((option) => (
              <Picker.Item
                key={option.value}
                label={option.label}
                value={option.value}
              />
            ))}
          </Picker>
        </View>
      </View>
 
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Preferred Language</Text>
        <View style={styles.pickerWrapper}>
          <Picker
            selectedValue={profile.preferredLanguage}
            onValueChange={(value) => setProfile(prev => ({ ...prev, preferredLanguage: value }))}
            style={[styles.picker, Platform.OS === 'ios' && styles.pickerIOS]}
            itemStyle={Platform.OS === 'ios' ? styles.pickerItemIOS : {}}
          >
            {languageOptions.map((option) => (
              <Picker.Item
                key={option.value}
                label={option.label}
                value={option.value}
              />
            ))}
          </Picker>
        </View>
      </View>
 
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Visa Status</Text>
        <View style={styles.pickerWrapper}>
          <Picker
            selectedValue={profile.visaStatus}
            onValueChange={(value) => setProfile(prev => ({ ...prev, visaStatus: value }))}
            style={[styles.picker, Platform.OS === 'ios' && styles.pickerIOS]}
            itemStyle={Platform.OS === 'ios' ? styles.pickerItemIOS : {}}
          >
            {visaStatusOptions.map((option) => (
              <Picker.Item
                key={option.value}
                label={option.label}
                value={option.value}
              />
            ))}
          </Picker>
        </View>
      </View>
    </View>
  );
 
  const renderStep2 = () => (
    <>
      <Text style={styles.stepTitle}>Work & Income</Text>
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Occupation *</Text>
        <SpeechTextInput
          inputStyle={styles.input}
          placeholder="Enter your occupation"
          value={profile.occupation}
          onChangeText={(text) => setProfile(prev => ({ ...prev, occupation: text }))}
          placeholderTextColor="#B0BEC5"
        />
      </View>
 
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Monthly Income *</Text>
        <SpeechTextInput
          inputStyle={styles.input}
          placeholder="Enter your monthly income"
          value={profile.monthlyIncome}
          onChangeText={(text) => setProfile(prev => ({ ...prev, monthlyIncome: text }))}
          keyboardType="numeric"
          placeholderTextColor="#B0BEC5"
        />
      </View>
    </>
  );
 
  const renderStep3 = () => (
    <>
      <Text style={styles.stepTitle}>Financial Profile</Text>
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Financial Experience</Text>
        <View style={styles.pickerWrapper}>
          <Picker
            selectedValue={profile.experience}
            onValueChange={(value) => setProfile(prev => ({ ...prev, experience: value }))}
            style={[styles.picker, Platform.OS === 'ios' && styles.pickerIOS]}
            itemStyle={Platform.OS === 'ios' ? styles.pickerItemIOS : {}}
          >
            {experienceOptions.map(option => (
              <Picker.Item
                key={option.value}
                label={option.label}
                value={option.value}
              />
            ))}
          </Picker>
        </View>
      </View>
 
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Financial Goals (Select all that apply) *</Text>
        <View style={styles.goalsContainer}>
          {financialGoalOptions.map((goal) => (
            <TouchableOpacity
              key={goal}
              style={[
                styles.goalChip,
                profile.financialGoals.includes(goal) && styles.goalChipSelected
              ]}
              onPress={() => toggleGoal(goal)}
            >
              <Text
                style={[
                  styles.goalChipText,
                  profile.financialGoals.includes(goal) && styles.goalChipTextSelected
                ]}
              >
                {goal}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </>
  );
 
  if (loadingProfile) {
    return (
      <SafeAreaView style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content}>
        {isEditing && (
          <TouchableOpacity style={styles.closeButton} onPress={() => navigation.goBack()}>
            <MaterialIcons name="close" size={24} color="#ffffff" />
          </TouchableOpacity>
        )}
        <Text style={styles.title}>{isEditing ? 'Edit Your Profile' : 'Complete Your Profile'}</Text>
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            {[1, 2, 3].map((s) => (
              <View
                key={s}
                style={[
                  styles.progressStep,
                  s <= step && styles.progressStepActive
                ]}
              />
            ))}
          </View>
          <Text style={styles.progressText}>Step {step} of 3</Text>
        </View>
 
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
      </ScrollView>
 
      <View style={styles.buttonContainer}>
        {step > 1 && (
          <TouchableOpacity
            style={[styles.button, styles.backButton]}
            onPress={handleBack}
          >
            <Text style={[styles.buttonText, styles.backButtonText]}>Back</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.button, styles.nextButton]}
          onPress={handleNext}
        >
          <Text style={styles.buttonText}>
            {step === 3 ? (isEditing ? 'Save Changes' : 'Complete') : 'Next'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};
 
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#17384a',
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    alignSelf: 'flex-end',
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#0f2a3a',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  content: {
    flex: 1,
    padding: 24,
    paddingTop: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 24,
    letterSpacing: 0.5,
  },
  progressContainer: {
    marginBottom: 32,
  },
  progressBar: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  progressStep: {
    flex: 1,
    height: 6,
    backgroundColor: '#546E7A',
    borderRadius: 3,
  },
  progressStepActive: {
    backgroundColor: '#64B5F6',
  },
  progressText: {
    color: '#B0BEC5',
    fontSize: 14,
    fontWeight: '500',
  },
  stepTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 24,
    letterSpacing: 0.5,
  },
  inputContainer: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#cfe0ee',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#1f4a62',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2a5f7b',
    padding: 12,
    fontSize: 16,
    color: '#e9f2f9',
  },
  pickerWrapper: {
    backgroundColor: '#1f4a62',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2a5f7b',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    ...Platform.select({
      android: {
        overflow: 'hidden',
      },
      ios: {
        padding: 8,
      }
    })
  },
  picker: {
    ...Platform.select({
      android: {
        height: 50,
        width: '100%',
        color: '#e9f2f9',
      },
      ios: {
        width: '100%',
      }
    })
  },
  pickerIOS: {
    backgroundColor: 'transparent',
  },
  pickerItemIOS: {
    fontSize: 16,
    height: 120,
    color: '#e9f2f9',
  },
  inputGroup: {
    marginBottom: 16,
  },
  goalsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  goalChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#0f2a3a',
    borderWidth: 1,
    borderColor: '#2a5f7b',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  goalChipSelected: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  goalChipText: {
    color: '#cfe0ee',
    fontSize: 14,
    fontWeight: '500',
  },
  goalChipTextSelected: {
    color: '#FFFFFF',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    padding: 24,
    backgroundColor: '#0f2a3a',
    borderTopWidth: 1,
    borderTopColor: '#2a5f7b',
  },
  button: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  nextButton: {
    backgroundColor: '#3B82F6',
  },
  backButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#3B82F6',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  backButtonText: {
    color: '#3B82F6',
  },
});
 
export default ProfileSetupScreen;