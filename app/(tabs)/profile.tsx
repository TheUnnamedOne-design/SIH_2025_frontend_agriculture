import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  Alert 
} from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { User, Phone, MapPin, Building2, Award, Settings } from 'lucide-react-native';
import { useLanguage } from '@/hooks/useLanguage';

interface GovernmentScheme {
  id: string;
  name: string;
  description: string;
  eligibility: string;
  status: 'eligible' | 'applied' | 'approved';
}

export default function ProfileScreen() {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userProfile, setUserProfile] = useState({
    name: 'Farmer Name',
    phone: '+91 98765 43210',
    location: 'Village, District, State',
    farmSize: '5 acres',
  });

  const schemes: GovernmentScheme[] = [
    {
      id: '1',
      name: 'PM-KISAN Scheme',
      description: 'Direct income support of ₹6000 per year to farmer families',
      eligibility: 'All landholding farmer families',
      status: 'approved'
    },
    {
      id: '2',
      name: 'Crop Insurance Scheme',
      description: 'Comprehensive risk solution for crop protection',
      eligibility: 'All farmers growing notified crops',
      status: 'eligible'
    },
    {
      id: '3',
      name: 'Soil Health Card Scheme',
      description: 'Free soil testing and nutrient recommendations',
      eligibility: 'All farmers with agricultural land',
      status: 'applied'
    },
    {
      id: '4',
      name: 'Organic Farming Scheme',
      description: 'Financial assistance for organic farming practices',
      eligibility: 'Farmers adopting organic methods',
      status: 'eligible'
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
      padding: 40,
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
    loginSection: {
      padding: 20,
      alignItems: 'center',
    },
    loginTitle: {
      fontSize: 20,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 20,
    },
    phoneInput: {
      width: '100%',
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      padding: 15,
      fontSize: 16,
      color: colors.text,
      backgroundColor: colors.surface,
      marginBottom: 20,
    },
    loginButton: {
      backgroundColor: colors.primary,
      paddingHorizontal: 40,
      paddingVertical: 15,
      borderRadius: 12,
      width: '100%',
      alignItems: 'center',
    },
    loginButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '600',
    },
    profileSection: {
      backgroundColor: colors.surface,
      margin: 20,
      borderRadius: 16,
      padding: 20,
      borderWidth: 1,
      borderColor: colors.border,
    },
    profileHeader: {
      alignItems: 'center',
      marginBottom: 20,
    },
    avatar: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 12,
    },
    profileName: {
      fontSize: 20,
      fontWeight: 'bold',
      color: colors.text,
    },
    profileDetail: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    profileDetailText: {
      fontSize: 16,
      color: colors.textSecondary,
      marginLeft: 12,
    },
    schemesSection: {
      margin: 20,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 16,
    },
    schemeCard: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    schemeName: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 8,
    },
    schemeDescription: {
      fontSize: 14,
      color: colors.textSecondary,
      lineHeight: 20,
      marginBottom: 8,
    },
    schemeEligibility: {
      fontSize: 12,
      color: colors.textSecondary,
      marginBottom: 12,
    },
    statusBadge: {
      paddingHorizontal: 12,
      paddingVertical: 4,
      borderRadius: 12,
      alignSelf: 'flex-start',
    },
    eligibleBadge: {
      backgroundColor: colors.primary + '20',
    },
    appliedBadge: {
      backgroundColor: '#FFA726' + '20',
    },
    approvedBadge: {
      backgroundColor: '#4CAF50' + '20',
    },
    statusText: {
      fontSize: 12,
      fontWeight: '500',
    },
    eligibleText: {
      color: colors.primary,
    },
    appliedText: {
      color: '#FFA726',
    },
    approvedText: {
      color: '#4CAF50',
    },
  });

  const handleLogin = () => {
    if (phoneNumber.length < 10) {
      Alert.alert(t('auth.invalidPhoneNumber') || 'Invalid Phone Number', t('auth.pleaseEnterValidPhone') || 'Please enter a valid 10-digit phone number');
      return;
    }
    
    setIsLoggedIn(true);
    Alert.alert(t('auth.loginSuccessful') || 'Login Successful', t('auth.welcomeToFarmerHelpline') || 'Welcome to Farmer Helpline!');
  };

  const getStatusBadgeStyle = (status: string) => {
    switch (status) {
      case 'eligible':
        return styles.eligibleBadge;
      case 'applied':
        return styles.appliedBadge;
      case 'approved':
        return styles.approvedBadge;
      default:
        return styles.eligibleBadge;
    }
  };

  const getStatusTextStyle = (status: string) => {
    switch (status) {
      case 'eligible':
        return styles.eligibleText;
      case 'applied':
        return styles.appliedText;
      case 'approved':
        return styles.approvedText;
      default:
        return styles.eligibleText;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'eligible':
        return 'Eligible';
      case 'applied':
        return 'Applied';
      case 'approved':
        return 'Approved';
      default:
        return 'Unknown';
    }
  };

  if (!isLoggedIn) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>{t('common.login') || 'Login'}</Text>
            <Text style={styles.subtitle}>{t('auth.enterPhoneNumber') || 'Enter your phone number to continue'}</Text>
          </View>
          
          <View style={styles.loginSection}>
            <Text style={styles.loginTitle}>{t('auth.phoneNumberLogin') || 'Phone Number Login'}</Text>
            <TextInput
              style={styles.phoneInput}
              placeholder={t('auth.enterYourPhoneNumber') || 'Enter your phone number'}
              placeholderTextColor={colors.textSecondary}
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              keyboardType="phone-pad"
              maxLength={10}
            />
            <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
              <Text style={styles.loginButtonText}>{t('common.continue') || 'Continue'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>{t('profile.title') || 'Profile'}</Text>
          <Text style={styles.subtitle}>{t('profile.subtitle') || 'Your account and government schemes'}</Text>
        </View>
      
        <ScrollView>
          <View style={styles.profileSection}>
            <View style={styles.profileHeader}>
              <View style={styles.avatar}>
                <User size={40} color="#FFFFFF" />
              </View>
              <Text style={styles.profileName}>{userProfile.name}</Text>
            </View>

            <View style={styles.profileDetail}>
              <Phone size={16} color={colors.textSecondary} />
              <Text style={styles.profileDetailText}>{userProfile.phone}</Text>
            </View>

            <View style={styles.profileDetail}>
              <MapPin size={16} color={colors.textSecondary} />
              <Text style={styles.profileDetailText}>{userProfile.location}</Text>
            </View>

            <View style={styles.profileDetail}>
              <Building2 size={16} color={colors.textSecondary} />
              <Text style={styles.profileDetailText}>{t('profile.farmSize') || 'Farm Size'}: {userProfile.farmSize}</Text>
            </View>
          </View>

          <View style={styles.schemesSection}>
            <Text style={styles.sectionTitle}>{t('profile.governmentSchemes') || 'Government Schemes'}</Text>
            {schemes.map((scheme) => (
              <View key={scheme.id} style={styles.schemeCard}>
                <Text style={styles.schemeName}>{scheme.name}</Text>
                <Text style={styles.schemeDescription}>{scheme.description}</Text>
                <Text style={styles.schemeEligibility}>
                  {(t('profile.eligibility') || 'Eligibility')}: {scheme.eligibility}
                </Text>
                <View style={[styles.statusBadge, getStatusBadgeStyle(scheme.status)]}>
                  <Text style={[styles.statusText, getStatusTextStyle(scheme.status)]}>
                    {getStatusText(scheme.status)}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}