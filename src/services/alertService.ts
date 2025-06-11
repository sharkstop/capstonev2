import axios from 'axios';

export const ALERT_TYPES = {
  ACCESS_GRANTED: 'access_granted',
  ACCESS_DENIED: 'access_denied',
  VIP_DETECTED: 'vip_detected',
  MULTIPLE_FACES: 'multiple_faces',
  LOW_CONFIDENCE: 'low_confidence',
  SYSTEM_ERROR: 'system_error'
};

const audioCache = new Map<string, HTMLAudioElement>();

export async function triggerAlert(alertType: string, userId?: number, location?: string, additionalData?: any) {
  try {
    const response = await axios.post('/api/alerts/trigger', {
      alert_type: alertType,
      user_id: userId,
      location: location,
      additional_data: additionalData
    });

    if (response.data.success) {
      playAlertSound(response.data.alert_data.sound, response.data.alert_data.volume);
    }

    return response.data;
  } catch (error) {
    console.error('Error triggering alert:', error);
    throw error;
  }
}

export function playAlertSound(soundFile: string, volume: number = 0.7) {
  if (audioCache.has(soundFile)) {
    const audio = audioCache.get(soundFile);
    audio.volume = volume;
    audio.currentTime = 0;
    audio.play().catch(err => console.error('Error playing sound:', err));
    return;
  }

  const audio = new Audio(`/sounds/${soundFile}`);
  audio.volume = volume;
  audioCache.set(soundFile, audio);
  audio.play().catch(err => console.error('Error playing sound:', err));
}

export async function getAllAlertSettings() {
  try {
    const response = await axios.get('/api/alerts/settings');
    return response.data.settings;
  } catch (error) {
    console.error('Error getting alert settings:', error);
    throw error;
  }
}

export async function updateAlertSettings(alertType: string, settings: {
  sound?: string,
  volume?: number,
  enabled?: boolean
}) {
  try {
    const response = await axios.put(`/api/alerts/settings/${alertType}`, settings);
    return response.data;
  } catch (error) {
    console.error('Error updating alert settings:', error);
    throw error;
  }
}

export function preloadAlertSounds() {
  const defaultSounds = [
    'access_granted.mp3',
    'access_denied.mp3',
    'vip_alert.mp3',
    'multiple_faces.mp3',
    'low_confidence.mp3',
    'system_error.mp3'
  ];

  defaultSounds.forEach(sound => {
    const audio = new Audio(`/sounds/${sound}`);
    audio.load();
    audioCache.set(sound, audio);