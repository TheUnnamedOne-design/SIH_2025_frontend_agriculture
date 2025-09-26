import React, { useState, useEffect } from 'react';
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
import { useTheme } from '@/contexts/ThemeContext';
// import { useUser } from '@/contexts/userContext'; // Commented out
import { 
  PhoneOff, 
  Mic, 
  MicOff, 
  User, 
  Volume2, 
  Phone, 
  ChevronDown, 
  Settings, 
  FileAudio,
  Cloud,
  CloudOff,
  MessageSquare
} from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ApiService from '@/services/apiService';

// Call states
const CALL_STATES = {
  IDLE: 'idle',
  CONNECTING: 'connecting',
  CONNECTED: 'connected'
};

// Backend Configuration
const BACKEND_CONFIG = {
  DEVELOPMENT_URL: 'http://localhost:5000',
  PRODUCTION_URL: 'https://your-api.com',
  get CURRENT_URL() {
    return __DEV__ ? this.DEVELOPMENT_URL : this.PRODUCTION_URL;
  }
};

interface CallRecording {
  id: string;
  filename: string;
  uri: string;
  duration: number;
  timestamp: number;
  size: number;
  language: string;
  format: 'm4a';
  uploadStatus: 'pending' | 'uploading' | 'uploaded' | 'failed';
}

