import { Finger, FingerCurl, FingerDirection } from 'fingerpose';

// MediaPipe Hand Landmark Indices
// 0: Wrist
// 1-4: Thumb
// 5-8: Index
// 9-12: Middle
// 13-16: Ring
// 17-20: Pinky

export interface HandPose {
    curls: Record<Finger, FingerCurl>;
    directions: Record<Finger, FingerDirection>;
}

export function estimateHandPose(landmarks: any[]): HandPose {
    const curls: Record<Finger, FingerCurl> = {
        [Finger.Thumb]: FingerCurl.NoCurl,
        [Finger.Index]: FingerCurl.NoCurl,
        [Finger.Middle]: FingerCurl.NoCurl,
        [Finger.Ring]: FingerCurl.NoCurl,
        [Finger.Pinky]: FingerCurl.NoCurl,
    };

    const directions: Record<Finger, FingerDirection> = {
        [Finger.Thumb]: FingerDirection.VerticalUp,
        [Finger.Index]: FingerDirection.VerticalUp,
        [Finger.Middle]: FingerDirection.VerticalUp,
        [Finger.Ring]: FingerDirection.VerticalUp,
        [Finger.Pinky]: FingerDirection.VerticalUp,
    };

    // 1. Calculate Curls
    // We use the exact logic from FingerPoseEstimator.js to ensure consistency

    // Thresholds from FingerPoseEstimator.js defaults
    const NO_CURL_START_LIMIT = 130.0;
    const HALF_CURL_START_LIMIT = 60.0;

    for (const finger of [Finger.Thumb, Finger.Index, Finger.Middle, Finger.Ring, Finger.Pinky]) {
        // Determine points based on FingerPose logic
        // Thumb: 1 (CMC), 3 (IP), 4 (Tip)
        // Others: 0 (Wrist), PIP, Tip

        let p1_idx, p2_idx, p3_idx;

        if (finger === Finger.Thumb) {
            p1_idx = 1; // CMC
            p2_idx = 3; // IP
            p3_idx = 4; // Tip
        } else {
            p1_idx = 0; // Wrist

            // Get PIP and Tip indices
            switch (finger) {
                case Finger.Index: p2_idx = 6; p3_idx = 8; break;
                case Finger.Middle: p2_idx = 10; p3_idx = 12; break;
                case Finger.Ring: p2_idx = 14; p3_idx = 16; break;
                case Finger.Pinky: p2_idx = 18; p3_idx = 20; break;
                default: p2_idx = 0; p3_idx = 0;
            }
        }

        const p_start = landmarks[p1_idx];
        const p_mid = landmarks[p2_idx];
        const p_end = landmarks[p3_idx];

        // Calculate distances (using 3D if available, or 2D)
        // MediaPipe landmarks have x, y, z (normalized)
        // We'll use 3D distance for better accuracy
        const dist3D = (p1: any, p2: any) => Math.sqrt(
            Math.pow(p1.x - p2.x, 2) +
            Math.pow(p1.y - p2.y, 2) +
            Math.pow((p1.z || 0) - (p2.z || 0), 2)
        );

        const start_mid_dist = dist3D(p_start, p_mid);
        const mid_end_dist = dist3D(p_mid, p_end);
        const start_end_dist = dist3D(p_start, p_end);

        // Cosine rule: c^2 = a^2 + b^2 - 2ab cos(C)
        // cos(C) = (a^2 + b^2 - c^2) / 2ab
        // Here 'C' is the angle at 'mid' (PIP).
        // Wait, Fingerpose logic was:
        // cos_in = (mid_end^2 + start_mid^2 - start_end^2) / (2 * mid_end * start_mid)
        // This calculates the angle at 'mid' inside the triangle.

        let cos_in = (
            mid_end_dist * mid_end_dist +
            start_mid_dist * start_mid_dist -
            start_end_dist * start_end_dist
        ) / (2 * mid_end_dist * start_mid_dist);

        if (cos_in > 1.0) cos_in = 1.0;
        if (cos_in < -1.0) cos_in = -1.0;

        let angleOfCurve = Math.acos(cos_in);
        angleOfCurve = (57.2958 * angleOfCurve); // Convert to degrees

        // Assign curl based on angle
        if (angleOfCurve > NO_CURL_START_LIMIT) {
            curls[finger as Finger] = FingerCurl.NoCurl;
        } else if (angleOfCurve > HALF_CURL_START_LIMIT) {
            curls[finger as Finger] = FingerCurl.HalfCurl;
        } else {
            curls[finger as Finger] = FingerCurl.FullCurl;
        }
    }

    // 2. Calculate Directions
    // Fingerpose uses different logic for direction too?
    // It uses slopes and voting.
    // But my simplified direction logic seemed to match the "HorizontalLeft = Left" finding.
    // Let's stick with the current direction logic as it was verified to be correct (Left=Left).
    // However, I should ensure I use the same points for direction as before (MCP to Tip).
    // Fingerpose uses:
    // startPoint (Wrist/CMC), midPoint (PIP/IP), endPoint (Tip).
    // It calculates slopes for start-mid, mid-end, start-end.
    // And votes.
    // My logic uses MCP to Tip. This is a decent approximation.
    // Given the user's issue was likely curl (Rock On has extended fingers), I'll focus on Curl first.
    // If direction is still an issue, I'll rewrite that too.

    // Re-verify direction points:
    // My code uses:
    // Thumb: 2 (MCP) -> 4 (Tip)
    // Others: MCP -> Tip
    // This is robust enough for basic directions.

    const fingerJoints = {
        [Finger.Index]: [8, 6, 5],
        [Finger.Middle]: [12, 10, 9],
        [Finger.Ring]: [16, 14, 13],
        [Finger.Pinky]: [20, 18, 17],
        [Finger.Thumb]: [4, 3, 2]
    };

    // 2. Calculate Directions
    // ... (keep existing direction logic, it's correct now)
    for (const finger of [Finger.Thumb, Finger.Index, Finger.Middle, Finger.Ring, Finger.Pinky]) {
        let startIdx, endIdx;
        if (finger === Finger.Thumb) {
            startIdx = 2; // MCP
            endIdx = 4;   // Tip
        } else {
            // @ts-ignore
            startIdx = fingerJoints[finger][2]; // MCP
            // @ts-ignore
            endIdx = fingerJoints[finger][0];   // Tip
        }

        const start = landmarks[startIdx];
        const end = landmarks[endIdx];

        // Calculate slope
        const dx = end.x - start.x;
        const dy = end.y - start.y;

        const angle = Math.atan2(dy, dx) * (180 / Math.PI);

        if (angle > -45 && angle <= 45) {
            directions[finger as Finger] = FingerDirection.HorizontalRight;
        } else if (angle > 45 && angle <= 135) {
            directions[finger as Finger] = FingerDirection.VerticalDown;
        } else if (angle > 135 || angle <= -135) {
            directions[finger as Finger] = FingerDirection.HorizontalLeft;
        } else {
            directions[finger as Finger] = FingerDirection.VerticalUp;
        }
    }

    return { curls, directions };
}
