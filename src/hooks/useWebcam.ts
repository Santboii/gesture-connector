// Custom hook for webcam management

import { useEffect, useRef, useState } from 'react';

export function useWebcam() {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isReady, setIsReady] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let stream: MediaStream | null = null;

        async function enableWebcam() {
            try {
                const constraints = {
                    video: {
                        width: { ideal: 1280 },
                        height: { ideal: 720 },
                        facingMode: 'user'
                    }
                };

                stream = await navigator.mediaDevices.getUserMedia(constraints);

                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    videoRef.current.addEventListener('loadeddata', () => {
                        setIsReady(true);
                    });
                }
            } catch (err) {
                console.error('Camera error:', err);
                setError('Camera access denied. Please allow camera access to use this app.');
            }
        }

        enableWebcam();

        // Cleanup
        return () => {
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
            setIsReady(false);
        };
    }, []);

    return { videoRef, isReady, error };
}
