// Control panel component

import type { DetectionMode, GestureResult, LogEntry } from '../../utils/types';
import { ModeButton } from '../ui/ModeButton';
import { GestureDisplay } from './GestureDisplay';
import { GestureList } from './GestureList';
import { ActionLog } from './ActionLog';
import './ControlPanel.css';

interface ControlPanelProps {
    mode: DetectionMode;
    onModeChange: (mode: DetectionMode) => void;
    currentGesture: GestureResult | null;
    logs: LogEntry[];
}

export function ControlPanel({ mode, onModeChange, currentGesture, logs }: ControlPanelProps) {
    return (
        <div className="control-panel">
            <div className="panel-section">
                <h2 className="panel-title">Detection Mode</h2>
                <div className="mode-toggles">
                    <ModeButton
                        mode="hands"
                        icon="👋"
                        label="Hand Gestures"
                        active={mode === 'hands'}
                        onClick={() => onModeChange('hands')}
                    />
                    <ModeButton
                        mode="face"
                        icon="😊"
                        label="Face Detection"
                        active={mode === 'face'}
                        onClick={() => onModeChange('face')}
                    />
                    <ModeButton
                        mode="both"
                        icon="🎯"
                        label="Both"
                        active={mode === 'both'}
                        onClick={() => onModeChange('both')}
                    />
                </div>
            </div>

            <div className="panel-section">
                <h2 className="panel-title">Detected Gestures</h2>
                <GestureDisplay gesture={currentGesture} />
            </div>

            <div className="panel-section">
                <h2 className="panel-title">Supported Gestures</h2>
                <GestureList />
            </div>

            <div className="panel-section">
                <h2 className="panel-title">Action Log</h2>
                <ActionLog logs={logs} />
            </div>
        </div>
    );
}
