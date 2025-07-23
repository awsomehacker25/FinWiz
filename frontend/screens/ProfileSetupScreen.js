import React, { useState, useContext, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, Platform } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { AuthContext } from '../context/AuthContext';
import { upsertUserProfile } from '../services/api';

const ProfileSetupScreen = ({ navigation }) => {
  const { user, login } = useContext(AuthContext);
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

  // Pre-fill name if user data is available from sign-up
  useEffect(() => {
    if (user && user.firstName && user.lastName) {
      // Name is already collected in sign-up, no need to pre-fill here
    }
  }, [user]);

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
          password: user?.password || profile.password, // Store password if available
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
        password: user?.password || profile.password, // Store password if available
        ...profile
      });
      // Update user context to mark profile as complete
      await login({ ...user, isNewUser: false });
      navigation.replace('Home');
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to save profile');
    }
  };

  const renderStep1 = () => (
    <View style={styles.step}>
      <Text style={styles.stepTitle}>Basic Information</Text>
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Age *</Text>
        <TextInput
          style={styles.input}
          value={profile.age}
          onChangeText={(text) => setProfile({ ...profile, age: text })}
          placeholder="Enter your age"
          keyboardType="numeric"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Phone Number (Optional)</Text>
        <TextInput
          style={styles.input}
          value={profile.phoneNumber}
          onChangeText={(text) => setProfile({ ...profile, phoneNumber: text })}
          placeholder="Enter your phone number"
          keyboardType="phone-pad"
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
        <TextInput
          style={styles.input}
          placeholder="Enter your occupation"
          value={profile.occupation}
          onChangeText={(text) => setProfile(prev => ({ ...prev, occupation: text }))}
          placeholderTextColor="#666"
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Monthly Income *</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter your monthly income"
          value={profile.monthlyIncome}
          onChangeText={(text) => setProfile(prev => ({ ...prev, monthlyIncome: text }))}
          keyboardType="numeric"
          placeholderTextColor="#666"
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

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content}>
        <Text style={styles.title}>Complete Your Profile</Text>
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
            {step === 3 ? 'Complete' : 'Next'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
    padding: 24,
    paddingTop: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 24,
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
    height: 4,
    backgroundColor: '#e0e0e0',
    borderRadius: 2,
  },
  progressStepActive: {
    backgroundColor: '#4CAF50',
  },
  progressText: {
    color: '#666',
    fontSize: 14,
  },
  stepTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 24,
  },
  inputContainer: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#2c3e50',
    marginBottom: 8,
  },
  input: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  pickerWrapper: {
    backgroundColor: 'white',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
    marginBottom: 16,
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
        color: '#2c3e50',
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
    color: '#2c3e50',
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
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  goalChipSelected: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  goalChipText: {
    color: '#2c3e50',
    fontSize: 14,
  },
  goalChipTextSelected: {
    color: 'white',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    padding: 24,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  button: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  nextButton: {
    backgroundColor: '#4CAF50',
  },
  backButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  backButtonText: {
    color: '#4CAF50',
  },
});

export default ProfileSetupScreen;