import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  ScrollView, 
  SafeAreaView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Keyboard
} from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { Send, Mic, Camera, MicOff, ChevronDown } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { useLanguage } from '@/hooks/useLanguage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  type?: 'text' | 'image' | 'voice';
}

export default function ChatScreen() {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const { availableLanguages, currentLanguage } = useLanguage();
  const insets = useSafeAreaInsets();
  const [localLangOpen, setLocalLangOpen] = useState(false);
  const [chatLanguage, setChatLanguage] = useState<string>(currentLanguage);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: t('chat.welcomeMessage') || "Hello! I'm your farming assistant. How can I help you today?",
      isUser: false,
      timestamp: new Date(),
      type: 'text'
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const textInputRef = useRef<TextInput>(null);

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      () => {
        setKeyboardVisible(true);
        // Scroll to bottom when keyboard appears
        setTimeout(() => {
          scrollViewRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }
    );
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => {
        setKeyboardVisible(false);
      }
    );

    return () => {
      keyboardDidHideListener.remove();
      keyboardDidShowListener.remove();
    };
  }, []);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    safeArea: {
      flex: 1,
      backgroundColor: colors.surface,
    },
    keyboardAvoidingView: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      padding: 40,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      backgroundColor: colors.surface,
      justifyContent: 'center',
      alignItems: 'center',
    },
    headerControls: {
      position: 'absolute',
      right: 15,
      top: 16 + insets.top,
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
      top: 34,
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
      maxWidth: 140,
      flexShrink: 1,
    },
    languageRow: {
      flexDirection: 'row',
      alignItems: 'center',
      flexShrink: 1,
      maxWidth: 200,
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
    headerTitle: {
      fontSize: 22,
      fontWeight: 'bold',
      color: colors.text,
      textAlign: 'center',
    },
    messagesContainer: {
      flex: 1,
      padding: 15,
      // paddingBottom: keyboardVisible ? 10 : 15,
    },
    messageBubble: {
      maxWidth: '80%',
      padding: 12,
      borderRadius: 18,
      marginVertical: 4,
    },
    userBubble: {
      backgroundColor: colors.chatBubbleUser,
      alignSelf: 'flex-end',
      borderBottomRightRadius: 4,
    },
    botBubble: {
      backgroundColor: colors.chatBubbleBot,
      alignSelf: 'flex-start',
      borderBottomLeftRadius: 4,
    },
    messageText: {
      fontSize: 16,
      lineHeight: 20,
    },
    userMessageText: {
      color: '#FFFFFF',
    },
    botMessageText: {
      color: colors.text,
    },
    timestamp: {
      fontSize: 11,
      marginTop: 4,
      opacity: 0.7,
    },
    inputContainer: {
      flexDirection: 'row',
      padding: 15,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      backgroundColor: colors.surface,
      alignItems: 'flex-end',
      minHeight: 75,
    },
    textInput: {
      flex: 1,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 25,
      paddingHorizontal: 15,
      paddingVertical: 10,
      marginRight: 10,
      maxHeight: 100,
      minHeight: 44,
      backgroundColor: colors.background,
      color: colors.text,
      fontSize: 16,
      textAlignVertical: 'center',
    },
    textInputFocused: {
      borderColor: colors.primary,
      borderWidth: 2,
    },
    actionButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      marginLeft: 5,
    },
    recordingButton: {
      backgroundColor: colors.error,
    },
    sendButton: {
      backgroundColor: inputText.trim() ? colors.primary : colors.border,
    },
  });

  const sendMessage = async (text: string, type: 'text' | 'image' | 'voice' = 'text') => {
    if (!text.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text,
      isUser: true,
      timestamp: new Date(),
      type,
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');

    // Scroll to bottom after sending message
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);

    // Simulate bot response
    setTimeout(() => {
      const botResponse = generateBotResponse(text);
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: botResponse,
        isUser: false,
        timestamp: new Date(),
        type: 'text',
      };
      setMessages(prev => [...prev, botMessage]);
      
      // Scroll to bottom after bot response
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }, 1000);
  };

  const generateBotResponse = (userMessage: string): string => {
    const responses = [
      "That's a great question about farming! Based on your query, I'd recommend consulting with local agricultural experts for the most accurate advice for your specific region.",
      "For crop-related issues, it's important to consider factors like soil type, weather conditions, and local growing seasons. Would you like me to provide more specific guidance?",
      "Farming practices can vary significantly based on your location and crop type. I suggest checking with your local agricultural extension office for personalized recommendations.",
        t('chat.suggestion4') || "Thank you for reaching out! For the best farming advice, I recommend speaking with agricultural specialists who understand your local conditions.",
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  };

  const handleVoiceInput = () => {
    if (isRecording) {
      // Stop recording
      setIsRecording(false);
      // Simulate voice-to-text conversion
      sendMessage("Voice message: How can I improve my crop yield?", 'voice');
    } else {
      // Start recording
      setIsRecording(true);
      Alert.alert(
        "Voice Recording",
        "Voice recording would start here. This is a demo implementation.",
        [
          { text: "Stop", onPress: () => setIsRecording(false) }
        ]
      );
    }
  };

  const handleImagePicker = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (permissionResult.granted === false) {
      Alert.alert("Permission denied", "Permission to access camera roll is required!");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      sendMessage("Image uploaded: Plant disease identification request", 'image');
    }
  };

  const handleInputFocus = () => {
    // Scroll to bottom when input is focused
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 300);
  };

  const handleSendPress = () => {
    sendMessage(inputText);
    textInputRef.current?.blur();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView 
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <View style={styles.container}>
          <View style={styles.header}>
          <Text style={styles.headerTitle}>{t('chat.title') || 'Farming Assistant'}</Text>
            <View style={styles.headerControls}>
              <TouchableOpacity
                onPress={() => setLocalLangOpen(!localLangOpen)}
                style={styles.dropdownTrigger}
                activeOpacity={0.8}
              >
                <Text style={styles.dropdownLabel}>
                  {availableLanguages.find(l => l.code === chatLanguage)?.name || chatLanguage.toUpperCase()}
                </Text>
                <ChevronDown size={14} color={colors.text} />
              </TouchableOpacity>
              {localLangOpen && (
                <>
                <TouchableOpacity
                  activeOpacity={1}
                  onPress={() => setLocalLangOpen(false)}
                  style={{ position: 'absolute', left: -9999, right: -9999, top: -9999, bottom: -9999 }}
                />
                <View style={styles.dropdownMenu}>
                  {availableLanguages.map((lang, idx) => (
                    <TouchableOpacity
                      key={lang.code}
                      onPress={() => { setChatLanguage(lang.code); setLocalLangOpen(false); }}
                      style={[styles.dropdownItem, idx === availableLanguages.length - 1 && { borderBottomWidth: 0 }]}
                    >
                      <View style={styles.languageRow}>
                        <Text style={styles.languageFlag}>{lang.flag}</Text>
                        <Text style={styles.languageName} numberOfLines={1}>{lang.name}</Text>
                      </View>
                      {chatLanguage === lang.code && <Text style={styles.dropdownItemText}>✓</Text>}
                    </TouchableOpacity>
                  ))}
                </View>
                </>
              )}
            </View>
          </View>

          <ScrollView 
            ref={scrollViewRef}
            style={styles.messagesContainer}
            contentContainerStyle={{ paddingBottom: 10 }}
            onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
            keyboardShouldPersistTaps="handled"
          >
            {messages.map((message) => (
              <View
                key={message.id}
                style={[
                  styles.messageBubble,
                  message.isUser ? styles.userBubble : styles.botBubble,
                ]}
              >
                <Text
                  style={[
                    styles.messageText,
                    message.isUser ? styles.userMessageText : styles.botMessageText,
                  ]}
                >
                  {message.text}
                </Text>
                <Text
                  style={[
                    styles.timestamp,
                    message.isUser ? styles.userMessageText : styles.botMessageText,
                  ]}
                >
                  {message.timestamp.toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </Text>
              </View>
            ))}
          </ScrollView>

          <View style={styles.inputContainer}>
            <TextInput
              ref={textInputRef}
              style={[
                styles.textInput,
                keyboardVisible && styles.textInputFocused
              ]}
              value={inputText}
              onChangeText={setInputText}
              placeholder={t('chat.placeholder') || 'Type your question...'}
              placeholderTextColor={colors.textSecondary}
              multiline
              onFocus={handleInputFocus}
              onSubmitEditing={handleSendPress}
              blurOnSubmit={false}
            />
            
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleImagePicker}
            >
              <Camera size={20} color="#FFFFFF" />
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.actionButton, isRecording && styles.recordingButton]}
              onPress={handleVoiceInput}
            >
              {isRecording ? (
                <MicOff size={20} color="#FFFFFF" />
              ) : (
                <Mic size={20} color="#FFFFFF" />
              )}
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.actionButton, styles.sendButton]}
              onPress={handleSendPress}
              disabled={!inputText.trim()}
            >
              <Send size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}