// Custom hook for MediaPipe initialization

import { useEffect, useState } from 'react';

// Declare global MediaPipe types
declare global {
    interface Window {
        GestureRecognizer: any;
        FaceLandmarker: any;
        FilesetResolver: any;
        DrawingUtils: any;
    }
}
export function useMediaPipe() {
    const [gestureRecognizer, setGestureRecognizer] = useState<any>(null);
    const [faceLandmarker, setFaceLandmarker] = useState<any>(null);
    const [visionClasses, setVisionClasses] = useState<{
        GestureRecognizer: any;
        FaceLandmarker: any;
        FilesetResolver: any;
        DrawingUtils: any;
    } | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function initializeMediaPipe() {
            try {
                // Wait for MediaPipe to load (poll every 100ms, max 5 seconds)
                let attempts = 0;
                const maxAttempts = 50;

                while (!window.FilesetResolver && attempts < maxAttempts) {
                    await new Promise(resolve => setTimeout(resolve, 100));
                    attempts++;
                }

                if (!window.FilesetResolver) {
                    console.error('MediaPipe failed to load after 5 seconds');
                    setError('MediaPipe failed to load');
                    setIsLoading(false);
                    return;
                }

                console.log('MediaPipe loaded successfully');

                setVisionClasses({
                    GestureRecognizer: window.GestureRecognizer,
                    FaceLandmarker: window.FaceLandmarker,
                    FilesetResolver: window.FilesetResolver,
                    DrawingUtils: window.DrawingUtils
                });

                // Load MediaPipe vision tasks
                const visionTasks = await window.FilesetResolver.forVisionTasks("/vendor/wasm");

                // Initialize Gesture Recognizer
                const gestureRec = await window.GestureRecognizer.createFromOptions(visionTasks, {
                    baseOptions: {
                        modelAssetPath: "https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task",
                        delegate: "GPU"
                    },
                    runningMode: "VIDEO",
                    numHands: 2,
                    minHandDetectionConfidence: 0.5,
                    minHandPresenceConfidence: 0.5,
                    minTrackingConfidence: 0.5
                });

                // Initialize Face Landmarker
                const faceMarker = await window.FaceLandmarker.createFromOptions(visionTasks, {
                    baseOptions: {
                        modelAssetPath: "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
                        delegate: "GPU"
                    },
                    runningMode: "VIDEO",
                    numFaces: 1,
                    minFaceDetectionConfidence: 0.5,
                    minFacePresenceConfidence: 0.5,
                    minTrackingConfidence: 0.5,
                    outputFaceBlendshapes: true,
                    outputFacialTransformationMatrixes: true
                });

                setGestureRecognizer(gestureRec);
                setFaceLandmarker(faceMarker);
                setIsLoading(false);
            } catch (err) {
                console.error('MediaPipe initialization error:', err);
                setError('Failed to load MediaPipe models');
                setIsLoading(false);
            }
        }

        initializeMediaPipe();
    }, []);

    return { gestureRecognizer, faceLandmarker, visionClasses, isLoading, error };
}
