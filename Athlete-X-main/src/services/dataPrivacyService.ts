import { Athlete, AssessmentTest } from '../models';

interface PrivacyConsent {
  athleteId: string;
  dataSharing: boolean;
  talentIdentification: boolean;
  performanceAnalytics: boolean;
  contactPermission: boolean;
  dataRetention: number; // in years
  consentDate: Date;
  ipAddress: string;
  userAgent: string;
}

interface DataAnonymizationOptions {
  hidePersonalInfo: boolean;
  hashIdentifiers: boolean;
  generalizeLocation: boolean;
  removeContactInfo: boolean;
  aggregateScores: boolean;
}

interface DataSecurityLog {
  id: string;
  timestamp: Date;
  action: 'access' | 'export' | 'sync' | 'anonymize' | 'delete';
  userId: string;
  athleteIds: string[];
  dataTypes: string[];
  purpose: string;
  ipAddress: string;
  success: boolean;
  details?: string;
}

interface AnonymizedAthlete {
  id: string; // Hashed ID
  ageRange: string; // e.g., "18-22"
  region: string; // State level only
  sportsCategories: string[];
  assessmentSummary: {
    totalAssessments: number;
    scoreRange: string; // e.g., "80-85"
    percentileRange: string; // e.g., "85-90th"
    performanceLevel: 'excellent' | 'good' | 'average' | 'below_average';
  };
  lastAssessmentDate: string; // Month/Year only
}

class DataPrivacyService {
  private readonly CONSENT_KEY = 'athletex_privacy_consents';
  private readonly SECURITY_LOG_KEY = 'athletex_security_logs';
  private readonly ENCRYPTION_KEY = 'athletex_data_encryption'; // In production, use proper key management

  // Privacy Consent Management
  async recordConsent(athleteId: string, consent: Omit<PrivacyConsent, 'athleteId' | 'consentDate' | 'ipAddress' | 'userAgent'>): Promise<void> {
    const fullConsent: PrivacyConsent = {
      ...consent,
      athleteId,
      consentDate: new Date(),
      ipAddress: await this.getCurrentIPAddress(),
      userAgent: navigator.userAgent
    };

    const consents = this.getStoredConsents();
    const existingIndex = consents.findIndex(c => c.athleteId === athleteId);
    
    if (existingIndex >= 0) {
      consents[existingIndex] = fullConsent;
    } else {
      consents.push(fullConsent);
    }

    this.storeConsents(consents);
    
    // Log the consent recording
    await this.logSecurityAction('access', athleteId, [athleteId], ['consent'], 'Privacy consent recorded');
  }

  async getConsent(athleteId: string): Promise<PrivacyConsent | null> {
    const consents = this.getStoredConsents();
    return consents.find(c => c.athleteId === athleteId) || null;
  }

  async hasValidConsent(athleteId: string, purpose: keyof Pick<PrivacyConsent, 'dataSharing' | 'talentIdentification' | 'performanceAnalytics' | 'contactPermission'>): Promise<boolean> {
    const consent = await this.getConsent(athleteId);
    if (!consent) return false;

    // Check if consent is still valid (not expired)
    const consentAge = Date.now() - consent.consentDate.getTime();
    const maxAge = consent.dataRetention * 365 * 24 * 60 * 60 * 1000; // Convert years to milliseconds
    
    if (consentAge > maxAge) return false;

    return consent[purpose] === true;
  }

  // Simple consent check method for enhanced assessment service
  async checkConsent(athleteId: string, purpose: string): Promise<boolean> {
    try {
      const consent = await this.getConsent(athleteId);
      if (!consent) return true; // Default to allow for demo purposes
      
      switch (purpose.toLowerCase()) {
        case 'assessment_analysis':
        case 'talent_identification':
          return consent.talentIdentification;
        case 'performance_analytics':
          return consent.performanceAnalytics;
        case 'data_sharing':
          return consent.dataSharing;
        default:
          return true; // Default to allow for demo
      }
    } catch {
      return true; // Default to allow if check fails
    }
  }

