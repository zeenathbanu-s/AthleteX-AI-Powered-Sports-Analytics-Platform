import { Athlete, AssessmentTest, TestType, SportType } from '../models';
import { SAITalentProfile } from './saiCloudService';

interface TalentScore {
  athleteId: string;
  overallScore: number;
  categoryScores: {
    physical: number;
    technical: number;
    mental: number;
    potential: number;
  };
  sportSpecificScores: { [sport: string]: number };
  riskFactors: string[];
  strengthAreas: string[];
  recommendedSports: string[];
  confidenceLevel: number; // 0-1
}

interface TalentPrediction {
  athleteId: string;
  predictedPeakAge: number;
  projectedImprovement: number;
  successProbability: number;
  optimalSport: string;
  timeToReachPotential: number; // in months
  trainingRecommendations: string[];
}

interface PopulationAnalytics {
  totalAnalyzed: number;
  averageScoreByRegion: { [region: string]: number };
  talentDensityByState: { [state: string]: number };
  ageDistribution: { [ageRange: string]: number };
  sportAffinityTrends: { [sport: string]: number };
  identificationRates: {
    exceptional: number; // 95th+ percentile
    elite: number; // 90th+ percentile
    highPotential: number; // 80th+ percentile
    developing: number; // 60th+ percentile
  };
}

interface ComparativeAnalysis {
  athleteId: string;
  peerComparison: {
    sameAge: { rank: number; totalPeers: number; percentile: number };
    sameRegion: { rank: number; totalPeers: number; percentile: number };
    sameSport: { rank: number; totalPeers: number; percentile: number };
  };
  nationalStandards: {
    meetsEliteThreshold: boolean;
    distanceFromElite: number;
    projectedRanking: number;
  };
  internationalBenchmarks: {
    estimatedGlobalPercentile: number;
    competitiveLevel: 'international' | 'national' | 'state' | 'regional' | 'local';
  };
}

interface TalentIdentificationFilter {
  minOverallScore?: number;
  maxAge?: number;
  requiredSports?: string[];
  excludeRiskFactors?: string[];
  minConfidenceLevel?: number;
  regionFocus?: string[];
  priorityCategories?: Array<'physical' | 'technical' | 'mental' | 'potential'>;
}

class TalentAnalyticsService {
  // Sport-specific performance weights
  private readonly sportWeights: { [sport: string]: { [testType: string]: number } } = {
    'athletics': {
      'speed': 0.35,
      'endurance': 0.30,
      'strength': 0.20,
      'agility': 0.10,
      'flexibility': 0.05
    },
    'football': {
      'agility': 0.30,
      'speed': 0.25,
      'endurance': 0.20,
      'strength': 0.15,
      'balance': 0.10
    },
    'basketball': {
      'agility': 0.30,
      'speed': 0.20,
      'strength': 0.20,
      'balance': 0.15,
      'endurance': 0.15
    },
    'hockey': {
      'agility': 0.25,
      'speed': 0.25,
      'endurance': 0.20,
      'strength': 0.15,
      'balance': 0.15
    },
    'wrestling': {
      'strength': 0.35,
      'agility': 0.25,
      'endurance': 0.20,
      'balance': 0.15,
      'flexibility': 0.05
    },
    'badminton': {
      'agility': 0.35,
      'speed': 0.25,
      'balance': 0.20,
      'endurance': 0.15,
      'flexibility': 0.05
    }
  };

  // Performance benchmarks by age and sport
  private readonly performanceBenchmarks: { [sport: string]: { [ageRange: string]: number } } = {
    'athletics': { '14-16': 70, '17-19': 75, '20-22': 80, '23-25': 82 },
    'football': { '14-16': 68, '17-19': 73, '20-22': 78, '23-25': 80 },
    'basketball': { '14-16': 69, '17-19': 74, '20-22': 79, '23-25': 81 },
    'hockey': { '14-16': 67, '17-19': 72, '20-22': 77, '23-25': 79 },
    'wrestling': { '14-16': 71, '17-19': 76, '20-22': 81, '23-25': 83 },
    'badminton': { '14-16': 66, '17-19': 71, '20-22': 76, '23-25': 78 }
  };

