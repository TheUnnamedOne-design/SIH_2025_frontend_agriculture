// services/apiService.ts

interface ApiConfig {
    baseURL: string;
    timeout: number;
    headers: Record<string, string>;
  }
  
  interface UploadProgress {
    loaded: number;
    total: number;
    percentage: number;
  }
  
  interface CallRecordingUpload {
    file: {
      uri: string;
      name: string;
      type: string;
    };
    metadata: {
      userId?: string;
      callId?: string | null;
      duration: number;
      language: string;
      timestamp: number;
      deviceInfo?: any;
      segmentIndex?: number;
      isSegment?: boolean;
      [key: string]: any;
    };
  }
  
  interface CallEndData {
    callId: string;
    userId: string;
    duration: number;
    startTime: string;
    endTime: string;
    language: string;
    recordingPath?: string | null;
    deviceInfo: {
      platform: string;
      version: string | number;
    };
    metadata?: {
      wasRecorded: boolean;
      endedBy: string;
      [key: string]: any;
    } | null;
  }
  
  // NEW: Voice query interface
  interface VoiceQueryData {
    audioFile: {
      uri: string;
      name: string;
      type: string;
    };
    district: string;
    state: string;
    choice: number;
    currentCrop?: string;
    preferredLanguage: string;
  }
  
  interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    message?: string;
    error?: string;
  }
  
  class ApiService {
    private config: ApiConfig;
  
    constructor(baseURL: string) {
      this.config = {
        baseURL: baseURL.replace(/\/$/, ''),
        timeout: 30000,
        headers: {
          'Content-Type': 'application/json',
        }
      };
    }
  
    // Helper function to create fetch with timeout
    private fetchWithTimeout(url: string, options: RequestInit = {}, timeout: number = this.config.timeout): Promise<Response> {
      return new Promise((resolve, reject) => {
        const controller = new AbortController();
        const signal = controller.signal;
  
        const timeoutId = setTimeout(() => {
          controller.abort();
          reject(new Error(`Request timeout after ${timeout}ms`));
        }, timeout);
  
        fetch(url, { ...options, signal })
          .then(response => {
            clearTimeout(timeoutId);
            resolve(response);
          })
          .catch(error => {
            clearTimeout(timeoutId);
            if (error.name === 'AbortError') {
              reject(new Error('Request timeout'));
            } else {
              reject(error);
            }
          });
      });
    }
  
    // Health check
    async checkConnection(): Promise<boolean> {
      try {
        const response = await this.fetchWithTimeout(
          `${this.config.baseURL}/health`, 
          { method: 'GET' },
          5000
        );
        return response.ok;
      } catch (error) {
        console.log('Connection check failed:', error);
        return false;
      }
    }
  
    // Send call end event
    async sendCallEndEvent(callData: CallEndData): Promise<ApiResponse> {
      try {
        const response = await this.fetchWithTimeout(
          `${this.config.baseURL}/api/calls/end`,
          {
            method: 'POST',
            headers: this.config.headers,
            body: JSON.stringify(callData),
          },
          10000
        );
  
        const result = await response.json();
        
        if (!response.ok) {
          throw new Error(result.message || `Call end event failed with status: ${response.status}`);
        }
  
        return {
          success: true,
          data: result,
          message: 'Call end event sent successfully'
        };
  
      } catch (error: any) {
        return {
          success: false,
          error: error.message || 'Failed to send call end event',
          message: 'Call end event failed'
        };
      }
    }
  
    // NEW: Send voice query to speech API
    async sendVoiceQuery(voiceData: VoiceQueryData): Promise<ApiResponse> {
      try {
        console.log('🎤 Sending voice query to backend...');
        
        const formData = new FormData();
        
        // Add the audio file
        formData.append('audio', {
          uri: voiceData.audioFile.uri,
          name: voiceData.audioFile.name,
          type: voiceData.audioFile.type,
        } as any);
  
        // Add form data
        formData.append('district', voiceData.district);
        formData.append('state', voiceData.state);
        formData.append('choice', voiceData.choice.toString());
        formData.append('current_crop', voiceData.currentCrop || 'rice');
        formData.append('preferred_language', voiceData.preferredLanguage);
  
        const response = await this.fetchWithTimeout(
          `${this.config.baseURL}/speech/voice-query-json`,
          {
            method: 'POST',
            body: formData,
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          },
          30000 // 30 second timeout for voice processing
        );
  
        const result = await response.json();
        
        if (!response.ok) {
          throw new Error(result.error || `Voice query failed with status: ${response.status}`);
        }
  
        return {
          success: true,
          data: result,
          message: 'Voice query processed successfully'
        };
  
      } catch (error: any) {
        return {
          success: false,
          error: error.message || 'Voice query failed',
          message: 'Voice query processing failed'
        };
      }
    }
  
    // Upload call recording
    async uploadRecording(
      uploadData: CallRecordingUpload,
      onProgress?: (progress: UploadProgress) => void
    ): Promise<ApiResponse> {
      try {
        const formData = new FormData();
        
        formData.append('recording', {
          uri: uploadData.file.uri,
          name: uploadData.file.name,
          type: uploadData.file.type,
        } as any);
  
        const cleanMetadata = {
          ...uploadData.metadata,
          callId: uploadData.metadata.callId || undefined,
        };
        formData.append('metadata', JSON.stringify(cleanMetadata));
  
        const response = await this.fetchWithTimeout(
          `${this.config.baseURL}/api/recordings/upload`,
          {
            method: 'POST',
            body: formData,
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          },
          60000
        );
  
        const result = await response.json();
        
        if (!response.ok) {
          throw new Error(result.message || `Upload failed with status: ${response.status}`);
        }
  
        return {
          success: true,
          data: result,
          message: 'Recording uploaded successfully'
        };
  
      } catch (error: any) {
        return {
          success: false,
          error: error.message || 'Upload failed',
          message: 'Failed to upload recording'
        };
      }
    }
    
    // Get user's recordings
    async getRecordings(userId?: string): Promise<ApiResponse> {
      try {
        const url = userId 
          ? `${this.config.baseURL}/api/recordings/user/${userId}`
          : `${this.config.baseURL}/api/recordings`;
  
        const response = await this.fetchWithTimeout(url, {
          method: 'GET',
          headers: this.config.headers,
        });
  
        const result = await response.json();
        return response.ok ? { success: true, data: result } : { success: false, error: result.message };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    }
  
    // Get call history
    async getCallHistory(userId?: string, limit?: number): Promise<ApiResponse> {
      try {
        const params = new URLSearchParams();
        if (userId) params.append('userId', userId);
        if (limit) params.append('limit', limit.toString());
  
        const url = `${this.config.baseURL}/api/calls/history${params.toString() ? '?' + params.toString() : ''}`;
  
        const response = await this.fetchWithTimeout(url, {
          method: 'GET',
          headers: this.config.headers,
        });
  
        const result = await response.json();
        return response.ok ? { success: true, data: result } : { success: false, error: result.message };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    }
  
    // Get recording analytics
    async getAnalytics(userId?: string): Promise<ApiResponse> {
      try {
        const url = userId
          ? `${this.config.baseURL}/api/analytics/user/${userId}`
          : `${this.config.baseURL}/api/analytics`;
  
        const response = await this.fetchWithTimeout(url, {
          method: 'GET',
          headers: this.config.headers,
        });
  
        const result = await response.json();
        return response.ok ? { success: true, data: result } : { success: false, error: result.message };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    }
  
    // Get backend status
    async getServerStatus(): Promise<ApiResponse> {
      try {
        const response = await this.fetchWithTimeout(
          `${this.config.baseURL}/api/status`,
          { method: 'GET' },
          5000
        );
  
        const result = await response.json();
        return response.ok ? { success: true, data: result } : { success: false, error: result.message };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    }
  
    // Update config
    updateConfig(newConfig: Partial<ApiConfig>): void {
      this.config = { ...this.config, ...newConfig };
    }
  }
  
  export default ApiService;
  