  // Simple data access logging for enhanced assessment service
  async logDataAccess(logEntry: {
    athleteId: string;
    accessType: string;
    purpose: string;
    dataTypes: string[];
    timestamp: Date;
    result: string;
  }): Promise<void> {
    try {
      await this.logSecurityAction(
        'access',
        'system',
        [logEntry.athleteId],
        logEntry.dataTypes,
        logEntry.purpose,
        logEntry.result === 'success'
      );
    } catch (error) {
      console.error('Failed to log data access:', error);
    }
  }

  // Data Anonymization
  async anonymizeAthlete(athlete: Athlete, assessments: AssessmentTest[], options: DataAnonymizationOptions): Promise<AnonymizedAthlete> {
    await this.logSecurityAction('anonymize', 'system', [athlete.id], ['athlete_data', 'assessments'], 'Data anonymization');

    const averageScore = assessments.length > 0 
      ? assessments.reduce((sum, a) => sum + a.score, 0) / assessments.length 
      : 0;

    return {
      id: options.hashIdentifiers ? this.hashString(athlete.id) : athlete.id,
      ageRange: this.getAgeRange(athlete.age),
      region: options.generalizeLocation ? athlete.state : `${athlete.city}, ${athlete.state}`,
      sportsCategories: athlete.sportsPlayed as string[],
      assessmentSummary: {
        totalAssessments: assessments.length,
        scoreRange: options.aggregateScores ? this.getScoreRange(averageScore) : averageScore.toFixed(1),
        percentileRange: this.getPercentileRange(averageScore),
        performanceLevel: this.getPerformanceLevel(averageScore)
      },
      lastAssessmentDate: assessments.length > 0 
        ? this.formatDateForPrivacy(new Date(Math.max(...assessments.map(a => a.timestamp.getTime()))))
        : 'N/A'
    };
  }

  async anonymizeAthleteList(athletes: Athlete[], assessmentsByAthlete: Map<string, AssessmentTest[]>, options: DataAnonymizationOptions): Promise<AnonymizedAthlete[]> {
    const anonymized: AnonymizedAthlete[] = [];

    for (const athlete of athletes) {
      const assessments = assessmentsByAthlete.get(athlete.id) || [];
      const anonymizedAthlete = await this.anonymizeAthlete(athlete, assessments, options);
      anonymized.push(anonymizedAthlete);
    }

    return anonymized;
  }

  // Data Access Control
  async validateDataAccess(userId: string, athleteIds: string[], purpose: string): Promise<{
    allowed: string[];
    denied: string[];
    reasons: { [athleteId: string]: string };
  }> {
    const result = {
      allowed: [] as string[],
      denied: [] as string[],
      reasons: {} as { [athleteId: string]: string }
    };

    for (const athleteId of athleteIds) {
      const consent = await this.getConsent(athleteId);
      
      if (!consent) {
        result.denied.push(athleteId);
        result.reasons[athleteId] = 'No privacy consent on record';
        continue;
      }

      // Check consent validity based on purpose
      let hasConsent = false;
      switch (purpose.toLowerCase()) {
        case 'talent_identification':
        case 'sai_sync':
          hasConsent = consent.talentIdentification;
          break;
        case 'performance_analytics':
          hasConsent = consent.performanceAnalytics;
          break;
        case 'data_sharing':
        case 'export':
          hasConsent = consent.dataSharing;
          break;
        case 'contact':
          hasConsent = consent.contactPermission;
          break;
        default:
          hasConsent = consent.dataSharing; // Default to data sharing consent
      }

      if (!hasConsent) {
        result.denied.push(athleteId);
        result.reasons[athleteId] = `No consent for ${purpose}`;
        continue;
      }

      // Check if consent is still valid (not expired)
      const consentAge = Date.now() - consent.consentDate.getTime();
      const maxAge = consent.dataRetention * 365 * 24 * 60 * 60 * 1000;
      
      if (consentAge > maxAge) {
        result.denied.push(athleteId);
        result.reasons[athleteId] = 'Consent has expired';
        continue;
      }

      result.allowed.push(athleteId);
    }

    // Log the access validation
    await this.logSecurityAction('access', userId, athleteIds, ['consent_validation'], purpose);

    return result;
  }

