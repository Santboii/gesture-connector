// Visual effects utilities for gesture detection

import { GESTURE_EMOJIS } from './types';

// Create particle burst effect
export function createParticleEffect(color: string, containerElement: HTMLElement) {
    const centerX = containerElement.offsetWidth / 2;
    const centerY = containerElement.offsetHeight / 2;

    for (let i = 0; i < 20; i++) {
        const particle = document.createElement('div');
        particle.className = 'effect-particle';
        particle.style.cssText = `
      left: ${centerX}px;
      top: ${centerY}px;
      width: ${Math.random() * 10 + 5}px;
      height: ${Math.random() * 10 + 5}px;
      background: ${color};
      --tx: ${(Math.random() - 0.5) * 200}px;
      --ty: ${(Math.random() - 0.5) * 200}px;
    `;
        containerElement.appendChild(particle);

        setTimeout(() => particle.remove(), 1000);
    }
}

// Create screen flash effect
export function flashScreen(color: string) {
    const flash = document.createElement('div');
    flash.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: ${color};
    pointer-events: none;
    z-index: 9999;
    animation: flashEffect 0.5s ease-out;
  `;
    document.body.appendChild(flash);

    const style = document.createElement('style');
    style.textContent = `
    @keyframes flashEffect {
      0% { opacity: 1; }
      100% { opacity: 0; }
    }
  `;
    document.head.appendChild(style);

    setTimeout(() => {
        flash.remove();
        style.remove();
    }, 500);
}

// Create snow/frost effect
export function createSnowEffect(containerElement: HTMLElement) {
    const width = containerElement.offsetWidth;

    // Create 40 snowflakes
    for (let i = 0; i < 40; i++) {
        const snowflake = document.createElement('div');
        snowflake.className = 'effect-particle';
        snowflake.textContent = '❄️';
        snowflake.style.cssText = `
            left: ${Math.random() * width}px;
            top: -20px;
            font-size: ${Math.random() * 20 + 10}px;
            color: white;
            opacity: 0.8;
            position: absolute;
            pointer-events: none;
            z-index: 1000;
            animation: fall ${Math.random() * 2 + 1}s linear forwards;
            --tx: ${(Math.random() - 0.5) * 100}px;
        `;

        // Add fall animation if not exists
        if (!document.getElementById('snow-animation')) {
            const style = document.createElement('style');
            style.id = 'snow-animation';
            style.textContent = `
                @keyframes fall {
                    0% { transform: translateY(0) translateX(0) rotate(0deg); opacity: 1; }
                    100% { transform: translateY(100vh) translateX(var(--tx)) rotate(360deg); opacity: 0; }
                }
            `;
            document.head.appendChild(style);
        }

        containerElement.appendChild(snowflake);
        setTimeout(() => snowflake.remove(), 3000);
    }
}

// Get emoji for gesture
export function getGestureEmoji(gesture: string): string {
    return GESTURE_EMOJIS[gesture] || '👋';
}

// Gesture action configurations
export interface GestureAction {
    message: string;
    type: 'success' | 'warning' | 'error';
    particleColor: string;
    hasFlash: boolean;
    flashColor?: string;
    effectType?: 'burst' | 'snow';
}

export const GESTURE_ACTIONS: Record<string, GestureAction> = {
    'Thumb_Up': {
        message: '👍 Thumbs Up detected - Success!',
        type: 'success',
        particleColor: '#00ff88',
        hasFlash: false,
    },
    'Thumb_Down': {
        message: '👎 Thumbs Down detected',
        type: 'warning',
        particleColor: '#ff4757',
        hasFlash: false,
    },
    'Victory': {
        message: '✌️ Victory detected - Let it Snow!',
        type: 'success',
        particleColor: '#ffd700',
        hasFlash: true,
        flashColor: '#a5f3fc30',
        effectType: 'snow',
    },
    'Open_Palm': {
        message: '✋ Open Palm detected - Pause/Reset',
        type: 'success',
        particleColor: '#00d4ff',
        hasFlash: false,
    },
    'Closed_Fist': {
        message: '✊ Closed Fist detected - Activate!',
        type: 'success',
        particleColor: '#b537ff',
        hasFlash: true,
        flashColor: '#b537ff30',
    },
    'Pointing_Up': {
        message: '☝️ Pointing Up detected - Navigate',
        type: 'success',
        particleColor: '#00d4ff',
        hasFlash: false,
    },
    'ILoveYou': {
        message: '🤟 ILoveYou detected - Special effect!',
        type: 'success',
        particleColor: '#ff006e',
        hasFlash: true,
        flashColor: '#ff006e30',
    },
    'OK_Sign': {
        message: '👌 OK Sign detected - Perfect!',
        type: 'success',
        particleColor: '#00ff88',
        hasFlash: true,
        flashColor: '#00ff8830',
    },
    'Rock_On': {
        message: '🤘 Rock On detected - Awesome!',
        type: 'success',
        particleColor: '#ff006e',
        hasFlash: true,
        flashColor: '#ff006e30',
    },
    'Call_Me': {
        message: '🤙 Call Me detected - Hang loose!',
        type: 'success',
        particleColor: '#ffd700',
        hasFlash: false,
    },
    'Smile': {
        message: '😊 Smile detected - Happy vibes!',
        type: 'success',
        particleColor: '#ffd700',
        hasFlash: false,
    },
    'MouthOpen': {
        message: '😮 Mouth Open detected - Alert!',
        type: 'warning',
        particleColor: '#ff4757',
        hasFlash: false,
    },
    'EyebrowRaise': {
        message: '🤨 Eyebrow Raise detected - Curious?',
        type: 'success',
        particleColor: '#00d4ff',
        hasFlash: false,
    },
};
