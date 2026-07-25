import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Geolocation } from '@capacitor/geolocation';
import { Device } from '@capacitor/device';
import { Network } from '@capacitor/network';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';

export interface DeviceInfo {
  platform: string;
  model: string;
  operatingSystem: string;
  osVersion: string;
  manufacturer: string;
  isVirtual: boolean;
  webViewVersion: string;
}

export interface LocationInfo {
  latitude: number;
  longitude: number;
  accuracy: number;
  altitude?: number;
  speed?: number;
  heading?: number;
  timestamp: number;
}

export interface NetworkInfo {
  connected: boolean;
  connectionType: string;
}

class CapacitorService {
  private isNativeApp: boolean = false;

  constructor() {
    // Check if we're running in a native app or web
    this.isNativeApp = !!(window as any).Capacitor?.isNativePlatform();
    console.log(`🔌 CapacitorService initialized. Native app: ${this.isNativeApp}`);
  }

  // Initialize native app features
  async initializeApp(): Promise<void> {
    if (!this.isNativeApp) {
      console.log('🌐 Running in web mode - native features disabled');
      return;
    }

    try {
      // Hide splash screen after app loads
      await SplashScreen.hide();

      // Set status bar style
      await StatusBar.setStyle({ style: Style.Light });
      await StatusBar.setBackgroundColor({ color: '#1976d2' });

      console.log('✅ Native app initialized successfully');
    } catch (error) {
      console.error('❌ Error initializing native app:', error);
    }
  }

  // Camera functionality for video assessments
  async capturePhoto(): Promise<string | null> {
    if (!this.isNativeApp) {
      console.log('📷 Camera not available in web mode');
      return null;
    }

    try {
      const result = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.Base64,
        source: CameraSource.Camera
      });

