import { Athlete, AssessmentTest } from '../models';
import { SAITalentProfile } from './saiCloudService';
import { TalentScore, TalentPrediction } from './talentAnalyticsService';
import dataPrivacyService from './dataPrivacyService';

interface NotificationRule {
  id: string;
  name: string;
  description: string;
  active: boolean;
  conditions: {
    minScore?: number;
    maxAge?: number;
    sports?: string[];
    regions?: string[];
    improvementThreshold?: number;
    newAssessmentAlert?: boolean;
    eliteThresholdAlert?: boolean;
  };
  recipients: {
    officials: string[];
    emailAddresses: string[];
    phoneNumbers: string[];
  };
  frequency: 'immediate' | 'daily' | 'weekly' | 'monthly';
  priority: 'high' | 'medium' | 'low';
}

interface TalentAlert {
  id: string;
  timestamp: Date;
  type: 'new_talent' | 'score_improvement' | 'elite_threshold' | 'recruitment_opportunity' | 'assessment_milestone';
  priority: 'high' | 'medium' | 'low';
  athleteId: string;
  athleteName: string;
  title: string;
  message: string;
  data: {
    currentScore?: number;
    previousScore?: number;
    improvement?: number;
    percentile?: number;
    recommendedSports?: string[];
    location?: string;
    age?: number;
  };
  actionRequired: boolean;
  actionItems?: string[];
  recipients: string[];
  delivered: boolean;
  readBy: string[];
  archived: boolean;
}

interface RecruitmentReport {
  id: string;
  title: string;
  period: {
    startDate: Date;
    endDate: Date;
  };
  generated: Date;
  type: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annual';
  summary: {
    newTalentsIdentified: number;
    totalAssessments: number;
    averageScore: number;
    regionalBreakdown: { [region: string]: number };
    sportBreakdown: { [sport: string]: number };
    alertsTriggered: number;
  };
  insights: {
    topTalents: Array<{
      athleteId: string;
      name: string;
      score: number;
      sport: string;
      location: string;
    }>;
    trendAnalysis: {
      scoreTrend: 'improving' | 'stable' | 'declining';
      regionalTrends: { [region: string]: 'up' | 'down' | 'stable' };
      sportTrends: { [sport: string]: 'up' | 'down' | 'stable' };
    };
    recommendations: string[];
    riskFactors: string[];
  };
  actions: {
    immediate: string[];
    shortTerm: string[];
    longTerm: string[];
  };
}

interface DeliveryChannel {
  type: 'email' | 'sms' | 'push' | 'dashboard';
  enabled: boolean;
  config: {
    [key: string]: any;
  };
}

class SAINotificationService {
  private readonly RULES_KEY = 'sai_notification_rules';
  private readonly ALERTS_KEY = 'sai_talent_alerts';
  private readonly REPORTS_KEY = 'sai_reports';
  private readonly DELIVERY_CONFIG_KEY = 'sai_delivery_channels';

  // Notification Rule Management
  async createNotificationRule(rule: Omit<NotificationRule, 'id'>): Promise<NotificationRule> {
    const newRule: NotificationRule = {
      ...rule,
      id: this.generateId('rule')
    };

    const rules = this.getNotificationRules();
    rules.push(newRule);
    this.storeNotificationRules(rules);

    return newRule;
  }

  async updateNotificationRule(ruleId: string, updates: Partial<NotificationRule>): Promise<void> {
    const rules = this.getNotificationRules();
    const ruleIndex = rules.findIndex(r => r.id === ruleId);
    
    if (ruleIndex >= 0) {
      rules[ruleIndex] = { ...rules[ruleIndex], ...updates };
      this.storeNotificationRules(rules);
    }
  }

  async deleteNotificationRule(ruleId: string): Promise<void> {
    const rules = this.getNotificationRules().filter(r => r.id !== ruleId);
    this.storeNotificationRules(rules);
  }

  getNotificationRules(): NotificationRule[] {
    try {
      const stored = localStorage.getItem(this.RULES_KEY);
      return stored ? JSON.parse(stored) : this.getDefaultNotificationRules();
    } catch {
      return this.getDefaultNotificationRules();
    }
  }

  // Alert Processing
  async processNewAssessment(athlete: Athlete, assessment: AssessmentTest, talentScore: TalentScore): Promise<void> {
    const rules = this.getNotificationRules().filter(rule => rule.active);
    
    for (const rule of rules) {
      if (await this.shouldTriggerAlert(athlete, assessment, talentScore, rule)) {
        const alert = await this.createTalentAlertFromRule(athlete, assessment, talentScore, rule);
        await this.deliverAlert(alert);
      }
    }
  }

