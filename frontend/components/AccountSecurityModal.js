import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Modal, Alert, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
  deleteUser,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { auth } from '../config/firebaseConfig';
import { deleteAllUserData } from '../services/api';

function friendlyAuthError(error) {
  switch (error.code) {
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Incorrect password. Please try again.';
    case 'auth/weak-password':
      return 'Password is too weak. Please choose a stronger password.';
    case 'auth/requires-recent-login':
      return 'Please re-enter your password to confirm this change.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Please try again later.';
    default:
      return error.message || 'Something went wrong. Please try again.';
  }
}

async function reauthenticate(email, currentPassword) {
  const credential = EmailAuthProvider.credential(email, currentPassword);
  await reauthenticateWithCredential(auth.currentUser, credential);
}

export default function AccountSecurityModal({ visible, onClose, user, onAccountDeleted }) {
  const [mode, setMode] = useState('menu'); // 'menu' | 'changePassword' | 'deleteAccount'
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!visible) {
      // Reset on close so a stale password isn't sitting in state next open.
      setMode('menu');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setSubmitting(false);
    }
  }, [visible]);

  const handleClose = () => {
    if (submitting) return;
    onClose();
  };

  const handleSendResetEmail = () => {
    if (!user?.email) return;
    Alert.alert(
      'Send Password Reset Email',
      `Send a password reset link to ${user.email}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send',
          onPress: async () => {
            try {
              await sendPasswordResetEmail(auth, user.email);
              Alert.alert('Email Sent', 'Check your inbox for a link to reset your password.');
            } catch (err) {
              Alert.alert('Error', friendlyAuthError(err));
            }
          },
        },
      ]
    );
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('Missing Fields', 'Please fill in all fields.');
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert('Weak Password', 'New password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Passwords Don\'t Match', 'Please make sure both new password fields match.');
      return;
    }
    setSubmitting(true);
    try {
      await reauthenticate(user.email, currentPassword);
      await updatePassword(auth.currentUser, newPassword);
      Alert.alert('Success', 'Your password has been updated.');
      setMode('menu');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      Alert.alert('Error', friendlyAuthError(err));
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDeleteAccount = () => {
    if (!currentPassword) {
      Alert.alert('Password Required', 'Enter your password to confirm account deletion.');
      return;
    }
    Alert.alert(
      'Delete Account',
      'This permanently deletes your profile, income, spending, savings goals, and community posts. This cannot be undone. Are you absolutely sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete Account', style: 'destructive', onPress: handleDeleteAccount },
      ]
    );
  };

  const handleDeleteAccount = async () => {
    setSubmitting(true);
    try {
      await reauthenticate(user.email, currentPassword);
      await deleteAllUserData(user.email);
      await deleteUser(auth.currentUser);
      onClose();
      onAccountDeleted?.();
    } catch (err) {
      Alert.alert('Error', friendlyAuthError(err));
      setSubmitting(false);
    }
  };

  const renderMenu = () => (
    <>
      <Text style={styles.modalTitle}>Account Security</Text>

      <TouchableOpacity style={styles.optionRow} onPress={() => setMode('changePassword')}>
        <MaterialIcons name="lock-reset" size={22} color="#cfe0ee" style={styles.optionIcon} />
        <View style={styles.optionTextWrap}>
          <Text style={styles.optionLabel}>Change Password</Text>
          <Text style={styles.optionSubLabel}>Update your password using your current one</Text>
        </View>
        <MaterialIcons name="chevron-right" size={20} color="#546E7A" />
      </TouchableOpacity>

      <TouchableOpacity style={styles.optionRow} onPress={handleSendResetEmail}>
        <MaterialIcons name="email" size={22} color="#cfe0ee" style={styles.optionIcon} />
        <View style={styles.optionTextWrap}>
          <Text style={styles.optionLabel}>Send Password Reset Email</Text>
          <Text style={styles.optionSubLabel}>Forgot your password? Get a reset link by email</Text>
        </View>
        <MaterialIcons name="chevron-right" size={20} color="#546E7A" />
      </TouchableOpacity>

      <TouchableOpacity style={[styles.optionRow, styles.dangerRow]} onPress={() => setMode('deleteAccount')}>
        <MaterialIcons name="delete-forever" size={22} color="#f44336" style={styles.optionIcon} />
        <View style={styles.optionTextWrap}>
          <Text style={[styles.optionLabel, styles.dangerText]}>Delete Account</Text>
          <Text style={styles.optionSubLabel}>Permanently delete your account and data</Text>
        </View>
        <MaterialIcons name="chevron-right" size={20} color="#546E7A" />
      </TouchableOpacity>

      <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
        <Text style={styles.closeButtonText}>Close</Text>
      </TouchableOpacity>
    </>
  );

  const renderChangePassword = () => (
    <>
      <View style={styles.subHeader}>
        <TouchableOpacity onPress={() => setMode('menu')} disabled={submitting}>
          <MaterialIcons name="arrow-back" size={22} color="#cfe0ee" />
        </TouchableOpacity>
        <Text style={styles.modalTitle}>Change Password</Text>
      </View>

      <Text style={styles.inputLabel}>Current Password</Text>
      <TextInput
        style={styles.input}
        value={currentPassword}
        onChangeText={setCurrentPassword}
        secureTextEntry
        placeholder="Enter current password"
        placeholderTextColor="#88a2b6"
        editable={!submitting}
      />

      <Text style={styles.inputLabel}>New Password</Text>
      <TextInput
        style={styles.input}
        value={newPassword}
        onChangeText={setNewPassword}
        secureTextEntry
        placeholder="Enter new password"
        placeholderTextColor="#88a2b6"
        editable={!submitting}
      />

      <Text style={styles.inputLabel}>Confirm New Password</Text>
      <TextInput
        style={styles.input}
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry
        placeholder="Re-enter new password"
        placeholderTextColor="#88a2b6"
        editable={!submitting}
      />

      <TouchableOpacity
        style={[styles.primaryButton, submitting && styles.buttonDisabled]}
        onPress={handleChangePassword}
        disabled={submitting}
      >
        {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryButtonText}>Update Password</Text>}
      </TouchableOpacity>
    </>
  );

  const renderDeleteAccount = () => (
    <>
      <View style={styles.subHeader}>
        <TouchableOpacity onPress={() => setMode('menu')} disabled={submitting}>
          <MaterialIcons name="arrow-back" size={22} color="#cfe0ee" />
        </TouchableOpacity>
        <Text style={styles.modalTitle}>Delete Account</Text>
      </View>

      <Text style={styles.warningText}>
        This will permanently delete your profile, income, spending, savings goals, and community posts. This cannot be undone.
      </Text>

      <Text style={styles.inputLabel}>Confirm Password</Text>
      <TextInput
        style={styles.input}
        value={currentPassword}
        onChangeText={setCurrentPassword}
        secureTextEntry
        placeholder="Enter your password"
        placeholderTextColor="#88a2b6"
        editable={!submitting}
      />

      <TouchableOpacity
        style={[styles.dangerButton, submitting && styles.buttonDisabled]}
        onPress={confirmDeleteAccount}
        disabled={submitting}
      >
        {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryButtonText}>Delete My Account</Text>}
      </TouchableOpacity>
    </>
  );

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={handleClose}
    >
      <TouchableOpacity
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={handleClose}
      >
        <TouchableOpacity activeOpacity={1} style={styles.modalContent} onPress={() => {}}>
          {mode === 'menu' && renderMenu()}
          {mode === 'changePassword' && renderChangePassword()}
          {mode === 'deleteAccount' && renderDeleteAccount()}
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#0f2a3a',
    borderRadius: 16,
    marginHorizontal: 24,
    padding: 20,
    width: '88%',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  subHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: '#1f4a62',
    marginBottom: 8,
  },
  dangerRow: {
    backgroundColor: '#d32f2f20',
  },
  optionIcon: {
    marginRight: 12,
  },
  optionTextWrap: {
    flex: 1,
  },
  optionLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  dangerText: {
    color: '#f44336',
  },
  optionSubLabel: {
    fontSize: 12,
    color: '#cfe0ee',
    marginTop: 2,
  },
  closeButton: {
    marginTop: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#88a2b6',
    fontSize: 15,
    fontWeight: '600',
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#cfe0ee',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#1f4a62',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2a5f7b',
    padding: 12,
    fontSize: 15,
    color: '#e9f2f9',
    marginBottom: 14,
  },
  warningText: {
    fontSize: 14,
    color: '#FF9800',
    marginBottom: 16,
    lineHeight: 20,
  },
  primaryButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  dangerButton: {
    backgroundColor: '#d32f2f',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