  // Calculate comprehensive talent score
  async calculateTalentScore(athlete: Athlete, assessments: AssessmentTest[]): Promise<TalentScore> {
    if (assessments.length === 0) {
      throw new Error('No assessments available for talent scoring');
    }

    // Calculate category scores
    const categoryScores = this.calculateCategoryScores(assessments);
    
    // Calculate sport-specific scores
    const sportSpecificScores = this.calculateSportSpecificScores(athlete.sportsPlayed as string[], assessments);
    
    // Overall score with age and potential adjustments
    const overallScore = this.calculateOverallScore(athlete, categoryScores, sportSpecificScores);
    
    // Identify risk factors and strengths
    const riskFactors = this.identifyRiskFactors(athlete, assessments);
    const strengthAreas = this.identifyStrengths(assessments);
    
    // Recommend optimal sports
    const recommendedSports = this.recommendSports(assessments);
    
    // Calculate confidence level
    const confidenceLevel = this.calculateConfidenceLevel(assessments);

    return {
      athleteId: athlete.id,
      overallScore,
      categoryScores,
      sportSpecificScores,
      riskFactors,
      strengthAreas,
      recommendedSports,
      confidenceLevel
    };
  }

  // Predict future performance and optimal development path
  async predictTalentTrajectory(athlete: Athlete, assessments: AssessmentTest[]): Promise<TalentPrediction> {
    const talentScore = await this.calculateTalentScore(athlete, assessments);
    
    // Predict peak performance age based on sport and current performance
    const predictedPeakAge = this.predictPeakAge(athlete, talentScore);
    
    // Calculate projected improvement potential
    const projectedImprovement = this.calculateImprovementPotential(athlete, talentScore);
    
    // Success probability based on multiple factors
    const successProbability = this.calculateSuccessProbability(athlete, talentScore, assessments);
    
    // Optimal sport recommendation
    const optimalSport = this.findOptimalSport(talentScore);
    
    // Time to reach potential
    const timeToReachPotential = this.estimateTimeToReachPotential(athlete, talentScore);
    
    // Training recommendations
    const trainingRecommendations = this.generateTrainingRecommendations(athlete, talentScore);

    return {
      athleteId: athlete.id,
      predictedPeakAge,
      projectedImprovement,
      successProbability,
      optimalSport,
      timeToReachPotential,
      trainingRecommendations
    };
  }

  // Perform comparative analysis against peers and standards
  async performComparativeAnalysis(
    athlete: Athlete, 
    assessments: AssessmentTest[], 
    populationData: { athletes: Athlete[]; assessmentsByAthlete: Map<string, AssessmentTest[]> }
  ): Promise<ComparativeAnalysis> {
    const talentScore = await this.calculateTalentScore(athlete, assessments);
    
    // Compare with same age group
    const sameAgeComparison = this.compareWithSameAge(athlete, talentScore, populationData);
    
    // Compare with same region
    const sameRegionComparison = this.compareWithSameRegion(athlete, talentScore, populationData);
    
    // Compare with same sport
    const sameSportComparison = this.compareWithSameSport(athlete, talentScore, populationData);
    
    // National standards assessment
    const nationalStandards = this.assessNationalStandards(athlete, talentScore);
    
    // International benchmarks estimation
    const internationalBenchmarks = this.estimateInternationalBenchmarks(talentScore);

    return {
      athleteId: athlete.id,
      peerComparison: {
        sameAge: sameAgeComparison,
        sameRegion: sameRegionComparison,
        sameSport: sameSportComparison
      },
      nationalStandards,
      internationalBenchmarks
    };
  }

  // Advanced filtering and ranking for talent identification
  async identifyTopTalents(
    populationData: { athletes: Athlete[]; assessmentsByAthlete: Map<string, AssessmentTest[]> },
    filters: TalentIdentificationFilter = {},
    limit: number = 50
  ): Promise<{
    rankedTalents: (TalentScore & { athlete: Athlete; prediction: TalentPrediction })[];
    analytics: PopulationAnalytics;
  }> {
    const allTalentScores: Array<TalentScore & { athlete: Athlete; prediction: TalentPrediction }> = [];

    // Calculate talent scores for all athletes
    for (const athlete of populationData.athletes) {
      const assessments = populationData.assessmentsByAthlete.get(athlete.id) || [];
      
      if (assessments.length === 0) continue;

      try {
        const talentScore = await this.calculateTalentScore(athlete, assessments);
        const prediction = await this.predictTalentTrajectory(athlete, assessments);
        
        // Apply filters
        if (this.passesFilters(athlete, talentScore, filters)) {
          allTalentScores.push({
            ...talentScore,
            athlete,
            prediction
          });
        }
      } catch (error) {
        console.warn(`Error calculating talent score for athlete ${athlete.id}:`, error);
      }
    }

    // Sort by overall score and confidence
    const rankedTalents = allTalentScores
      .sort((a, b) => {
        const scoreA = a.overallScore * a.confidenceLevel;
        const scoreB = b.overallScore * b.confidenceLevel;
        return scoreB - scoreA;
      })
      .slice(0, limit);

    // Generate population analytics
    const analytics = this.generatePopulationAnalytics(allTalentScores);

    return { rankedTalents, analytics };
  }

