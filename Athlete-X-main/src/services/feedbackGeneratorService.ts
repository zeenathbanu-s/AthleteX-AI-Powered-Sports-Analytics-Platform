import { Athlete, AssessmentTest, TestType } from '../models';
import cheatDetectionService, { CheatDetectionResult } from './cheatDetectionService';
import benchmarkingService, { InstantFeedback } from './benchmarkingService';
import assessmentService from './assessmentService';

interface ComprehensiveFeedback {
  assessmentId: string;
  athleteId: string;
  timestamp: Date;
  overallStatus: 'approved' | 'under_review' | 'needs_resubmission' | 'rejected';
  integrityAnalysis: {
    integrityScore: number;
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    flaggedIssues: string[];
    recommendations: string[];
    approved: boolean;
  };
  performanceFeedback: InstantFeedback;
  combinedInsights: {
    keyFindings: string[];
    actionItems: string[];
    overallAssessment: string;
    confidenceLevel: 'high' | 'medium' | 'low';
  };
  nextSteps: {
    immediate: string[];
    followUp: string[];
    longTerm: string[];
  };
  visualSummary: {
    scoreBreakdown: {
      integrity: number;
      performance: number;
      improvement: number;
      composite: number;
    };
    comparisons: Array<{
      category: string;
      value: number;
      benchmark: number;
      status: 'above' | 'at' | 'below';
    }>;
    progressIndicators: {
      currentLevel: string;
      nextTarget: { level: string; score: number; timeframe: string };
      trajectory: 'upward' | 'stable' | 'declining';
    };
  };
  alerts: Array<{
    type: 'success' | 'warning' | 'error' | 'info';
    message: string;
    priority: 'high' | 'medium' | 'low';
  }>;
}

interface FeedbackGenerationOptions {
  includeIntegrityCheck: boolean;
  includePerformanceAnalysis: boolean;
  includePeerComparison: boolean;
  includeProgressTracking: boolean;
  detailedRecommendations: boolean;
  realTimeNotifications: boolean;
}

interface VideoAnalysisProgress {
  stage: 'uploading' | 'processing' | 'analyzing_integrity' | 'analyzing_performance' | 'generating_feedback' | 'complete' | 'error';
  progress: number; // 0-100
  message: string;
  estimatedTimeRemaining?: number; // in seconds
}

class FeedbackGeneratorService {
  private processingQueue: Map<string, VideoAnalysisProgress> = new Map();
  private feedbackCache: Map<string, ComprehensiveFeedback> = new Map();

