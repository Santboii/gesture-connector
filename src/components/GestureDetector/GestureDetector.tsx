import { useState, useRef, useEffect, useCallback } from 'react';
import { useWebcam } from '../../hooks/useWebcam';
import { useMediaPipe } from '../../hooks/useMediaPipe';
import { useGestureDetection } from '../../hooks/useGestureDetection';
import { Particles } from './Particles';
import { VideoCanvas } from './VideoCanvas';
import { ControlPanel } from './ControlPanel';
import { GestureRecorder } from './GestureRecorder';
import { createParticleEffect, createSnowEffect, flashScreen, GESTURE_ACTIONS } from '../../utils/visualEffects';
import type { DetectionMode, LogEntry } from '../../utils/types';
import './GestureDetector.css';

export function GestureDetector() {
    const [mode, setMode] = useState<DetectionMode>('hands');
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [userGestures, setUserGestures] = useState<any[]>([]);
    const [isRecording, setIsRecording] = useState(false);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Initialize webcam
    const { videoRef, isReady: webcamReady, error: webcamError } = useWebcam();

    // Initialize MediaPipe
    const { gestureRecognizer, faceLandmarker, visionClasses, isLoading, error: mediaPipeError } = useMediaPipe();

    // Gesture detection
    const { currentGesture, landmarks } = useGestureDetection({
        videoRef,
        canvasRef,
        gestureRecognizer,
        faceLandmarker,
        visionClasses,
        mode,
        isReady: webcamReady && !isLoading,
        customGestures: userGestures,
    });

    // Add log entry
    const addLog = useCallback((message: string, type: 'success' | 'warning' | 'error' = 'success') => {
        const newLog: LogEntry = {
            id: `${Date.now()}-${Math.random()}`,
            message,
            type,
            timestamp: Date.now(),
        };

        setLogs((prevLogs) => {
            const updated = [newLog, ...prevLogs];
            return updated.slice(0, 20); // Keep only last 20 logs
        });
    }, []);

    // Handle gesture actions
    useEffect(() => {
        if (!currentGesture || !containerRef.current) return;

        // Check predefined actions
        const action = GESTURE_ACTIONS[currentGesture.name];

        if (action) {
            // Add log
            addLog(action.message, action.type);

            // Trigger visual effects
            if (action.effectType === 'snow') {
                createSnowEffect(containerRef.current);
            } else {
                createParticleEffect(action.particleColor, containerRef.current);
            }

            // Create flash effect if needed
            if (action.hasFlash && action.flashColor) {
                flashScreen(action.flashColor);
            }
        } else {
            // Handle user-defined gestures (generic feedback)
            addLog(`Custom Gesture Detected: ${currentGesture.name}`, 'success');
            createParticleEffect('#ffffff', containerRef.current);
        }
    }, [currentGesture, addLog]);

    // Handle saving new gesture
    const handleSaveGesture = (gesture: any) => {
        setUserGestures(prev => [...prev, gesture]);
        addLog(`New gesture "${gesture.name}" trained successfully!`, 'success');
        setIsRecording(false);
    };

    // Handle mode change
    const handleModeChange = useCallback((newMode: DetectionMode) => {
        setMode(newMode);
        addLog(`Switched to ${newMode} mode`, 'success');
    }, [addLog]);

    // Determine status message
    let statusMessage = 'Initializing...';
    if (webcamError) {
        statusMessage = 'Camera access denied';
    } else if (mediaPipeError) {
        statusMessage = 'Error loading models';
    } else if (isLoading) {
        statusMessage = 'Loading MediaPipe models...';
    } else if (webcamReady) {
        statusMessage = 'Camera active';
    }

    // Add initialization log
    useEffect(() => {
        if (webcamReady && !isLoading) {
            addLog('Application initialized successfully', 'success');
        }
    }, [webcamReady, isLoading, addLog]);

    return (
        <>
            <Particles />
            {isRecording && (
                <GestureRecorder
                    landmarks={landmarks}
                    onSaveGesture={handleSaveGesture}
                    onClose={() => setIsRecording(false)}
                />
            )}
            <div className="container" ref={containerRef}>
                <header className="header">
                    <h1 className="title">
                        <span className="gradient-text">Gesture Detector</span>
                    </h1>
                    <p className="subtitle">Real-time hand & face recognition powered by MediaPipe</p>
                    <button
                        className="train-btn"
                        onClick={() => setIsRecording(true)}
                        disabled={!webcamReady || isLoading}
                    >
                        + Train Gesture
                    </button>
                </header>

                <div className="main-content">
                    <div className="video-section">
                        <VideoCanvas
                            videoRef={videoRef}
                            canvasRef={canvasRef}
                            statusMessage={statusMessage}
                            isActive={webcamReady && !isLoading}
                        />
                    </div>

                    <ControlPanel
                        mode={mode}
                        onModeChange={handleModeChange}
                        currentGesture={currentGesture}
                        logs={logs}
                    />
                </div>
            </div>
        </>
    );
}
