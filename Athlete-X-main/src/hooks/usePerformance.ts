import { useState, useEffect } from 'react';
import { PerformanceMetric, MetricType } from '../models';
import performanceService from '../services/performanceService';
import { useAuth } from './useAuth';

interface PerformanceState {
  metrics: PerformanceMetric[];
  loading: boolean;
  error: string | null;
  adding: boolean;
}

export const usePerformance = () => {
  const { user } = useAuth();
  const [state, setState] = useState<PerformanceState>({
    metrics: [],
    loading: true,
    error: null,
    adding: false
  });

  useEffect(() => {
    if (user?.uid) {
      loadMetrics();
    }
  }, [user?.uid]);

  const loadMetrics = async () => {
    if (!user?.uid) return;

    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      const metrics = await performanceService.getAthleteMetrics(user.uid);
      setState(prev => ({ ...prev, metrics, loading: false }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load performance metrics';
      setState(prev => ({ ...prev, error: errorMessage, loading: false }));
    }
  };

  const addMetric = async (metricData: Omit<PerformanceMetric, 'id' | 'athleteId' | 'timestamp'>) => {
    if (!user?.uid) {
      throw new Error('User not authenticated');
    }

    try {
      setState(prev => ({ ...prev, adding: true, error: null }));
      
      const metric = await performanceService.addMetric(user.uid, {
        ...metricData,
        timestamp: new Date()
      });

      // Add new metric to the beginning of the list
      setState(prev => ({
        ...prev,
        metrics: [metric, ...prev.metrics],
        adding: false
      }));

      return metric;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to add metric';
      setState(prev => ({ ...prev, error: errorMessage, adding: false }));
      throw error;
    }
  };

  const updateMetric = async (metricId: string, updates: Partial<PerformanceMetric>) => {
    try {
      await performanceService.updateMetric(metricId, updates);
      
      // Update local state
      setState(prev => ({
        ...prev,
        metrics: prev.metrics.map(metric =>
          metric.id === metricId
            ? { ...metric, ...updates }
            : metric
        )
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update metric';
      setState(prev => ({ ...prev, error: errorMessage }));
      throw error;
    }
  };

  const deleteMetric = async (metricId: string) => {
    try {
      await performanceService.deleteMetric(metricId);
      
      // Remove from local state
      setState(prev => ({
        ...prev,
        metrics: prev.metrics.filter(metric => metric.id !== metricId)
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete metric';
      setState(prev => ({ ...prev, error: errorMessage }));
      throw error;
    }
  };

  const getMetricsByType = (metricType: MetricType) => {
    return state.metrics.filter(metric => metric.metricType === metricType);
  };

  const getPersonalBest = (metricType: MetricType) => {
    return performanceService.calculatePersonalBest(state.metrics, metricType);
  };

  const getProgress = (metricType: MetricType, days: number = 30) => {
    return performanceService.calculateProgress(state.metrics, metricType, days);
  };

  const getChartData = (metricType: MetricType) => {
    return performanceService.getChartData(state.metrics, metricType);
  };

  const getMetricDisplayInfo = (metricType: MetricType) => {
    return performanceService.getMetricDisplayInfo(metricType);
  };

  const clearError = () => {
    setState(prev => ({ ...prev, error: null }));
  };

  return {
    metrics: state.metrics,
    loading: state.loading,
    error: state.error,
    adding: state.adding,
    addMetric,
    updateMetric,
    deleteMetric,
    getMetricsByType,
    getPersonalBest,
    getProgress,
    getChartData,
    getMetricDisplayInfo,
    clearError,
    refetch: loadMetrics
  };
};
