import { useState, useEffect } from 'react';
import { Finger, FingerCurl, FingerDirection, GestureDescription } from 'fingerpose';
import './GestureRecorder.css';

interface GestureRecorderProps {
    landmarks: any[]; // This is now poseData: [[finger, curl, direction], ...]
    onSaveGesture: (gesture: GestureDescription) => void;
    onClose: () => void;
}

export function GestureRecorder({ landmarks: poseData, onSaveGesture, onClose }: GestureRecorderProps) {
    const [gestureName, setGestureName] = useState('');
    const [captured, setCaptured] = useState(false);

    // Helper to parse poseData
    const getPose = () => {
        if (!poseData || poseData.length === 0) return null;

        // poseData format from Fingerpose: [ [FingerName, CurlName, DirectionName], ... ]
        // But wait, the cat output showed:
        // poseData.push([Finger.getName(fingerIdx), FingerCurl.getName(est.curls[fingerIdx]), ...])
        // So it returns STRINGS.
        // We need to map them back to enums or use the strings if GestureDescription supports it?
        // GestureDescription.addCurl accepts the ENUM value (0, 1, 2).

        // Let's check what we actually get.
        // If we can't get the raw enums from estimate(), we have to map back.

        return poseData;
    };

    const handleCapture = () => {
        if (!poseData || !gestureName.trim()) return;

        const description = new GestureDescription(gestureName);

        // Map string names back to enums
        const curlMap: Record<string, any> = {
            'No Curl': FingerCurl.NoCurl,
            'Half Curl': FingerCurl.HalfCurl,
            'Full Curl': FingerCurl.FullCurl
        };

        const dirMap: Record<string, any> = {
            'Vertical Up': FingerDirection.VerticalUp,
            'Vertical Down': FingerDirection.VerticalDown,
            'Horizontal Left': FingerDirection.HorizontalLeft,
            'Horizontal Right': FingerDirection.HorizontalRight,
            'Diagonal Up Right': FingerDirection.DiagonalUpRight,
            'Diagonal Up Left': FingerDirection.DiagonalUpLeft,
            'Diagonal Down Right': FingerDirection.DiagonalDownRight,
            'Diagonal Down Left': FingerDirection.DiagonalDownLeft
        };

        const fingerMap: Record<string, any> = {
            'Thumb': Finger.Thumb,
            'Index': Finger.Index,
            'Middle': Finger.Middle,
            'Ring': Finger.Ring,
            'Pinky': Finger.Pinky
        };

        // poseData is array of [fingerName, curlName, dirName]
        for (const [fingerName, curlName, dirName] of poseData) {
            const finger = fingerMap[fingerName];
            const curl = curlMap[curlName];
            const direction = dirMap[dirName];

            if (finger !== undefined && curl !== undefined && direction !== undefined) {
                // Add curl rule (high confidence)
                description.addCurl(finger, curl, 1.0); // We can trust this 100% now!

                // Add direction rule (medium confidence)
                description.addDirection(finger, direction, 0.9);
            }
        }

        onSaveGesture(description);
        setCaptured(true);
        setTimeout(() => {
            setCaptured(false);
            setGestureName('');
        }, 2000);
    };

    return (
        <div className="gesture-recorder-overlay">
            <div className="gesture-recorder">
                <div className="recorder-header">
                    <h3>Train New Gesture</h3>
                    <button className="close-btn" onClick={onClose}>×</button>
                </div>

                <div className="recorder-content">
                    <div className="input-group">
                        <label>Gesture Name:</label>
                        <input
                            type="text"
                            value={gestureName}
                            onChange={(e) => setGestureName(e.target.value)}
                            placeholder="e.g., Spiderman"
                        />
                    </div>

                    <div className="pose-preview">
                        <h4>Current Hand Pose (Detector View):</h4>
                        {poseData && poseData.length > 0 ? (
                            <div className="finger-stats">
                                {poseData.map(([finger, curl, dir]: any[]) => (
                                    <div key={finger} className="finger-row">
                                        <span className="finger-name">{finger}:</span>
                                        <span className="finger-curl">{curl}</span>
                                        <span className="finger-dir" style={{ fontSize: '0.8em', color: '#888' }}>({dir})</span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="no-hand">No hand detected</p>
                        )}
                    </div>

                    <button
                        className={`capture-btn ${captured ? 'success' : ''}`}
                        onClick={handleCapture}
                        disabled={!poseData || !gestureName.trim()}
                    >
                        {captured ? 'Saved!' : 'Capture Gesture'}
                    </button>
                </div>
            </div>
        </div>
    );
}