  async processScoreImprovement(athlete: Athlete, previousScore: number, currentScore: number, talentScore: TalentScore): Promise<void> {
    const improvement = ((currentScore - previousScore) / previousScore) * 100;
    
    const rules = this.getNotificationRules().filter(rule => 
      rule.active && 
      rule.conditions.improvementThreshold && 
      improvement >= rule.conditions.improvementThreshold
    );

    for (const rule of rules) {
      const alert: TalentAlert = {
        id: this.generateId('alert'),
        timestamp: new Date(),
        type: 'score_improvement',
        priority: this.calculateAlertPriority(improvement, talentScore),
        athleteId: athlete.id,
        athleteName: athlete.name,
        title: `Significant Improvement: ${athlete.name}`,
        message: `${athlete.name} has shown ${improvement.toFixed(1)}% improvement, reaching a score of ${currentScore}`,
        data: {
          currentScore,
          previousScore,
          improvement,
          percentile: talentScore.categoryScores.physical, // Simplified
          location: `${athlete.city}, ${athlete.state}`,
          age: athlete.age
        },
        actionRequired: improvement > 25, // Significant improvement
        actionItems: improvement > 25 ? [
          'Schedule follow-up assessment',
          'Consider for advanced training program',
          'Update talent profile'
        ] : [],
        recipients: rule.recipients.officials,
        delivered: false,
        readBy: [],
        archived: false
      };

      await this.deliverAlert(alert);
    }
  }

  async processEliteThresholdReached(athlete: Athlete, talentScore: TalentScore): Promise<void> {
    const rules = this.getNotificationRules().filter(rule => 
      rule.active && rule.conditions.eliteThresholdAlert
    );

    for (const rule of rules) {
      const alert: TalentAlert = {
        id: this.generateId('alert'),
        timestamp: new Date(),
        type: 'elite_threshold',
        priority: 'high',
        athleteId: athlete.id,
        athleteName: athlete.name,
        title: `Elite Threshold Reached: ${athlete.name}`,
        message: `${athlete.name} has reached elite performance levels with a score of ${talentScore.overallScore}`,
        data: {
          currentScore: talentScore.overallScore,
          percentile: Math.max(...Object.values(talentScore.categoryScores)),
          recommendedSports: talentScore.recommendedSports,
          location: `${athlete.city}, ${athlete.state}`,
          age: athlete.age
        },
        actionRequired: true,
        actionItems: [
          'Immediate talent scout assignment',
          'Schedule comprehensive evaluation',
          'Add to priority recruitment list',
          'Contact athlete for program enrollment'
        ],
        recipients: rule.recipients.officials,
        delivered: false,
        readBy: [],
        archived: false
      };

      await this.deliverAlert(alert);
    }
  }

  // Alert Management
  async getTalentAlerts(filters?: {
    type?: TalentAlert['type'];
    priority?: TalentAlert['priority'];
    unreadOnly?: boolean;
    recipientId?: string;
    limit?: number;
  }): Promise<TalentAlert[]> {
    let alerts = this.getStoredAlerts();

    // Apply filters
    if (filters?.type) {
      alerts = alerts.filter(alert => alert.type === filters.type);
    }
    if (filters?.priority) {
      alerts = alerts.filter(alert => alert.priority === filters.priority);
    }
    if (filters?.unreadOnly && filters?.recipientId) {
      alerts = alerts.filter(alert => !alert.readBy.includes(filters.recipientId!));
    }
    if (filters?.recipientId) {
      alerts = alerts.filter(alert => alert.recipients.includes(filters.recipientId!));
    }

    // Sort by timestamp (newest first) and limit
    alerts = alerts
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, filters?.limit || 100);

