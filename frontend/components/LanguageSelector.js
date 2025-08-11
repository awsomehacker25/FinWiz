import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { getAvailableLanguages, saveLanguage } from '../localization/i18n';

export default function LanguageSelector({ visible, onClose, onLanguageChange }) {
  const { t, i18n } = useTranslation();
  const languages = getAvailableLanguages();
  const currentLanguage = i18n.language;

  const handleLanguageSelect = async (languageCode) => {
    await saveLanguage(languageCode);
    if (onLanguageChange) {
      onLanguageChange(languageCode);
    }
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.title}>{t('language.selectLanguage')}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>×</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.languageList}>
            {languages.map((language) => (
              <TouchableOpacity
                key={language.code}
                style={[
                  styles.languageItem,
                  currentLanguage === language.code && styles.selectedLanguage
                ]}
                onPress={() => handleLanguageSelect(language.code)}
              >
                <Text style={[
                  styles.languageName,
                  currentLanguage === language.code && styles.selectedLanguageText
                ]}>
                  {language.nativeName}
                </Text>
                <Text style={[
                  styles.languageCode,
                  currentLanguage === language.code && styles.selectedLanguageText
                ]}>
                  {language.name}
                </Text>
                {currentLanguage === language.code && (
                  <Text style={styles.checkmark}>✓</Text>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    width: '85%',
    maxHeight: '70%',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2C3E50',
  },
  closeButton: {
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 15,
    backgroundColor: '#F8F9FA',
  },
  closeButtonText: {
    fontSize: 24,
    color: '#6C757D',
    fontWeight: 'bold',
  },
  languageList: {
    maxHeight: 400,
  },
  languageItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F8F9FA',
  },
  selectedLanguage: {
    backgroundColor: '#E3F2FD',
  },
  languageName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C3E50',
    flex: 1,
  },
  languageCode: {
    fontSize: 14,
    color: '#6C757D',
    marginRight: 10,
  },
  selectedLanguageText: {
    color: '#1976D2',
  },
  checkmark: {
    fontSize: 18,
    color: '#1976D2',
    fontWeight: 'bold',
  },
});
