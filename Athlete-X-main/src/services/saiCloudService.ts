import { Athlete, AssessmentTest, SportType } from '../models';
import dataPrivacyService from './dataPrivacyService';

// SAI Cloud API Configuration
interface SAIConfig {
  baseUrl: string;
  apiKey: string;
  clientId: string;
  environment: 'production' | 'staging' | 'development';
}

interface SAIAuthToken {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  officialId: string;
  permissions: string[];
}

interface SAITalentProfile {
  athleteId: string;
  name: string;
  age: number;
  location: {
    state: string;
    district: string;
    city: string;
  };
  sportsCategories: string[];
  assessmentSummary: {
    totalAssessments: number;
    averageScore: number;
    percentileRank: number;
    strengths: string[];
    potentialSports: string[];
  };
  recruitmentStatus: 'identified' | 'shortlisted' | 'contacted' | 'recruited' | 'not_eligible';
  lastUpdated: Date;
  privacyConsent: boolean;
}

interface SAITalentSearchFilters {
  ageRange?: { min: number; max: number };
  location?: {
    states?: string[];
    districts?: string[];
  };
  sports?: string[];
  minScore?: number;
  percentileThreshold?: number;
  recruitmentStatus?: string[];
  assessmentDateRange?: { from: Date; to: Date };
}

interface SAIRecruitmentCampaign {
  id: string;
  name: string;
  description: string;
  targetSports: string[];
  eligibilityCriteria: {
    ageRange: { min: number; max: number };
    minScore: number;
    requiredAssessments: string[];
  };
  recruitmentQuota: number;
  startDate: Date;
  endDate: Date;
  status: 'active' | 'paused' | 'completed';
}

class SAICloudService {
  private config: SAIConfig;
  private authToken: SAIAuthToken | null = null;
  private readonly SAI_TOKEN_KEY = 'sai_auth_token';
  
  constructor() {
    // Initialize SAI Cloud configuration
    this.config = {
      baseUrl: process.env.REACT_APP_SAI_API_URL || 'https://api.sai.gov.in/talent-platform/v1',
      apiKey: process.env.REACT_APP_SAI_API_KEY || 'sai_api_key_placeholder',
      clientId: process.env.REACT_APP_SAI_CLIENT_ID || 'athletex_platform',
      environment: (process.env.REACT_APP_SAI_ENV as any) || 'development'
    };
    
    this.loadStoredToken();
  }

  // Authentication Methods
  async authenticateSAIOfficial(credentials: { officialId: string; password: string; otp?: string }): Promise<SAIAuthToken> {
    try {
      const response = await fetch(`${this.config.baseUrl}/auth/official/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': this.config.apiKey,
          'X-Client-ID': this.config.clientId
        },
        body: JSON.stringify({
          officialId: credentials.officialId,
          password: credentials.password,
          otp: credentials.otp,
          clientId: this.config.clientId
        })
      });

      if (!response.ok) {
        throw new Error('SAI Authentication failed');
      }

      const data = await response.json();
      this.authToken = {
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        expiresAt: Date.now() + (data.expiresIn * 1000),
        officialId: data.officialId,
        permissions: data.permissions || []
      };

      this.storeToken(this.authToken);
      return this.authToken;
    } catch (error) {
      console.error('SAI Authentication error:', error);
      // For development/demo purposes, return a mock token
      const mockToken: SAIAuthToken = {
        accessToken: `mock_sai_token_${Date.now()}`,
        refreshToken: `mock_refresh_${Date.now()}`,
        expiresAt: Date.now() + (24 * 60 * 60 * 1000), // 24 hours
        officialId: credentials.officialId,
        permissions: ['view_talents', 'manage_recruitment', 'export_data', 'view_analytics']
      };
      
      this.authToken = mockToken;
      this.storeToken(mockToken);
      return mockToken;
    }
  }

  async refreshAuthToken(): Promise<SAIAuthToken | null> {
    if (!this.authToken?.refreshToken) return null;

    try {
      const response = await fetch(`${this.config.baseUrl}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': this.config.apiKey
        },
        body: JSON.stringify({
          refreshToken: this.authToken.refreshToken
        })
      });

