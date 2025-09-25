import { Tabs } from 'expo-router';
import { View, StyleSheet, Animated } from 'react-native';
import { Chrome as Home, MessageCircle, Phone, User, Info, Settings } from 'lucide-react-native';
import { useRef, useEffect } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/hooks/useLanguage';

export default function TabLayout() {
  const { colors, isDark } = useTheme();
  const { t } = useLanguage();
  
  const tabBarStyle = {
    backgroundColor: colors.surface,
    borderTopColor: colors.border,
  };

  const activeColor = colors.primary;
  const inactiveColor = colors.textSecondary;

  const IconWrapper = ({ children, focused }: { children: React.ReactNode; focused: boolean }) => {
    const scaleAnim = useRef(new Animated.Value(focused ? 1 : 0.8)).current;
    const opacityAnim = useRef(new Animated.Value(focused ? 1 : 0)).current;
    const translateYAnim = useRef(new Animated.Value(focused ? 0 : 5)).current;

    useEffect(() => {
      // Scale animation
      Animated.spring(scaleAnim, {
        toValue: focused ? 1 : 0.8,
        useNativeDriver: true,
        tension: 150,
        friction: 8,
      }).start();

      // Background opacity animation
      Animated.timing(opacityAnim, {
        toValue: focused ? 1 : 0,
        duration: 200,
        useNativeDriver: true,
      }).start();

      // Bounce animation
      Animated.spring(translateYAnim, {
        toValue: focused ? 0 : 5,
        useNativeDriver: true,
        tension: 300,
        friction: 10,
      }).start();
    }, [focused]);

    return (
      <Animated.View 
        style={[
          styles.iconContainer,
          {
            transform: [
              { scale: scaleAnim },
              { translateY: translateYAnim }
            ],
          }
        ]}
      >
        <Animated.View
          style={[
            styles.backgroundContainer,
            {
              backgroundColor: activeColor,
              opacity: opacityAnim,
            }
          ]}
        />
        <View style={styles.iconContent}>
          {children}
        </View>
      </Animated.View>
    );
  };

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle,
        tabBarActiveTintColor: '#FFFFFF',
        tabBarInactiveTintColor: inactiveColor,
        tabBarLabelStyle: {
          color: colors.text,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: t('navigation.home'),
          tabBarIcon: ({ size, color, focused }) => (
            <IconWrapper focused={focused}>
              <Home size={size} color={focused ? '#FFFFFF' : color} />
            </IconWrapper>
          ),
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: t('navigation.chat'),
          tabBarIcon: ({ size, color, focused }) => (
            <IconWrapper focused={focused}>
              <MessageCircle size={size} color={focused ? '#FFFFFF' : color} />
            </IconWrapper>
          ),
        }}
      />
      <Tabs.Screen
        name="call"
        options={{
          title: t('navigation.call'),
          tabBarIcon: ({ size, color, focused }) => (
            <IconWrapper focused={focused}>
              <Phone size={size} color={focused ? '#FFFFFF' : color} />
            </IconWrapper>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t('navigation.profile'),
          tabBarIcon: ({ size, color, focused }) => (
            <IconWrapper focused={focused}>
              <User size={size} color={focused ? '#FFFFFF' : color} />
            </IconWrapper>
          ),
        }}
      />
      <Tabs.Screen
        name="faq"
        options={{
          title: t('faq.title'),
          tabBarIcon: ({ color, size, focused }) => (
            <IconWrapper focused={focused}>
              <Info size={size} color={focused ? '#FFFFFF' : color} />
            </IconWrapper>
          ),
        }}
      />
      <Tabs.Screen
        name="Settings"
        options={{
          title: t('navigation.settings'),
          tabBarIcon: ({ color, size, focused }) => (
            <IconWrapper focused={focused}>
              <Settings size={size} color={focused ? '#FFFFFF' : color} />
            </IconWrapper>
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    width: 72,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  backgroundContainer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  iconContent: {
    zIndex: 1,
  },
});
