import React, { useState, useRef } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import speechToTextService from '../services/speechToTextService';

const SpeechTextInput = ({
  value,
  onChangeText,
  placeholder,
  style,
  inputStyle,
  microphoneStyle,
  secureTextEntry,
  keyboardType,
  multiline,
  numberOfLines,
  maxLength,
  editable = true,
  ...otherProps
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const recordingRef = useRef(null);

  const requestAudioPermission = async () => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'This app needs access to your microphone to use speech-to-text.',
          [{ text: 'OK' }]
        );
        return false;
      }
      return true;
    } catch (error) {
      console.error('Error requesting audio permission:', error);
      return false;
    }
  };

  const startRecording = async () => {
    try {
      // Check permissions first
      const hasPermission = await requestAudioPermission();
      if (!hasPermission) return;

      console.log('Starting recording...');
      
      // Set audio mode for recording
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const recordingOptions = {
        android: {
          extension: '.wav',
          outputFormat: Audio.RECORDING_OPTION_ANDROID_OUTPUT_FORMAT_DEFAULT,
          audioEncoder: Audio.RECORDING_OPTION_ANDROID_AUDIO_ENCODER_DEFAULT,
          sampleRate: 16000,
          numberOfChannels: 1,
          bitRate: 128000,
        },
        ios: {
          extension: '.wav',
          outputFormat: Audio.RECORDING_OPTION_IOS_OUTPUT_FORMAT_LINEARPCM,
          audioQuality: Audio.RECORDING_OPTION_IOS_AUDIO_QUALITY_HIGH,
          sampleRate: 16000,
          numberOfChannels: 1,
          bitRate: 128000,
          linearPCMBitDepth: 16,
          linearPCMIsBigEndian: false,
          linearPCMIsFloat: false,
        },
      };

      const { recording } = await Audio.Recording.createAsync(recordingOptions);
      recordingRef.current = recording;
      setIsRecording(true);

    } catch (error) {
      console.error('Error starting recording:', error);
      Alert.alert('Recording Error', 'Failed to start recording. Please try again.');
    }
  };

  const stopRecording = async () => {
    try {
      if (!recordingRef.current) return;

      console.log('Stopping recording...');
      
      await recordingRef.current.stopAndUnloadAsync();
      
      const uri = recordingRef.current.getURI();
      setIsRecording(false);
      
      console.log('Recording saved to:', uri);

      // Process the recording
      if (uri) {
        await processRecording(uri);
      }

      recordingRef.current = null;

    } catch (error) {
      console.error('Error stopping recording:', error);
      Alert.alert('Recording Error', 'Failed to stop recording.');
      setIsRecording(false);
    }
  };

  const processRecording = async (audioUri) => {
    try {
      setIsProcessing(true);

      // Check if service is configured
      const configStatus = speechToTextService.getConfigStatus();
      console.log('Speech service config:', configStatus);

      // Validate the audio file
      await speechToTextService.validateAudioFile(audioUri);

      let transcription;
      
      // Try the configured Azure service first, fallback to simple method
      if (configStatus.isReady) {
        try {
          transcription = await speechToTextService.convertAudioToText(audioUri);
        } catch (apiError) {
          console.log('Azure API failed, using simple method:', apiError.message);
          transcription = await speechToTextService.convertAudioToTextSimple(audioUri);
        }
      } else {
        console.log('Azure Speech service not configured, using simple method');
        transcription = await speechToTextService.convertAudioToTextSimple(audioUri);
      }
      
      // Update the text input with transcribed text
      if (transcription && transcription.trim()) {
        const newText = value ? `${value} ${transcription}` : transcription;
        onChangeText(newText);
      } else {
        Alert.alert('No Speech Detected', 'Please try speaking more clearly or check your microphone.');
      }

    } catch (error) {
      console.error('Error processing recording:', error);
      Alert.alert('Processing Error', error.message || 'Failed to convert speech to text. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleMicrophonePress = () => {
    if (!editable) return;
    
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const getMicrophoneIcon = () => {
    if (isProcessing) {
      return <ActivityIndicator size="small" color="#007AFF" />;
    }
    
    if (isRecording) {
      return <Ionicons name="stop-circle" size={24} color="#FF3B30" />;
    }
    
    return <Ionicons name="mic" size={24} color="#007AFF" />;
  };

  return (
    <View style={[styles.container, style]}>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        style={[styles.textInput, inputStyle]}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        multiline={multiline}
        numberOfLines={numberOfLines}
        maxLength={maxLength}
        editable={editable}
        {...otherProps}
      />
      {editable && (
        <TouchableOpacity
          style={[styles.microphoneButton, microphoneStyle]}
          onPress={handleMicrophonePress}
          disabled={isProcessing}
        >
          {getMicrophoneIcon()}
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  textInput: {
    flex: 1,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
  },
  microphoneButton: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 44,
    marginLeft: 8,
  },
});

export default SpeechTextInput;
