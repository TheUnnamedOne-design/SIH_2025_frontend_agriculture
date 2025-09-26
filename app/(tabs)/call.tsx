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
import { router } from 'expo-router';
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
  Wifi,
  WifiOff,
  Upload,
  Cloud,
  CloudOff
} from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ApiService from '../../services/apiService';

// Call states
const CALL_STATES = {
  IDLE: 'idle',
  CONNECTING: 'connecting',
  CONNECTED: 'connected'
};

// Backend Configuration
const BACKEND_CONFIG = {
  DEVELOPMENT_URL: 'http://localhost:8000',  // Your local backend
  PRODUCTION_URL: 'https://your-api.com',    // Your production backend
  get CURRENT_URL() {
    return __DEV__ ? this.DEVELOPMENT_URL : this.PRODUCTION_URL;
  }
};

interface CallRecording {
  id: string;
  filename: string;
  uri: string;
  backendId?: string;
  duration: number;
  timestamp: number;
  size: number;
  language: string;
  format: 'm4a' | 'mp3';
  uploadStatus: 'pending' | 'uploading' | 'uploaded' | 'failed';
  backendUrl?: string;
}

export default function CallScreen() {
  const { colors } = useTheme();
  const { t, i18n } = useTranslation();
  const insets = useSafeAreaInsets();
  
  // API Service instance
  const [apiService] = useState(() => new ApiService(BACKEND_CONFIG.CURRENT_URL));
  
  // Call state
  const [callDuration, setCallDuration] = useState(0);
  const [callState, setCallState] = useState(CALL_STATES.IDLE);
  const [isMuted, setIsMuted] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [callStatus, setCallStatus] = useState('Ready to call');
  const [pulseAnim] = useState(new Animated.Value(1));
  const [callLanguage, setCallLanguage] = useState<string>(i18n.language);
  const [langOpen, setLangOpen] = useState(false);
  
  // Recording state
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [recordingUri, setRecordingUri] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [autoRecord, setAutoRecord] = useState(true);
  const [savedRecordings, setSavedRecordings] = useState<CallRecording[]>([]);
  
  // Backend connection state
  const [backendConnected, setBackendConnected] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');

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

  // Check backend connection periodically
  useEffect(() => {
    checkBackendConnection();
    const interval = setInterval(checkBackendConnection, 15000);
    return () => clearInterval(interval);
  }, []);

  // Load settings on mount
  useEffect(() => {
    loadRecordingSettings();
    loadSavedRecordings();
  }, []);

  // Auto-start recording when call connects
  useEffect(() => {
    if (callState === CALL_STATES.CONNECTED && autoRecord && !isRecording) {
      startRecording();
    }
    if (callState === CALL_STATES.IDLE && isRecording) {
      stopRecording();
    }
  }, [callState, autoRecord]);

  const checkBackendConnection = async () => {
    const connected = await apiService.checkConnection();
    setBackendConnected(connected);
  };

  const uploadToBackend = async (recordingData: CallRecording): Promise<boolean> => {
    try {
      setUploadStatus('uploading');
      setUploadProgress(0);

      const uploadData = {
        file: {
          uri: recordingData.uri,
          name: recordingData.filename,
          type: 'audio/mp4',
        },
        metadata: {
          userId: 'user_123', // Replace with actual user ID from your auth system
          callId: recordingData.id,
          duration: recordingData.duration,
          language: recordingData.language,
          timestamp: recordingData.timestamp,
          deviceInfo: {
            platform: Platform.OS,
            version: Platform.Version,
          }
        }
      };

      const response = await apiService.uploadRecording(
        uploadData,
        (progress) => {
          setUploadProgress(progress.percentage);
        }
      );

      if (response.success) {
        setUploadStatus('success');
        console.log('Upload successful:', response.data);
        
        // Update recording with backend details
        const updatedRecording = {
          ...recordingData,
          uploadStatus: 'uploaded' as const,
          backendId: response.data?.id,
          backendUrl: response.data?.url,
        };
        
        await updateRecordingInStorage(updatedRecording);
        return true;
      } else {
        throw new Error(response.error || 'Upload failed');
      }

    } catch (error: any) {
      console.log('Backend upload failed:', error);
      setUploadStatus('error');
      
      // Update recording status to failed
      const failedRecording = {
        ...recordingData,
        uploadStatus: 'failed' as const,
      };
      await updateRecordingInStorage(failedRecording);
      
      return false;
    } finally {
      // Reset upload UI after 3 seconds
      setTimeout(() => {
        setUploadStatus('idle');
        setUploadProgress(0);
      }, 3000);
    }
  };

  const updateRecordingInStorage = async (updatedRecording: CallRecording) => {
    try {
      const updatedRecordings = savedRecordings.map(r => 
        r.id === updatedRecording.id ? updatedRecording : r
      );
      setSavedRecordings(updatedRecordings);
      await AsyncStorage.setItem('savedRecordings', JSON.stringify(updatedRecordings));
    } catch (error) {
      console.log('Failed to update recording in storage:', error);
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
      setRecordingUri(null);

      console.log('Recording started');
    } catch (error) {
      console.log('Failed to start recording:', error);
      Alert.alert('Recording Error', 'Failed to start recording. Please try again.');
    }
  };

  const stopRecording = async () => {
    try {
      if (!recording) return;

      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecording(null);
      setIsRecording(false);

      if (uri) {
        setRecordingUri(uri);
        await saveRecording(uri);
      }

      console.log('Recording stopped');
    } catch (error) {
      console.log('Failed to stop recording:', error);
      Alert.alert('Recording Error', 'Failed to stop recording.');
    }
  };

  const saveRecording = async (uri: string) => {
    try {
      const fileInfo = await FileSystem.getInfoAsync(uri);
      if (!fileInfo.exists) {
        throw new Error('Recording file does not exist');
      }

      // Generate filename with timestamp and language
      const timestamp = Date.now();
      const date = new Date(timestamp);
      const dateStr = date.toISOString().split('T')[0];
      const timeStr = date.toTimeString().split(' ')[0].replace(/:/g, '-');
      const filename = `call_${dateStr}_${timeStr}_${callLanguage}.m4a`;

      // Always save locally first
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

      // Create recording metadata
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

      // Save to local storage
      await saveToPersistentStorage(recordingData);

      // Try to upload to backend if connected
      if (backendConnected) {
        const uploaded = await uploadToBackend(recordingData);
        
        Alert.alert(
          'Recording Saved',
          `Recording saved ${uploaded ? 'and uploaded to server' : 'locally'}!\nDuration: ${formatTime(callDuration)}\nLanguage: ${availableLanguages.find(l => l.code === callLanguage)?.name}`,
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert(
          'Recording Saved Locally',
          `Recording saved to device. Will upload when server is available.\nDuration: ${formatTime(callDuration)}`,
          [{ text: 'OK' }]
        );
      }

    } catch (error) {
      console.log('Failed to save recording:', error);
      Alert.alert('Save Error', 'Failed to save recording.');
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const saveToPersistentStorage = async (recording: CallRecording) => {
    try {
      const updatedRecordings = [...savedRecordings, recording];
      setSavedRecordings(updatedRecordings);
      await AsyncStorage.setItem('savedRecordings', JSON.stringify(updatedRecordings));
    } catch (error) {
      console.log('Error saving to persistent storage:', error);
    }
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

  const loadSavedRecordings = async () => {
    try {
      const recordings = await AsyncStorage.getItem('savedRecordings');
      if (recordings) {
        setSavedRecordings(JSON.parse(recordings));
      }
    } catch (error) {
      console.log('Error loading saved recordings:', error);
    }
  };

  // ... (rest of your existing functions)

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
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
    },
    statusText: {
      fontSize: 10,
      marginLeft: 4,
    },
    uploadProgress: {
      position: 'absolute',
      bottom: 100,
      left: 20,
      right: 20,
      backgroundColor: colors.surface,
      borderRadius: 8,
      padding: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    progressInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
    },
    progressText: {
      fontSize: 12,
      marginLeft: 8,
      color: colors.text,
    },
    progressBar: {
      height: 4,
      backgroundColor: colors.border,
      borderRadius: 2,
      overflow: 'hidden',
    },
    progressFill: {
      height: '100%',
      backgroundColor: colors.primary,
      borderRadius: 2,
    },
    settingsButton: {
      padding: 6,
      borderRadius: 12,
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.border,
    },
  });

  return (
    <SafeAreaView style={{ flex: 1 }}>
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

        {/* Upload Progress Indicator */}
        {uploadStatus !== 'idle' && (
          <View style={styles.uploadProgress}>
            <View style={styles.progressInfo}>
              {uploadStatus === 'uploading' && (
                <>
                  <Upload size={16} color={colors.primary} />
                  <Text style={styles.progressText}>Uploading... {uploadProgress}%</Text>
                </>
              )}
              {uploadStatus === 'success' && (
                <>
                  <Cloud size={16} color="#4CAF50" />
                  <Text style={[styles.progressText, { color: '#4CAF50' }]}>Upload Complete!</Text>
                </>
              )}
              {uploadStatus === 'error' && (
                <>
                  <CloudOff size={16} color="#FF4444" />
                  <Text style={[styles.progressText, { color: '#FF4444' }]}>Upload Failed</Text>
                </>
              )}
            </View>
            {uploadStatus === 'uploading' && (
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${uploadProgress}%` }]} />
              </View>
            )}
          </View>
        )}

        {/* Your existing call interface */}
        {/* Add all your existing JSX here */}
        
      </View>
    </SafeAreaView>
  );
}
