import React, { useState, useEffect } from 'react';
import { MessageCircle } from 'lucide-react-native';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  SafeAreaView,
  Alert,
  Animated, 
  Platform 
} from 'react-native';
import { router } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { PhoneOff, Mic, MicOff, User, Volume2, Phone, ChevronDown } from 'lucide-react-native';
import { useLanguage } from '@/hooks/useLanguage';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Call states
const CALL_STATES = {
  IDLE: 'idle',
  CONNECTING: 'connecting',
  CONNECTED: 'connected'
};

export default function CallScreen() {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const { availableLanguages, currentLanguage } = useLanguage();
  const insets = useSafeAreaInsets();
  const [callDuration, setCallDuration] = useState(0);
  const [callState, setCallState] = useState(CALL_STATES.IDLE);
  const [isMuted, setIsMuted] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [callStatus, setCallStatus] = useState(t('call.ready') || 'Ready to call');
  const [pulseAnim] = useState(new Animated.Value(1));
  const [callLanguage, setCallLanguage] = useState<string>(currentLanguage);
  const [langOpen, setLangOpen] = useState(false);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [recordingUri, setRecordingUri] = useState<string | null>(null);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    safeArea: {
      flex: 1,
    },
    callHeader: {
      alignItems: 'center',
      paddingVertical: 60,
    },
    headerControls: {
      position: 'absolute',
      right: 20,
      top: 12 + insets.top,
      alignItems: 'flex-end',
      zIndex: 1000,
      elevation: 10,
    },
    dropdownTrigger: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.background,
    },
    dropdownLabel: {
      color: colors.text,
      fontSize: 11,
      marginRight: 6,
      maxWidth: 120,
    },
    dropdownMenu: {
      position: 'absolute',
      right: 0,
      top: 30,
      minWidth: 180,
      marginTop: 6,
      borderRadius: 10,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: 'hidden',
      paddingVertical: 4,
      zIndex: 1001,
      elevation: 12,
    },
    dropdownItem: {
      paddingHorizontal: 12,
      paddingVertical: 10,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    dropdownItemText: {
      color: colors.text,
      fontSize: 12,
      includeFontPadding: false,
      maxWidth: 160,
      flexShrink: 1,
    },
    languageRow: {
      flexDirection: 'row',
      alignItems: 'center',
      flexShrink: 1,
      maxWidth: 240,
    },
    languageFlag: {
      fontSize: 14,
    },
    languageName: {
      marginLeft: 8,
      color: colors.text,
      fontSize: 12,
      lineHeight: 16,
      includeFontPadding: false,
      flexShrink: 1,
    },
    avatar: {
      width: 200,
      height: 200,
      borderRadius: 100,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 20,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 4,
      },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 8,
    },
    callerName: {
      fontSize: 24,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 8,
    },
    callStatus: {
      fontSize: 16,
      color: colors.textSecondary,
      marginBottom: 12,
    },
    callTimer: {
      fontSize: 20,
      fontWeight: '600',
      color: colors.primary,
    },
    callContent: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 40,
    },
    listeningIndicator: {
      alignItems: 'center',
      marginBottom: 40,
    },
    listeningText: {
      fontSize: 18,
      color: colors.text,
      marginBottom: 20,
      textAlign: 'center',
    },
    waveform: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
    },
    waveBar: {
      width: 4,
      marginHorizontal: 2,
      borderRadius: 2,
      backgroundColor: colors.primary,
    },
    instructionText: {
      fontSize: 16,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 24,
      marginBottom: 40,
    },
    controlsContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 40,
      paddingHorizontal: 20,
    },
    controlButton: {
      width: 64,
      height: 64,
      borderRadius: 32,
      alignItems: 'center',
      justifyContent: 'center',
      marginHorizontal: 20,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.2,
      shadowRadius: 4,
      elevation: 4,
    },
    muteButton: {
      backgroundColor: isMuted ? colors.error : colors.textSecondary,
    },
    endCallButton: {
      backgroundColor: colors.error,
      width: 72,
      height: 72,
      borderRadius: 36,
    },
    startCallButton: {
      backgroundColor: '#4CAF50',
      width: 72,
      height: 72,
      borderRadius: 36,
    },
    reconnectButton: {
      backgroundColor: '#FF9800',
      width: 72,
      height: 72,
      borderRadius: 36,
    },
    speakerButton: {
      backgroundColor: colors.primary,
    },
    pulseAnimation: {
      position: 'absolute',
      width: 200,
      height: 200,
      borderRadius: 100,
      borderWidth: 3,
      borderColor: colors.primary,
      opacity: 0.3,
    },
    userInfoContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 16,
    },
    userAvatar: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    userName: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.text,
    },
    userLocation: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    reconnectText: {
      fontSize: 14,
      color: '#FF9800',
      textAlign: 'center',
      marginTop: 8,
    },
    disabledButton: {
      opacity: 0.5,
    },
  });

  // Update call status based on state
  useEffect(() => {
    switch (callState) {
      case CALL_STATES.IDLE:
        setCallStatus(t('call.ready') || 'Ready to call');
        break;
      case CALL_STATES.CONNECTING:
        setCallStatus(t('call.connecting') || 'Connecting...');
        break;
      case CALL_STATES.CONNECTED:
        setCallStatus(t('call.connected') || 'Connected');
        break;
    }
  }, [callState]);

  // Handle call connection
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    
    if (callState === CALL_STATES.CONNECTING) {
      timer = setTimeout(() => {
        setCallState(CALL_STATES.CONNECTED);
      }, 2000); // 2 seconds connection time
    }

    return () => clearTimeout(timer);
  }, [callState]);

  // Start/stop audio recording based on call connection state
  useEffect(() => {
    const run = async () => {
      try {
        if (callState === CALL_STATES.CONNECTED && !recording) {
          const perm = await Audio.requestPermissionsAsync();
          if (perm.status !== 'granted') {
            Alert.alert('Microphone Permission', 'Permission to access microphone is required to record.');
            return;
          }
          await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
          const { recording: rec } = await Audio.Recording.createAsync(
            Audio.RecordingOptionsPresets.HIGH_QUALITY
          );
          setRecording(rec);
          setRecordingUri(null);
        }
        if (callState !== CALL_STATES.CONNECTED && recording) {
          await stopRecording();
        }
      } catch (e) {
        console.log('Recording lifecycle error', e);
      }
    };
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [callState]);

  const stopRecording = async () => {
    try {
      if (recording) {
        await recording.stopAndUnloadAsync();
        const uri = recording.getURI();
        setRecording(null);
        if (uri) setRecordingUri(uri);
      }
    } catch (e) {
      console.log('stopRecording error', e);
    }
  };

  // Call duration timer
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (callState === CALL_STATES.CONNECTED) {
      interval = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [callState]);

  // Pulse animation for avatar
  useEffect(() => {
    const pulse = () => {
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]).start(() => pulse());
    };

    if (callState === CALL_STATES.CONNECTED) {
      pulse();
    }
  }, [callState, pulseAnim]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const startCall = () => {
    setCallState(CALL_STATES.CONNECTING);
    setIsMuted(false);
  };

  const resetCall = () => {
    setCallState(CALL_STATES.IDLE);
    setCallDuration(0);
    setIsMuted(false);
    setIsListening(false);
  };

  const handleMute = () => {
    if (callState !== CALL_STATES.CONNECTED) return;
    
    setIsMuted(!isMuted);
    Alert.alert(
      isMuted ? (t('call.micOnTitle') || 'Microphone On') : (t('call.micOffTitle') || 'Microphone Off'),
      isMuted ? (t('call.micOnMsg') || 'You can now speak to the assistant') : (t('call.micOffMsg') || 'Your microphone is muted')
    );
  };

  const handleSpeaker = () => {
    if (callState !== CALL_STATES.CONNECTED) return;
    Alert.alert(t('call.speakerTitle') || 'Speaker', t('call.speakerMsg') || 'Speaker mode toggled');
  };

  const startListening = () => {
    if (callState !== CALL_STATES.CONNECTED) return;
    
    setIsListening(true);
    setTimeout(() => {
      setIsListening(false);
      Alert.alert(
        t('call.voiceRecognizedTitle') || 'Voice Recognized',
        t('call.voiceRecognizedMsg') || 'Thank you for your question. The assistant is processing your request...',
        [
          {
            text: t('common.ok') || 'OK',
            onPress: () => {
              setTimeout(() => {
                Alert.alert(
                  t('call.assistantResponseTitle') || 'Assistant Response',
                  t('call.assistantResponseMsg') || 'Based on your question about crop diseases, I recommend checking for common symptoms like yellowing leaves or spots. Would you like specific treatment recommendations?'
                );
              }, 1500);
            }
          }
        ]
      );
    }, 3000);
  };

  const endCall = () => {
    if (callState === CALL_STATES.IDLE) return;
    
    Alert.alert(
      "End Call",
      "Are you sure you want to end this call?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "End Call", 
          style: "destructive",
          onPress: async () => {
            await stopRecording();
            await exportAndShareRecording();
            resetCall();
          }
        }
      ]
    );
  };

  const exportAndShareRecording = async () => {
    try {
      if (!recordingUri) return;
      const wavPath = `${FileSystem.cacheDirectory}call_recording_${Date.now()}.wav`;
      await FileSystem.copyAsync({ from: recordingUri, to: wavPath });
      Alert.alert('Recording Saved', `Saved at: ${wavPath}`);
    } catch (e) {
      console.log('export/share error', e);
    }
  };

  const renderWaveform = () => {
    const bars = Array.from({ length: 5 }, (_, i) => (
      <Animated.View
        key={i}
        style={[
          styles.waveBar,
          {
            height: isListening ? Math.random() * 30 + 10 : 5,
          }
        ]}
      />
    ));
    return <View style={styles.waveform}>{bars}</View>;
  };

  const renderMainButton = () => {
    switch (callState) {
      case CALL_STATES.IDLE:
        return (
          <TouchableOpacity
            style={[styles.controlButton, styles.startCallButton]}
            onPress={startCall}
          >
            <Phone size={28} color="#FFFFFF" />
          </TouchableOpacity>
        );
      
      case CALL_STATES.CONNECTING:
        return (
          <TouchableOpacity
            style={[styles.controlButton, styles.endCallButton]}
            onPress={() => resetCall()}
          >
            <PhoneOff size={28} color="#FFFFFF" />
          </TouchableOpacity>
        );
      
      default:
        return (
          <TouchableOpacity
            style={[styles.controlButton, styles.endCallButton]}
            onPress={endCall}
          >
            <PhoneOff size={28} color="#FFFFFF" />
          </TouchableOpacity>
        );
    }
  };

  const getInstructionText = () => {
    switch (callState) {
      case CALL_STATES.IDLE:
        return t('call.instructionIdle') || 'Tap the call button to connect with the Farmer Helpline assistant';
      case CALL_STATES.CONNECTING:
        return t('call.instructionConnecting') || 'Connecting you to the Farmer Helpline assistant...';
      case CALL_STATES.CONNECTED:
        return t('call.instructionConnected') || 'Connected! You can now speak with the assistant.';
      default:
        return "";
    }
  };

  const isCallActive = callState === CALL_STATES.CONNECTED || callState === CALL_STATES.CONNECTING;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.callHeader}>
          <View style={styles.headerControls}>
            <TouchableOpacity
              onPress={() => setLangOpen(!langOpen)}
              style={styles.dropdownTrigger}
              activeOpacity={0.8}
            >
              <Text style={styles.dropdownLabel}>
                {availableLanguages.find(l => l.code === callLanguage)?.name || callLanguage.toUpperCase()}
              </Text>
              <ChevronDown size={14} color={colors.text} />
            </TouchableOpacity>
            {langOpen && (
              <>
              <TouchableOpacity
                activeOpacity={1}
                onPress={() => setLangOpen(false)}
                style={{ position: 'absolute', left: -9999, right: -9999, top: -9999, bottom: -9999 }}
              />
              <View style={styles.dropdownMenu}>
                {availableLanguages.map((lang, idx) => (
                  <TouchableOpacity
                    key={lang.code}
                    onPress={() => { setCallLanguage(lang.code); setLangOpen(false); }}
                    style={[styles.dropdownItem, idx === availableLanguages.length - 1 && { borderBottomWidth: 0 }]}
                  >
                    <View style={styles.languageRow}>
                      <Text style={styles.languageFlag}>{lang.flag}</Text>
                      <Text style={styles.languageName} numberOfLines={1}>{lang.name}</Text>
                    </View>
                    {callLanguage === lang.code && <Text style={styles.dropdownItemText}>✓</Text>}
                  </TouchableOpacity>
                ))}
              </View>
              </>
            )}
          </View>
          <View style={{ position: 'relative' }}>
            {callState === CALL_STATES.CONNECTED && (
              <Animated.View
                style={[
                  styles.pulseAnimation,
                  {
                    transform: [{ scale: pulseAnim }],
                  }
                ]}
              />
            )}
            <View style={styles.avatar}>
              <User size={60} color="#FFFFFF" />
            </View>
          </View>
          <Text style={styles.callerName}>{t('call.botName') || 'Farmer Helpline Bot'}</Text>
          <Text style={styles.callStatus}>{callStatus}</Text>
          {callState === CALL_STATES.CONNECTED && (
            <Text style={styles.callTimer}>{formatTime(callDuration)}</Text>
          )}
        </View>

        <View style={styles.callContent}>
          {callState === CALL_STATES.CONNECTED ? (
            <View style={styles.listeningIndicator}>
              <Text style={styles.listeningText}>
                {isListening ? (t('call.listening') || 'Listening...') : (t('call.tapToSpeak') || 'Tap to speak')}
              </Text>
              {renderWaveform()}
            </View>
          ) : (
            <Text style={styles.instructionText}>
              {getInstructionText()}
            </Text>
          )}
        </View>

        <View style={styles.userInfoContainer}>
          <View style={styles.userAvatar}>
            <User size={40} color={colors.primary} />
          </View>
          <View>
            <Text style={styles.userName}>Ravi Kumar</Text>
            <Text style={styles.userLocation}>Andhra Pradesh, India</Text>
          </View>
        </View>

        <View style={styles.controlsContainer}>
          {isCallActive && (
            <TouchableOpacity
              style={[
                styles.controlButton, 
                styles.muteButton,
                callState !== CALL_STATES.CONNECTED && styles.disabledButton
              ]}
              onPress={handleMute}
              disabled={callState !== CALL_STATES.CONNECTED}
            >
              {isMuted ? (
                <MicOff size={24} color="#fff" />
              ) : (
                <Mic size={24} color="#fff" />
              )}
            </TouchableOpacity>
          )}
          
          {renderMainButton()}

          {isCallActive && (
            <TouchableOpacity
              style={[
                styles.controlButton, 
                styles.speakerButton,
                callState !== CALL_STATES.CONNECTED && styles.disabledButton
              ]}
              onPress={handleSpeaker}
              disabled={callState !== CALL_STATES.CONNECTED}
            >
              <Volume2 size={24} color="#FFFFFF" />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}