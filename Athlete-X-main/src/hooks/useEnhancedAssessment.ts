import { useState, useEffect, useCallback } from 'react';
import { AssessmentTest, TestType, Athlete } from '../models';
import { useAuth } from './useAuth';
import assessmentService from '../services/assessmentService';
import enhancedAssessmentService, { 
  EnhancedAssessmentResult, 
  AssessmentProcessingOptions,
  AssessmentProcessingProgress
} from '../services/enhancedAssessmentService';

interface EnhancedAssessmentState {
  assessments: AssessmentTest[];
  enhancedResults: EnhancedAssessmentResult[];
  loading: boolean;
  error: string | null;
  uploading: boolean;
  processing: boolean;
  processingProgress?: AssessmentProcessingProgress;
  insights: any | null;
}

interface AssessmentMode {
  type: 'quick' | 'enhanced' | 'comprehensive';
  options?: Partial<AssessmentProcessingOptions>;
}

export const useEnhancedAssessment = () => {
  const { user } = useAuth();
  const [state, setState] = useState<EnhancedAssessmentState>({
    assessments: [],
    enhancedResults: [],
    loading: true,
    error: null,
    uploading: false,
    processing: false,
    processingProgress: undefined,
    insights: null
  });

  useEffect(() => {
    if (user?.uid) {
      loadAssessments();
    }
  }, [user?.uid]);

  const loadAssessments = async () => {
    if (!user?.uid) return;

    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      // Load both basic and enhanced assessments
      const [basicAssessments, enhancedResults] = await Promise.all([
        assessmentService.getAthleteAssessments(user.uid),
        enhancedAssessmentService.getAthleteEnhancedAssessments(user.uid)
      ]);

      setState(prev => ({
        ...prev,
        assessments: basicAssessments,
        enhancedResults,
        loading: false
      }));

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load assessments';
      setState(prev => ({ ...prev, error: errorMessage, loading: false }));
    }
  };

  const loadInsights = async () => {
    if (!user?.uid) return;

    try {
      const insights = await enhancedAssessmentService.getAssessmentInsights(user.uid);
      setState(prev => ({ ...prev, insights }));
    } catch (error) {
      console.error('Failed to load insights:', error);
    }
  };

  // Create assessment with AI analysis
  const createEnhancedAssessment = async (
    testType: TestType,
    videoFile: File,
    notes: string = '',
    mode: AssessmentMode = { type: 'enhanced' },
    onProgress?: (progress: AssessmentProcessingProgress) => void
  ): Promise<EnhancedAssessmentResult> => {
    
    if (!user?.uid) {
      throw new Error('User not authenticated');
    }

    // Create athlete object from user
    const athlete: Athlete = {
      id: user.uid,
      name: user.displayName || user.email || 'Unknown',
      email: user.email || '',
      phoneNumber: user.phoneNumber || '',
      age: 25, // Would come from profile
      gender: 'male' as const, // Would come from profile
      height: 175,
      weight: 70,
      primarySport: 'general',
      sportsPlayed: ['general'],
      country: 'India',
      state: 'Unknown',
      city: 'Unknown',
      pinCode: '000000',
      profilePictureUrl: user.photoURL || '',
      location: 'Unknown',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    try {
      setState(prev => ({ 
        ...prev, 
        uploading: true, 
        processing: true, 
        error: null,
        processingProgress: undefined
      }));

      const progressHandler = (progress: AssessmentProcessingProgress) => {
        setState(prev => ({ ...prev, processingProgress: progress }));
        if (onProgress) {
          onProgress(progress);
        }
      };

      let result: EnhancedAssessmentResult;

      switch (mode.type) {
        case 'quick':
          // Quick assessment with background AI processing
          const basicAssessment = await enhancedAssessmentService.createQuickAssessment(
            athlete,
            testType,
            videoFile,
            notes
          );
          
          result = {
            assessment: basicAssessment,
            integrityAnalysis: null,
            performanceFeedback: null,
            comprehensiveFeedback: null,
            movementAnalysis: null,
            processingStatus: 'partial'
          };
          break;

        case 'enhanced':
          // Enhanced assessment with key AI features
          result = await enhancedAssessmentService.createEnhancedAssessment(
            athlete,
            testType,
            videoFile,
            notes,
            {
              enableIntegrityCheck: true,
              enablePerformanceAnalysis: true,
              enableMovementAnalysis: false, // Skip for faster processing
              enableRealTimeFeedback: true,
              detailedBiomechanics: false,
              generateReports: false,
              notifySAI: false,
              ...mode.options
            },
            progressHandler
          );
          break;

        case 'comprehensive':
          // Full comprehensive analysis with all features
          result = await enhancedAssessmentService.createEnhancedAssessment(
            athlete,
            testType,
            videoFile,
            notes,
            {
              enableIntegrityCheck: true,
              enablePerformanceAnalysis: true,
              enableMovementAnalysis: true,
              enableRealTimeFeedback: true,
              detailedBiomechanics: true,
              generateReports: true,
              notifySAI: false, // Admin can enable this manually
              ...mode.options
            },
            progressHandler
          );
          break;
      }

      // Update state with new results
      setState(prev => ({
        ...prev,
        assessments: [result.assessment, ...prev.assessments],
        enhancedResults: [result, ...prev.enhancedResults],
        uploading: false,
        processing: false,
        processingProgress: undefined
      }));

      // Refresh insights
      loadInsights();

      return result;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create assessment';
      setState(prev => ({ 
        ...prev, 
        error: errorMessage, 
        uploading: false, 
        processing: false,
        processingProgress: undefined
      }));
      throw error;
    }
  };

  // Create basic assessment (backwards compatibility)
  const createAssessment = async (
    testType: TestType,
    videoFile: File,
    notes: string = ''
  ): Promise<AssessmentTest> => {
    const result = await createEnhancedAssessment(testType, videoFile, notes, { type: 'quick' });
    return result.assessment;
  };

  // Reprocess existing assessment with different options
  const reprocessAssessment = async (
    assessmentId: string,
    options: Partial<AssessmentProcessingOptions>,
    onProgress?: (progress: AssessmentProcessingProgress) => void
  ): Promise<EnhancedAssessmentResult | null> => {
    
    try {
      setState(prev => ({ ...prev, processing: true, error: null }));

      const progressHandler = (progress: AssessmentProcessingProgress) => {
        setState(prev => ({ ...prev, processingProgress: progress }));
        if (onProgress) {
          onProgress(progress);
        }
      };

      const result = await enhancedAssessmentService.reprocessAssessment(
        assessmentId,
        options,
        progressHandler
      );

      if (result) {
        // Update enhanced results
        setState(prev => ({
          ...prev,
          enhancedResults: prev.enhancedResults.map(r => 
            r.assessment.id === assessmentId ? result : r
          ),
          processing: false,
          processingProgress: undefined
        }));
      }

      return result;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to reprocess assessment';
      setState(prev => ({ 
        ...prev, 
        error: errorMessage, 
        processing: false,
        processingProgress: undefined
      }));
      throw error;
    }
  };

  // Get enhanced result for specific assessment
  const getEnhancedResult = useCallback((assessmentId: string): EnhancedAssessmentResult | null => {
    return state.enhancedResults.find(result => result.assessment.id === assessmentId) || null;
  }, [state.enhancedResults]);

  // Get assessments with AI analysis status
  const getAssessmentsWithStatus = useCallback(() => {
    return state.assessments.map(assessment => {
      const enhanced = getEnhancedResult(assessment.id);
      return {
        ...assessment,
        hasAIAnalysis: !!enhanced,
        processingStatus: enhanced?.processingStatus || 'none',
        integrityStatus: enhanced?.integrityAnalysis?.recommendedAction || 'unknown',
        performancePercentile: enhanced?.performanceFeedback?.comparisons.ageGroup.percentileRank || null,
        aiInsights: enhanced?.comprehensiveFeedback?.combinedInsights.keyFindings || []
      };
    });
  }, [state.assessments, getEnhancedResult]);

  // Get processing status for real-time updates
  const getProcessingStatus = (processingId: string) => {
    return enhancedAssessmentService.getProcessingStatus(processingId);
  };

  // Assessment analytics
  const getAssessmentAnalytics = useCallback(() => {
    const total = state.assessments.length;
    const withAI = state.enhancedResults.length;
    const completed = state.enhancedResults.filter(r => r.processingStatus === 'complete').length;
    const failed = state.enhancedResults.filter(r => r.processingStatus === 'failed').length;
    
    // Integrity statistics
    const integrityChecked = state.enhancedResults.filter(r => r.integrityAnalysis);
    const integrityPassed = integrityChecked.filter(r => r.integrityAnalysis?.recommendedAction === 'approve');
    
    // Performance statistics
    const withPerformance = state.enhancedResults.filter(r => r.performanceFeedback);
    const avgPercentile = withPerformance.length > 0 ? 
      withPerformance.reduce((sum, r) => sum + (r.performanceFeedback?.comparisons.ageGroup.percentileRank || 0), 0) / withPerformance.length : 0;

    return {
      total,
      withAIAnalysis: withAI,
      analysisComplete: completed,
      analysisFailed: failed,
      integrityPassRate: integrityChecked.length > 0 ? (integrityPassed.length / integrityChecked.length) * 100 : 100,
      averagePercentile: Math.round(avgPercentile),
      processingSuccessRate: withAI > 0 ? (completed / withAI) * 100 : 0
    };
  }, [state.assessments, state.enhancedResults]);

  // Update assessment notes
  const updateAssessmentNotes = async (assessmentId: string, notes: string) => {
    try {
      await assessmentService.updateAssessmentNotes(assessmentId, notes);
      
      // Update local state
      setState(prev => ({
        ...prev,
        assessments: prev.assessments.map(assessment =>
          assessment.id === assessmentId
            ? { ...assessment, notes }
            : assessment
        ),
        enhancedResults: prev.enhancedResults.map(result =>
          result.assessment.id === assessmentId
            ? { ...result, assessment: { ...result.assessment, notes } }
            : result
        )
      }));

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update notes';
      setState(prev => ({ ...prev, error: errorMessage }));
      throw error;
    }
  };

  // Utility methods (backwards compatibility)
  const getScoreDisplay = (testType: TestType, score: number) => {
    return assessmentService.getScoreDisplayText(testType, score);
  };

  const getAssessmentsByType = (testType: TestType) => {
    return state.assessments.filter(assessment => assessment.testType === testType);
  };

  const getLatestScore = (testType: TestType) => {
    const assessments = getAssessmentsByType(testType);
    return assessments.length > 0 ? assessments[0].score : null;
  };

  const getBestScore = (testType: TestType) => {
    const assessments = getAssessmentsByType(testType);
    if (assessments.length === 0) return null;
    return Math.max(...assessments.map(a => a.score));
  };

  const clearError = () => {
    setState(prev => ({ ...prev, error: null }));
  };

  // Assessment modes helper
  const getAvailableModes = (): AssessmentMode[] => [
    {
      type: 'quick',
      options: { enableIntegrityCheck: false, enablePerformanceAnalysis: false }
    },
    {
      type: 'enhanced',
      options: { enableIntegrityCheck: true, enablePerformanceAnalysis: true, enableMovementAnalysis: false }
    },
    {
      type: 'comprehensive',
      options: { enableIntegrityCheck: true, enablePerformanceAnalysis: true, enableMovementAnalysis: true, detailedBiomechanics: true }
    }
  ];

  const getModeDescription = (mode: AssessmentMode['type']): string => {
    switch (mode) {
      case 'quick':
        return 'Fast submission with basic scoring (< 5 seconds)';
      case 'enhanced':
        return 'AI analysis with integrity check and performance benchmarking (~ 30 seconds)';
      case 'comprehensive':
        return 'Full analysis with movement tracking and detailed feedback (~ 60 seconds)';
      default:
        return 'Standard assessment';
    }
  };

  return {
    // State
    assessments: state.assessments,
    enhancedResults: state.enhancedResults,
    loading: state.loading,
    error: state.error,
    uploading: state.uploading,
    processing: state.processing,
    processingProgress: state.processingProgress,
    insights: state.insights,

    // Enhanced methods
    createEnhancedAssessment,
    reprocessAssessment,
    getEnhancedResult,
    getAssessmentsWithStatus,
    getProcessingStatus,
    getAssessmentAnalytics,
    loadInsights,

    // Assessment modes
    getAvailableModes,
    getModeDescription,

    // Backwards compatibility
    createAssessment,
    updateAssessmentNotes,
    getScoreDisplay,
    getAssessmentsByType,
    getLatestScore,
    getBestScore,
    clearError,
    refetch: loadAssessments
  };
};