  // Main feedback generation method
  async generateComprehensiveFeedback(
    athlete: Athlete,
    assessment: AssessmentTest,
    videoFile: File,
    options: FeedbackGenerationOptions = this.getDefaultOptions(),
    onProgress?: (progress: VideoAnalysisProgress) => void
  ): Promise<ComprehensiveFeedback> {
    const analysisId = `${assessment.id}_${Date.now()}`;
    
    try {
      // Initialize progress tracking
      await this.updateProgress(analysisId, {
        stage: 'processing',
        progress: 0,
        message: 'Starting comprehensive analysis...'
      }, onProgress);

      // Step 1: Integrity Analysis (if enabled)
      let integrityResult: CheatDetectionResult | null = null;
      if (options.includeIntegrityCheck) {
        await this.updateProgress(analysisId, {
          stage: 'analyzing_integrity',
          progress: 20,
          message: 'Analyzing video integrity and detecting anomalies...',
          estimatedTimeRemaining: 15
        }, onProgress);

        const previousAssessments = options.includeProgressTracking ? 
          await assessmentService.getAthleteAssessments(athlete.id) : undefined;

        integrityResult = await cheatDetectionService.analyzeAssessment(
          assessment, 
          videoFile, 
          athlete,
          { previousAssessments }
        );
      }

      // Step 2: Performance Analysis (if enabled)
      let performanceFeedback: InstantFeedback | null = null;
      if (options.includePerformanceAnalysis) {
        await this.updateProgress(analysisId, {
          stage: 'analyzing_performance',
          progress: 60,
          message: 'Analyzing performance and generating benchmarks...',
          estimatedTimeRemaining: 8
        }, onProgress);

        const previousAssessments = options.includeProgressTracking ?
          await assessmentService.getAthleteAssessments(athlete.id) : undefined;

        performanceFeedback = await benchmarkingService.generateInstantFeedback(
          athlete,
          assessment,
          previousAssessments
        );
      }

      // Step 3: Generate comprehensive feedback
      await this.updateProgress(analysisId, {
        stage: 'generating_feedback',
        progress: 85,
        message: 'Combining insights and generating recommendations...',
        estimatedTimeRemaining: 3
      }, onProgress);

      const comprehensiveFeedback = await this.combineAnalyses(
        athlete,
        assessment,
        integrityResult,
        performanceFeedback,
        options
      );

      // Step 4: Cache and complete
      this.feedbackCache.set(assessment.id, comprehensiveFeedback);

      await this.updateProgress(analysisId, {
        stage: 'complete',
        progress: 100,
        message: 'Analysis complete! Feedback generated successfully.'
      }, onProgress);

      return comprehensiveFeedback;

    } catch (error) {
      console.error('Error generating comprehensive feedback:', error);
      
      await this.updateProgress(analysisId, {
        stage: 'error',
        progress: 0,
        message: `Analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      }, onProgress);

      throw error;
    } finally {
      // Clean up progress tracking after a delay
      setTimeout(() => {
        this.processingQueue.delete(analysisId);
      }, 60000); // Keep for 1 minute for potential retry
    }
  }

  // Combine integrity and performance analyses
  private async combineAnalyses(
    athlete: Athlete,
    assessment: AssessmentTest,
    integrityResult: CheatDetectionResult | null,
    performanceFeedback: InstantFeedback | null,
    options: FeedbackGenerationOptions
  ): Promise<ComprehensiveFeedback> {
    
    // Determine overall status
    const overallStatus = this.determineOverallStatus(integrityResult, performanceFeedback);
    
    // Generate integrity analysis summary
    const integrityAnalysis = this.generateIntegrityAnalysis(integrityResult);
    
    // Generate combined insights
    const combinedInsights = this.generateCombinedInsights(
      athlete, 
      assessment, 
      integrityResult, 
      performanceFeedback
    );
    
    // Generate comprehensive next steps
    const nextSteps = this.generateComprehensiveNextSteps(
      integrityResult, 
      performanceFeedback, 
      overallStatus
    );
    
    // Generate visual summary
    const visualSummary = this.generateVisualSummary(
      assessment, 
      integrityResult, 
      performanceFeedback
    );
    
    // Generate alerts
    const alerts = this.generateAlerts(integrityResult, performanceFeedback, overallStatus);

    return {
      assessmentId: assessment.id,
      athleteId: athlete.id,
      timestamp: new Date(),
      overallStatus,
      integrityAnalysis,
      performanceFeedback: performanceFeedback!,
      combinedInsights,
      nextSteps,
      visualSummary,
      alerts
    };
  }

  private determineOverallStatus(
    integrityResult: CheatDetectionResult | null,
    performanceFeedback: InstantFeedback | null
  ): ComprehensiveFeedback['overallStatus'] {
    
    // If integrity check failed critically
    if (integrityResult?.riskLevel === 'critical') {
      return 'rejected';
    }
    
    // If integrity has high risk
    if (integrityResult?.riskLevel === 'high') {
      return 'under_review';
    }
    
    // If integrity has medium risk but performance is poor
    if (integrityResult?.riskLevel === 'medium' && 
        performanceFeedback?.overallRating === 'needs_improvement') {
      return 'needs_resubmission';
    }
    
    // If integrity issues need resubmission
    if (integrityResult?.recommendedAction === 'request_resubmission') {
      return 'needs_resubmission';
    }
    
    // If integrity needs review
    if (integrityResult?.recommendedAction === 'review') {
      return 'under_review';
    }
    
    // Default to approved if no critical issues
    return 'approved';
  }

  private generateIntegrityAnalysis(integrityResult: CheatDetectionResult | null): ComprehensiveFeedback['integrityAnalysis'] {
    if (!integrityResult) {
      return {
        integrityScore: 100,
        riskLevel: 'low',
        flaggedIssues: [],
        recommendations: ['Integrity check was skipped'],
        approved: true
      };
    }

    return {
      integrityScore: integrityResult.overallIntegrityScore,
      riskLevel: integrityResult.riskLevel,
      flaggedIssues: integrityResult.flaggedReasons,
      recommendations: integrityResult.suggestions,
      approved: integrityResult.recommendedAction === 'approve'
    };
  }

  private generateCombinedInsights(
    athlete: Athlete,
    assessment: AssessmentTest,
    integrityResult: CheatDetectionResult | null,
    performanceFeedback: InstantFeedback | null
  ): ComprehensiveFeedback['combinedInsights'] {
    
    const keyFindings: string[] = [];
    const actionItems: string[] = [];
    let overallAssessment = '';
    let confidenceLevel: 'high' | 'medium' | 'low' = 'high';

    // Integrity findings
    if (integrityResult) {
      if (integrityResult.overallIntegrityScore >= 90) {
        keyFindings.push('✅ High video integrity - no significant anomalies detected');
      } else if (integrityResult.overallIntegrityScore >= 70) {
        keyFindings.push('⚠️ Minor integrity concerns detected');
        confidenceLevel = 'medium';
      } else {
        keyFindings.push('🚨 Significant integrity issues identified');
        confidenceLevel = 'low';
      }

      if (integrityResult.flaggedReasons.length > 0) {
        actionItems.push(`Address integrity issues: ${integrityResult.flaggedReasons.join(', ')}`);
      }
    }

    // Performance findings
    if (performanceFeedback) {
      const percentile = performanceFeedback.comparisons.ageGroup.percentileRank;
      
      if (percentile >= 90) {
        keyFindings.push(`🏆 Outstanding ${assessment.testType} performance (${percentile}th percentile)`);
      } else if (percentile >= 75) {
        keyFindings.push(`🌟 Strong ${assessment.testType} performance (${percentile}th percentile)`);
      } else if (percentile >= 50) {
        keyFindings.push(`📊 Average ${assessment.testType} performance (${percentile}th percentile)`);
      } else {
        keyFindings.push(`📈 Below average ${assessment.testType} performance (${percentile}th percentile)`);
      }

      // Add improvement insights
      if (performanceFeedback.scoreAnalysis.improvement > 0) {
        keyFindings.push(`📈 Improved by ${performanceFeedback.scoreAnalysis.improvement.toFixed(1)} points since last assessment`);
      }

      // Add action items from performance feedback
      actionItems.push(...performanceFeedback.nextSteps.immediate);
    }

    // Generate overall assessment
    if ((integrityResult?.overallIntegrityScore ?? 0) >= 85 && (performanceFeedback?.comparisons.ageGroup.percentileRank ?? 0) >= 75) {
      overallAssessment = 'Excellent assessment with high integrity and strong performance. Continue with current training approach.';
    } else if ((integrityResult?.overallIntegrityScore ?? 0) >= 70 && (performanceFeedback?.comparisons.ageGroup.percentileRank ?? 0) >= 50) {
      overallAssessment = 'Solid assessment with room for improvement. Focus on addressing identified areas for better results.';
    } else if (integrityResult && integrityResult.overallIntegrityScore < 70) {
      overallAssessment = 'Assessment integrity concerns require attention before performance can be reliably evaluated.';
    } else {
      overallAssessment = 'Assessment completed with areas identified for development and improvement.';
    }

    return {
      keyFindings,
      actionItems,
      overallAssessment,
      confidenceLevel
    };
  }

  private generateComprehensiveNextSteps(
    integrityResult: CheatDetectionResult | null,
    performanceFeedback: InstantFeedback | null,
    overallStatus: ComprehensiveFeedback['overallStatus']
  ): ComprehensiveFeedback['nextSteps'] {
    
    const immediate: string[] = [];
    const followUp: string[] = [];
    const longTerm: string[] = [];

    // Handle based on overall status
    switch (overallStatus) {
      case 'rejected':
        immediate.push('Assessment rejected - contact support for guidance');
        immediate.push('Review assessment guidelines before resubmission');
        break;
        
      case 'under_review':
        immediate.push('Assessment under manual review - expect response within 24-48 hours');
        immediate.push('Prepare additional documentation if requested');
        followUp.push('Monitor review status and respond to any requests');
        break;
        
      case 'needs_resubmission':
        immediate.push('Retake assessment following provided guidelines');
        immediate.push(...(integrityResult?.suggestions || []));
        followUp.push('Schedule reassessment within 1-2 weeks');
        break;
        
      case 'approved':
        if (performanceFeedback) {
          immediate.push(...performanceFeedback.nextSteps.immediate);
          followUp.push(...performanceFeedback.nextSteps.shortTerm);
          longTerm.push(...performanceFeedback.nextSteps.longTerm);
        }
        break;
    }

    // Add general recommendations
    if (performanceFeedback?.scoreAnalysis.trend === 'declining') {
      immediate.push('Analyze recent training changes that may be affecting performance');
      followUp.push('Consult with coach to adjust training program');
    }

    return { immediate, followUp, longTerm };
  }

  private generateVisualSummary(
    assessment: AssessmentTest,
    integrityResult: CheatDetectionResult | null,
    performanceFeedback: InstantFeedback | null
  ): ComprehensiveFeedback['visualSummary'] {
    
    // Score breakdown
    const scoreBreakdown = {
      integrity: integrityResult?.overallIntegrityScore || 100,
      performance: assessment.score,
      improvement: performanceFeedback?.scoreAnalysis.improvement || 0,
      composite: this.calculateCompositeScore(
        integrityResult?.overallIntegrityScore || 100,
        assessment.score,
        performanceFeedback?.scoreAnalysis.improvement || 0
      )
    };

    // Comparisons
    const comparisons = [];
    if (performanceFeedback) {
      comparisons.push(
        {
          category: 'Age Group Average',
          value: assessment.score,
          benchmark: performanceFeedback.comparisons.ageGroup.benchmarkProfile.percentiles[50],
          status: assessment.score > performanceFeedback.comparisons.ageGroup.benchmarkProfile.percentiles[50] ? 'above' as const : 
                 assessment.score === performanceFeedback.comparisons.ageGroup.benchmarkProfile.percentiles[50] ? 'at' as const : 'below' as const
        },
        {
          category: 'Elite Level',
          value: assessment.score,
          benchmark: performanceFeedback.comparisons.ageGroup.benchmarkProfile.percentiles[95],
          status: assessment.score > performanceFeedback.comparisons.ageGroup.benchmarkProfile.percentiles[95] ? 'above' as const : 
                 assessment.score === performanceFeedback.comparisons.ageGroup.benchmarkProfile.percentiles[95] ? 'at' as const : 'below' as const
        }
      );

      if (performanceFeedback.comparisons.national) {
        comparisons.push({
          category: 'National Average',
          value: assessment.score,
          benchmark: performanceFeedback.comparisons.national.benchmarkProfile.percentiles[50],
          status: assessment.score > performanceFeedback.comparisons.national.benchmarkProfile.percentiles[50] ? 'above' as const : 
                 assessment.score === performanceFeedback.comparisons.national.benchmarkProfile.percentiles[50] ? 'at' as const : 'below' as const
        });
      }
    }

    // Progress indicators
    const progressIndicators = {
      currentLevel: performanceFeedback?.overallRating || 'fair',
      nextTarget: performanceFeedback ? {
        level: this.getNextLevel(performanceFeedback.overallRating),
        score: performanceFeedback.targetScores.nextLevel.score,
        timeframe: performanceFeedback.targetScores.nextLevel.timeframe
      } : { level: 'good', score: 80, timeframe: '3-6 months' },
      trajectory: performanceFeedback?.scoreAnalysis.trend === 'improving' ? 'upward' as const :
                 performanceFeedback?.scoreAnalysis.trend === 'declining' ? 'declining' as const : 'stable' as const
    };

    return { scoreBreakdown, comparisons, progressIndicators };
  }

  private generateAlerts(
    integrityResult: CheatDetectionResult | null,
    performanceFeedback: InstantFeedback | null,
    overallStatus: ComprehensiveFeedback['overallStatus']
  ): ComprehensiveFeedback['alerts'] {
    
    const alerts: ComprehensiveFeedback['alerts'] = [];

    // Status-based alerts
    switch (overallStatus) {
      case 'approved':
        alerts.push({
          type: 'success',
          message: 'Assessment approved successfully!',
          priority: 'medium'
        });
        break;
        
      case 'under_review':
        alerts.push({
          type: 'warning',
          message: 'Assessment under review - response expected within 24-48 hours',
          priority: 'high'
        });
        break;
        
      case 'needs_resubmission':
        alerts.push({
          type: 'warning',
          message: 'Please retake the assessment following the provided guidelines',
          priority: 'high'
        });
        break;
        
      case 'rejected':
        alerts.push({
          type: 'error',
          message: 'Assessment rejected due to integrity violations',
          priority: 'high'
        });
        break;
    }

    // Performance-based alerts
    if (performanceFeedback) {
      if (performanceFeedback.comparisons.ageGroup.percentileRank >= 95) {
        alerts.push({
          type: 'success',
          message: `Outstanding performance! You're in the top 5% for your age group.`,
          priority: 'medium'
        });
      }

      if (performanceFeedback.scoreAnalysis.improvement > 10) {
        alerts.push({
          type: 'success',
          message: `Great improvement! You've gained ${performanceFeedback.scoreAnalysis.improvement.toFixed(1)} points.`,
          priority: 'low'
        });
      } else if (performanceFeedback.scoreAnalysis.improvement < -5) {
        alerts.push({
          type: 'warning',
          message: `Performance declined by ${Math.abs(performanceFeedback.scoreAnalysis.improvement).toFixed(1)} points. Consider reviewing your training.`,
          priority: 'medium'
        });
      }
    }

