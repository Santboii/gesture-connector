// Fingerpose gesture definitions for custom hand gestures

import {
    GestureDescription,
    Finger,
    FingerCurl,
    FingerDirection
} from 'fingerpose';

// OK Sign: Thumb and index touching, other fingers extended
export const okSignGesture = new GestureDescription('OK_Sign');

// Thumb should be slightly curled (touching index)
okSignGesture.addCurl(Finger.Thumb, FingerCurl.HalfCurl, 1.0);
okSignGesture.addCurl(Finger.Thumb, FingerCurl.NoCurl, 0.5);

// Index should be slightly curled (touching thumb)
okSignGesture.addCurl(Finger.Index, FingerCurl.HalfCurl, 1.0);
okSignGesture.addCurl(Finger.Index, FingerCurl.NoCurl, 0.5);

// Other fingers should be extended
okSignGesture.addCurl(Finger.Middle, FingerCurl.NoCurl, 1.0);
okSignGesture.addCurl(Finger.Ring, FingerCurl.NoCurl, 1.0);
okSignGesture.addCurl(Finger.Pinky, FingerCurl.NoCurl, 1.0);

// Rock On: Index and pinky extended, middle and ring folded
export const rockOnGesture = new GestureDescription('Rock_On');

// Index and pinky extended
rockOnGesture.addCurl(Finger.Index, FingerCurl.NoCurl, 1.0);
rockOnGesture.addCurl(Finger.Pinky, FingerCurl.NoCurl, 1.0);

// Middle and ring folded
rockOnGesture.addCurl(Finger.Middle, FingerCurl.FullCurl, 1.0);
rockOnGesture.addCurl(Finger.Ring, FingerCurl.FullCurl, 1.0);

// Thumb can be in any position
rockOnGesture.addCurl(Finger.Thumb, FingerCurl.HalfCurl, 0.5);
rockOnGesture.addCurl(Finger.Thumb, FingerCurl.NoCurl, 0.5);

// Call Me (Shaka): Thumb and pinky extended, others folded
export const callMeGesture = new GestureDescription('Call_Me');

// Thumb and pinky extended
callMeGesture.addCurl(Finger.Thumb, FingerCurl.NoCurl, 1.0);
callMeGesture.addCurl(Finger.Pinky, FingerCurl.NoCurl, 1.0);

// Other fingers folded
callMeGesture.addCurl(Finger.Index, FingerCurl.FullCurl, 1.0);
callMeGesture.addCurl(Finger.Middle, FingerCurl.FullCurl, 1.0);
callMeGesture.addCurl(Finger.Ring, FingerCurl.FullCurl, 1.0);

// Direction: Thumb should point outward
callMeGesture.addDirection(Finger.Thumb, FingerDirection.HorizontalLeft, 0.7);
callMeGesture.addDirection(Finger.Thumb, FingerDirection.HorizontalRight, 0.7);

// Peace/Victory gesture (built-in to MediaPipe, but we can define it for Fingerpose too)
export const victoryGesture = new GestureDescription('Victory');

// Index and middle extended
victoryGesture.addCurl(Finger.Index, FingerCurl.NoCurl, 1.0);
victoryGesture.addCurl(Finger.Middle, FingerCurl.NoCurl, 1.0);

// Other fingers folded
victoryGesture.addCurl(Finger.Ring, FingerCurl.FullCurl, 1.0);
victoryGesture.addCurl(Finger.Pinky, FingerCurl.FullCurl, 1.0);
victoryGesture.addCurl(Finger.Thumb, FingerCurl.HalfCurl, 0.9);

// Thumbs Up gesture
export const thumbsUpGesture = new GestureDescription('Thumb_Up');

// Thumb extended and pointing up
thumbsUpGesture.addCurl(Finger.Thumb, FingerCurl.NoCurl, 1.0);
thumbsUpGesture.addDirection(Finger.Thumb, FingerDirection.VerticalUp, 1.0);
thumbsUpGesture.addDirection(Finger.Thumb, FingerDirection.DiagonalUpLeft, 0.9);
thumbsUpGesture.addDirection(Finger.Thumb, FingerDirection.DiagonalUpRight, 0.9);

// All other fingers curled
thumbsUpGesture.addCurl(Finger.Index, FingerCurl.FullCurl, 1.0);
thumbsUpGesture.addCurl(Finger.Middle, FingerCurl.FullCurl, 1.0);
thumbsUpGesture.addCurl(Finger.Ring, FingerCurl.FullCurl, 1.0);
thumbsUpGesture.addCurl(Finger.Pinky, FingerCurl.FullCurl, 1.0);

// Export all gestures as an array
export const customGestures = [
    okSignGesture,
    rockOnGesture,
    callMeGesture,
    victoryGesture,
    thumbsUpGesture,
];
