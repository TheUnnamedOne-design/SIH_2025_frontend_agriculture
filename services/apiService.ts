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
      callId?: string | null;    // ✅ Fixed: Allow null values
      duration: number;
      language: string;
      timestamp: number;
      deviceInfo?: any;
      segmentIndex?: number;     // ✅ Added: For recording segments
      isSegment?: boolean;       // ✅ Added: Flag for segments
      [key: string]: any;        // ✅ Added: Allow additional properties
    };
  }
  
  // Interface for call end data (removed duplicate)
  interface CallEndData {
    callId: string;
    userId: string;
    duration: number;
    startTime: string;
    endTime: string;
    language: string;
    recordingPath?: string | null;  // ✅ Fixed: Allow null values
    deviceInfo: {
      platform: string;
      version: string | number;
    };
    metadata?: {
      wasRecorded: boolean;
      endedBy: string;
      [key: string]: any;
    } | null;  // ✅ Fixed: Allow null metadata
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
        baseURL: baseURL.replace(/\/$/, ''), // Remove trailing slash
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
          5000 // 5 second timeout for health check
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
          10000 // 10 second timeout for call end events
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
  
    // Upload call recording
    async uploadRecording(
      uploadData: CallRecordingUpload,
      onProgress?: (progress: UploadProgress) => void
    ): Promise<ApiResponse> {
      try {
        const formData = new FormData();
        
        // Add the audio file
        formData.append('recording', {
          uri: uploadData.file.uri,
          name: uploadData.file.name,
          type: uploadData.file.type,
        } as any);
  
        // Add metadata (convert null values to undefined for JSON)
        const cleanMetadata = {
          ...uploadData.metadata,
          callId: uploadData.metadata.callId || undefined, // ✅ Convert null to undefined
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
          60000 // 60 second timeout for uploads
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
  
    // Delete recording
    async deleteRecording(recordingId: string): Promise<ApiResponse> {
      try {
        const response = await this.fetchWithTimeout(
          `${this.config.baseURL}/api/recordings/${recordingId}`,
          {
            method: 'DELETE',
            headers: this.config.headers,
          }
        );
  
        const result = await response.json();
        return response.ok ? { success: true, data: result } : { success: false, error: result.message };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    }
  
    // Convert audio format
    async convertAudio(recordingId: string, targetFormat: 'mp3' | 'wav'): Promise<ApiResponse> {
      try {
        const response = await this.fetchWithTimeout(
          `${this.config.baseURL}/api/recordings/${recordingId}/convert`,
          {
            method: 'POST',
            headers: this.config.headers,
            body: JSON.stringify({ format: targetFormat }),
          },
          60000 // Longer timeout for conversion
        );
  
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
  
    // Update config
    updateConfig(newConfig: Partial<ApiConfig>): void {
      this.config = { ...this.config, ...newConfig };
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
  
    // Sync pending recordings
    async syncPendingRecordings(recordings: CallRecordingUpload[]): Promise<ApiResponse[]> {
      const results = [];
      
      for (const recording of recordings) {
        try {
          const result = await this.uploadRecording(recording);
          results.push(result);
        } catch (error) {
          results.push({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }
      
      return results;
    }
  }
  
  export default ApiService;
  