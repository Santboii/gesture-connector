// TypeScript type definitions for the gesture detector application

export type DetectionMode = 'hands' | 'face' | 'both';

export interface GestureResult {
    name: string;
    confidence: number;
}

export interface HandLandmark {
    x: number;
    y: number;
    z?: number;
}

export interface AppState {
    mode: DetectionMode;
    webcamRunning: boolean;
    lastGesture: string | null;
    lastGestureTime: number;
    gestureDebounce: number;
}

export interface LogEntry {
    id: string;
    message: string;
    type: 'success' | 'warning' | 'error';
    timestamp: number;
}

export const GESTURE_EMOJIS: Record<string, string> = {
    'Thumb_Up': '👍',
    'Thumb_Down': '👎',
    'Victory': '✌️',
    'Open_Palm': '✋',
    'Closed_Fist': '✊',
    'Pointing_Up': '☝️',
    'ILoveYou': '🤟',
    'OK_Sign': '👌',
    'Rock_On': '🤘',
    'Call_Me': '🤙',
    'Smile': '😊',
    'MouthOpen': '😮',
    'EyebrowRaise': '🤨',
};

export const SUPPORTED_GESTURES = [
    { emoji: '👍', name: 'Thumbs Up' },
    { emoji: '👎', name: 'Thumbs Down' },
    { emoji: '✌️', name: 'Victory/Peace' },
    { emoji: '✋', name: 'Open Palm' },
    { emoji: '✊', name: 'Closed Fist' },
    { emoji: '☝️', name: 'Pointing Up' },
    { emoji: '🤟', name: 'ILoveYou' },
    { emoji: '👌', name: 'OK Sign' },
    { emoji: '🤘', name: 'Rock On' },
    { emoji: '🤙', name: 'Call Me' },
];