      return result.base64String || null;
    } catch (error) {
      console.error('❌ Camera error:', error);
      return null;
    }
  }

  // Enhanced video capture for assessments
  async captureVideo(): Promise<string | null> {
    if (!this.isNativeApp) {
      console.log('🎥 Video capture not available in web mode');
      // Fallback to web MediaRecorder API
      return this.captureWebVideo();
    }

    try {
      // Note: For video capture, you might need additional plugins
      // or use the web implementation even in native apps
      return this.captureWebVideo();
    } catch (error) {
      console.error('❌ Video capture error:', error);
      return null;
    }
  }

  // Web video capture fallback
  private async captureWebVideo(): Promise<string | null> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 1280, height: 720 },
        audio: true 
      });
      
      // For now, just return a placeholder. In a real implementation,
      // you'd use MediaRecorder API to record the stream to a Blob
      console.log('📹 Web video stream available:', stream);
      return 'web-video-stream-placeholder';
    } catch (error) {
      console.error('❌ Web video capture error:', error);
      return null;
    }
  }

  // File system operations for storing assessments
  async saveFile(data: string, fileName: string, directory: Directory = Directory.Documents): Promise<boolean> {
    if (!this.isNativeApp) {
      // Fallback to localStorage or IndexedDB for web
      try {
        localStorage.setItem(`file_${fileName}`, data);
        return true;
      } catch (error) {
        console.error('❌ Web file save error:', error);
        return false;
      }
    }

    try {
      await Filesystem.writeFile({
        path: fileName,
        data: data,
        directory: directory
      });
      return true;
    } catch (error) {
      console.error('❌ Native file save error:', error);
      return false;
    }
  }

  async readFile(fileName: string, directory: Directory = Directory.Documents): Promise<string | null> {
    if (!this.isNativeApp) {
      try {
        return localStorage.getItem(`file_${fileName}`);
      } catch (error) {
        console.error('❌ Web file read error:', error);
        return null;
      }
    }

    try {
      const result = await Filesystem.readFile({
        path: fileName,
        directory: directory
      });
      return result.data as string;
    } catch (error) {
      console.error('❌ Native file read error:', error);
      return null;
    }
  }

  // Location services for athlete location tracking
  async getCurrentLocation(): Promise<LocationInfo | null> {
    if (!this.isNativeApp) {
      // Fallback to web geolocation API
      return this.getWebLocation();
    }

    try {
      const position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000
      });

      return {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        altitude: position.coords.altitude || undefined,
        speed: position.coords.speed || undefined,
        heading: position.coords.heading || undefined,
        timestamp: position.timestamp
      };
    } catch (error) {
      console.error('❌ Location error:', error);
      return null;
    }
  }

  private async getWebLocation(): Promise<LocationInfo | null> {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve(null);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            altitude: position.coords.altitude || undefined,
            speed: position.coords.speed || undefined,
            heading: position.coords.heading || undefined,
            timestamp: position.timestamp
          });
        },
        (error) => {
          console.error('❌ Web location error:', error);
          resolve(null);
        }
      );
    });
  }

  // Device information for analytics
  async getDeviceInfo(): Promise<DeviceInfo | null> {
    if (!this.isNativeApp) {
      return {
        platform: 'web',
        model: navigator.userAgent,
        operatingSystem: navigator.platform,
        osVersion: 'N/A',
        manufacturer: 'N/A',
        isVirtual: false,
        webViewVersion: 'N/A'
      };
    }

    try {
      const info = await Device.getInfo();
      return {
        platform: info.platform,
        model: info.model,
        operatingSystem: info.operatingSystem,
        osVersion: info.osVersion,
        manufacturer: info.manufacturer,
        isVirtual: info.isVirtual,
        webViewVersion: info.webViewVersion
      };
    } catch (error) {
      console.error('❌ Device info error:', error);
      return null;
    }
  }

  // Network monitoring for offline capabilities
  async getNetworkStatus(): Promise<NetworkInfo> {
    if (!this.isNativeApp) {
      return {
        connected: navigator.onLine,
        connectionType: 'web'
      };
    }

    try {
      const status = await Network.getStatus();
      return {
        connected: status.connected,
        connectionType: status.connectionType
      };
    } catch (error) {
      console.error('❌ Network status error:', error);
      return {
        connected: true,
        connectionType: 'unknown'
      };
    }
  }

  // Listen for network changes
  addNetworkListener(callback: (status: NetworkInfo) => void): void {
    if (!this.isNativeApp) {
      window.addEventListener('online', () => callback({ connected: true, connectionType: 'web' }));
      window.addEventListener('offline', () => callback({ connected: false, connectionType: 'web' }));
      return;
    }

    Network.addListener('networkStatusChange', (status) => {
      callback({
        connected: status.connected,
        connectionType: status.connectionType
      });
    });
  }

  // Utility methods
  isRunningNatively(): boolean {
    return this.isNativeApp;
  }

  async checkPermissions(): Promise<{ camera: boolean; location: boolean }> {
    if (!this.isNativeApp) {
      return { camera: true, location: true }; // Assume web permissions are handled by browser
    }

    try {
      const [cameraPermission, locationPermission] = await Promise.all([
        Camera.checkPermissions(),
        Geolocation.checkPermissions()
      ]);

      return {
        camera: cameraPermission.camera === 'granted',
        location: locationPermission.location === 'granted'
      };
    } catch (error) {
      console.error('❌ Permission check error:', error);
      return { camera: false, location: false };
    }
  }

  async requestPermissions(): Promise<{ camera: boolean; location: boolean }> {
    if (!this.isNativeApp) {
      return { camera: true, location: true };
    }

    try {
      const [cameraPermission, locationPermission] = await Promise.all([
        Camera.requestPermissions({ permissions: ['camera', 'photos'] }),
        Geolocation.requestPermissions({ permissions: ['location'] })
      ]);

      return {
        camera: cameraPermission.camera === 'granted',
        location: locationPermission.location === 'granted'
      };
    } catch (error) {
      console.error('❌ Permission request error:', error);
      return { camera: false, location: false };
    }
  }
}

const capacitorService = new CapacitorService();
export default capacitorService;
