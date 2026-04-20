/**
 * React Hook for Application Insights
 * Easy-to-use analytics and monitoring hook
 */

import { useEffect, useCallback } from 'react';
import appInsightsService from '../services/appInsightsService';
import type { UseAppInsightsReturn } from '../types/game.types';

export const useAppInsights = (): UseAppInsightsReturn => {
  // Initialize on mount
  useEffect(() => {
    if (appInsightsService.isConfigured()) {
      appInsightsService.initialize();
    }
  }, []);

  /**
   * Track custom event
   */
  const trackEvent = useCallback((
    name: string,
    properties?: Record<string, any>
  ): void => {
    appInsightsService.trackEvent({ name, properties });
  }, []);

  /**
   * Track page view
   */
  const trackPageView = useCallback((
    name: string,
    uri?: string
  ): void => {
    appInsightsService.trackPageView({ name, uri });
  }, []);

  /**
   * Track exception/error
   */
  const trackException = useCallback((
    error: Error,
    severityLevel: number = 3
  ): void => {
    appInsightsService.trackException({
      exception: error,
      severityLevel,
    });
  }, []);

  /**
   * Track metric
   */
  const trackMetric = useCallback((
    name: string,
    value: number
  ): void => {
    appInsightsService.trackMetric({
      name,
      average: value,
      sampleCount: 1,
    });
  }, []);

  /**
   * Track game start
   */
  const trackGameStart = useCallback((
    gameMode: string,
    difficulty?: string
  ): void => {
    appInsightsService.trackGameStart(gameMode, difficulty);
  }, []);

  /**
   * Track game end
   */
  const trackGameEnd = useCallback((data: {
    gameMode: string;
    score: number;
    wave: number;
    playTime: number;
    enemiesKilled: number;
    bossesDefeated: number;
  }): void => {
    appInsightsService.trackGameEnd(data);
  }, []);

  return {
    isConfigured: appInsightsService.isConfigured(),
    trackEvent,
    trackPageView,
    trackException,
    trackMetric,
    trackGameStart,
    trackGameEnd,
  };
};

export default useAppInsights;