    // Integrity-based alerts
    if (integrityResult) {
      if (integrityResult.overallIntegrityScore < 60) {
        alerts.push({
          type: 'error',
          message: 'Significant integrity issues detected in your submission',
          priority: 'high'
        });
      } else if (integrityResult.overallIntegrityScore < 80) {
        alerts.push({
          type: 'warning',
          message: 'Minor technical issues detected - consider improving recording conditions',
          priority: 'low'
        });
      }
    }

    return alerts;
  }

  // Helper methods
  private async updateProgress(
    analysisId: string, 
    progress: VideoAnalysisProgress, 
    onProgress?: (progress: VideoAnalysisProgress) => void
  ): Promise<void> {
    this.processingQueue.set(analysisId, progress);
    if (onProgress) {
      onProgress(progress);
    }
    
    // Simulate processing time for realistic feedback
    if (progress.estimatedTimeRemaining) {
      await new Promise(resolve => setTimeout(resolve, Math.min((progress.estimatedTimeRemaining ?? 0) * 100, 2000)));
    }
  }

  private calculateCompositeScore(integrityScore: number, performanceScore: number, improvement: number): number {
    // Weighted composite score
    const weights = {
      integrity: 0.3,
      performance: 0.6,
      improvement: 0.1
    };

    const normalizedImprovement = Math.max(0, Math.min(100, 50 + improvement * 2)); // Normalize improvement to 0-100
    
    return Math.round(
      (integrityScore * weights.integrity) +
      (performanceScore * weights.performance) +
      (normalizedImprovement * weights.improvement)
    );
  }

  private getNextLevel(currentRating: string): string {
    const levels = ['needs_improvement', 'fair', 'good', 'excellent', 'outstanding'];
    const currentIndex = levels.indexOf(currentRating);
    return levels[Math.min(currentIndex + 1, levels.length - 1)];
  }

  private getDefaultOptions(): FeedbackGenerationOptions {
    return {
      includeIntegrityCheck: true,
      includePerformanceAnalysis: true,
      includePeerComparison: true,
      includeProgressTracking: true,
      detailedRecommendations: true,
      realTimeNotifications: true
    };
  }

  // Public utility methods
  getProcessingStatus(analysisId: string): VideoAnalysisProgress | null {
    return this.processingQueue.get(analysisId) || null;
  }

  getCachedFeedback(assessmentId: string): ComprehensiveFeedback | null {
    return this.feedbackCache.get(assessmentId) || null;
  }

  // Batch processing for multiple assessments
  async generateBatchFeedback(
    requests: Array<{
      athlete: Athlete;
      assessment: AssessmentTest;
      videoFile: File;
      options?: FeedbackGenerationOptions;
    }>,
    onProgress?: (overallProgress: { completed: number; total: number; current?: string }) => void
  ): Promise<ComprehensiveFeedback[]> {
    
    console.log(`🔄 Starting batch feedback generation for ${requests.length} assessments...`);
    
    const results: ComprehensiveFeedback[] = [];
    const total = requests.length;

    for (let i = 0; i < requests.length; i++) {
      const { athlete, assessment, videoFile, options } = requests[i];
      
      if (onProgress) {
        onProgress({
          completed: i,
          total,
          current: `Processing ${athlete.name}'s ${assessment.testType} assessment...`
        });
      }

      try {
        const feedback = await this.generateComprehensiveFeedback(
          athlete,
          assessment,
          videoFile,
          options
        );
        results.push(feedback);
      } catch (error) {
        console.error(`Error processing assessment for ${athlete.name}:`, error);
        // Continue with next assessment
      }

      // Small delay between assessments to prevent system overload
      if (i < requests.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    if (onProgress) {
      onProgress({ completed: total, total });
    }

    console.log(`✅ Batch feedback generation complete. Processed ${results.length}/${total} assessments.`);
    return results;
  }

  // Quick feedback for immediate response (less comprehensive)
  async generateQuickFeedback(
    athlete: Athlete,
    assessment: AssessmentTest,
    previousAssessments?: AssessmentTest[]
  ): Promise<{
    overallRating: string;
    percentileRank: number;
    improvement: number;
    keyMessage: string;
    nextTarget: { score: number; timeframe: string };
  }> {
    
    const feedback = await benchmarkingService.generateInstantFeedback(
      athlete,
      assessment,
      previousAssessments
    );

    return {
      overallRating: feedback.overallRating,
      percentileRank: feedback.comparisons.ageGroup.percentileRank,
      improvement: feedback.scoreAnalysis.improvement,
      keyMessage: feedback.motivationalMessage,
      nextTarget: {
        score: feedback.targetScores.nextLevel.score,
        timeframe: feedback.targetScores.nextLevel.timeframe
      }
    };
  }
}

const feedbackGeneratorService = new FeedbackGeneratorService();
export default feedbackGeneratorService;
export type { 
  ComprehensiveFeedback, 
  FeedbackGenerationOptions, 
  VideoAnalysisProgress 
};
