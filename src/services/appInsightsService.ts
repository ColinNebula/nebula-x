/**
 * Azure Application Insights Service
 * Real-time monitoring, analytics, and error tracking
 */

import { ApplicationInsights } from '@microsoft/applicationinsights-web';
import appInsightsConfig from './appInsightsConfig';

export interface TelemetryEvent {
  name: string;
  properties?: Record<string, any>;
  measurements?: Record<string, number>;
}

export interface TelemetryException {
  exception: Error;
  severityLevel?: number;
  properties?: Record<string, any>;
}

export interface TelemetryMetric {
  name: string;
  average: number;
  sampleCount?: number;
  min?: number;
  max?: number;
  properties?: Record<string, any>;
}

export interface TelemetryPageView {
  name: string;
  uri?: string;
  properties?: Record<string, any>;
  measurements?: Record<string, number>;
}

class AppInsightsService {
  private appInsights: ApplicationInsights | null = null;
  private isInitialized = false;

  /**
   * Initialize Application Insights
   */
  initialize(): void {
    if (this.isInitialized) {
      console.warn('Application Insights already initialized');
      return;
    }

    if (!appInsightsConfig.instrumentationKey) {
      console.warn('Application Insights not configured. Set REACT_APP_APPINSIGHTS_KEY in .env');
      return;
    }

    try {
      this.appInsights = new ApplicationInsights({
        config: appInsightsConfig,
      });

      this.appInsights.loadAppInsights();
      this.appInsights.trackPageView(); // Initial page view

      // Set user context
      this.appInsights.context.user.id = this.getOrCreateUserId();

      this.isInitialized = true;
      console.log('✅ Application Insights initialized');

    } catch (error) {
      console.error('❌ Application Insights initialization failed:', error);
    }
  }

  /**
   * Track custom event
   */
  trackEvent(event: TelemetryEvent): void {
    if (!this.isInitialized || !this.appInsights) return;

    this.appInsights.trackEvent({
      name: event.name,
      properties: event.properties,
      measurements: event.measurements,
    });
  }

  /**
   * Track page view
   */
  trackPageView(pageView: TelemetryPageView): void {
    if (!this.isInitialized || !this.appInsights) return;

    this.appInsights.trackPageView({
      name: pageView.name,
      uri: pageView.uri,
      properties: pageView.properties,
      measurements: pageView.measurements,
    });
  }

  /**
   * Track exception/error
   */
  trackException(exceptionData: TelemetryException): void {
    if (!this.isInitialized || !this.appInsights) return;

    this.appInsights.trackException({
      exception: exceptionData.exception,
      severityLevel: exceptionData.severityLevel,
      properties: exceptionData.properties,
    });
  }

  /**
   * Track metric
   */
  trackMetric(metric: TelemetryMetric): void {
    if (!this.isInitialized || !this.appInsights) return;

    this.appInsights.trackMetric({
      name: metric.name,
      average: metric.average,
      sampleCount: metric.sampleCount,
      min: metric.min,
      max: metric.max,
      properties: metric.properties,
    });
  }

  /**
   * Track game session start
   */
  trackGameStart(gameMode: string, difficulty?: string): void {
    this.trackEvent({
      name: 'GameStart',
      properties: {
        gameMode,
        difficulty,
        timestamp: new Date().toISOString(),
      },
    });
  }

  /**
   * Track game session end
   */
  trackGameEnd(data: {
    gameMode: string;
    score: number;
    wave: number;
    playTime: number;
    enemiesKilled: number;
    bossesDefeated: number;
  }): void {
    this.trackEvent({
      name: 'GameEnd',
      properties: {
        gameMode: data.gameMode,
        wave: data.wave,
        timestamp: new Date().toISOString(),
      },
      measurements: {
        score: data.score,
        playTime: data.playTime,
        enemiesKilled: data.enemiesKilled,
        bossesDefeated: data.bossesDefeated,
      },
    });
  }

  /**
   * Track player death
   */
  trackPlayerDeath(wave: number, enemyType: string, score: number): void {
    this.trackEvent({
      name: 'PlayerDeath',
      properties: {
        wave: wave.toString(),
        enemyType,
      },
      measurements: {
        score,
      },
    });
  }

  /**
   * Track boss defeated
   */
  trackBossDefeated(bossName: string, wave: number, timeTaken: number): void {
    this.trackEvent({
      name: 'BossDefeated',
      properties: {
        bossName,
        wave: wave.toString(),
      },
      measurements: {
        timeTaken,
      },
    });
  }

  /**
   * Track achievement unlocked
   */
  trackAchievementUnlocked(achievementId: string, achievementName: string): void {
    this.trackEvent({
      name: 'AchievementUnlocked',
      properties: {
        achievementId,
        achievementName,
        timestamp: new Date().toISOString(),
      },
    });
  }

  /**
   * Track performance metric
   */
  trackPerformance(metricName: string, value: number): void {
    this.trackMetric({
      name: metricName,
      average: value,
      sampleCount: 1,
    });
  }

  /**
   * Track FPS (frames per second)
   */
  trackFPS(fps: number): void {
    this.trackMetric({
      name: 'GameFPS',
      average: fps,
      sampleCount: 1,
    });
  }

  /**
   * Set user properties
   */
  setUser(userId: string, accountId?: string): void {
    if (!this.isInitialized || !this.appInsights) return;

    this.appInsights.setAuthenticatedUserContext(userId, accountId);
  }

  /**
   * Track dependency (API calls, resource loading)
   */
  trackDependency(
    id: string,
    method: string,
    absoluteUrl: string,
    duration: number,
    success: boolean
  ): void {
    if (!this.isInitialized || !this.appInsights) return;

    this.appInsights.trackDependencyData({
      id,
      target: absoluteUrl,
      name: `${method} ${absoluteUrl}`,
      duration,
      success,
      responseCode: success ? 200 : 500,
    });
  }

  /**
   * Flush telemetry (send immediately)
   */
  flush(): void {
    if (!this.isInitialized || !this.appInsights) return;

    this.appInsights.flush();
  }

  /**
   * Get or create unique user ID
   */
  private getOrCreateUserId(): string {
    let userId = localStorage.getItem('appinsights_user_id');

    if (!userId) {
      userId = 'user_' + Math.random().toString(36).substring(2, 15) +
               Math.random().toString(36).substring(2, 15);
      localStorage.setItem('appinsights_user_id', userId);
    }

    return userId;
  }

  /**
   * Check if Application Insights is configured
   */
  isConfigured(): boolean {
    return !!appInsightsConfig.instrumentationKey &&
           appInsightsConfig.instrumentationKey.length > 0;
  }

  /**
   * Get Application Insights instance
   */
  getInstance(): ApplicationInsights | null {
    return this.appInsights;
  }
}

// Export singleton instance
const appInsightsService = new AppInsightsService();
export default appInsightsService;