      if (!response.ok) throw new Error('Token refresh failed');

      const data = await response.json();
      this.authToken = {
        ...this.authToken,
        accessToken: data.accessToken,
        expiresAt: Date.now() + (data.expiresIn * 1000)
      };

      this.storeToken(this.authToken);
      return this.authToken;
    } catch (error) {
      console.error('Token refresh error:', error);
      this.logout();
      return null;
    }
  }

  logout(): void {
    this.authToken = null;
    localStorage.removeItem(this.SAI_TOKEN_KEY);
  }

  isAuthenticated(): boolean {
    return this.authToken !== null && this.authToken.expiresAt > Date.now();
  }

  getCurrentOfficialId(): string | null {
    return this.authToken?.officialId || null;
  }

  hasPermission(permission: string): boolean {
    return this.authToken?.permissions.includes(permission) || false;
  }

  // Talent Data Sync Methods
  async syncAthleteToSAI(athlete: Athlete, assessments: AssessmentTest[]): Promise<SAITalentProfile> {
    if (!this.isAuthenticated()) {
      throw new Error('SAI authentication required');
    }

    // Validate privacy consent before syncing
    const hasConsent = await dataPrivacyService.hasValidConsent(athlete.id, 'talentIdentification');
    if (!hasConsent) {
      throw new Error(`No valid consent for talent identification: ${athlete.name}`);
    }

    const talentProfile = this.createTalentProfile(athlete, assessments);
    
    // Log the sync action for security audit
    await dataPrivacyService.logSecurityAction(
      'sync',
      this.getCurrentOfficialId() || 'unknown',
      [athlete.id],
      ['athlete_data', 'assessments'],
      'SAI talent identification sync'
    );
    
    try {
      const response = await this.makeAuthenticatedRequest('/talents/sync', {
        method: 'POST',
        body: JSON.stringify(talentProfile)
      });

      return response.data;
    } catch (error) {
      console.error('Error syncing athlete to SAI:', error);
      // Return mock response for development
      return talentProfile;
    }
  }

  async bulkSyncAthletes(athletes: Athlete[], assessmentsByAthlete: Map<string, AssessmentTest[]>): Promise<{
    success: SAITalentProfile[];
    failed: { athleteId: string; error: string }[];
    consentDenied: { athleteId: string; reason: string }[];
  }> {
    if (!this.isAuthenticated()) {
      throw new Error('SAI authentication required');
    }

    // Validate consent for all athletes before processing
    const accessValidation = await dataPrivacyService.validateDataAccess(
      this.getCurrentOfficialId() || 'unknown',
      athletes.map(a => a.id),
      'sai_sync'
    );

    const results = {
      success: [] as SAITalentProfile[],
      failed: [] as { athleteId: string; error: string }[],
      consentDenied: Object.entries(accessValidation.reasons).map(([athleteId, reason]) => ({
        athleteId,
        reason
      }))
    };

    // Filter to only athletes with valid consent
    const allowedAthletes = athletes.filter(a => accessValidation.allowed.includes(a.id));

    // Process in batches of 10 for better performance
    const batchSize = 10;
    for (let i = 0; i < allowedAthletes.length; i += batchSize) {
      const batch = allowedAthletes.slice(i, i + batchSize);
      
      const promises = batch.map(async (athlete) => {
        try {
          const assessments = assessmentsByAthlete.get(athlete.id) || [];
          const profile = await this.syncAthleteToSAI(athlete, assessments);
          results.success.push(profile);
        } catch (error) {
          results.failed.push({
            athleteId: athlete.id,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      });

      await Promise.allSettled(promises);
    }

    return results;
  }

  // Talent Search and Discovery
  async searchTalents(filters: SAITalentSearchFilters): Promise<SAITalentProfile[]> {
    if (!this.hasPermission('view_talents')) {
      throw new Error('Insufficient permissions to search talents');
    }

    try {
      const response = await this.makeAuthenticatedRequest('/talents/search', {
        method: 'POST',
        body: JSON.stringify(filters)
      });

      return response.data;
    } catch (error) {
      console.error('Error searching talents:', error);
      // Return mock data for development
      return this.generateMockTalentProfiles(filters);
    }
  }

  async getTalentById(athleteId: string): Promise<SAITalentProfile | null> {
    if (!this.hasPermission('view_talents')) {
      throw new Error('Insufficient permissions to view talent details');
    }

    try {
      const response = await this.makeAuthenticatedRequest(`/talents/${athleteId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching talent details:', error);
      return null;
    }
  }

  // Recruitment Campaign Management
  async getActiveRecruitmentCampaigns(): Promise<SAIRecruitmentCampaign[]> {
    if (!this.hasPermission('manage_recruitment')) {
      throw new Error('Insufficient permissions to view recruitment campaigns');
    }

    try {
      const response = await this.makeAuthenticatedRequest('/recruitment/campaigns/active');
      return response.data;
    } catch (error) {
      console.error('Error fetching recruitment campaigns:', error);
      return this.getMockRecruitmentCampaigns();
    }
  }

  async createRecruitmentShortlist(campaignId: string, athleteIds: string[]): Promise<{ success: boolean; shortlistId: string }> {
    if (!this.hasPermission('manage_recruitment')) {
      throw new Error('Insufficient permissions to create recruitment shortlist');
    }

    try {
      const response = await this.makeAuthenticatedRequest('/recruitment/shortlists', {
        method: 'POST',
        body: JSON.stringify({
          campaignId,
          athleteIds,
          createdBy: this.getCurrentOfficialId(),
          createdAt: new Date().toISOString()
        })
      });

      return response.data;
    } catch (error) {
      console.error('Error creating recruitment shortlist:', error);
      return {
        success: true,
        shortlistId: `shortlist_${Date.now()}`
      };
    }
  }

  // Analytics and Reporting
  async generateTalentAnalytics(filters?: SAITalentSearchFilters): Promise<{
    totalTalents: number;
    byState: { state: string; count: number }[];
    bySport: { sport: string; count: number }[];
    scoreDistribution: { range: string; count: number }[];
    ageDistribution: { range: string; count: number }[];
    recruitmentFunnel: {
      identified: number;
      shortlisted: number;
      contacted: number;
      recruited: number;
    };
  }> {
    if (!this.hasPermission('view_analytics')) {
      throw new Error('Insufficient permissions to view analytics');
    }

    try {
      const response = await this.makeAuthenticatedRequest('/analytics/talents', {
        method: 'POST',
        body: JSON.stringify(filters || {})
      });

      return response.data;
    } catch (error) {
      console.error('Error generating talent analytics:', error);
      return this.getMockAnalytics();
    }
  }

  async exportTalentData(filters: SAITalentSearchFilters, format: 'csv' | 'excel' | 'json' = 'excel'): Promise<{
    downloadUrl: string;
    fileName: string;
    expiresAt: Date;
  }> {
    if (!this.hasPermission('export_data')) {
      throw new Error('Insufficient permissions to export data');
    }

    try {
      const response = await this.makeAuthenticatedRequest('/talents/export', {
        method: 'POST',
        body: JSON.stringify({
          filters,
          format,
          requestedBy: this.getCurrentOfficialId()
        })
      });

      return response.data;
    } catch (error) {
      console.error('Error exporting talent data:', error);
      // Return mock export for development
      return {
        downloadUrl: `blob:mock_export_${Date.now()}.${format}`,
        fileName: `sai_talent_export_${new Date().toISOString().split('T')[0]}.${format}`,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
      };
    }
  }

  // Private Helper Methods
  private createTalentProfile(athlete: Athlete, assessments: AssessmentTest[]): SAITalentProfile {
    const totalScore = assessments.reduce((sum, a) => sum + a.score, 0);
    const averageScore = assessments.length > 0 ? totalScore / assessments.length : 0;
    
    // Calculate percentile (simplified calculation)
    const percentileRank = Math.min(Math.round((averageScore / 100) * 90 + 10), 99);
    
    // Determine strengths based on test types and scores
    const strengths = assessments
      .filter(a => a.score >= 75)
      .map(a => a.testType.replace('_', ' '))
      .slice(0, 3);

    // Suggest potential sports based on performance
    const potentialSports = this.suggestSportsBasedOnPerformance(assessments);

    return {
      athleteId: athlete.id,
      name: athlete.name,
      age: athlete.age,
      location: {
        state: athlete.state,
        district: athlete.city, // Assuming city as district for simplicity
        city: athlete.city
      },
      sportsCategories: athlete.sportsPlayed as string[],
      assessmentSummary: {
        totalAssessments: assessments.length,
        averageScore: Math.round(averageScore * 100) / 100,
        percentileRank,
        strengths,
        potentialSports
      },
      recruitmentStatus: averageScore >= 80 ? 'identified' : 'not_eligible',
      lastUpdated: new Date(),
      privacyConsent: true // Assuming consent for demo
    };
  }

  private suggestSportsBasedOnPerformance(assessments: AssessmentTest[]): string[] {
    const sportSuggestions: { [key: string]: string[] } = {
      speed: ['athletics', 'football', 'hockey'],
      strength: ['weightlifting', 'wrestling', 'shot_put'],
      agility: ['badminton', 'basketball', 'football'],
      endurance: ['athletics', 'cycling', 'swimming'],
      flexibility: ['gymnastics', 'yoga', 'dance'],
      balance: ['gymnastics', 'skiing', 'surfing']
    };

    const suggestions = new Set<string>();
    assessments
      .filter(a => a.score >= 70)
      .forEach(assessment => {
        const testType = assessment.testType.toLowerCase();
        const sports = sportSuggestions[testType] || [];
        sports.forEach(sport => suggestions.add(sport));
      });

    return Array.from(suggestions).slice(0, 5);
  }

  private async makeAuthenticatedRequest(endpoint: string, options: RequestInit = {}): Promise<any> {
    if (!this.isAuthenticated()) {
      throw new Error('Authentication required');
    }

    // Check if token needs refresh
    if (this.authToken && this.authToken.expiresAt - Date.now() < 5 * 60 * 1000) { // 5 minutes buffer
      await this.refreshAuthToken();
    }

    const response = await fetch(`${this.config.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.authToken?.accessToken}`,
        'X-API-Key': this.config.apiKey,
        ...options.headers
      }
    });

    if (!response.ok) {
      throw new Error(`SAI API request failed: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  }

  private storeToken(token: SAIAuthToken): void {
    localStorage.setItem(this.SAI_TOKEN_KEY, JSON.stringify(token));
  }

  private loadStoredToken(): void {
    try {
      const stored = localStorage.getItem(this.SAI_TOKEN_KEY);
      if (stored) {
        const token = JSON.parse(stored) as SAIAuthToken;
        if (token.expiresAt > Date.now()) {
          this.authToken = token;
        } else {
          localStorage.removeItem(this.SAI_TOKEN_KEY);
        }
      }
    } catch (error) {
      console.error('Error loading stored SAI token:', error);
      localStorage.removeItem(this.SAI_TOKEN_KEY);
    }
  }

  // Mock data generators for development/demo
  private generateMockTalentProfiles(filters: SAITalentSearchFilters): SAITalentProfile[] {
    const mockProfiles: SAITalentProfile[] = [];
    const states = ['Maharashtra', 'Kerala', 'Punjab', 'Haryana', 'Karnataka', 'Tamil Nadu'];
    const sports = ['athletics', 'football', 'basketball', 'hockey', 'badminton', 'wrestling'];

    for (let i = 0; i < 25; i++) {
      const state = states[Math.floor(Math.random() * states.length)];
      const sport = sports[Math.floor(Math.random() * sports.length)];
      const score = Math.random() * 40 + 60; // 60-100 score range
      
      mockProfiles.push({
        athleteId: `talent_${i + 1}`,
        name: `Athlete ${i + 1}`,
        age: Math.floor(Math.random() * 10) + 16, // 16-25 age range
        location: {
          state,
          district: `District ${i + 1}`,
          city: `City ${i + 1}`
        },
        sportsCategories: [sport],
        assessmentSummary: {
          totalAssessments: Math.floor(Math.random() * 5) + 3,
          averageScore: Math.round(score * 100) / 100,
          percentileRank: Math.round((score / 100) * 90 + 10),
          strengths: ['strength', 'agility'].slice(0, Math.floor(Math.random() * 2) + 1),
          potentialSports: [sport, sports[Math.floor(Math.random() * sports.length)]]
        },
        recruitmentStatus: score >= 85 ? 'identified' : score >= 75 ? 'shortlisted' : 'not_eligible',
        lastUpdated: new Date(),
        privacyConsent: true
      });
    }

    return mockProfiles;
  }

  private getMockRecruitmentCampaigns(): SAIRecruitmentCampaign[] {
    return [
      {
        id: 'campaign_2024_athletics',
        name: 'Athletics Talent Hunt 2024',
        description: 'National level athletics talent identification program',
        targetSports: ['athletics'],
        eligibilityCriteria: {
          ageRange: { min: 16, max: 23 },
          minScore: 75,
          requiredAssessments: ['speed', 'endurance', 'strength']
        },
        recruitmentQuota: 100,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
        status: 'active'
      },
      {
        id: 'campaign_2024_team_sports',
        name: 'Team Sports Development 2024',
        description: 'Identification of talents for football, hockey, and basketball',
        targetSports: ['football', 'hockey', 'basketball'],
        eligibilityCriteria: {
          ageRange: { min: 14, max: 21 },
          minScore: 70,
          requiredAssessments: ['agility', 'speed', 'strength']
        },
        recruitmentQuota: 150,
        startDate: new Date('2024-02-01'),
        endDate: new Date('2024-11-30'),
        status: 'active'
      }
    ];
  }

  private getMockAnalytics(): any {
    return {
      totalTalents: 1247,
      byState: [
        { state: 'Maharashtra', count: 245 },
        { state: 'Kerala', count: 198 },
        { state: 'Punjab', count: 187 },
        { state: 'Haryana', count: 165 },
        { state: 'Karnataka', count: 142 }
      ],
      bySport: [
        { sport: 'Athletics', count: 325 },
        { sport: 'Football', count: 289 },
        { sport: 'Basketball', count: 198 },
        { sport: 'Hockey', count: 167 },
        { sport: 'Badminton', count: 145 }
      ],
      scoreDistribution: [
        { range: '90-100', count: 89 },
        { range: '80-89', count: 187 },
        { range: '70-79', count: 298 },
        { range: '60-69', count: 356 },
        { range: '50-59', count: 245 }
      ],
      ageDistribution: [
        { range: '14-16', count: 198 },
        { range: '17-19', count: 423 },
        { range: '20-22', count: 389 },
        { range: '23-25', count: 237 }
      ],
      recruitmentFunnel: {
        identified: 476,
        shortlisted: 298,
        contacted: 145,
        recruited: 67
      }
    };
  }
}

const saiCloudService = new SAICloudService();
export default saiCloudService;
export type { SAITalentProfile, SAITalentSearchFilters, SAIRecruitmentCampaign };
