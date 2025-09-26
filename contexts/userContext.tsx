import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface UserProfile {
  name: string;
  phone: string;
  location: string;
  farmSize: string;
  district?: string;
  state?: string;
  currentCrop?: string;
  isLoggedIn: boolean;
} // ✅ Added missing closing brace

interface UserContextType {
  userProfile: UserProfile;
  setUserProfile: (profile: UserProfile) => void;
  updateUserProfile: (updates: Partial<UserProfile>) => void; // ✅ Added <UserProfile>
  login: (phoneNumber: string) => Promise<void>; // ✅ Added <void>
  logout: () => Promise<void>; // ✅ Added <void>
  isLoggedIn: boolean;
} // ✅ Added missing closing brace

const UserContext = createContext<UserContextType | undefined>(undefined); // ✅ Added proper typing

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [userProfile, setUserProfile] = useState<UserProfile>({ // ✅ Added typing
    name: 'Ravi Kumar',
    phone: '+91 98765 43210',
    location: 'Guntur, Andhra Pradesh, India',
    farmSize: '5 acres',
    district: 'Guntur',
    state: 'Andhra Pradesh',
    currentCrop: 'rice',
    isLoggedIn: false,
  });

  // Load user data from storage on app start
  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      const savedProfile = await AsyncStorage.getItem('userProfile');
      if (savedProfile) {
        const profile = JSON.parse(savedProfile);
        setUserProfile(profile);
      }
    } catch (error) {
      console.log('Error loading user profile:', error);
    }
  }; // ✅ Added missing closing brace

  const saveUserProfile = async (profile: UserProfile) => {
    try {
      await AsyncStorage.setItem('userProfile', JSON.stringify(profile));
    } catch (error) {
      console.log('Error saving user profile:', error);
    }
  }; // ✅ Added missing closing brace

  const updateUserProfile = (updates: Partial<UserProfile>) => { // ✅ Added <UserProfile>
    const updatedProfile = { ...userProfile, ...updates };
    setUserProfile(updatedProfile);
    saveUserProfile(updatedProfile);
  };

  const login = async (phoneNumber: string) => {
    // Parse location to extract district and state
    const locationParts = userProfile.location.split(', ');
    const district = locationParts[0] || 'Guntur';
    const state = locationParts[1] || 'Andhra Pradesh';

    const updatedProfile = {
      ...userProfile,
      phone: phoneNumber,
      district,
      state,
      isLoggedIn: true,
    };

    setUserProfile(updatedProfile);
    await saveUserProfile(updatedProfile);
  };

  const logout = async () => {
    const updatedProfile = { ...userProfile, isLoggedIn: false };
    setUserProfile(updatedProfile);
    await saveUserProfile(updatedProfile);
  };

  return (
    <UserContext.Provider
      value={{
        userProfile,
        setUserProfile,
        updateUserProfile,
        login,
        logout,
        isLoggedIn: userProfile.isLoggedIn,
      }}
    >
      {children}
    </UserContext.Provider>
  ); // ✅ Added proper JSX return
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}; // ✅ Added missing closing brace
