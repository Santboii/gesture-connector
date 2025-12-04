// Gesture list component

import { SUPPORTED_GESTURES } from '../../utils/types';
import './GestureList.css';

export function GestureList() {
    return (
        <div className="gesture-list">
            {SUPPORTED_GESTURES.map((gesture, index) => (
                <div key={index} className="gesture-item">
                    {gesture.emoji} {gesture.name}
                </div>
            ))}
        </div>
    );
}
