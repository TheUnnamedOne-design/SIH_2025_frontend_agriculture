import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  ScrollView, 
  TouchableOpacity,
  Alert,
  Switch
} from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/hooks/useLanguage';
import { 
  Sun, 
  Moon, 
  Globe, 
  LogOut, 
  User, 
  Bell, 
  Shield, 
  Info,
  ChevronRight,
  Check
} from 'lucide-react-native';

export default function SettingsScreen() {
  const { colors, isDark, toggleTheme } = useTheme();
  const { t, currentLanguage, availableLanguages, changeLanguage } = useLanguage();
  const [showLanguageOptions, setShowLanguageOptions] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  const handleLogout = () => {
    Alert.alert(
      t('settings.confirmLogout') || 'Confirm Logout',
      t('settings.logoutMessage') || 'Are you sure you want to log out?',
      [
        {
          text: t('common.cancel') || 'Cancel',
          style: 'cancel',
        },
        {
          text: t('settings.logout') || 'Logout',
          style: 'destructive',
          onPress: () => {
            // Handle logout logic here
            Alert.alert(t('settings.loggedOut') || 'Logged out successfully');
          },
        },
      ]
    );
  };

  const getCurrentLanguageName = () => {
    return availableLanguages.find(lang => lang.code === currentLanguage)?.name || 'English';
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    safeArea: {
      flex: 1,
    },
    header: {
      padding: 20,
      paddingTop: 40,
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      color: colors.text,
      textAlign: 'center',
    },
    subtitle: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: 'center',
      marginTop: 5,
    },
    content: {
      flex: 1,
    },
    section: {
      marginTop: 20,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.textSecondary,
      marginHorizontal: 20,
      marginBottom: 10,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    settingItem: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    firstItem: {
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    settingIcon: {
      marginRight: 16,
      width: 24,
      alignItems: 'center',
    },
    settingContent: {
      flex: 1,
    },
    settingTitle: {
      fontSize: 16,
      fontWeight: '500',
      color: colors.text,
      marginBottom: 2,
    },
    settingDescription: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    settingValue: {
      fontSize: 14,
      color: colors.primary,
      fontWeight: '500',
    },
    settingAction: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    chevronIcon: {
      marginLeft: 8,
    },
    switch: {
      marginLeft: 8,
    },
    languageOptions: {
      backgroundColor: colors.surface,
    },
    languageOption: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      paddingLeft: 56,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    selectedLanguageOption: {
      backgroundColor: colors.primary + '15',
    },
    languageFlag: {
      fontSize: 18,
      marginRight: 12,
    },
    languageName: {
      flex: 1,
      fontSize: 15,
      color: colors.text,
    },
    checkIcon: {
      marginLeft: 8,
    },
    logoutItem: {
      marginTop: 20,
    },
    logoutButton: {
      color: '#FF4444',
    },
    version: {
      textAlign: 'center',
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 20,
      marginBottom: 20,
    },
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>{t('settings.title') || 'Settings'}</Text>
          <Text style={styles.subtitle}>{t('settings.subtitle') || 'Manage your app preferences'}</Text>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Appearance Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('settings.appearance') || 'Appearance'}</Text>
            
            <TouchableOpacity style={[styles.settingItem, styles.firstItem]} onPress={toggleTheme}>
              <View style={styles.settingIcon}>
                {isDark ? <Moon size={20} color={colors.text} /> : <Sun size={20} color={colors.text} />}
              </View>
              <View style={styles.settingContent}>
                <Text style={styles.settingTitle}>{t('settings.theme') || 'Theme'}</Text>
                <Text style={styles.settingDescription}>
                  {isDark ? (t('settings.darkMode') || 'Dark Mode') : (t('settings.lightMode') || 'Light Mode')}
                </Text>
              </View>
              <View style={styles.settingAction}>
                <Switch
                  style={styles.switch}
                  value={isDark}
                  onValueChange={toggleTheme}
                  trackColor={{ false: colors.border, true: colors.primary }}
                  thumbColor={isDark ? '#FFFFFF' : '#FFFFFF'}
                />
              </View>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.settingItem} 
              onPress={() => setShowLanguageOptions(!showLanguageOptions)}
            >
              <View style={styles.settingIcon}>
                <Globe size={20} color={colors.text} />
              </View>
              <View style={styles.settingContent}>
                <Text style={styles.settingTitle}>{t('settings.language') || 'Language'}</Text>
                <Text style={styles.settingValue}>{getCurrentLanguageName()}</Text>
              </View>
              <View style={styles.settingAction}>
                <ChevronRight 
                  size={16} 
                  color={colors.textSecondary}
                  style={[
                    styles.chevronIcon,
                    showLanguageOptions && { transform: [{ rotate: '90deg' }] }
                  ]} 
                />
              </View>
            </TouchableOpacity>

            {/* Language Options */}
            {showLanguageOptions && (
              <View style={styles.languageOptions}>
                {availableLanguages.map((language) => (
                  <TouchableOpacity
                    key={language.code}
                    style={[
                      styles.languageOption,
                      currentLanguage === language.code && styles.selectedLanguageOption,
                    ]}
                    onPress={() => {
                      changeLanguage(language.code);
                      setShowLanguageOptions(false);
                    }}
                  >
                    <Text style={styles.languageFlag}>{language.flag}</Text>
                    <Text style={styles.languageName}>{language.name}</Text>
                    {currentLanguage === language.code && (
                      <View style={styles.checkIcon}>
                        <Check size={16} color={colors.primary} />
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Notifications Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('settings.notifications') || 'Notifications'}</Text>
            
            <View style={[styles.settingItem, styles.firstItem]}>
              <View style={styles.settingIcon}>
                <Bell size={20} color={colors.text} />
              </View>
              <View style={styles.settingContent}>
                <Text style={styles.settingTitle}>{t('settings.pushNotifications') || 'Push Notifications'}</Text>
                <Text style={styles.settingDescription}>
                  {t('settings.receiveUpdates') || 'Receive updates and alerts'}
                </Text>
              </View>
              <View style={styles.settingAction}>
                <Switch
                  style={styles.switch}
                  value={notificationsEnabled}
                  onValueChange={setNotificationsEnabled}
                  trackColor={{ false: colors.border, true: colors.primary }}
                  thumbColor={'#FFFFFF'}
                />
              </View>
            </View>
          </View>

          {/* Account Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('settings.account') || 'Account'}</Text>
            
            <TouchableOpacity style={[styles.settingItem, styles.firstItem]}>
              <View style={styles.settingIcon}>
                <User size={20} color={colors.text} />
              </View>
              <View style={styles.settingContent}>
                <Text style={styles.settingTitle}>{t('settings.editProfile') || 'Edit Profile'}</Text>
                <Text style={styles.settingDescription}>
                  {t('settings.updatePersonalInfo') || 'Update your personal information'}
                </Text>
              </View>
              <View style={styles.settingAction}>
                <ChevronRight size={16} color={colors.textSecondary} style={styles.chevronIcon} />
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.settingItem}>
              <View style={styles.settingIcon}>
                <Shield size={20} color={colors.text} />
              </View>
              <View style={styles.settingContent}>
                <Text style={styles.settingTitle}>{t('settings.privacy') || 'Privacy & Security'}</Text>
                <Text style={styles.settingDescription}>
                  {t('settings.manageDataPrivacy') || 'Manage your data and privacy settings'}
                </Text>
              </View>
              <View style={styles.settingAction}>
                <ChevronRight size={16} color={colors.textSecondary} style={styles.chevronIcon} />
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.settingItem}>
              <View style={styles.settingIcon}>
                <Info size={20} color={colors.text} />
              </View>
              <View style={styles.settingContent}>
                <Text style={styles.settingTitle}>{t('settings.about') || 'About'}</Text>
                <Text style={styles.settingDescription}>
                  {t('settings.appVersion') || 'App version and information'}
                </Text>
              </View>
              <View style={styles.settingAction}>
                <ChevronRight size={16} color={colors.textSecondary} style={styles.chevronIcon} />
              </View>
            </TouchableOpacity>
          </View>

          {/* Logout Section */}
          <View style={[styles.section, styles.logoutItem]}>
            <TouchableOpacity style={[styles.settingItem, styles.firstItem]} onPress={handleLogout}>
              <View style={styles.settingIcon}>
                <LogOut size={20} color="#FF4444" />
              </View>
              <View style={styles.settingContent}>
                <Text style={[styles.settingTitle, styles.logoutButton]}>
                  {t('settings.logout') || 'Logout'}
                </Text>
                <Text style={styles.settingDescription}>
                  {t('settings.signOutAccount') || 'Sign out of your account'}
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          <Text style={styles.version}>Version 1.0.0</Text>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
