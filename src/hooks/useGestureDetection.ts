// Custom hook for gesture detection with Fingerpose

import { useEffect, useRef, useState, useCallback } from 'react';
import { GestureEstimator } from 'fingerpose';
import { customGestures } from '../utils/gestures';
import type { DetectionMode, GestureResult } from '../utils/types';

interface UseGestureDetectionProps {
    videoRef: React.RefObject<HTMLVideoElement>;
    canvasRef: React.RefObject<HTMLCanvasElement>;
    gestureRecognizer: any;
    faceLandmarker: any;
    visionClasses: any;
    mode: DetectionMode;
    isReady: boolean;
    customGestures?: any[]; // Allow passing dynamic gestures
}

export function useGestureDetection({
    videoRef,
    canvasRef,
    gestureRecognizer,
    faceLandmarker,
    visionClasses,
    mode,
    isReady,
    customGestures: dynamicGestures,
}: UseGestureDetectionProps) {
    const [currentGesture, setCurrentGesture] = useState<GestureResult | null>(null);
    const [landmarks, setLandmarks] = useState<any[]>([]); // Expose landmarks
    const lastVideoTimeRef = useRef(-1);
    const animationFrameRef = useRef<number>();
    const drawingUtilsRef = useRef<any>(null);
    const gestureEstimatorRef = useRef<GestureEstimator | null>(null);
    const lastGestureTimeRef = useRef(0);
    const GESTURE_DEBOUNCE = 500; // ms

    // Initialize Fingerpose GestureEstimator
    useEffect(() => {
        // Combine default custom gestures with dynamic ones
        const allGestures = [...(customGestures || []), ...(dynamicGestures || [])];
        // @ts-ignore
        gestureEstimatorRef.current = new GestureEstimator(allGestures);
    }, [dynamicGestures]); // Re-run when dynamic gestures change

    // Initialize DrawingUtils
    useEffect(() => {
        if (canvasRef.current && !drawingUtilsRef.current && visionClasses?.DrawingUtils) {
            const ctx = canvasRef.current.getContext('2d');
            if (ctx) {
                drawingUtilsRef.current = new visionClasses.DrawingUtils(ctx);
            }
        }
    }, [canvasRef, visionClasses]);

    const processHandGestures = useCallback(async (nowInMs: number) => {
        if (!gestureRecognizer || !videoRef.current || !canvasRef.current) return;

        try {
            const results = gestureRecognizer.recognizeForVideo(videoRef.current, nowInMs);
            const ctx = canvasRef.current.getContext('2d');
            if (!ctx) return;

            // Draw hand landmarks
            if (results.landmarks && results.landmarks.length > 0) {
                // REMOVED: setLandmarks(results.landmarks[0]); - this was causing the crash by mixing types

                for (let i = 0; i < results.landmarks.length; i++) {
                    const landmarks = results.landmarks[i];

                    // Draw connections
                    if (drawingUtilsRef.current && visionClasses?.GestureRecognizer) {
                        drawingUtilsRef.current.drawConnectors(
                            landmarks,
                            visionClasses.GestureRecognizer.HAND_CONNECTIONS,
                            { color: '#00d4ff', lineWidth: 3 }
                        );

                        // Draw landmarks
                        drawingUtilsRef.current.drawLandmarks(
                            landmarks,
                            { color: '#b537ff', lineWidth: 1, radius: 4 }
                        );
                    }
                }

                // Check for gestures
                let detectedGesture: GestureResult | null = null;

                // First, check MediaPipe's built-in gestures
                if (results.gestures && results.gestures.length > 0) {
                    const gesture = results.gestures[0][0];
                    detectedGesture = {
                        name: gesture.categoryName,
                        confidence: gesture.score * 100,
                    };
                    // Clear pose data if using MediaPipe gestures (or we could try to get it from FP anyway?)
                    setLandmarks([]);
                }
                // Then check Fingerpose custom gestures
                else if (gestureEstimatorRef.current && results.landmarks[0]) {
                    const estimate = gestureEstimatorRef.current.estimate(
                        results.landmarks[0],
                        7.5 // confidence threshold
                    );

                    // Expose raw pose data for recorder
                    // We cast to any because TypeScript definitions might be missing poseData
                    const rawEstimate = estimate as any;
                    if (rawEstimate.poseData) {
                        setLandmarks(rawEstimate.poseData);
                    } else {
                        setLandmarks([]);
                    }

                    if (estimate.gestures && estimate.gestures.length > 0) {
                        const bestGesture = estimate.gestures.reduce((p: any, c: any) => {
                            return (p.score > c.score) ? p : c;
                        });
                        detectedGesture = {
                            name: bestGesture.name,
                            confidence: bestGesture.score * 100,
                        };
                    }
                }

                // Update gesture with debouncing
                if (detectedGesture) {
                    if (
                        detectedGesture.name !== currentGesture?.name ||
                        nowInMs - lastGestureTimeRef.current > GESTURE_DEBOUNCE
                    ) {
                        setCurrentGesture(detectedGesture);
                        lastGestureTimeRef.current = nowInMs;
                    }
                }
            } else {
                // No hands detected
                setLandmarks([]);
                if (mode === 'hands' && currentGesture) {
                    setCurrentGesture(null);
                }
            }
        } catch (error) {
            console.error('Hand gesture processing error:', error);
        }
    }, [gestureRecognizer, videoRef, canvasRef, mode, currentGesture, visionClasses]);

    const processFaceDetection = useCallback(async (nowInMs: number) => {
        if (!faceLandmarker || !videoRef.current || !canvasRef.current) return;

        try {
            const results = faceLandmarker.detectForVideo(videoRef.current, nowInMs);

            // Draw face landmarks
            if (results.faceLandmarks && results.faceLandmarks.length > 0) {
                const faceLandmarks = results.faceLandmarks[0];

                if (drawingUtilsRef.current && visionClasses?.FaceLandmarker) {
                    // Draw face mesh
                    drawingUtilsRef.current.drawConnectors(
                        faceLandmarks,
                        visionClasses.FaceLandmarker.FACE_LANDMARKS_TESSELATION,
                        { color: '#00d4ff40', lineWidth: 1 }
                    );

                    // Draw eyes
                    drawingUtilsRef.current.drawConnectors(
                        faceLandmarks,
                        visionClasses.FaceLandmarker.FACE_LANDMARKS_RIGHT_EYE,
                        { color: '#b537ff', lineWidth: 2 }
                    );
                    drawingUtilsRef.current.drawConnectors(
                        faceLandmarks,
                        visionClasses.FaceLandmarker.FACE_LANDMARKS_LEFT_EYE,
                        { color: '#b537ff', lineWidth: 2 }
                    );

                    // Draw lips
                    drawingUtilsRef.current.drawConnectors(
                        faceLandmarks,
                        visionClasses.FaceLandmarker.FACE_LANDMARKS_LIPS,
                        { color: '#ff006e', lineWidth: 2 }
                    );
                }

                // Detect facial expressions
                if (results.faceBlendshapes && results.faceBlendshapes.length > 0) {
                    const blendshapes = results.faceBlendshapes[0].categories;

                    const smileLeft = blendshapes.find((c: any) => c.categoryName === 'mouthSmileLeft')?.score || 0;
                    const smileRight = blendshapes.find((c: any) => c.categoryName === 'mouthSmileRight')?.score || 0;
                    const smile = (smileLeft + smileRight) / 2;

                    const mouthOpen = blendshapes.find((c: any) => c.categoryName === 'jawOpen')?.score || 0;
                    const browInnerUp = blendshapes.find((c: any) => c.categoryName === 'browInnerUp')?.score || 0;

                    let faceGesture: GestureResult | null = null;

                    if (smile > 0.6) {
                        faceGesture = { name: 'Smile', confidence: smile * 100 };
                    } else if (mouthOpen > 0.5) {
                        faceGesture = { name: 'MouthOpen', confidence: mouthOpen * 100 };
                    } else if (browInnerUp > 0.5) {
                        faceGesture = { name: 'EyebrowRaise', confidence: browInnerUp * 100 };
                    }

                    if (faceGesture && nowInMs - lastGestureTimeRef.current > GESTURE_DEBOUNCE) {
                        setCurrentGesture(faceGesture);
                        lastGestureTimeRef.current = nowInMs;
                    }
                }
            }
        } catch (error) {
            console.error('Face detection processing error:', error);
        }
    }, [faceLandmarker, videoRef, canvasRef]);

    const predictWebcam = useCallback(() => {
        if (!videoRef.current || !canvasRef.current) return;

        const nowInMs = Date.now();

        // Only process if we have a new frame
        if (videoRef.current.currentTime !== lastVideoTimeRef.current) {
            lastVideoTimeRef.current = videoRef.current.currentTime;

            // Clear canvas
            const ctx = canvasRef.current.getContext('2d');
            if (ctx) {
                ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
            }

            // Process based on mode
            if (mode === 'hands' || mode === 'both') {
                processHandGestures(nowInMs);
            }

            if (mode === 'face' || mode === 'both') {
                processFaceDetection(nowInMs);
            }
        }

        // Continue loop
        animationFrameRef.current = requestAnimationFrame(predictWebcam);
    }, [videoRef, canvasRef, mode, processHandGestures, processFaceDetection]);

    // Start/stop detection loop
    useEffect(() => {
        if (isReady && gestureRecognizer && faceLandmarker) {
            // Setup canvas dimensions
            if (videoRef.current && canvasRef.current) {
                canvasRef.current.width = videoRef.current.videoWidth;
                canvasRef.current.height = videoRef.current.videoHeight;
            }

            predictWebcam();
        }

        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        };
    }, [isReady, gestureRecognizer, faceLandmarker, predictWebcam, videoRef, canvasRef]);

    return { currentGesture, landmarks };
}
