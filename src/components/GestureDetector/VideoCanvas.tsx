// Video canvas component with webcam feed and overlay

import { StatusBadge } from '../ui/StatusBadge';
import './VideoCanvas.css';

interface VideoCanvasProps {
    videoRef: React.RefObject<HTMLVideoElement>;
    canvasRef: React.RefObject<HTMLCanvasElement>;
    statusMessage: string;
    isActive: boolean;
}

export function VideoCanvas({ videoRef, canvasRef, statusMessage, isActive }: VideoCanvasProps) {
    return (
        <div className="video-container">
            <video ref={videoRef} autoPlay playsInline id="webcam" />
            <canvas ref={canvasRef} id="canvas" />
            <StatusBadge message={statusMessage} active={isActive} />
        </div>
    );
}
