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
  CloudOff
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

  // Health check function
  const checkBackendConnection = async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(`${BACKEND_CONFIG.CURRENT_URL}/health`, {
        method: 'GET',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      setBackendConnected(response.ok);
      console.log('Backend connection:', response.ok ? 'Online' : 'Offline');
    } catch (error) {
      setBackendConnected(false);
      console.log('Backend connection failed:', error instanceof Error ? error.message : 'Unknown error');
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
      const callEndData = {
        callId: callData.callId,
        userId: 'user_123', // Replace with actual user ID
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
          totalSegments: recordingSegments.length, // Added segment count
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
          userId: 'user_123',
          callId: callId,
          duration: callDuration,
          language: callLanguage,
          timestamp: Date.now(),
          isSegment: false,
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

  // Send recording segment and start new one
  const sendRecordingSegment = async () => {
    if (!isRecording || !recording) {
      Alert.alert('No Recording', 'No active recording to send.');
      return;
    }

    try {
      setIsSendingSegment(true);
      console.log('📤 Sending recording segment...');

      // Stop current recording
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecording(null);
      setIsRecording(false);

      if (uri) {
        // Save the segment with segment number
        const segmentPath = await saveRecordingSegment(uri, currentSegmentIndex);
        
        if (segmentPath && backendConnected) {
          // Upload the segment immediately
          await uploadRecordingSegment(segmentPath, currentSegmentIndex);
        }

        // Increment segment index
        setCurrentSegmentIndex(prev => prev + 1);
      }

      // Immediately start recording the next segment
      setTimeout(async () => {
        await startRecording();
        setIsSendingSegment(false);
      }, 500);

    } catch (error) {
      console.log('❌ Error sending recording segment:', error);
      Alert.alert('Error', 'Failed to send recording segment.');
      setIsSendingSegment(false);
    }
  };

  // Save recording segment with segment number
  const saveRecordingSegment = async (uri: string, segmentIndex: number): Promise<string | null> => {
    try {
      const fileInfo = await FileSystem.getInfoAsync(uri);
      if (!fileInfo.exists) {
        throw new Error('Recording segment does not exist');
      }

      const timestamp = Date.now();
      const date = new Date(timestamp);
      const dateStr = date.toISOString().split('T')[0];
      const timeStr = date.toTimeString().split(' ')[0].replace(/:/g, '-');
      const filename = `call_${dateStr}_${timeStr}_seg${segmentIndex}_${callLanguage}.m4a`;

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
        id: `${timestamp}_seg${segmentIndex}`,
        filename,
        uri: localUri,
        duration: callDuration,
        timestamp,
        size: fileInfo.size || 0,
        language: callLanguage,
        format: 'm4a',
        uploadStatus: 'pending',
      };

      // Add to segments list
      const updatedSegments = [...recordingSegments, recordingData];
      setRecordingSegments(updatedSegments);

      // Also add to main recordings list
      const updatedRecordings = [...savedRecordings, recordingData];
      setSavedRecordings(updatedRecordings);
      await AsyncStorage.setItem('savedRecordings', JSON.stringify(updatedRecordings));

      console.log('Recording segment saved:', filename);
      return localUri;

    } catch (error) {
      console.log('Failed to save recording segment:', error);
      return null;
    }
  };

  // Upload recording segment
  const uploadRecordingSegment = async (filePath: string, segmentIndex: number) => {
    try {
      if (!callId) {
        console.log('❌ No callId available, skipping segment upload');
        return;
      }
      
      const apiService = new ApiService(BACKEND_CONFIG.CURRENT_URL);
      
      const uploadData = {
        file: {
          uri: filePath,
          name: `call_${callId}_seg${segmentIndex}_${Date.now()}.m4a`,
          type: 'audio/mp4',
        },
        metadata: {
          userId: 'user_123',
          callId: callId,
          segmentIndex: segmentIndex,
          duration: callDuration,
          language: callLanguage,
          timestamp: Date.now(),
          isSegment: true,
          deviceInfo: {
            platform: Platform.OS,
            version: Platform.Version,
          }
        }
      };

      const result = await apiService.uploadRecording(uploadData);
      
      if (result.success) {
        console.log(`✅ Recording segment ${segmentIndex} uploaded successfully:`, result.data);
        Alert.alert(
          'Segment Sent',
          `Recording segment ${segmentIndex + 1} uploaded successfully!\nContinuing recording...`,
          [{ text: 'OK' }]
        );
      } else {
        console.log(`❌ Recording segment ${segmentIndex} upload failed:`, result.error);
        Alert.alert('Upload Failed', 'Failed to upload recording segment.');
      }
    } catch (error) {
      console.log(`❌ Error uploading recording segment ${segmentIndex}:`, error);
      Alert.alert('Upload Error', 'Error uploading recording segment.');
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
        setCallStatus(t('call.connected') || 'Connected');
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
        console.log('Call connected with ID:', newCallId);
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
      console.log('Recording started');
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
        console.log('Recording stopped and saved');
        return savedPath;
      }
      
      console.log('Recording stopped');
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

      console.log('Recording saved:', filename);
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
  };

  const resetCall = async () => {
    let recordingPath: string | null = null;
    
    // Stop recording if active and get the path
    if (isRecording) {
      recordingPath = await stopRecording();
    }

    // Send call end event to backend if we have call session data
    if (callId && callStartTime) {
      const endTime = Date.now();
      await sendCallEndEvent({
        callId,
        duration: callDuration,
        startTime: callStartTime,
        endTime,
        language: callLanguage,
        recordingPath: recordingPath,
      });

      // Upload the final recording if it exists
      if (recordingPath && backendConnected) {
        await uploadRecordingToBackend(recordingPath);
      }
    }

    // Reset all call state including segments
    setCallState(CALL_STATES.IDLE);
    setCallDuration(0);
    setIsMuted(false);
    setIsListening(false);
    setCallId(null);
    setCallStartTime(null);
    setRecordingSegments([]);
    setCurrentSegmentIndex(0);
    setIsSendingSegment(false);
    
    console.log('Call ended and reset');
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

  const startListening = () => {
    if (callState !== CALL_STATES.CONNECTED) return;
    
    setIsListening(true);
    setTimeout(() => {
      setIsListening(false);
      Alert.alert(
        'Voice Recognized',
        'Thank you for your question. The assistant is processing your request...'
      );
    }, 3000);
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
        return 'Tap the call button to connect with the Farmer Helpline assistant';
      case CALL_STATES.CONNECTING:
        return 'Connecting you to the Farmer Helpline assistant...';
      case CALL_STATES.CONNECTED:
        return 'Connected! You can now speak with the assistant.';
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
    sendButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.primary + '20',
      marginBottom: 6,
    },
    sendButtonText: {
      color: colors.primary,
      fontSize: 11,
      fontWeight: '600',
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
            {backendConnected ? 'Server Online' : 'Server Offline'}
          </Text>
        </View>

        <View style={styles.callHeader}>
          {/* Recording Controls */}
          <View style={styles.recordingControls}>
            {isCallActive && (
              <>
                <TouchableOpacity
                  style={styles.recordingButton}
                  onPress={isRecording ? stopRecording : startRecording}
                >
                  {isRecording && <View style={styles.recordingDot} />}
                  <Text style={styles.recordingText}>
                    {isRecording ? 'Recording...' : 'Record'}
                  </Text>
                </TouchableOpacity>

                {/* Send Segment Button */}
                {isRecording && (
                  <TouchableOpacity
                    style={[styles.sendButton, isSendingSegment && styles.disabledButton]}
                    onPress={sendRecordingSegment}
                    disabled={isSendingSegment}
                  >
                    <Text style={styles.sendButtonText}>
                      {isSendingSegment ? 'Sending...' : `Send Seg ${currentSegmentIndex + 1}`}
                    </Text>
                  </TouchableOpacity>
                )}
              </>
            )}
            
            <TouchableOpacity
              style={styles.settingsButton}
              onPress={() => {
                Alert.alert(
                  'Recording Settings',
                  `Server: ${backendConnected ? 'Online' : 'Offline'}\nAuto-record: ${autoRecord ? 'Enabled' : 'Disabled'}\nSaved recordings: ${savedRecordings.length}\nRecording segments: ${recordingSegments.length}${callId ? `\nCurrent Call ID: ${callId}` : ''}`,
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

          <Text style={styles.callerName}>Farmer Helpline Bot</Text>
          <Text style={styles.callStatus}>{callStatus}</Text>
          {callState === CALL_STATES.CONNECTED && (
            <Text style={styles.callTimer}>{formatTime(callDuration)}</Text>
          )}
        </View>

        <View style={styles.callContent}>
          {callState === CALL_STATES.CONNECTED ? (
            <TouchableOpacity onPress={startListening} style={styles.listeningIndicator}>
              <Text style={styles.listeningText}>
                {isListening ? 'Listening...' : 'Tap to speak'}
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
