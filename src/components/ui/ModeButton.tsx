// Mode toggle button component

import type { DetectionMode } from '../../utils/types';
import './ModeButton.css';

interface ModeButtonProps {
    mode: DetectionMode;
    icon: string;
    label: string;
    active: boolean;
    onClick: () => void;
}

export function ModeButton({ mode, icon, label, active, onClick }: ModeButtonProps) {
    return (
        <button
            className={`mode-btn ${active ? 'active' : ''}`}
            onClick={onClick}
            data-mode={mode}
        >
            <span className="mode-icon">{icon}</span>
            <span className="mode-label">{label}</span>
        </button>
    );
}
