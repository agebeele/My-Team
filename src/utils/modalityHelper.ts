import { MatchModality } from '../types';

export interface ModalityDurationInfo {
  modality: MatchModality;
  label: string;
  halfMinutes: number; // 20 min for fut 5, 7, 9; 45 min for fut 11
  totalMinutes: number; // 40 min for fut 5, 7, 9; 90 min for fut 11
  halfSeconds: number; // 20*60 = 1200 or 45*60 = 2700
  totalSeconds: number; // 40*60 = 2400 or 90*60 = 5400
  mvpAvailableMinutes: number; // 25 for fut 5/7/9; 50 for fut 11
  period1Label: string;
  period2Label: string;
  description: string;
  playersPerSide: number;
}

/**
 * Returns match duration & period info based on soccer modality.
 * - Fut 5, 7, and 9: 20 minutes per half (40 min regular time)
 * - Fut 11: 45 minutes per half (90 min regular time)
 */
export function getModalityInfo(modality?: MatchModality): ModalityDurationInfo {
  // Application is exclusively dedicated to Fútbol 7
  return {
    modality: 'fut7',
    label: 'Fútbol 7',
    halfMinutes: 20,
    totalMinutes: 40,
    halfSeconds: 20 * 60,
    totalSeconds: 40 * 60,
    mvpAvailableMinutes: 25,
    period1Label: "1T (0' - 20')",
    period2Label: "2T (20' - 40')",
    description: '2 tiempos de 20 min (40 min total)',
    playersPerSide: 7,
  };
}

export const FUT7_MODALITY_INFO: ModalityDurationInfo = {
  modality: 'fut7',
  label: 'Fútbol 7',
  halfMinutes: 20,
  totalMinutes: 40,
  halfSeconds: 20 * 60,
  totalSeconds: 40 * 60,
  mvpAvailableMinutes: 25,
  period1Label: "1T (0' - 20')",
  period2Label: "2T (20' - 40')",
  description: '2 tiempos de 20 min (40 min total)',
  playersPerSide: 7,
};

export const ALL_MODALITIES: {
  id: MatchModality;
  name: string;
  halfMinutes: number;
  totalMinutes: number;
  durationNote: string;
}[] = [
  { id: 'fut7', name: 'Fútbol 7', halfMinutes: 20, totalMinutes: 40, durationNote: 'Oficial: 20 min por tiempo (40m total)' },
];
