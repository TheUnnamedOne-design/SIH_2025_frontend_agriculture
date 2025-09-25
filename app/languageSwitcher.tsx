import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  ScrollView,
  Animated,
} from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/hooks/useLanguage';
import { Globe, Check, X } from 'lucide-react-native';

interface LanguageSwitcherProps {
  showAsModal?: boolean;
}

export default function LanguageSwitcher({ showAsModal = true }: LanguageSwitcherProps) {
  const { colors } = useTheme();
  const { t, currentLanguage, changeLanguage, availableLanguages, getCurrentLanguage } = useLanguage();
  const [modalVisible, setModalVisible] = useState(false);

  const handleLanguageChange = (languageCode: string) => {
    changeLanguage(languageCode);
    if (showAsModal) {
      setModalVisible(false);
    }
  };

  const styles = StyleSheet.create({
    trigger: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 12,
      backgroundColor: colors.surface,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
    },
    triggerText: {
      marginLeft: 8,
      fontSize: 14,
      color: colors.text,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContent: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      width: '85%',
      maxHeight: '70%',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 8,
    },
    modalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 20,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
    },
    closeButton: {
      padding: 4,
    },
    languagesList: {
      maxHeight: 400,
    },
    languageItem: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border + '30',
    },
    selectedLanguage: {
      backgroundColor: colors.primary + '15',
    },
    languageFlag: {
      fontSize: 24,
      marginRight: 16,
    },
    languageInfo: {
      flex: 1,
    },
    languageName: {
      fontSize: 16,
      color: colors.text,
      fontWeight: '500',
    },
    languageCode: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 2,
    },
    checkIcon: {
      marginLeft: 12,
    },
  });

  if (!showAsModal) {
    // Inline version for settings screen
    return (
      <View>
        {availableLanguages.map((language) => (
          <TouchableOpacity
            key={language.code}
            style={[
              styles.languageItem,
              currentLanguage === language.code && styles.selectedLanguage,
            ]}
            onPress={() => handleLanguageChange(language.code)}
          >
            <Text style={styles.languageFlag}>{language.flag}</Text>
            <View style={styles.languageInfo}>
              <Text style={styles.languageName}>{language.name}</Text>
              <Text style={styles.languageCode}>{language.code.toUpperCase()}</Text>
            </View>
            {currentLanguage === language.code && (
              <View style={styles.checkIcon}>
                <Check size={20} color={colors.primary} />
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>
    );
  }

  // Modal version
  return (
    <>
      <TouchableOpacity style={styles.trigger} onPress={() => setModalVisible(true)}>
        <Globe size={20} color={colors.text} />
        <Text style={styles.triggerText}>{getCurrentLanguage().name}</Text>
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('settings.selectLanguage')}</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setModalVisible(false)}
              >
                <X size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.languagesList} showsVerticalScrollIndicator={false}>
              {availableLanguages.map((language, index) => (
                <TouchableOpacity
                  key={language.code}
                  style={[
                    styles.languageItem,
                    currentLanguage === language.code && styles.selectedLanguage,
                    index === availableLanguages.length - 1 && { borderBottomWidth: 0 },
                  ]}
                  onPress={() => handleLanguageChange(language.code)}
                >
                  <Text style={styles.languageFlag}>{language.flag}</Text>
                  <View style={styles.languageInfo}>
                    <Text style={styles.languageName}>{language.name}</Text>
                    <Text style={styles.languageCode}>{language.code.toUpperCase()}</Text>
                  </View>
                  {currentLanguage === language.code && (
                    <View style={styles.checkIcon}>
                      <Check size={20} color={colors.primary} />
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}