  // Generate insights for recruitment strategy
  async generateRecruitmentInsights(
    populationData: { athletes: Athlete[]; assessmentsByAthlete: Map<string, AssessmentTest[]> },
    targetSports: string[] = [],
    recruitmentQuota: number = 100
  ): Promise<{
    priorityRegions: string[];
    underrepresentedAreas: string[];
    optimalRecruitmentTiming: { [month: string]: number };
    successFactors: { [factor: string]: number };
    recommendedCriteria: TalentIdentificationFilter;
  }> {
    // Analyze current talent distribution
    const regionAnalysis = this.analyzeRegionalDistribution(populationData);
    const timingAnalysis = this.analyzeOptimalTiming(populationData);
    const factorAnalysis = this.analyzeSuccessFactors(populationData);
    
    // Generate recommendations
    const priorityRegions = Object.entries(regionAnalysis.talentDensity)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([region]) => region);
    
    const underrepresentedAreas = Object.entries(regionAnalysis.representation)
      .filter(([, ratio]) => ratio < 0.7) // Under 70% of expected representation
      .map(([region]) => region);
    
    const recommendedCriteria: TalentIdentificationFilter = {
      minOverallScore: this.calculateOptimalScoreThreshold(populationData, recruitmentQuota),
      maxAge: 22, // Peak development age
      minConfidenceLevel: 0.75,
      priorityCategories: factorAnalysis.topFactors.slice(0, 3) as any[]
    };

