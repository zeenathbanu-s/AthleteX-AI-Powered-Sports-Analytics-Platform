import { useState, useEffect } from 'react';
import capacitorService, { DeviceInfo, LocationInfo, NetworkInfo } from '../services/capacitorService';

export interface CapacitorState {
  isNative: boolean;
  deviceInfo: DeviceInfo | null;
  networkInfo: NetworkInfo | null;
  location: LocationInfo | null;
  permissions: {
    camera: boolean;
    location: boolean;
  };
  loading: boolean;
}

export const useCapacitor = () => {
  const [state, setState] = useState<CapacitorState>({
    isNative: false,
    deviceInfo: null,
    networkInfo: null,
    location: null,
    permissions: { camera: false, location: false },
    loading: true
  });

  useEffect(() => {
    initializeCapacitor();
  }, []);

  const initializeCapacitor = async () => {
    try {
      setState(prev => ({ ...prev, loading: true }));

      // Initialize the native app
      await capacitorService.initializeApp();

      // Get device info
      const deviceInfo = await capacitorService.getDeviceInfo();
      
      // Get network status
      const networkInfo = await capacitorService.getNetworkStatus();
      
      // Check permissions
      const permissions = await capacitorService.checkPermissions();

      setState(prev => ({
        ...prev,
        isNative: capacitorService.isRunningNatively(),
        deviceInfo,
        networkInfo,
        permissions,
        loading: false
      }));

      // Set up network listener
      capacitorService.addNetworkListener((networkStatus) => {
        setState(prev => ({ ...prev, networkInfo: networkStatus }));
      });

    } catch (error) {
      console.error('Error initializing Capacitor:', error);
      setState(prev => ({ ...prev, loading: false }));
    }
  };

  const requestPermissions = async () => {
    const permissions = await capacitorService.requestPermissions();
    setState(prev => ({ ...prev, permissions }));
    return permissions;
  };

  const getCurrentLocation = async () => {
    const location = await capacitorService.getCurrentLocation();
    setState(prev => ({ ...prev, location }));
    return location;
  };

  const capturePhoto = async () => {
    return await capacitorService.capturePhoto();
  };

  const captureVideo = async () => {
    return await capacitorService.captureVideo();
  };

  const saveFile = async (data: string, fileName: string) => {
    return await capacitorService.saveFile(data, fileName);
  };

  const readFile = async (fileName: string) => {
    return await capacitorService.readFile(fileName);
  };

  return {
    ...state,
    requestPermissions,
    getCurrentLocation,
    capturePhoto,
    captureVideo,
    saveFile,
    readFile,
    refresh: initializeCapacitor
  };
};