  // Security Logging
  async logSecurityAction(
    action: DataSecurityLog['action'],
    userId: string,
    athleteIds: string[],
    dataTypes: string[],
    purpose: string,
    success: boolean = true,
    details?: string
  ): Promise<void> {
    const logEntry: DataSecurityLog = {
      id: this.generateId(),
      timestamp: new Date(),
      action,
      userId,
      athleteIds,
      dataTypes,
      purpose,
      ipAddress: await this.getCurrentIPAddress(),
      success,
      details
    };

    const logs = this.getStoredSecurityLogs();
    logs.push(logEntry);
    
    // Keep only last 1000 log entries
    if (logs.length > 1000) {
      logs.splice(0, logs.length - 1000);
    }

    this.storeSecurityLogs(logs);
  }

  async getSecurityLogs(athleteId?: string, userId?: string, limit: number = 100): Promise<DataSecurityLog[]> {
    const logs = this.getStoredSecurityLogs();
    
    let filteredLogs = logs;
    
    if (athleteId) {
      filteredLogs = filteredLogs.filter(log => log.athleteIds.includes(athleteId));
    }
    
    if (userId) {
      filteredLogs = filteredLogs.filter(log => log.userId === userId);
    }

    // Sort by timestamp (newest first) and limit
    return filteredLogs
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  // Data Retention Management
  async cleanupExpiredData(): Promise<{
    deletedAthletes: number;
    deletedAssessments: number;
    deletedConsents: number;
  }> {
    const consents = this.getStoredConsents();
    const now = Date.now();
    
    let deletedAthletes = 0;
    let deletedAssessments = 0;
    let deletedConsents = 0;

    // Find expired consents
    const expiredConsents = consents.filter(consent => {
      const maxAge = consent.dataRetention * 365 * 24 * 60 * 60 * 1000;
      return (now - consent.consentDate.getTime()) > maxAge;
    });

    // Log cleanup action
    await this.logSecurityAction(
      'delete', 
      'system', 
      expiredConsents.map(c => c.athleteId), 
      ['expired_data'], 
      'Automated data retention cleanup'
    );

    // Remove expired consents
    const validConsents = consents.filter(consent => {
      const maxAge = consent.dataRetention * 365 * 24 * 60 * 60 * 1000;
      return (now - consent.consentDate.getTime()) <= maxAge;
    });

    this.storeConsents(validConsents);
    deletedConsents = expiredConsents.length;

    return {
      deletedAthletes,
      deletedAssessments,
      deletedConsents
    };
  }

  // Secure Data Export with Privacy Controls
  async createSecureExport(
    athletes: Athlete[], 
    assessmentsByAthlete: Map<string, AssessmentTest[]>,
    userId: string,
    purpose: string,
    anonymizationOptions?: DataAnonymizationOptions
  ): Promise<{
    data: any[];
    metadata: {
      exportId: string;
      timestamp: Date;
      userId: string;
      purpose: string;
      athleteCount: number;
      anonymized: boolean;
      consentValidated: boolean;
    };
  }> {
    // Validate consent for all athletes
    const accessValidation = await this.validateDataAccess(
      userId, 
      athletes.map(a => a.id), 
      purpose
    );

    // Filter to only athletes with valid consent
    const allowedAthletes = athletes.filter(a => accessValidation.allowed.includes(a.id));

    let exportData: any[];
    let anonymized = false;

    if (anonymizationOptions) {
      // Export anonymized data
      const filteredAssessments = new Map<string, AssessmentTest[]>();
      allowedAthletes.forEach(athlete => {
        filteredAssessments.set(athlete.id, assessmentsByAthlete.get(athlete.id) || []);
      });

      exportData = await this.anonymizeAthleteList(allowedAthletes, filteredAssessments, anonymizationOptions);
      anonymized = true;
    } else {
      // Export full data (for authorized purposes)
      exportData = allowedAthletes.map(athlete => ({
        ...athlete,
        assessments: assessmentsByAthlete.get(athlete.id) || []
      }));
    }

    const exportId = this.generateId();
    const metadata = {
      exportId,
      timestamp: new Date(),
      userId,
      purpose,
      athleteCount: allowedAthletes.length,
      anonymized,
      consentValidated: true
    };

    // Log the export
    await this.logSecurityAction(
      'export', 
      userId, 
      allowedAthletes.map(a => a.id), 
      ['athlete_data', 'assessments'], 
      purpose,
      true,
      `Export ID: ${exportId}, Anonymized: ${anonymized}`
    );

    return { data: exportData, metadata };
  }

  // Privacy Helper Methods
  private getAgeRange(age: number): string {
    if (age < 16) return 'Under 16';
    if (age < 18) return '16-17';
    if (age < 21) return '18-20';
    if (age < 25) return '21-24';
    return '25+';
  }

  private getScoreRange(score: number): string {
    const lower = Math.floor(score / 10) * 10;
    const upper = lower + 9;
    return `${lower}-${upper}`;
  }

  private getPercentileRange(score: number): string {
    // Simplified percentile calculation
    const percentile = Math.min(Math.round((score / 100) * 90 + 10), 99);
    const lower = Math.floor(percentile / 10) * 10;
    const upper = lower + 9;
    return `${lower}-${upper}th`;
  }

  private getPerformanceLevel(score: number): 'excellent' | 'good' | 'average' | 'below_average' {
    if (score >= 85) return 'excellent';
    if (score >= 75) return 'good';
    if (score >= 60) return 'average';
    return 'below_average';
  }

  private formatDateForPrivacy(date: Date): string {
    return `${date.getMonth() + 1}/${date.getFullYear()}`;
  }

  private hashString(input: string): string {
    // Simple hash function for demo purposes
    // In production, use a proper cryptographic hash
    let hash = 0;
    if (input.length === 0) return hash.toString();
    for (let i = 0; i < input.length; i++) {
      const char = input.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  private async getCurrentIPAddress(): Promise<string> {
    try {
      // In a real application, this would get the actual client IP
      return 'localhost';
    } catch {
      return 'unknown';
    }
  }

  private generateId(): string {
    return 'prv_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  // Storage Methods
  private getStoredConsents(): PrivacyConsent[] {
    try {
      const stored = localStorage.getItem(this.CONSENT_KEY);
      return stored ? JSON.parse(stored).map((c: any) => ({
        ...c,
        consentDate: new Date(c.consentDate)
      })) : [];
    } catch {
      return [];
    }
  }

  private storeConsents(consents: PrivacyConsent[]): void {
    localStorage.setItem(this.CONSENT_KEY, JSON.stringify(consents));
  }

  private getStoredSecurityLogs(): DataSecurityLog[] {
    try {
      const stored = localStorage.getItem(this.SECURITY_LOG_KEY);
      return stored ? JSON.parse(stored).map((log: any) => ({
        ...log,
        timestamp: new Date(log.timestamp)
      })) : [];
    } catch {
      return [];
    }
  }

  private storeSecurityLogs(logs: DataSecurityLog[]): void {
    localStorage.setItem(this.SECURITY_LOG_KEY, JSON.stringify(logs));
  }
}

const dataPrivacyService = new DataPrivacyService();
export default dataPrivacyService;
export type { PrivacyConsent, DataAnonymizationOptions, AnonymizedAthlete, DataSecurityLog };