export default function CallScreen() {
  const { colors } = useTheme();
  const { t, i18n } = useTranslation();
  const insets = useSafeAreaInsets();

  // Dummy user profile - always logged in
  const userProfile = {
    name: 'Ravi Kumar',
    phone: '+91 98765 43210',
    location: 'Guntur, Andhra Pradesh, India',
    farmSize: '5 acres',
    district: 'Guntur',
    state: 'Andhra Pradesh',
    currentCrop: 'rice',
    isLoggedIn: true,
  };
  
  // Call state
  const [callDuration, setCallDuration] = useState(0);
  const [callState, setCallState] = useState(CALL_STATES.IDLE);
  const [isMuted, setIsMuted] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [callStatus, setCallStatus] = useState('Ready to call');
  const [pulseAnim] = useState(new Animated.Value(1));
  const [callLanguage, setCallLanguage] = useState<string>(i18n.language || 'en');
  const [langOpen, setLangOpen] = useState(false);
  
  // Recording state
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [autoRecord, setAutoRecord] = useState(true);
  const [savedRecordings, setSavedRecordings] = useState<CallRecording[]>([]);
  
  // Recording segments state
  const [recordingSegments, setRecordingSegments] = useState<CallRecording[]>([]);
  const [currentSegmentIndex, setCurrentSegmentIndex] = useState(0);
  const [isSendingSegment, setIsSendingSegment] = useState(false);
  
  // Backend connection state
  const [backendConnected, setBackendConnected] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');

  // Call session tracking
  const [callId, setCallId] = useState<string | null>(null);
  const [callStartTime, setCallStartTime] = useState<number | null>(null);

  // Voice query state
  const [isProcessingVoice, setIsProcessingVoice] = useState(false);
  const [lastAIResponse, setLastAIResponse] = useState<string | null>(null);

  // Available languages
  const availableLanguages = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'hi', name: 'हिंदी', flag: '🇮🇳' },
    { code: 'te', name: 'తెలుగు', flag: '🇮🇳' },
    { code: 'ta', name: 'தமிழ்', flag: '🇮🇳' },
    { code: 'ml', name: 'മലയാളം', flag: '🇮🇳' },
    { code: 'kn', name: 'ಕನ್ನಡ', flag: '🇮🇳' },
    { code: 'bn', name: 'বাংলা', flag: '🇧🇩' },
    { code: 'pa', name: 'ਪੰਜਾਬੀ', flag: '🇮🇳' },
  ];

  // Helper function to map short language codes to full names
  const mapLanguageToFull = (langCode: string): string => {
    const languageMap: { [key: string]: string } = {
      'en': 'English',
      'hi': 'Hindi', 
      'te': 'Telugu',
      'ta': 'Tamil',
      'ml': 'Malayalam',
      'kn': 'Kannada',
      'bn': 'Bengali',
      'pa': 'Punjabi',
    };
    return languageMap[langCode] || 'English';
  };

  // Health check function
  const checkBackendConnection = async () => {
    try {
      const apiService = new ApiService(BACKEND_CONFIG.CURRENT_URL);
      const connected = await apiService.checkConnection();
      setBackendConnected(connected);
      console.log('🌐 Backend connection:', connected ? 'Online' : 'Offline');
    } catch (error) {
      setBackendConnected(false);
      console.log('❌ Backend connection failed:', error instanceof Error ? error.message : 'Unknown error');
    }
  };

  // Send voice query to backend
  const sendVoiceQuery = async (audioFilePath: string) => {
    if (!backendConnected) {
      Alert.alert('No Connection', 'Backend server is offline. Please try again later.');
      return;
    }

    try {
      console.log('🎤 Sending voice query with user data...');
      setIsProcessingVoice(true);

      const apiService = new ApiService(BACKEND_CONFIG.CURRENT_URL);
      
      const voiceQueryData = {
        audioFile: {
          uri: audioFilePath,
          name: `voice_query_${Date.now()}.m4a`,
          type: 'audio/mp4',
        },
        district: userProfile.district || 'Guntur',
        state: userProfile.state || 'Andhra Pradesh',
        choice: 1, // 1 for farming advice, 2 for pesticide
        currentCrop: userProfile.currentCrop || 'rice',
        preferredLanguage: mapLanguageToFull(callLanguage),
      };

      console.log('📋 Voice query data:', {
        district: voiceQueryData.district,
        state: voiceQueryData.state,
        currentCrop: voiceQueryData.currentCrop,
        language: voiceQueryData.preferredLanguage
      });

      const result = await apiService.sendVoiceQuery(voiceQueryData);
      
      if (result.success && result.data) {
        console.log('✅ Voice query successful:', result.data);
        
        const response = result.data;
        setLastAIResponse(response.native_answer);
        
        // Show the response to user
        Alert.alert(
          '🤖 AI Assistant Response',
          `Question: ${response.transcribed_text}\n\n${response.native_answer.substring(0, 200)}${response.native_answer.length > 200 ? '...' : ''}`,
          [
            { text: 'OK' },
            { 
              text: 'View Full Response', 
              onPress: () => showFullResponse(response) 
            }
          ]
        );
        
      } else {
        console.log('❌ Voice query failed:', result.error);
        Alert.alert('Voice Query Failed', result.error || 'Unknown error occurred');
      }
    } catch (error) {
      console.log('❌ Error sending voice query:', error);
      Alert.alert('Error', 'Failed to send voice query. Please try again.');
    } finally {
      setIsProcessingVoice(false);
    }
  };

  // Show full AI response
  const showFullResponse = (response: any) => {
    Alert.alert(
      '🌾 Complete AI Response',
      `❓ Question: ${response.transcribed_text}\n\n💡 Answer: ${response.native_answer}\n\n🔊 Language: ${response.detected_language}`,
      [{ text: 'Close' }]
    );
  };

  // Voice query recording
  const startVoiceQuery = async () => {
    if (callState !== CALL_STATES.CONNECTED) {
      Alert.alert('Not Connected', 'Please connect to a call first to use voice queries.');
      return;
    }

    try {
      console.log('🎤 Starting voice query recording...');
      setIsListening(true);
      
      const hasPermissions = await requestPermissions();
      if (!hasPermissions) {
        setIsListening(false);
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });

      const { recording: voiceRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      
      // Record for 8 seconds
      setTimeout(async () => {
        try {
          await voiceRecording.stopAndUnloadAsync();
          const uri = voiceRecording.getURI();
          setIsListening(false);
          
          if (uri) {
            console.log('🎤 Voice query recorded, processing...');
            Alert.alert(
              'Processing Voice Query',
              '🤖 Please wait while AI processes your question...',
              [{ text: 'OK' }]
            );
            
            // Send to voice query API
            await sendVoiceQuery(uri);
          }
        } catch (error) {
          console.log('❌ Error stopping voice recording:', error);
          setIsListening(false);
          Alert.alert('Recording Error', 'Failed to process voice recording.');
        }
      }, 8000); // 8 second recording
      
    } catch (error) {
      console.log('❌ Failed to start voice query:', error);
      setIsListening(false);
      Alert.alert('Voice Query Error', 'Failed to start voice recording.');
    }
  };

  // API call when call ends
  const sendCallEndEvent = async (callData: {
    callId: string;
    duration: number;
    startTime: number;
    endTime: number;
    language: string;
    recordingPath?: string | null;
  }) => {
    try {
      console.log('📞 Sending call end event...');
      
      const callEndData = {
        callId: callData.callId,
        userId: userProfile.phone, // Use phone as user ID
        duration: callData.duration,
        startTime: new Date(callData.startTime).toISOString(),
        endTime: new Date(callData.endTime).toISOString(),
        language: callData.language,
        recordingPath: callData.recordingPath || null,
        deviceInfo: {
          platform: Platform.OS,
          version: Platform.Version,
        },
        metadata: {
          wasRecorded: !!callData.recordingPath,
          endedBy: 'user',
          totalSegments: recordingSegments.length,
          userName: userProfile.name,
          userLocation: userProfile.location,
          farmSize: userProfile.farmSize,
          currentCrop: userProfile.currentCrop,
          hadVoiceQueries: !!lastAIResponse,
        }
      };
      
      const apiService = new ApiService(BACKEND_CONFIG.CURRENT_URL);
      const result = await apiService.sendCallEndEvent(callEndData);
      
      if (result.success) {
        console.log('✅ Call end event sent successfully:', result.data);
      } else {
        console.log('❌ Call end event failed:', result.error);
      }
    } catch (error) {
      console.log('❌ Error sending call end event:', error);
    }
  };

  // Upload recording to backend
  const uploadRecordingToBackend = async (filePath: string) => {
    try {
      if (!callId) {
        console.log('❌ No callId available, skipping upload');
        return;
      }
      
      console.log('📤 Starting audio file upload...');
      
      const apiService = new ApiService(BACKEND_CONFIG.CURRENT_URL);
      
      const uploadData = {
        file: {
          uri: filePath,
          name: `call_${callId}_${Date.now()}.m4a`,
          type: 'audio/mp4',
        },
        metadata: {
          userId: userProfile.phone,
          callId: callId,
          duration: callDuration,
          language: callLanguage,
          timestamp: Date.now(),
          isSegment: false,
          userName: userProfile.name,
          userLocation: userProfile.location,
          deviceInfo: {
            platform: Platform.OS,
            version: Platform.Version,
          }
        }
      };

      const result = await apiService.uploadRecording(uploadData);
      
      if (result.success) {
        console.log('✅ Audio file uploaded successfully:', result.data);
      } else {
        console.log('❌ Audio file upload failed:', result.error);
      }
    } catch (error) {
      console.log('❌ Error uploading audio file:', error);
    }
  };

  // Effects
  useEffect(() => {
    checkBackendConnection();
    const interval = setInterval(checkBackendConnection, 15000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    loadRecordingSettings();
  }, []);

  useEffect(() => {
    switch (callState) {
      case CALL_STATES.IDLE:
        setCallStatus(t('call.ready') || 'Ready to call');
        break;
      case CALL_STATES.CONNECTING:
        setCallStatus(t('call.connecting') || 'Connecting...');
        break;
      case CALL_STATES.CONNECTED:
        setCallStatus(t('call.connected') || 'Connected - Ask me anything!');
        break;
    }
  }, [callState, t]);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (callState === CALL_STATES.CONNECTING) {
      timer = setTimeout(() => {
        setCallState(CALL_STATES.CONNECTED);
        const newCallId = `call_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        setCallId(newCallId);
        setCallStartTime(Date.now());
        console.log('📞 Call connected with ID:', newCallId);
      }, 2000);
    }
    return () => clearTimeout(timer);
  }, [callState]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (callState === CALL_STATES.CONNECTED) {
      interval = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [callState]);

  useEffect(() => {
    if (callState === CALL_STATES.CONNECTED && autoRecord && !isRecording) {
      startRecording();
    }
    if (callState === CALL_STATES.IDLE && isRecording) {
      stopRecording();
    }
  }, [callState, autoRecord]);

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

  // Helper functions
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const loadRecordingSettings = async () => {
    try {
      const autoRecordSetting = await AsyncStorage.getItem('autoRecord');
      if (autoRecordSetting !== null) {
        setAutoRecord(JSON.parse(autoRecordSetting));
      }
    } catch (error) {
      console.log('Error loading recording settings:', error);
    }
  };

  const requestPermissions = async () => {
    try {
      const audioPermission = await Audio.requestPermissionsAsync();
      
      if (audioPermission.status !== 'granted') {
        Alert.alert(
          'Microphone Permission Required',
          'Permission to access microphone is required to record calls.',
          [{ text: 'OK' }]
        );
        return false;
      }
      return true;
    } catch (error) {
      console.log('Permission request error:', error);
      return false;
    }
  };

  const startRecording = async () => {
    try {
      const hasPermissions = await requestPermissions();
      if (!hasPermissions) return;

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });

      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      
      setRecording(newRecording);
      setIsRecording(true);
      console.log('🎙️ Recording started');
    } catch (error) {
      console.log('Failed to start recording:', error);
      Alert.alert('Recording Error', 'Failed to start recording. Please try again.');
    }
  };

  const stopRecording = async (): Promise<string | null> => {
    try {
      if (!recording) return null;

      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecording(null);
      setIsRecording(false);

      if (uri) {
        const savedPath = await saveRecording(uri);
        console.log('🎙️ Recording stopped and saved');
        return savedPath;
      }
      
      console.log('🎙️ Recording stopped');
      return null;
    } catch (error) {
      console.log('Failed to stop recording:', error);
      Alert.alert('Recording Error', 'Failed to stop recording.');
      return null;
    }
  };

  const saveRecording = async (uri: string): Promise<string | null> => {
    try {
      const fileInfo = await FileSystem.getInfoAsync(uri);
      if (!fileInfo.exists) {
        throw new Error('Recording file does not exist');
      }

      const timestamp = Date.now();
      const date = new Date(timestamp);
      const dateStr = date.toISOString().split('T')[0];
      const timeStr = date.toTimeString().split(' ')[0].replace(/:/g, '-');
      const filename = `call_${dateStr}_${timeStr}_${callLanguage}.m4a`;

      const recordingsDir = `${FileSystem.documentDirectory}call_recordings/`;
      const dirInfo = await FileSystem.getInfoAsync(recordingsDir);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(recordingsDir, { intermediates: true });
      }

      const localUri = `${recordingsDir}${filename}`;
      await FileSystem.copyAsync({
        from: uri,
        to: localUri,
      });

      const recordingData: CallRecording = {
        id: timestamp.toString(),
        filename,
        uri: localUri,
        duration: callDuration,
        timestamp,
        size: fileInfo.size || 0,
        language: callLanguage,
        format: 'm4a',
        uploadStatus: 'pending',
      };

      const updatedRecordings = [...savedRecordings, recordingData];
      setSavedRecordings(updatedRecordings);
      await AsyncStorage.setItem('savedRecordings', JSON.stringify(updatedRecordings));

      console.log('💾 Recording saved:', filename);
      return localUri;

    } catch (error) {
      console.log('Failed to save recording:', error);
      Alert.alert('Save Error', 'Failed to save recording.');
      return null;
    }
  };

  // Call control functions
  const startCall = () => {
    setCallState(CALL_STATES.CONNECTING);
    setIsMuted(false);
    setCallDuration(0);
    setLastAIResponse(null);
  };

  const resetCall = async () => {
    let recordingPath: string | null = null;
    
    if (isRecording) {
      recordingPath = await stopRecording();
    }

    if (callId && callStartTime) {
      const endTime = Date.now();
      
      // Send call end event to backend
      await sendCallEndEvent({
        callId,
        duration: callDuration,
        startTime: callStartTime,
        endTime,
        language: callLanguage,
        recordingPath: recordingPath,
      });

      // Upload recording if exists
      if (recordingPath && backendConnected) {
        await uploadRecordingToBackend(recordingPath);
      }
    }

    // Reset all state
    setCallState(CALL_STATES.IDLE);
    setCallDuration(0);
    setIsMuted(false);
    setIsListening(false);
    setCallId(null);
    setCallStartTime(null);
    setRecordingSegments([]);
    setCurrentSegmentIndex(0);
    setIsSendingSegment(false);
    setLastAIResponse(null);
    setIsProcessingVoice(false);
    
    console.log('📞 Call ended and reset');
  };

  const endCall = () => {
    if (callState === CALL_STATES.IDLE) return;
    resetCall();
  };

  const handleMute = () => {
    if (callState !== CALL_STATES.CONNECTED) return;
    
    setIsMuted(!isMuted);
    Alert.alert(
      isMuted ? 'Microphone On' : 'Microphone Off',
      isMuted ? 'You can now speak to the assistant' : 'Your microphone is muted'
    );
  };

  const handleSpeaker = () => {
    if (callState !== CALL_STATES.CONNECTED) return;
    Alert.alert('Speaker', 'Speaker mode toggled');
  };

  const showRecordingsList = () => {
    if (savedRecordings.length === 0) {
      Alert.alert('No Recordings', 'No call recordings found.');
      return;
    }

    Alert.alert(
      'Recordings',
      `You have ${savedRecordings.length} saved recordings.`,
      [{ text: 'OK' }]
    );
  };

  // UI Helper functions
  const renderWaveform = () => {
    const bars = Array.from({ length: 5 }, (_, i) => (
      <Animated.View
        key={i}
        style={[
          styles.waveBar,
          {
            height: (isListening || isProcessingVoice) ? Math.random() * 30 + 10 : 5,
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
        return 'Tap the call button to connect with the AI Farming Assistant';
      case CALL_STATES.CONNECTING:
        return 'Connecting you to the AI Farming Assistant...';
      case CALL_STATES.CONNECTED:
        return isProcessingVoice 
          ? '🤖 AI is processing your question...' 
          : 'Connected! Tap the center area or voice button to ask farming questions.';
      default:
        return "";
    }
  };

  const isCallActive = callState === CALL_STATES.CONNECTED || callState === CALL_STATES.CONNECTING;

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    safeArea: {
      flex: 1,
    },
    backendStatus: {
      flexDirection: 'row',
      alignItems: 'center',
      position: 'absolute',
      top: 50,
      right: 20,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
      backgroundColor: colors.surface,
      zIndex: 1000,
    },
    statusText: {
      fontSize: 10,
      marginLeft: 4,
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
    recordingControls: {
      position: 'absolute',
      left: 20,
      top: 12 + insets.top,
      alignItems: 'flex-start',
      zIndex: 1000,
      elevation: 10,
    },
    recordingButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: isRecording ? colors.error + '20' : colors.background,
      marginBottom: 6,
    },
    recordingText: {
      color: isRecording ? colors.error : colors.text,
      fontSize: 11,
      marginLeft: 6,
    },
    recordingDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: colors.error,
    },
    settingsButton: {
      padding: 6,
      borderRadius: 12,
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.border,
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
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 8,
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
      shadowOffset: { width: 0, height: 2 },
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
    speakerButton: {
      backgroundColor: colors.primary,
    },
    recordButton: {
      backgroundColor: isRecording ? colors.error : '#FF9800',
    },
    voiceQueryButton: {
      backgroundColor: '#9C27B0',
      position: 'relative',
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
    disabledButton: {
      opacity: 0.5,
    },
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Backend Status Indicator */}
        <View style={styles.backendStatus}>
          {backendConnected ? (
            <Cloud size={16} color="#4CAF50" />
          ) : (
            <CloudOff size={16} color="#FF4444" />
          )}
          <Text style={[styles.statusText, { color: backendConnected ? '#4CAF50' : '#FF4444' }]}>
            {backendConnected ? 'AI Online' : 'AI Offline'}
          </Text>
        </View>

        <View style={styles.callHeader}>
          {/* Recording Controls */}
          <View style={styles.recordingControls}>
            {isCallActive && (
              <TouchableOpacity
                style={styles.recordingButton}
                onPress={isRecording ? stopRecording : startRecording}
              >
                {isRecording && <View style={styles.recordingDot} />}
                <Text style={styles.recordingText}>
                  {isRecording ? 'Recording...' : 'Record'}
                </Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity
              style={styles.settingsButton}
              onPress={() => {
                Alert.alert(
                  '🤖 AI Assistant Info',
                  `🌐 Server: ${backendConnected ? 'Online' : 'Offline'}\n👤 User: ${userProfile.name}\n📍 Location: ${userProfile.location}\n🌾 Crop: ${userProfile.currentCrop || 'rice'}${callId ? `\n📞 Call ID: ${callId}` : ''}\n🎙️ Recordings: ${savedRecordings.length}${lastAIResponse ? '\n💬 Had AI conversation' : ''}`,
                  [
                    { text: 'Cancel' },
                    { text: 'View Recordings', onPress: showRecordingsList },
                  ]
                );
              }}
            >
              <Settings size={16} color={colors.text} />
            </TouchableOpacity>
          </View>

          {/* Language Controls */}
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

          {/* Avatar with Pulse Animation */}
          <View style={{ position: 'relative' }}>
            {(callState === CALL_STATES.CONNECTED || isProcessingVoice) && (
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

          <Text style={styles.callerName}>🌾 AI Farming Assistant</Text>
          <Text style={styles.callStatus}>{callStatus}</Text>
          {callState === CALL_STATES.CONNECTED && (
            <Text style={styles.callTimer}>{formatTime(callDuration)}</Text>
          )}
        </View>

        <View style={styles.callContent}>
          {callState === CALL_STATES.CONNECTED ? (
            <TouchableOpacity 
              onPress={startVoiceQuery} 
              style={styles.listeningIndicator}
              disabled={isProcessingVoice}
            >
              <Text style={styles.listeningText}>
                {isProcessingVoice 
                  ? '🤖 AI is thinking...' 
                  : isListening 
                    ? '👂 Listening to your question...' 
                    : '🎤 Tap to ask farming questions'}
              </Text>
              {renderWaveform()}
            </TouchableOpacity>
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
            <Text style={styles.userName}>{userProfile.name}</Text>
            <Text style={styles.userLocation}>{userProfile.location}</Text>
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
                styles.voiceQueryButton,
                (callState !== CALL_STATES.CONNECTED || isProcessingVoice) && styles.disabledButton
              ]}
              onPress={startVoiceQuery}
              disabled={callState !== CALL_STATES.CONNECTED || isProcessingVoice}
            >
              <MessageSquare size={24} color="#FFFFFF" />
            </TouchableOpacity>
          )}

          {isCallActive && (
            <TouchableOpacity
              style={[
                styles.controlButton, 
                styles.recordButton,
                callState !== CALL_STATES.CONNECTED && styles.disabledButton
              ]}
              onPress={showRecordingsList}
              disabled={callState !== CALL_STATES.CONNECTED}
            >
              <FileAudio size={24} color="#FFFFFF" />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}
