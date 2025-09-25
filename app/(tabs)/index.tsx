import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { MessageCircle, Phone, Camera, Cloud, TrendingUp, Building2, Sun, Moon } from 'lucide-react-native';
import { useLanguage } from '@/hooks/useLanguage';
import LanguageSwitcher from '@/app/languageSwitcher';

interface ServiceItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  action: () => void;
  description: string;
}

export default function LandingScreen() {
  const { colors, isDark, toggleTheme } = useTheme();
  const { t } = useLanguage();

  const services: ServiceItem[] = [
    {
      id: '1',
      label: t('landing.chatWithBot'),
      icon: <MessageCircle size={32} color="#FFFFFF" />,
      action: () => router.push('/chat'),
      description: t('landing.textBasedAssistance')
    },
    {
      id: '2',
      label: t('landing.voiceCallBot'),
      icon: <Phone size={32} color="#FFFFFF" />,
      action: () => router.push('/call'),
      description: t('landing.voiceOnlyExperience')
    },
  ];

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
    },
    headerTop: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 16,
    },
    headerContent: {
      flex: 1,
      alignItems: 'center',
    },
    themeToggle: {
      padding: 8,
      borderRadius: 20,
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.border,
      marginTop: -8,
    },
    title: {
      fontSize: 28,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 8,
    },
    subtitle: {
      fontSize: 16,
      color: colors.textSecondary,
      textAlign: 'center',
    },
    servicesContainer: {
      flex: 1,
      padding: 20,
    },
    serviceGrid: {
      flexDirection: 'column',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
    },
    serviceCard: {
      width: '98%',
      backgroundColor: colors.primary,
      borderRadius: 16,
      padding: 20,
      marginBottom: 16,
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 140,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    serviceIcon: {
      marginBottom: 12,
    },
    serviceLabel: {
      fontSize: 16,
      fontWeight: '600',
      color: '#FFFFFF',
      textAlign: 'center',
      marginBottom: 4,
    },
    serviceDescription: {
      fontSize: 12,
      color: '#FFFFFF',
      opacity: 0.9,
      textAlign: 'center',
      lineHeight: 16,
    },
    welcomeSection: {
      backgroundColor: colors.surface,
      margin: 20,
      padding: 20,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    welcomeText: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 8,
    },
    welcomeSubtext: {
      fontSize: 14,
      color: colors.textSecondary,
      lineHeight: 20,
    },
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View style={styles.headerContent}>
              <Text style={styles.title}>{t('landing.title')}</Text>
              <Text style={styles.subtitle}>{t('landing.subtitle')}</Text>
            </View>
            <LanguageSwitcher />
            <TouchableOpacity style={styles.themeToggle} onPress={toggleTheme}>
              {isDark ? <Sun size={20} color={colors.text} /> : <Moon size={20} color={colors.text} />}
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView style={styles.servicesContainer} showsVerticalScrollIndicator={false}>
          <View style={styles.welcomeSection}>
            <Text style={styles.welcomeText}>{t('landing.welcome')}</Text>
            <Text style={styles.welcomeSubtext}>
              {t('landing.description')}
            </Text>
          </View>

          <View style={styles.serviceGrid}>
            {services.map((service) => (
              <TouchableOpacity
                key={service.id}
                style={styles.serviceCard}
                onPress={service.action}
                activeOpacity={0.8}
              >
                <View style={styles.serviceIcon}>
                  {service.icon}
                </View>
                <Text style={styles.serviceLabel}>{service.label}</Text>
                <Text style={styles.serviceDescription}>{service.description}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
