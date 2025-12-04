// Gesture display component

import type { GestureResult } from '../../utils/types';
import { getGestureEmoji } from '../../utils/visualEffects';
import './GestureDisplay.css';

interface GestureDisplayProps {
    gesture: GestureResult | null;
}

export function GestureDisplay({ gesture }: GestureDisplayProps) {
    if (!gesture) {
        return (
            <div className="gesture-display">
                <div className="no-gesture">No gestures detected</div>
            </div>
        );
    }

    const emoji = getGestureEmoji(gesture.name);

    return (
        <div className="gesture-display">
            <div className="detected-gesture">
                {emoji} {gesture.name.replace(/_/g, ' ')} <span style={{ opacity: 0.7 }}>({gesture.confidence.toFixed(0)}%)</span>
            </div>
        </div>
    );
}
