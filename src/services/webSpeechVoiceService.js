// Enhanced Web Speech API Voice Service - NO AUTO RETRY, SHOW ERRORS IMMEDIATELY
// This service provides voice recognition with immediate error feedback

class WebSpeechVoiceService {
  constructor() {
    this.recognition = null;
    this.isListening = false;
    this.isSupported = false;
    this.callbacks = {};
    this.finalTranscript = '';
    this.interimTranscript = '';
    this.recognitionTimeout = null;

    // Initialize speech recognition
    this.initializeSpeechRecognition();
  }

  /**
   * Initialize Web Speech API
   */
  initializeSpeechRecognition() {
    // Check for browser support
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.warn('❌ Web Speech API not supported in this browser');
      this.isSupported = false;
      return;
    }

    this.isSupported = true;
    console.log('✅ Web Speech API is supported');

    // Create recognition instance
    this.recognition = new SpeechRecognition();

    // Configure recognition settings
    this.recognition.continuous = false; // Single recognition session
    this.recognition.interimResults = true; // Get partial results
    this.recognition.lang = 'en-US'; // English language
    this.recognition.maxAlternatives = 1; // Single best result

    // Set up event handlers
    this.setupEventHandlers();
  }

  /**
   * Set up speech recognition event handlers - IMMEDIATE ERROR FEEDBACK
   */
  setupEventHandlers() {
    if (!this.recognition) return;

    // Recognition starts
    this.recognition.onstart = () => {
      console.log('🎤 Web Speech API started');
      this.isListening = true;
      this.finalTranscript = '';
      this.interimTranscript = '';

      // Set timeout protection - stop if no result in 15 seconds
      this.recognitionTimeout = setTimeout(() => {
        console.warn('⏰ Recognition timeout - stopping...');
        this.stopListening();
        if (this.callbacks.onError) {
          this.callbacks.onError({
            error: 'timeout',
            message: 'Voice recognition timed out. Please try again.',
            canRetry: true,
            suggestions: ['Try again', 'Speak more clearly', 'Check microphone']
          });
        }
      }, 15000);

      if (this.callbacks.onStart) {
        this.callbacks.onStart();
      }
    };

    // Recognition ends
    this.recognition.onend = () => {
      console.log('🛑 Web Speech API ended');
      this.isListening = false;

      // Clear timeout
      if (this.recognitionTimeout) {
        clearTimeout(this.recognitionTimeout);
        this.recognitionTimeout = null;
      }

      if (this.callbacks.onEnd) {
        this.callbacks.onEnd();
      }
    };

    // IMMEDIATE ERROR HANDLING - NO AUTO RETRY
    this.recognition.onerror = (event) => {
      console.error('❌ Speech recognition error:', event.error);
      this.isListening = false;

      // Clear timeout
      if (this.recognitionTimeout) {
        clearTimeout(this.recognitionTimeout);
        this.recognitionTimeout = null;
      }

      let errorMessage = 'Voice recognition error occurred';
      let suggestions = [];

      // Handle specific errors with clear messages
      switch (event.error) {
        case 'network':
          errorMessage = 'Network error: Please check your internet connection and try again.';
          suggestions = ['Check internet connection', 'Try again', 'Use text input instead'];
          break;

        case 'no-speech':
          errorMessage = 'No speech detected. Please speak clearly and try again.';
          suggestions = ['Speak louder', 'Check microphone', 'Try again'];
          break;

        case 'not-allowed':
          errorMessage = 'Microphone access denied. Please allow microphone permissions and try again.';
          suggestions = ['Allow microphone access', 'Check browser settings', 'Reload page'];
          break;

        case 'audio-capture':
          errorMessage = 'Audio capture failed. Please check your microphone connection.';
          suggestions = ['Check microphone connection', 'Try different microphone', 'Restart browser'];
          break;

        case 'service-not-allowed':
          errorMessage = 'Speech service not allowed. Please try again or use text input.';
          suggestions = ['Try again', 'Use text input', 'Check browser settings'];
          break;

        case 'aborted':
          errorMessage = 'Speech recognition was stopped unexpectedly.';
          suggestions = ['Try again', 'Check microphone', 'Speak more clearly'];
          break;

        case 'language-not-supported':
          errorMessage = 'Language not supported. Switching to English.';
          suggestions = ['Try again', 'Check language settings'];
          break;

        default:
          errorMessage = `Voice recognition error: ${event.error}. Please try again.`;
          suggestions = ['Try again', 'Use text input instead', 'Check microphone'];
      }

      // ALWAYS show error to user - NO AUTO RETRY
      if (this.callbacks.onError) {
        this.callbacks.onError({
          error: event.error,
          message: errorMessage,
          canRetry: true,
          suggestions: suggestions,
          timestamp: new Date().toISOString()
        });
      }
    };

    // Process speech results
    this.recognition.onresult = (event) => {
      // Clear timeout since we got a result
      if (this.recognitionTimeout) {
        clearTimeout(this.recognitionTimeout);
        this.recognitionTimeout = null;
      }

      let interimTranscript = '';
      let finalTranscript = '';

      // Process all results
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const transcript = result[0].transcript;

        if (result.isFinal) {
          finalTranscript += transcript;
          this.finalTranscript += transcript;

          console.log('🎯 FINAL transcription:', transcript);

          // Call final result callback
          if (this.callbacks.onResult) {
            this.callbacks.onResult({
              transcript: transcript.trim(),
              confidence: result[0].confidence || 0.9,
              isFinal: true,
              timestamp: new Date().toISOString(),
            });
          }
        } else {
          interimTranscript += transcript;
          this.interimTranscript = transcript;

          console.log('📝 INTERIM transcription:', transcript);

          // Call interim result callback
          if (this.callbacks.onInterimResult) {
            this.callbacks.onInterimResult({
              transcript: transcript.trim(),
              confidence: result[0].confidence || 0.7,
              isFinal: false,
              timestamp: new Date().toISOString(),
            });
          }
        }
      }
    };

    // Audio events for debugging
    this.recognition.onaudiostart = () => {
      console.log('🔊 Audio capture started');
    };

    this.recognition.onaudioend = () => {
      console.log('🔇 Audio capture ended');
    };

    this.recognition.onsoundstart = () => {
      console.log('🎵 Sound detected');
    };

    this.recognition.onsoundend = () => {
      console.log('🔇 Sound ended');
    };

    this.recognition.onspeechstart = () => {
      console.log('🗣️ Speech detected');
    };

    this.recognition.onspeechend = () => {
      console.log('🤐 Speech ended');
    };
  }

  /**
   * Start voice recognition - NO AUTO RETRY
   */
  async startListening(callbacks = {}) {
    if (!this.isSupported) {
      console.error('❌ Web Speech API not supported');
      if (callbacks.onError) {
        callbacks.onError({
          error: 'not-supported',
          message: 'Voice recognition not supported in this browser. Please use Chrome, Firefox, Safari, or Edge.',
          canRetry: false,
          suggestions: ['Use Chrome browser', 'Update your browser', 'Use text input instead'],
        });
      }
      return false;
    }

    if (this.isListening) {
      console.warn('⚠️ Already listening');
      return false;
    }

    try {
      // Store callbacks
      this.callbacks = callbacks;

      // Request microphone permission
      console.log('🎤 Requesting microphone access...');
      
      try {
        await navigator.mediaDevices.getUserMedia({ audio: true });
        console.log('✅ Microphone access granted');
      } catch (micError) {
        console.error('❌ Microphone permission denied:', micError);
        if (this.callbacks.onError) {
          this.callbacks.onError({
            error: 'microphone-denied',
            message: 'Microphone access denied. Please allow microphone permissions and try again.',
            canRetry: true,
            suggestions: ['Allow microphone access', 'Check browser settings', 'Reload page'],
          });
        }
        return false;
      }

      // Start recognition
      console.log('🚀 Starting Web Speech recognition...');
      this.recognition.start();

      return true;
    } catch (error) {
      console.error('❌ Failed to start voice recognition:', error);

      if (this.callbacks.onError) {
        this.callbacks.onError({
          error: 'start-failed',
          message: 'Failed to start voice recognition. Please try again.',
          canRetry: true,
          suggestions: ['Try again', 'Check microphone permissions', 'Use text input'],
        });
      }

      return false;
    }
  }

  /**
   * Stop voice recognition
   */
  stopListening() {
    if (!this.isListening) {
      console.warn('⚠️ Not currently listening');
      return;
    }

    console.log('🛑 Stopping Web Speech recognition...');

    try {
      // Clear timeout
      if (this.recognitionTimeout) {
        clearTimeout(this.recognitionTimeout);
        this.recognitionTimeout = null;
      }

      if (this.recognition) {
        this.recognition.stop();
      }
      
      this.isListening = false;
      console.log('✅ Voice recognition stopped');
    } catch (error) {
      console.error('❌ Error stopping voice recognition:', error);
    }
  }

  /**
   * Check if currently listening
   */
  get isCurrentlyListening() {
    return this.isListening;
  }

  /**
   * Check if service is supported
   */
  isServiceSupported() {
    return this.isSupported;
  }

  /**
   * Get service capabilities
   */
  getCapabilities() {
    return {
      isSupported: this.isSupported,
      isListening: this.isListening,
      provider: 'Web Speech API',
      supportedLanguages: ['en-US', 'en-GB', 'es-ES', 'fr-FR', 'de-DE', 'it-IT', 'pt-BR', 'ru-RU', 'ja-JP', 'ko-KR', 'zh-CN'],
      features: {
        continuous: true,
        interimResults: true,
        maxAlternatives: true,
        offline: 'partial',
        realtime: true,
        immediateErrorFeedback: true,
        noAutoRetry: true
      },
    };
  }

  /**
   * Test microphone access
   */
  async testMicrophone() {
    try {
      console.log('🧪 Testing microphone access...');

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      console.log('✅ Microphone test successful');

      // Stop test stream
      stream.getTracks().forEach((track) => track.stop());

      return {
        success: true,
        message: 'Microphone access is working perfectly',
      };
    } catch (error) {
      console.error('❌ Microphone test failed:', error);

      return {
        success: false,
        error: error.name,
        message: error.message,
      };
    }
  }

  /**
   * Change language
   */
  setLanguage(language) {
    if (this.recognition) {
      this.recognition.lang = language;
      console.log(`🌐 Language set to: ${language}`);
    }
  }

  /**
   * Get current transcripts
   */
  getTranscripts() {
    return {
      final: this.finalTranscript,
      interim: this.interimTranscript,
      combined: this.finalTranscript + this.interimTranscript,
    };
  }

  /**
   * Clear transcripts
   */
  clearTranscripts() {
    this.finalTranscript = '';
    this.interimTranscript = '';
  }

  /**
   * Cleanup resources
   */
  cleanup() {
    console.log('🧹 Cleaning up Web Speech service...');

    this.stopListening();
    
    // Clear timeout
    if (this.recognitionTimeout) {
      clearTimeout(this.recognitionTimeout);
      this.recognitionTimeout = null;
    }

    this.callbacks = {};
    this.clearTranscripts();

    console.log('✅ Web Speech service cleanup complete');
  }
}

// Create and export singleton instance
export const webSpeechVoiceService = new WebSpeechVoiceService();

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
  webSpeechVoiceService.cleanup();
});

// Handle visibility change to stop recognition when page is hidden
document.addEventListener('visibilitychange', () => {
  if (document.hidden && webSpeechVoiceService.isCurrentlyListening) {
    console.log('📱 Page hidden, stopping voice recognition');
    webSpeechVoiceService.stopListening();
  }
});

export default webSpeechVoiceService;