    return {
      priorityRegions,
      underrepresentedAreas,
      optimalRecruitmentTiming: timingAnalysis.monthlyOptimal,
      successFactors: factorAnalysis.factorWeights,
      recommendedCriteria
    };
  }

  // Private helper methods
  private calculateCategoryScores(assessments: AssessmentTest[]): TalentScore['categoryScores'] {
    const physicalTests = ['speed', 'strength', 'endurance'];
    const technicalTests = ['agility', 'balance', 'flexibility'];
    
    const physical = this.getAverageScore(assessments, physicalTests);
    const technical = this.getAverageScore(assessments, technicalTests);
    const mental = this.calculateMentalScore(assessments); // Based on consistency and improvement
    const potential = this.calculatePotentialScore(assessments); // Based on recent improvements

    return { physical, technical, mental, potential };
  }

  private calculateSportSpecificScores(sports: string[], assessments: AssessmentTest[]): { [sport: string]: number } {
    const scores: { [sport: string]: number } = {};

    for (const sport of sports) {
      const weights = this.sportWeights[sport.toLowerCase()] || this.sportWeights['athletics'];
      let weightedScore = 0;
      let totalWeight = 0;

      for (const [testType, weight] of Object.entries(weights)) {
        const testResults = assessments.filter(a => a.testType.toLowerCase() === testType);
        if (testResults.length > 0) {
          const avgScore = testResults.reduce((sum, test) => sum + test.score, 0) / testResults.length;
          weightedScore += avgScore * weight;
          totalWeight += weight;
        }
      }

      scores[sport] = totalWeight > 0 ? weightedScore / totalWeight : 0;
    }

    return scores;
  }

  private calculateOverallScore(athlete: Athlete, categoryScores: TalentScore['categoryScores'], sportScores: { [sport: string]: number }): number {
    // Base score from categories
    const categoryAverage = (categoryScores.physical + categoryScores.technical + categoryScores.mental + categoryScores.potential) / 4;
    
    // Best sport score
    const bestSportScore = Math.max(...Object.values(sportScores), 0);
    
    // Age adjustment (younger athletes get bonus for potential)
    const ageBonus = this.calculateAgeBonus(athlete.age);
    
    // Combine scores with weights
    const overallScore = (categoryAverage * 0.6) + (bestSportScore * 0.3) + (ageBonus * 0.1);
    
    return Math.round(overallScore * 100) / 100;
  }

  private identifyRiskFactors(athlete: Athlete, assessments: AssessmentTest[]): string[] {
    const riskFactors: string[] = [];

    // Age-related risks
    if (athlete.age > 24) riskFactors.push('Advanced age for talent development');
    if (athlete.age < 14) riskFactors.push('Very young - needs careful development');

    // Performance consistency risks
    const scores = assessments.map(a => a.score);
    const coefficient = this.calculateCoefficientOfVariation(scores);
    if (coefficient > 0.2) riskFactors.push('Inconsistent performance');

    // Sport specialization risks
    if (athlete.sportsPlayed.length > 3) riskFactors.push('Over-diversified - may need sport focus');
    if (athlete.sportsPlayed.length === 1 && athlete.age < 16) riskFactors.push('Early specialization risk');

    // Assessment coverage risks
    const testTypes = new Set(assessments.map(a => a.testType));
    if (testTypes.size < 3) riskFactors.push('Insufficient assessment coverage');

    return riskFactors;
  }

  private identifyStrengths(assessments: AssessmentTest[]): string[] {
    const testScores = new Map<TestType, number[]>();
    
    assessments.forEach(assessment => {
      if (!testScores.has(assessment.testType)) {
        testScores.set(assessment.testType, []);
      }
      testScores.get(assessment.testType)!.push(assessment.score);
    });

    const strengths: string[] = [];
    
    testScores.forEach((scores, testType) => {
      const avgScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
      if (avgScore >= 80) {
        strengths.push(testType.replace('_', ' '));
      }
    });

    return strengths;
  }

  private recommendSports(assessments: AssessmentTest[]): string[] {
    const testScores = new Map<TestType, number>();
    
    assessments.forEach(assessment => {
      const current = testScores.get(assessment.testType) || 0;
      testScores.set(assessment.testType, Math.max(current, assessment.score));
    });

    const recommendations: Array<{ sport: string; score: number }> = [];

    // Evaluate each sport based on test scores
    Object.entries(this.sportWeights).forEach(([sport, weights]) => {
      let sportScore = 0;
      let totalWeight = 0;

      Object.entries(weights).forEach(([testType, weight]) => {
        const score = testScores.get(testType as TestType) || 0;
        sportScore += score * weight;
        totalWeight += weight;
      });

      if (totalWeight > 0) {
        recommendations.push({
          sport: sport.charAt(0).toUpperCase() + sport.slice(1),
          score: sportScore / totalWeight
        });
      }
    });

    return recommendations
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map(r => r.sport);
  }

  private calculateConfidenceLevel(assessments: AssessmentTest[]): number {
    let confidence = 0.5; // Base confidence

    // More assessments increase confidence
    const assessmentBonus = Math.min(assessments.length * 0.1, 0.3);
    confidence += assessmentBonus;

    // Recent assessments increase confidence
    const recentAssessments = assessments.filter(a => 
      Date.now() - a.timestamp.getTime() < 90 * 24 * 60 * 60 * 1000 // Last 90 days
    );
    const recentBonus = Math.min(recentAssessments.length * 0.05, 0.2);
    confidence += recentBonus;

    return Math.min(confidence, 1.0);
  }

  private getAverageScore(assessments: AssessmentTest[], testTypes: string[]): number {
    const relevantAssessments = assessments.filter(a => 
      testTypes.includes(a.testType.toLowerCase())
    );
    
    if (relevantAssessments.length === 0) return 0;
    
    return relevantAssessments.reduce((sum, a) => sum + a.score, 0) / relevantAssessments.length;
  }

  private calculateMentalScore(assessments: AssessmentTest[]): number {
    // Base mental score on consistency and improvement trend
    const scores = assessments.map(a => a.score).sort((a, b) => a - b);
    const consistency = 100 - (this.calculateCoefficientOfVariation(scores) * 100);
    
    // Calculate improvement trend
    const chronologicalScores = assessments
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
      .map(a => a.score);
    
    const improvementTrend = this.calculateTrend(chronologicalScores);
    
    return Math.max(0, Math.min(100, (consistency * 0.6) + (improvementTrend * 0.4)));
  }

  private calculatePotentialScore(assessments: AssessmentTest[]): number {
    // Recent performance vs historical average
    const recentAssessments = assessments
      .filter(a => Date.now() - a.timestamp.getTime() < 60 * 24 * 60 * 60 * 1000)
      .map(a => a.score);
    
    const allScores = assessments.map(a => a.score);
    
    if (recentAssessments.length === 0) {
      return allScores.reduce((sum, score) => sum + score, 0) / allScores.length;
    }
    
    const recentAverage = recentAssessments.reduce((sum, score) => sum + score, 0) / recentAssessments.length;
    const historicalAverage = allScores.reduce((sum, score) => sum + score, 0) / allScores.length;
    
    // Potential based on recent improvement
    const improvementFactor = Math.max(1, recentAverage / historicalAverage);
    return Math.min(100, historicalAverage * improvementFactor);
  }

  private calculateAgeBonus(age: number): number {
    // Bonus for optimal development age ranges
    if (age >= 16 && age <= 20) return 5; // Prime development years
    if (age >= 14 && age <= 23) return 3; // Good development years
    if (age >= 21 && age <= 25) return 1; // Late but possible
    return 0; // No bonus for other ages
  }

  private calculateCoefficientOfVariation(values: number[]): number {
    if (values.length === 0) return 0;
    
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);
    
    return mean === 0 ? 0 : stdDev / mean;
  }

  private calculateTrend(values: number[]): number {
    if (values.length < 2) return 50; // Neutral trend
    
    let improvements = 0;
    for (let i = 1; i < values.length; i++) {
      if (values[i] > values[i - 1]) improvements++;
    }
    
    const improvementRatio = improvements / (values.length - 1);
    return improvementRatio * 100; // 0-100 scale
  }

  private predictPeakAge(athlete: Athlete, talentScore: TalentScore): number {
    // Sport-specific peak ages
    const sportPeakAges: { [sport: string]: number } = {
      'athletics': 25,
      'football': 27,
      'basketball': 26,
      'hockey': 26,
      'wrestling': 28,
      'badminton': 24
    };

    const primarySport = athlete.sportsPlayed[0] as string;
    const basePeakAge = sportPeakAges[primarySport.toLowerCase()] || 25;
    
    // Adjust based on current performance level
    const performanceAdjustment = talentScore.overallScore > 85 ? -1 : 
                                 talentScore.overallScore > 75 ? 0 : 1;
    
    return basePeakAge + performanceAdjustment;
  }

  private calculateImprovementPotential(athlete: Athlete, talentScore: TalentScore): number {
    // Base improvement potential on age and current performance
    const ageFactor = Math.max(0, (25 - athlete.age) / 10); // Younger = more potential
    const performanceGap = Math.max(0, (95 - talentScore.overallScore) / 95); // Room for improvement
    
    return Math.round((ageFactor * 0.6 + performanceGap * 0.4) * 100);
  }

  private calculateSuccessProbability(athlete: Athlete, talentScore: TalentScore, assessments: AssessmentTest[]): number {
    let probability = 0;

    // Base probability from overall score
    probability += Math.min(0.4, talentScore.overallScore / 100 * 0.4);

    // Age bonus (optimal development age)
    if (athlete.age >= 16 && athlete.age <= 22) probability += 0.2;
    else if (athlete.age >= 14 && athlete.age <= 25) probability += 0.1;

    // Consistency bonus
    const scores = assessments.map(a => a.score);
    const consistency = 1 - this.calculateCoefficientOfVariation(scores);
    probability += consistency * 0.2;

    // Confidence level bonus
    probability += talentScore.confidenceLevel * 0.2;

    return Math.min(1.0, probability);
  }

  private findOptimalSport(talentScore: TalentScore): string {
    return Object.entries(talentScore.sportSpecificScores)
      .sort(([, a], [, b]) => b - a)[0]?.[0] || 'Athletics';
  }

  private estimateTimeToReachPotential(athlete: Athlete, talentScore: TalentScore): number {
    // Base time on age and current performance
    const currentLevel = talentScore.overallScore / 100;
    const targetLevel = 0.9; // 90% of potential
    const developmentRate = this.estimateDevelopmentRate(athlete);
    
    const timeNeeded = (targetLevel - currentLevel) / developmentRate;
    return Math.max(6, Math.min(60, timeNeeded * 12)); // 6 months to 5 years
  }

  private estimateDevelopmentRate(athlete: Athlete): number {
    // Monthly improvement rate based on age and experience
    if (athlete.age < 18) return 0.02; // 2% per month
    if (athlete.age < 22) return 0.015; // 1.5% per month
    if (athlete.age < 26) return 0.01; // 1% per month
    return 0.005; // 0.5% per month
  }

  private generateTrainingRecommendations(athlete: Athlete, talentScore: TalentScore): string[] {
    const recommendations: string[] = [];

    // Physical training recommendations
    if (talentScore.categoryScores.physical < 75) {
      recommendations.push('Focus on strength and conditioning training');
    }
    if (talentScore.categoryScores.technical < 75) {
      recommendations.push('Enhance sport-specific technical skills');
    }
    if (talentScore.categoryScores.mental < 75) {
      recommendations.push('Implement mental training and sports psychology');
    }

    // Age-specific recommendations
    if (athlete.age < 18) {
      recommendations.push('Emphasize skill development over specialization');
    } else if (athlete.age > 22) {
      recommendations.push('Focus on performance optimization and injury prevention');
    }

    // Sport-specific recommendations
    const optimalSport = this.findOptimalSport(talentScore);
    recommendations.push(`Consider specializing in ${optimalSport} for optimal results`);

    return recommendations.slice(0, 5); // Limit to top 5 recommendations
  }

  private compareWithSameAge(athlete: Athlete, talentScore: TalentScore, populationData: any): { rank: number; totalPeers: number; percentile: number } {
    // Mock implementation - in real system, this would query actual population data
    const totalPeers = Math.floor(Math.random() * 1000) + 100;
    const rank = Math.floor(Math.random() * totalPeers) + 1;
    const percentile = ((totalPeers - rank) / totalPeers) * 100;

    return { rank, totalPeers, percentile: Math.round(percentile) };
  }

  private compareWithSameRegion(athlete: Athlete, talentScore: TalentScore, populationData: any): { rank: number; totalPeers: number; percentile: number } {
    const totalPeers = Math.floor(Math.random() * 500) + 50;
    const rank = Math.floor(Math.random() * totalPeers) + 1;
    const percentile = ((totalPeers - rank) / totalPeers) * 100;

    return { rank, totalPeers, percentile: Math.round(percentile) };
  }

  private compareWithSameSport(athlete: Athlete, talentScore: TalentScore, populationData: any): { rank: number; totalPeers: number; percentile: number } {
    const totalPeers = Math.floor(Math.random() * 300) + 30;
    const rank = Math.floor(Math.random() * totalPeers) + 1;
    const percentile = ((totalPeers - rank) / totalPeers) * 100;

    return { rank, totalPeers, percentile: Math.round(percentile) };
  }

  private assessNationalStandards(athlete: Athlete, talentScore: TalentScore): ComparativeAnalysis['nationalStandards'] {
    const eliteThreshold = 85;
    const meetsEliteThreshold = talentScore.overallScore >= eliteThreshold;
    const distanceFromElite = eliteThreshold - talentScore.overallScore;
    const projectedRanking = Math.max(1, 1000 - Math.floor(talentScore.overallScore * 10));

    return {
      meetsEliteThreshold,
      distanceFromElite: Math.max(0, distanceFromElite),
      projectedRanking
    };
  }

  private estimateInternationalBenchmarks(talentScore: TalentScore): ComparativeAnalysis['internationalBenchmarks'] {
    const estimatedGlobalPercentile = Math.min(99, talentScore.overallScore * 1.1);
    
    let competitiveLevel: ComparativeAnalysis['internationalBenchmarks']['competitiveLevel'];
    if (estimatedGlobalPercentile >= 95) competitiveLevel = 'international';
    else if (estimatedGlobalPercentile >= 85) competitiveLevel = 'national';
    else if (estimatedGlobalPercentile >= 70) competitiveLevel = 'state';
    else if (estimatedGlobalPercentile >= 50) competitiveLevel = 'regional';
    else competitiveLevel = 'local';

    return { estimatedGlobalPercentile: Math.round(estimatedGlobalPercentile), competitiveLevel };
  }

  private passesFilters(athlete: Athlete, talentScore: TalentScore, filters: TalentIdentificationFilter): boolean {
    if (filters.minOverallScore && talentScore.overallScore < filters.minOverallScore) return false;
    if (filters.maxAge && athlete.age > filters.maxAge) return false;
    if (filters.minConfidenceLevel && talentScore.confidenceLevel < filters.minConfidenceLevel) return false;
    if (filters.requiredSports && !filters.requiredSports.some(sport => athlete.sportsPlayed.includes(sport))) return false;
    if (filters.excludeRiskFactors && filters.excludeRiskFactors.some(risk => talentScore.riskFactors.includes(risk))) return false;
    if (filters.regionFocus && !filters.regionFocus.includes(athlete.state)) return false;

    return true;
  }

  private generatePopulationAnalytics(talents: Array<TalentScore & { athlete: Athlete }>): PopulationAnalytics {
    const totalAnalyzed = talents.length;
    
    // Regional analysis
    const regionScores: { [region: string]: number[] } = {};
    const stateCount: { [state: string]: number } = {};
    const ageDistribution: { [ageRange: string]: number } = {};
    const sportCounts: { [sport: string]: number } = {};

    talents.forEach(({ athlete, overallScore }) => {
      // Regional scores
      if (!regionScores[athlete.state]) regionScores[athlete.state] = [];
      regionScores[athlete.state].push(overallScore);
      
      // State counts
      stateCount[athlete.state] = (stateCount[athlete.state] || 0) + 1;
      
      // Age distribution
      const ageRange = athlete.age < 16 ? '14-15' : 
                      athlete.age < 18 ? '16-17' :
                      athlete.age < 21 ? '18-20' :
                      athlete.age < 25 ? '21-24' : '25+';
      ageDistribution[ageRange] = (ageDistribution[ageRange] || 0) + 1;
      
      // Sport affinity
      athlete.sportsPlayed.forEach(sport => {
        sportCounts[sport] = (sportCounts[sport] || 0) + 1;
      });
    });

    // Calculate averages and densities
    const averageScoreByRegion: { [region: string]: number } = {};
    Object.entries(regionScores).forEach(([region, scores]) => {
      averageScoreByRegion[region] = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    });

    const talentDensityByState: { [state: string]: number } = {};
    Object.entries(stateCount).forEach(([state, count]) => {
      // Normalize by assumed population (mock calculation)
      talentDensityByState[state] = count / 1000; // talents per 1000 population
    });

    // Identification rates
    const identificationRates = {
      exceptional: talents.filter(t => t.overallScore >= 95).length,
      elite: talents.filter(t => t.overallScore >= 90).length,
      highPotential: talents.filter(t => t.overallScore >= 80).length,
      developing: talents.filter(t => t.overallScore >= 60).length
    };

    return {
      totalAnalyzed,
      averageScoreByRegion,
      talentDensityByState,
      ageDistribution,
      sportAffinityTrends: sportCounts,
      identificationRates
    };
  }

  private analyzeRegionalDistribution(populationData: any): { talentDensity: { [region: string]: number }; representation: { [region: string]: number } } {
    // Mock implementation
    return {
      talentDensity: {
        'Maharashtra': 0.85,
        'Kerala': 0.78,
        'Punjab': 0.82,
        'Haryana': 0.89,
        'Karnataka': 0.76
      },
      representation: {
        'Maharashtra': 1.0,
        'Kerala': 0.65,
        'Punjab': 0.88,
        'Haryana': 0.92,
        'Karnataka': 0.58
      }
    };
  }

  private analyzeOptimalTiming(populationData: any): { monthlyOptimal: { [month: string]: number } } {
    // Mock seasonal analysis
    return {
      monthlyOptimal: {
        'January': 0.85, 'February': 0.82, 'March': 0.78, 'April': 0.75,
        'May': 0.70, 'June': 0.65, 'July': 0.68, 'August': 0.72,
        'September': 0.88, 'October': 0.92, 'November': 0.90, 'December': 0.87
      }
    };
  }

  private analyzeSuccessFactors(populationData: any): { topFactors: string[]; factorWeights: { [factor: string]: number } } {
    return {
      topFactors: ['physical', 'mental', 'technical', 'potential'],
      factorWeights: {
        'physical': 0.35,
        'technical': 0.25,
        'mental': 0.25,
        'potential': 0.15
      }
    };
  }

  private calculateOptimalScoreThreshold(populationData: any, quota: number): number {
    // Calculate score threshold to meet recruitment quota
    return 75; // Mock threshold
  }
}

const talentAnalyticsService = new TalentAnalyticsService();
export default talentAnalyticsService;
export type { 
  TalentScore, 
  TalentPrediction, 
  ComparativeAnalysis, 
  PopulationAnalytics, 
  TalentIdentificationFilter 
};