    return alerts;
  }

  async markAlertAsRead(alertId: string, userId: string): Promise<void> {
    const alerts = this.getStoredAlerts();
    const alertIndex = alerts.findIndex(a => a.id === alertId);
    
    if (alertIndex >= 0) {
      if (!alerts[alertIndex].readBy.includes(userId)) {
        alerts[alertIndex].readBy.push(userId);
      }
      this.storeAlerts(alerts);
    }
  }

  async archiveAlert(alertId: string): Promise<void> {
    const alerts = this.getStoredAlerts();
    const alertIndex = alerts.findIndex(a => a.id === alertId);
    
    if (alertIndex >= 0) {
      alerts[alertIndex].archived = true;
      this.storeAlerts(alerts);
    }
  }

  // Reporting System
  async generateDailyReport(date: Date = new Date()): Promise<RecruitmentReport> {
    const startDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 1);

    return this.generateReport('daily', startDate, endDate);
  }

  async generateWeeklyReport(weekStart?: Date): Promise<RecruitmentReport> {
    const start = weekStart || this.getWeekStart(new Date());
    const end = new Date(start);
    end.setDate(end.getDate() + 7);

    return this.generateReport('weekly', start, end);
  }

  async generateMonthlyReport(month?: number, year?: number): Promise<RecruitmentReport> {
    const now = new Date();
    const targetMonth = month ?? now.getMonth();
    const targetYear = year ?? now.getFullYear();

    const start = new Date(targetYear, targetMonth, 1);
    const end = new Date(targetYear, targetMonth + 1, 0);

    return this.generateReport('monthly', start, end);
  }

  async generateCustomReport(startDate: Date, endDate: Date, title: string): Promise<RecruitmentReport> {
    return this.generateReport('quarterly', startDate, endDate, title);
  }

  private async generateReport(
    type: RecruitmentReport['type'], 
    startDate: Date, 
    endDate: Date,
    customTitle?: string
  ): Promise<RecruitmentReport> {
    // Get data for the period (mock implementation)
    const alerts = this.getStoredAlerts().filter(alert => 
      alert.timestamp >= startDate && alert.timestamp < endDate
    );

    // Mock data generation for demonstration
    const summary = {
      newTalentsIdentified: alerts.filter(a => a.type === 'new_talent').length,
      totalAssessments: Math.floor(Math.random() * 500) + 100,
      averageScore: Math.random() * 20 + 70, // 70-90 range
      regionalBreakdown: {
        'Maharashtra': Math.floor(Math.random() * 50) + 20,
        'Kerala': Math.floor(Math.random() * 40) + 15,
        'Punjab': Math.floor(Math.random() * 35) + 12,
        'Haryana': Math.floor(Math.random() * 45) + 18,
        'Karnataka': Math.floor(Math.random() * 38) + 14
      },
      sportBreakdown: {
        'Athletics': Math.floor(Math.random() * 60) + 30,
        'Football': Math.floor(Math.random() * 50) + 25,
        'Basketball': Math.floor(Math.random() * 40) + 20,
        'Hockey': Math.floor(Math.random() * 35) + 15,
        'Badminton': Math.floor(Math.random() * 30) + 12
      },
      alertsTriggered: alerts.length
    };

    const report: RecruitmentReport = {
      id: this.generateId('report'),
      title: customTitle || `${type.charAt(0).toUpperCase() + type.slice(1)} Talent Report`,
      period: { startDate, endDate },
      generated: new Date(),
      type,
      summary,
      insights: {
        topTalents: this.generateTopTalentsInsight(alerts),
        trendAnalysis: this.generateTrendAnalysis(summary),
        recommendations: this.generateRecommendations(summary, alerts),
        riskFactors: this.identifyRiskFactors(summary, alerts)
      },
      actions: this.generateActionItems(summary, alerts)
    };

    // Store the report
    const reports = await this.getStoredReports();
    reports.push(report);
    this.storeReports(reports);

    return report;
  }

  async getReportsList(limit: number = 50): Promise<RecruitmentReport[]> {
    const reports = this.getStoredReports();
    return reports
      .sort((a, b) => b.generated.getTime() - a.generated.getTime())
      .slice(0, limit);
  }

  // Delivery Management
  async configureDeliveryChannels(channels: { [type: string]: DeliveryChannel }): Promise<void> {
    localStorage.setItem(this.DELIVERY_CONFIG_KEY, JSON.stringify(channels));
  }

  async deliverAlert(alert: TalentAlert): Promise<boolean> {
    try {
      // Store alert
      const alerts = this.getStoredAlerts();
      alerts.push(alert);
      this.storeAlerts(alerts);

      // Attempt delivery through configured channels
      const deliveryChannels = this.getDeliveryChannels();
      let delivered = false;

      for (const [channelType, channel] of Object.entries(deliveryChannels)) {
        if (channel.enabled) {
          try {
            await this.deliverViaChannel(alert, channel);
            delivered = true;
          } catch (error) {
            console.error(`Failed to deliver via ${channelType}:`, error);
          }
        }
      }

      // Update delivery status
      if (delivered) {
        alert.delivered = true;
        this.storeAlerts(alerts);
      }

      return delivered;
    } catch (error) {
      console.error('Error delivering alert:', error);
      return false;
    }
  }

  private async deliverViaChannel(alert: TalentAlert, channel: DeliveryChannel): Promise<void> {
    switch (channel.type) {
      case 'email':
        await this.sendEmail(alert, channel.config);
        break;
      case 'sms':
        await this.sendSMS(alert, channel.config);
        break;
      case 'push':
        await this.sendPushNotification(alert, channel.config);
        break;
      case 'dashboard':
        // Already stored in alerts, no additional action needed
        break;
      default:
        throw new Error(`Unknown delivery channel: ${channel.type}`);
    }
  }

  // Private Helper Methods
  private async shouldTriggerAlert(
    athlete: Athlete, 
    assessment: AssessmentTest, 
    talentScore: TalentScore, 
    rule: NotificationRule
  ): Promise<boolean> {
    const conditions = rule.conditions;

    // Check privacy consent
    const hasConsent = await dataPrivacyService.hasValidConsent(athlete.id, 'contactPermission');
    if (!hasConsent) return false;

    // Check score threshold
    if (conditions.minScore && talentScore.overallScore < conditions.minScore) return false;
    
    // Check age limit
    if (conditions.maxAge && athlete.age > conditions.maxAge) return false;
    
    // Check sports
    if (conditions.sports && !conditions.sports.some(sport => athlete.sportsPlayed.includes(sport))) return false;
    
    // Check regions
    if (conditions.regions && !conditions.regions.includes(athlete.state)) return false;
    
    // Check if new assessment alert is enabled
    if (conditions.newAssessmentAlert && assessment) return true;
    
    // Check elite threshold
    if (conditions.eliteThresholdAlert && talentScore.overallScore >= 85) return true;

    return false;
  }

  // Public method for creating talent alerts (used by enhancedAssessmentService)
  async createTalentAlert(alertData: {
    type: TalentAlert['type'];
    severity: 'high' | 'medium' | 'low';
    athleteId: string;
    athleteName: string;
    sport: string;
    testType: string;
    score: number;
    percentile: number;
    highlights: string[];
    timestamp: Date;
  }): Promise<TalentAlert> {
    const alert: TalentAlert = {
      id: this.generateId('alert'),
      timestamp: alertData.timestamp,
      type: alertData.type,
      priority: alertData.severity,
      athleteId: alertData.athleteId,
      athleteName: alertData.athleteName,
      title: `${alertData.type.replace('_', ' ').toUpperCase()}: ${alertData.athleteName}`,
      message: `${alertData.athleteName} has achieved a score of ${alertData.score} (${alertData.percentile}th percentile) in ${alertData.testType}`,
      data: {
        currentScore: alertData.score,
        percentile: alertData.percentile,
        recommendedSports: [alertData.sport],
        location: 'Unknown',
        age: 20 // Default age
      },
      actionRequired: alertData.severity === 'high',
      actionItems: alertData.highlights,
      recipients: ['sai_official_1'],
      delivered: false,
      readBy: [],
      archived: false
    };

    await this.deliverAlert(alert);
    return alert;
  }

  private async createTalentAlertFromRule(
    athlete: Athlete, 
    assessment: AssessmentTest, 
    talentScore: TalentScore, 
    rule: NotificationRule
  ): Promise<TalentAlert> {
    return {
      id: this.generateId('alert'),
      timestamp: new Date(),
      type: 'new_talent',
      priority: rule.priority,
      athleteId: athlete.id,
      athleteName: athlete.name,
      title: `New Talent Alert: ${athlete.name}`,
      message: `${athlete.name} (Age: ${athlete.age}) has completed a ${assessment.testType} assessment with a score of ${assessment.score}`,
      data: {
        currentScore: talentScore.overallScore,
        percentile: Math.max(...Object.values(talentScore.categoryScores)),
        recommendedSports: talentScore.recommendedSports,
        location: `${athlete.city}, ${athlete.state}`,
        age: athlete.age
      },
      actionRequired: talentScore.overallScore >= 80,
      actionItems: talentScore.overallScore >= 80 ? [
        'Review detailed assessment results',
        'Schedule talent scout evaluation',
        'Consider for training program'
      ] : ['Monitor for future assessments'],
      recipients: rule.recipients.officials,
      delivered: false,
      readBy: [],
      archived: false
    };
  }

  private calculateAlertPriority(improvement: number, talentScore: TalentScore): TalentAlert['priority'] {
    if (improvement > 30 || talentScore.overallScore > 90) return 'high';
    if (improvement > 15 || talentScore.overallScore > 80) return 'medium';
    return 'low';
  }

  private generateTopTalentsInsight(alerts: TalentAlert[]): RecruitmentReport['insights']['topTalents'] {
    // Mock implementation based on alerts
    return alerts
      .filter(alert => alert.type === 'new_talent' || alert.type === 'elite_threshold')
      .slice(0, 10)
      .map(alert => ({
        athleteId: alert.athleteId,
        name: alert.athleteName,
        score: alert.data.currentScore || 85,
        sport: alert.data.recommendedSports?.[0] || 'Athletics',
        location: alert.data.location || 'Unknown'
      }));
  }

  private generateTrendAnalysis(summary: RecruitmentReport['summary']): RecruitmentReport['insights']['trendAnalysis'] {
    return {
      scoreTrend: summary.averageScore > 75 ? 'improving' : summary.averageScore > 65 ? 'stable' : 'declining',
      regionalTrends: Object.fromEntries(
        Object.keys(summary.regionalBreakdown).map(region => [
          region, 
          Math.random() > 0.5 ? 'up' : Math.random() > 0.25 ? 'stable' : 'down'
        ])
      ),
      sportTrends: Object.fromEntries(
        Object.keys(summary.sportBreakdown).map(sport => [
          sport,
          Math.random() > 0.5 ? 'up' : Math.random() > 0.25 ? 'stable' : 'down'
        ])
      )
    };
  }

  private generateRecommendations(summary: RecruitmentReport['summary'], alerts: TalentAlert[]): string[] {
    const recommendations: string[] = [];

    if (summary.newTalentsIdentified < 10) {
      recommendations.push('Increase talent scouting activities in underperforming regions');
    }

    if (summary.averageScore < 70) {
      recommendations.push('Review assessment criteria and training programs');
    }

    if (alerts.filter(a => a.priority === 'high').length > 5) {
      recommendations.push('Allocate additional resources for high-priority talent development');
    }

    // Find top regions
    const topRegion = Object.entries(summary.regionalBreakdown)
      .sort(([, a], [, b]) => b - a)[0]?.[0];
    
    if (topRegion) {
      recommendations.push(`Focus recruitment efforts in ${topRegion} - showing strong talent pipeline`);
    }

    return recommendations;
  }

  private identifyRiskFactors(summary: RecruitmentReport['summary'], alerts: TalentAlert[]): string[] {
    const risks: string[] = [];

    if (summary.newTalentsIdentified < 5) {
      risks.push('Low talent identification rate may indicate assessment gaps');
    }

    if (summary.alertsTriggered > summary.newTalentsIdentified * 3) {
      risks.push('High alert volume may indicate threshold misconfiguration');
    }

    const lowPerformingRegions = Object.entries(summary.regionalBreakdown)
      .filter(([, count]) => count < 10)
      .map(([region]) => region);

    if (lowPerformingRegions.length > 2) {
      risks.push(`Underperformance in regions: ${lowPerformingRegions.join(', ')}`);
    }

    return risks;
  }

  private generateActionItems(summary: RecruitmentReport['summary'], alerts: TalentAlert[]): RecruitmentReport['actions'] {
    const highPriorityAlerts = alerts.filter(a => a.priority === 'high');
    const mediumPriorityAlerts = alerts.filter(a => a.priority === 'medium');

    return {
      immediate: [
        ...highPriorityAlerts.slice(0, 3).map(alert => `Follow up on ${alert.athleteName} - ${alert.title}`),
        'Review and respond to all high-priority alerts'
      ],
      shortTerm: [
        ...mediumPriorityAlerts.slice(0, 2).map(alert => `Evaluate ${alert.athleteName} for training programs`),
        'Analyze regional performance variations',
        'Update recruitment criteria based on trends'
      ],
      longTerm: [
        'Develop talent pipeline strategy for underperforming regions',
        'Implement enhanced assessment protocols',
        'Establish partnerships with regional training centers'
      ]
    };
  }

  private async sendEmail(alert: TalentAlert, config: any): Promise<void> {
    // Mock email delivery
    console.log(`Email sent: ${alert.title} to ${alert.recipients.join(', ')}`);
    
    // Log the notification delivery
    await dataPrivacyService.logSecurityAction(
      'access',
      'notification_system',
      [alert.athleteId],
      ['notification'],
      'Email notification delivery'
    );
  }

  private async sendSMS(alert: TalentAlert, config: any): Promise<void> {
    // Mock SMS delivery
    console.log(`SMS sent: ${alert.title}`);
    
    await dataPrivacyService.logSecurityAction(
      'access',
      'notification_system',
      [alert.athleteId],
      ['notification'],
      'SMS notification delivery'
    );
  }

  private async sendPushNotification(alert: TalentAlert, config: any): Promise<void> {
    // Mock push notification
    console.log(`Push notification: ${alert.title}`);
    
    await dataPrivacyService.logSecurityAction(
      'access',
      'notification_system',
      [alert.athleteId],
      ['notification'],
      'Push notification delivery'
    );
  }

  private getDefaultNotificationRules(): NotificationRule[] {
    return [
      {
        id: 'default_elite',
        name: 'Elite Threshold Alert',
        description: 'Notify when athletes reach elite performance levels (85+ score)',
        active: true,
        conditions: {
          minScore: 85,
          eliteThresholdAlert: true
        },
        recipients: {
          officials: ['sai_official_1'],
          emailAddresses: ['talent@sai.gov.in'],
          phoneNumbers: []
        },
        frequency: 'immediate',
        priority: 'high'
      },
      {
        id: 'default_improvement',
        name: 'Significant Improvement',
        description: 'Notify when athletes show 20%+ improvement',
        active: true,
        conditions: {
          improvementThreshold: 20
        },
        recipients: {
          officials: ['sai_official_1', 'regional_scout'],
          emailAddresses: ['scouts@sai.gov.in'],
          phoneNumbers: []
        },
        frequency: 'daily',
        priority: 'medium'
      }
    ];
  }

  private getWeekStart(date: Date): Date {
    const start = new Date(date);
    start.setDate(date.getDate() - date.getDay());
    start.setHours(0, 0, 0, 0);
    return start;
  }

  private getDeliveryChannels(): { [type: string]: DeliveryChannel } {
    try {
      const stored = localStorage.getItem(this.DELIVERY_CONFIG_KEY);
      return stored ? JSON.parse(stored) : {
        email: { type: 'email', enabled: true, config: {} },
        dashboard: { type: 'dashboard', enabled: true, config: {} }
      };
    } catch {
      return {
        email: { type: 'email', enabled: true, config: {} },
        dashboard: { type: 'dashboard', enabled: true, config: {} }
      };
    }
  }

  private generateId(prefix: string): string {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Storage methods
  private storeNotificationRules(rules: NotificationRule[]): void {
    localStorage.setItem(this.RULES_KEY, JSON.stringify(rules));
  }

  private getStoredAlerts(): TalentAlert[] {
    try {
      const stored = localStorage.getItem(this.ALERTS_KEY);
      return stored ? JSON.parse(stored).map((alert: any) => ({
        ...alert,
        timestamp: new Date(alert.timestamp)
      })) : [];
    } catch {
      return [];
    }
  }

  private storeAlerts(alerts: TalentAlert[]): void {
    // Keep only last 1000 alerts
    const trimmedAlerts = alerts.slice(-1000);
    localStorage.setItem(this.ALERTS_KEY, JSON.stringify(trimmedAlerts));
  }

  private getStoredReports(): RecruitmentReport[] {
    try {
      const stored = localStorage.getItem(this.REPORTS_KEY);
      return stored ? JSON.parse(stored).map((report: any) => ({
        ...report,
        generated: new Date(report.generated),
        period: {
          startDate: new Date(report.period.startDate),
          endDate: new Date(report.period.endDate)
        }
      })) : [];
    } catch {
      return [];
    }
  }

  private storeReports(reports: RecruitmentReport[]): void {
    // Keep only last 100 reports
    const trimmedReports = reports.slice(-100);
    localStorage.setItem(this.REPORTS_KEY, JSON.stringify(trimmedReports));
  }
}

const saiNotificationService = new SAINotificationService();
export default saiNotificationService;
export type { NotificationRule, TalentAlert, RecruitmentReport, DeliveryChannel };
