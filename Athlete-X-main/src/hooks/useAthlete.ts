import { useState, useEffect } from 'react';
import { Athlete } from '../models';
import athleteService from '../services/athleteService';
import { useAuth } from './useAuth';

interface AthleteState {
  profile: Athlete | null;
  loading: boolean;
  error: string | null;
  uploading: boolean;
}

export const useAthlete = () => {
  const { user } = useAuth();
  const [state, setState] = useState<AthleteState>({
    profile: null,
    loading: true,
    error: null,
    uploading: false
  });

  useEffect(() => {
    if (user?.uid) {
      loadProfile(user.uid);
    }
  }, [user?.uid]);

  const loadProfile = async (userId: string) => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      const profile = await athleteService.getProfile(userId);
      setState(prev => ({ ...prev, profile, loading: false }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load profile';
      setState(prev => ({ ...prev, error: errorMessage, loading: false }));
    }
  };

  const createProfile = async (athleteData: Partial<Athlete>) => {
    if (!user?.uid) {
      throw new Error('User not authenticated');
    }

    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      const profile = await athleteService.createProfile(user.uid, {
        ...athleteData,
        email: user.email,
        name: user.displayName || athleteData.name || ''
      });
      setState(prev => ({ ...prev, profile, loading: false }));
      return profile;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create profile';
      setState(prev => ({ ...prev, error: errorMessage, loading: false }));
      throw error;
    }
  };

  const updateProfile = async (updates: Partial<Athlete>) => {
    if (!user?.uid) {
      throw new Error('User not authenticated');
    }

    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      await athleteService.updateProfile(user.uid, updates);
      
      // Update local state
      setState(prev => ({
        ...prev,
        profile: prev.profile ? { ...prev.profile, ...updates } : null,
        loading: false
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update profile';
      setState(prev => ({ ...prev, error: errorMessage, loading: false }));
      throw error;
    }
  };

  const uploadProfilePicture = async (file: File) => {
    if (!user?.uid) {
      throw new Error('User not authenticated');
    }

    try {
      setState(prev => ({ ...prev, uploading: true, error: null }));
      const imageUrl = await athleteService.uploadProfilePicture(user.uid, file);
      
      // Update local state
      setState(prev => ({
        ...prev,
        profile: prev.profile ? { ...prev.profile, profilePictureUrl: imageUrl } : null,
        uploading: false
      }));

      return imageUrl;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to upload image';
      setState(prev => ({ ...prev, error: errorMessage, uploading: false }));
      throw error;
    }
  };

  const deleteProfilePicture = async () => {
    if (!user?.uid || !state.profile?.profilePictureUrl) {
      return;
    }

    try {
      setState(prev => ({ ...prev, uploading: true, error: null }));
      await athleteService.deleteProfilePicture(user.uid);
      
      // Update local state
      setState(prev => ({
        ...prev,
        profile: prev.profile ? { ...prev.profile, profilePictureUrl: '' } : null,
        uploading: false
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete image';
      setState(prev => ({ ...prev, error: errorMessage, uploading: false }));
      throw error;
    }
  };

  const clearError = () => {
    setState(prev => ({ ...prev, error: null }));
  };

  return {
    profile: state.profile,
    loading: state.loading,
    error: state.error,
    uploading: state.uploading,
    createProfile,
    updateProfile,
    uploadProfilePicture,
    deleteProfilePicture,
    clearError,
    refetch: () => user?.uid && loadProfile(user.uid)
  };
};
