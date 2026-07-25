import React, { createContext, useContext, useEffect, useState } from 'react';
import { useCapacitor, CapacitorState } from '../hooks/useCapacitor';
import LoadingSpinner from '../components/LoadingSpinner';
import { Box, Typography, Alert } from '@mui/material';

interface CapacitorContextType extends CapacitorState {
  requestPermissions: () => Promise<{ camera: boolean; location: boolean }>;
  getCurrentLocation: () => Promise<any>;
  capturePhoto: () => Promise<string | null>;
  captureVideo: () => Promise<string | null>;
  saveFile: (data: string, fileName: string) => Promise<boolean>;
  readFile: (fileName: string) => Promise<string | null>;
  refresh: () => Promise<void>;
}

const CapacitorContext = createContext<CapacitorContextType | null>(null);

export const useCapacitorContext = () => {
  const context = useContext(CapacitorContext);
  if (!context) {
    throw new Error('useCapacitorContext must be used within a CapacitorProvider');
  }
  return context;
};

interface CapacitorProviderProps {
  children: React.ReactNode;
}

export const CapacitorProvider: React.FC<CapacitorProviderProps> = ({ children }) => {
  const capacitor = useCapacitor();
  const [initializationError, setInitializationError] = useState<string | null>(null);
  const [showPlatformInfo, setShowPlatformInfo] = useState(false);

  useEffect(() => {
    // Show platform detection info for a few seconds on startup
    const timer = setTimeout(() => {
      setShowPlatformInfo(false);
    }, 3000);

    // Log platform information
    if (!capacitor.loading) {
      console.log('🚀 AthleteX Capacitor Integration:', {
        platform: capacitor.isNative ? 'Native App' : 'Web App',
        deviceInfo: capacitor.deviceInfo,
        networkConnected: capacitor.networkInfo?.connected,
        permissions: capacitor.permissions
      });

      setShowPlatformInfo(true);
    }

    return () => clearTimeout(timer);
  }, [capacitor.loading, capacitor.isNative, capacitor.deviceInfo]);

  // Handle initialization errors
  useEffect(() => {
    if (!capacitor.loading && !capacitor.deviceInfo && capacitor.isNative) {
      setInitializationError('Failed to initialize native app features. Some functionality may be limited.');
    }
  }, [capacitor.loading, capacitor.deviceInfo, capacitor.isNative]);

  // Show loading screen during initialization
  if (capacitor.loading) {
    return (
      <Box 
        sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center', 
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%)'
        }}
      >
        <LoadingSpinner />
        <Typography 
          variant="h6" 
          sx={{ 
            mt: 2, 
            color: 'primary.main',
            textAlign: 'center' 
          }}
        >
          Initializing AthleteX
        </Typography>
        <Typography 
          variant="body2" 
          sx={{ 
            mt: 1, 
            color: 'text.secondary',
            textAlign: 'center' 
          }}
        >
          Loading native features...
        </Typography>
      </Box>
    );
  }

  return (
    <CapacitorContext.Provider value={capacitor}>
      {/* Platform Information Alert */}
      {showPlatformInfo && (
        <Alert 
          severity="info" 
          sx={{ 
            position: 'fixed', 
            top: 16, 
            right: 16, 
            zIndex: 9999,
            minWidth: 300,
            '& .MuiAlert-message': {
              fontSize: '0.875rem'
            }
          }}
          onClose={() => setShowPlatformInfo(false)}
        >
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
            Platform: {capacitor.isNative ? '📱 Native App' : '🌐 Web App'}
          </Typography>
          {capacitor.deviceInfo && (
            <Typography variant="caption" component="div">
              {capacitor.deviceInfo.platform} • {capacitor.deviceInfo.operatingSystem}
            </Typography>
          )}
          {capacitor.networkInfo && (
            <Typography variant="caption" component="div">
              Network: {capacitor.networkInfo.connected ? '🟢 Online' : '🔴 Offline'}
            </Typography>
          )}
        </Alert>
      )}

      {/* Initialization Error Alert */}
      {initializationError && (
        <Alert 
          severity="warning" 
          sx={{ 
            position: 'fixed', 
            top: 16, 
            left: 16, 
            right: 16, 
            zIndex: 9998,
            mx: 2 
          }}
          onClose={() => setInitializationError(null)}
        >
          {initializationError}
        </Alert>
      )}

      {children}
    </CapacitorContext.Provider>
  );
};

export default CapacitorProvider;
