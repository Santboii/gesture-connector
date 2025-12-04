// Import MediaPipe from local vendor directory
import { GestureRecognizer, FaceLandmarker, FilesetResolver, DrawingUtils } from '../public/vendor/vision_bundle.mjs';

// Application State
const state = {
    mode: 'hands', // 'hands', 'face', or 'both'
    gestureRecognizer: null,
    faceLandmarker: null,
    webcamRunning: false,
    lastGesture: null,
    lastGestureTime: 0,
    gestureDebounce: 500, // ms
};

// DOM Elements
const elements = {
    webcam: document.getElementById('webcam'),
    canvas: document.getElementById('canvas'),
    statusOverlay: document.getElementById('statusOverlay'),
    statusBadge: document.querySelector('.status-badge'),
    gestureDisplay: document.getElementById('gestureDisplay'),
    actionLog: document.getElementById('actionLog'),
    handModeBtn: document.getElementById('handModeBtn'),
    faceModeBtn: document.getElementById('faceModeBtn'),
    bothModeBtn: document.getElementById('bothModeBtn'),
    particles: document.getElementById('particles'),
};

let canvasCtx;
let drawingUtils;

// Initialize the application
async function init() {
    try {
        updateStatus('Loading MediaPipe models...');

        // Load MediaPipe vision tasks
        const vision = await FilesetResolver.forVisionTasks(
            "/vendor/wasm"
        );

        // Initialize Gesture Recognizer
        state.gestureRecognizer = await GestureRecognizer.createFromOptions(vision, {
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
        state.faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
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

        updateStatus('Models loaded! Starting camera...');
        await enableWebcam();

        logAction('Application initialized successfully', 'success');
    } catch (error) {
        console.error(error);
        updateStatus('Error loading models');
    }
}

// Enable webcam
async function enableWebcam() {
    try {
        const constraints = {
            video: {
                width: { ideal: 1280 },
                height: { ideal: 720 },
                facingMode: 'user'
            }
        };

        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        elements.webcam.srcObject = stream;

        elements.webcam.addEventListener('loadeddata', () => {
            state.webcamRunning = true;

            // Setup canvas
            elements.canvas.width = elements.webcam.videoWidth;
            elements.canvas.height = elements.webcam.videoHeight;
            canvasCtx = elements.canvas.getContext('2d');
            drawingUtils = new DrawingUtils(canvasCtx);

            updateStatus('Camera active', true);
            createBackgroundParticles();
            predictWebcam();
        });
    } catch (error) {
        console.error('Camera error:', error);
        updateStatus('Camera access denied');
        logAction('Please allow camera access to use this app', 'error');
    }
}

// Main prediction loop
let lastVideoTime = -1;
async function predictWebcam() {
    if (!state.webcamRunning) return;

    const nowInMs = Date.now();

    // Only process if we have a new frame
    if (elements.webcam.currentTime !== lastVideoTime) {
        lastVideoTime = elements.webcam.currentTime;

        // Clear canvas
        canvasCtx.clearRect(0, 0, elements.canvas.width, elements.canvas.height);

        // Process based on mode
        if (state.mode === 'hands' || state.mode === 'both') {
            await processHandGestures(nowInMs);
        }

        if (state.mode === 'face' || state.mode === 'both') {
            await processFaceDetection(nowInMs);
        }
    }

    // Continue loop
    requestAnimationFrame(predictWebcam);
}

// Process hand gestures
async function processHandGestures(nowInMs) {
    if (!state.gestureRecognizer) return;

    try {
        const results = state.gestureRecognizer.recognizeForVideo(elements.webcam, nowInMs);

        if (results.landmarks && results.landmarks.length > 0) {
            // Draw hand landmarks
            for (let i = 0; i < results.landmarks.length; i++) {
                const landmarks = results.landmarks[i];

                // Draw connections
                drawingUtils.drawConnectors(
                    landmarks,
                    GestureRecognizer.HAND_CONNECTIONS,
                    { color: '#00d4ff', lineWidth: 3 }
                );

                // Draw landmarks
                drawingUtils.drawLandmarks(
                    landmarks,
                    { color: '#b537ff', lineWidth: 1, radius: 4 }
                );
            }
        }

        // Handle detected gestures
        if (results.gestures && results.gestures.length > 0) {
            const gesture = results.gestures[0][0];
            const gestureName = gesture.categoryName;
            const confidence = (gesture.score * 100).toFixed(0);

            // Debounce gesture detection
            if (gestureName !== state.lastGesture || nowInMs - state.lastGestureTime > state.gestureDebounce) {
                state.lastGesture = gestureName;
                state.lastGestureTime = nowInMs;

                displayGesture(gestureName, confidence);
                handleGestureAction(gestureName);
            }
        } else if (results.landmarks && results.landmarks.length > 0) {
            // Check for custom gestures based on hand landmarks
            const customGesture = detectCustomGestures(results.landmarks[0]);
            if (customGesture) {
                if (customGesture !== state.lastGesture || nowInMs - state.lastGestureTime > state.gestureDebounce) {
                    state.lastGesture = customGesture;
                    state.lastGestureTime = nowInMs;

                    displayGesture(customGesture, '95');
                    handleGestureAction(customGesture);
                }
            } else {
                // No gesture detected
                if (state.mode === 'hands' && state.lastGesture) {
                    clearGestureDisplay();
                }
            }
        } else {
            // No gesture detected
            if (state.mode === 'hands' && state.lastGesture) {
                clearGestureDisplay();
            }
        }
    } catch (error) {
        console.error('Hand gesture processing error:', error);
    }
}

// Process face detection
async function processFaceDetection(nowInMs) {
    if (!state.faceLandmarker) return;

    try {
        const results = state.faceLandmarker.detectForVideo(elements.webcam, nowInMs);

        if (results.faceLandmarks && results.faceLandmarks.length > 0) {
            const faceLandmarks = results.faceLandmarks[0];

            // Draw face mesh
            drawingUtils.drawConnectors(
                faceLandmarks,
                FaceLandmarker.FACE_LANDMARKS_TESSELATION,
                { color: '#00d4ff40', lineWidth: 1 }
            );

            // Draw key facial features
            drawingUtils.drawConnectors(
                faceLandmarks,
                FaceLandmarker.FACE_LANDMARKS_RIGHT_EYE,
                { color: '#b537ff', lineWidth: 2 }
            );
            drawingUtils.drawConnectors(
                faceLandmarks,
                FaceLandmarker.FACE_LANDMARKS_LEFT_EYE,
                { color: '#b537ff', lineWidth: 2 }
            );
            drawingUtils.drawConnectors(
                faceLandmarks,
                FaceLandmarker.FACE_LANDMARKS_LIPS,
                { color: '#ff006e', lineWidth: 2 }
            );

            // Detect facial expressions using blendshapes
            if (results.faceBlendshapes && results.faceBlendshapes.length > 0) {
                detectFacialExpressions(results.faceBlendshapes[0]);
            }
        }
    } catch (error) {
        console.error('Face detection processing error:', error);
    }
}

// Detect custom gestures based on hand landmarks
function detectCustomGestures(landmarks) {
    const DEBUG = true; // Set to true to enable console logging

    // Helper function to calculate distance between two points
    const distance = (p1, p2) => {
        const dx = p1.x - p2.x;
        const dy = p1.y - p2.y;
        const dz = (p1.z || 0) - (p2.z || 0);
        return Math.sqrt(dx * dx + dy * dy + dz * dz);
    };

    // Helper function to calculate angle at a joint (in degrees)
    const calculateAngle = (p1, p2, p3) => {
        const v1 = { x: p1.x - p2.x, y: p1.y - p2.y, z: (p1.z || 0) - (p2.z || 0) };
        const v2 = { x: p3.x - p2.x, y: p3.y - p2.y, z: (p3.z || 0) - (p2.z || 0) };

        const dot = v1.x * v2.x + v1.y * v2.y + v1.z * v2.z;
        const mag1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y + v1.z * v1.z);
        const mag2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y + v2.z * v2.z);

        const cosAngle = dot / (mag1 * mag2);
        return Math.acos(Math.max(-1, Math.min(1, cosAngle))) * (180 / Math.PI);
    };

    // Improved finger extension detection using both distance and angle
    const isFingerExtended = (tipIdx, pipIdx, mcpIdx, wristIdx = 0) => {
        // Method 1: Distance-based (original)
        const tipToWrist = distance(landmarks[tipIdx], landmarks[wristIdx]);
        const pipToWrist = distance(landmarks[pipIdx], landmarks[wristIdx]);
        const mcpToWrist = distance(landmarks[mcpIdx], landmarks[wristIdx]);
        const distanceExtended = tipToWrist > pipToWrist && pipToWrist > mcpToWrist * 0.85;

        // Method 2: Angle-based (more reliable for different orientations)
        const angle = calculateAngle(landmarks[tipIdx], landmarks[pipIdx], landmarks[mcpIdx]);
        const angleExtended = angle > 140; // Finger is straight if angle > 140 degrees

        // Finger is extended if either method confirms it
        return distanceExtended || angleExtended;
    };

    // Landmark indices
    const WRIST = 0;
    const THUMB_TIP = 4, THUMB_IP = 3, THUMB_MCP = 2, THUMB_CMC = 1;
    const INDEX_TIP = 8, INDEX_PIP = 6, INDEX_MCP = 5;
    const MIDDLE_TIP = 12, MIDDLE_PIP = 10, MIDDLE_MCP = 9;
    const RING_TIP = 16, RING_PIP = 14, RING_MCP = 13;
    const PINKY_TIP = 20, PINKY_PIP = 18, PINKY_MCP = 17;

    // Configurable thresholds
    const OK_SIGN_THRESHOLD = 0.10; // Increased from 0.08 for more lenient detection
    const THUMB_EXTENSION_THRESHOLD = 1.2; // Decreased from 1.3 for easier detection

    // OK Sign: Thumb tip touching index tip, other fingers extended
    const thumbIndexDist = distance(landmarks[THUMB_TIP], landmarks[INDEX_TIP]);
    const middleExtended = isFingerExtended(MIDDLE_TIP, MIDDLE_PIP, MIDDLE_MCP);
    const ringExtended = isFingerExtended(RING_TIP, RING_PIP, RING_MCP);
    const pinkyExtended = isFingerExtended(PINKY_TIP, PINKY_PIP, PINKY_MCP);

    if (DEBUG) {
        console.log('OK Sign Check:', {
            thumbIndexDist: thumbIndexDist.toFixed(3),
            threshold: OK_SIGN_THRESHOLD,
            middleExtended,
            ringExtended,
            pinkyExtended
        });
    }

    if (thumbIndexDist < OK_SIGN_THRESHOLD && middleExtended && ringExtended && pinkyExtended) {
        if (DEBUG) console.log('✅ OK Sign detected!');
        return 'OK_Sign';
    }

    // Rock On: Index and pinky extended, middle and ring folded
    const indexExtended = isFingerExtended(INDEX_TIP, INDEX_PIP, INDEX_MCP);
    const middleFolded = !isFingerExtended(MIDDLE_TIP, MIDDLE_PIP, MIDDLE_MCP);
    const ringFolded = !isFingerExtended(RING_TIP, RING_PIP, RING_MCP);
    const pinkyExt = isFingerExtended(PINKY_TIP, PINKY_PIP, PINKY_MCP);

    if (DEBUG) {
        console.log('Rock On Check:', {
            indexExtended,
            middleFolded,
            ringFolded,
            pinkyExtended: pinkyExt
        });
    }

    if (indexExtended && middleFolded && ringFolded && pinkyExt) {
        if (DEBUG) console.log('✅ Rock On detected!');
        return 'Rock_On';
    }

    // Call Me (Shaka): Thumb and pinky extended, other fingers folded
    const thumbToWrist = distance(landmarks[THUMB_TIP], landmarks[WRIST]);
    const thumbCmcToWrist = distance(landmarks[THUMB_CMC], landmarks[WRIST]);
    const thumbExtended = thumbToWrist > thumbCmcToWrist * THUMB_EXTENSION_THRESHOLD;

    const indexFolded = !isFingerExtended(INDEX_TIP, INDEX_PIP, INDEX_MCP);
    const middleFold = !isFingerExtended(MIDDLE_TIP, MIDDLE_PIP, MIDDLE_MCP);
    const ringFold = !isFingerExtended(RING_TIP, RING_PIP, RING_MCP);

    if (DEBUG) {
        console.log('Call Me Check:', {
            thumbToWrist: thumbToWrist.toFixed(3),
            thumbCmcToWrist: thumbCmcToWrist.toFixed(3),
            ratio: (thumbToWrist / thumbCmcToWrist).toFixed(2),
            threshold: THUMB_EXTENSION_THRESHOLD,
            thumbExtended,
            indexFolded,
            middleFolded: middleFold,
            ringFolded: ringFold,
            pinkyExtended: pinkyExt
        });
    }

    if (thumbExtended && indexFolded && middleFold && ringFold && pinkyExt) {
        if (DEBUG) console.log('✅ Call Me detected!');
        return 'Call_Me';
    }

    return null;
}

// Detect facial expressions from blendshapes
function detectFacialExpressions(blendshapes) {
    const categories = blendshapes.categories;

    // Find smile
    const smileLeft = categories.find(c => c.categoryName === 'mouthSmileLeft')?.score || 0;
    const smileRight = categories.find(c => c.categoryName === 'mouthSmileRight')?.score || 0;
    const smile = (smileLeft + smileRight) / 2;

    // Find mouth open
    const mouthOpen = categories.find(c => c.categoryName === 'jawOpen')?.score || 0;

    // Find eyebrow raise
    const browInnerUp = categories.find(c => c.categoryName === 'browInnerUp')?.score || 0;

    // Trigger actions based on expressions
    if (smile > 0.6) {
        displayGesture('😊 Smile', (smile * 100).toFixed(0));
        if (Date.now() - state.lastGestureTime > state.gestureDebounce) {
            state.lastGestureTime = Date.now();
            handleGestureAction('Smile');
        }
    } else if (mouthOpen > 0.5) {
        displayGesture('😮 Mouth Open', (mouthOpen * 100).toFixed(0));
        if (Date.now() - state.lastGestureTime > state.gestureDebounce) {
            state.lastGestureTime = Date.now();
            handleGestureAction('MouthOpen');
        }
    } else if (browInnerUp > 0.5) {
        displayGesture('🤨 Eyebrow Raise', (browInnerUp * 100).toFixed(0));
        if (Date.now() - state.lastGestureTime > state.gestureDebounce) {
            state.lastGestureTime = Date.now();
            handleGestureAction('EyebrowRaise');
        }
    }
}

// Display detected gesture
function displayGesture(gestureName, confidence) {
    const emoji = getGestureEmoji(gestureName);
    elements.gestureDisplay.innerHTML = `
        <div class="detected-gesture">
            ${emoji} ${gestureName} <span style="opacity: 0.7">(${confidence}%)</span>
        </div>
    `;
}

// Clear gesture display
function clearGestureDisplay() {
    state.lastGesture = null;
    elements.gestureDisplay.innerHTML = '<div class="no-gesture">No gestures detected</div>';
}

// Get emoji for gesture
function getGestureEmoji(gesture) {
    const emojiMap = {
        'Thumb_Up': '👍',
        'Thumb_Down': '👎',
        'Victory': '✌️',
        'Open_Palm': '✋',
        'Closed_Fist': '✊',
        'Pointing_Up': '☝️',
        'ILoveYou': '🤟',
        'OK_Sign': '👌',
        'Rock_On': '🤘',
        'Call_Me': '🤙',
        'Smile': '😊',
        'MouthOpen': '😮',
        'EyebrowRaise': '🤨'
    };
    return emojiMap[gesture] || '👋';
}

// Handle gesture actions
function handleGestureAction(gesture) {
    const actions = {
        'Thumb_Up': () => {
            logAction('👍 Thumbs Up detected - Success!', 'success');
            createParticleEffect('#00ff88');
        },
        'Thumb_Down': () => {
            logAction('👎 Thumbs Down detected', 'warning');
            createParticleEffect('#ff4757');
        },
        'Victory': () => {
            logAction('✌️ Victory detected - Celebration!', 'success');
            createParticleEffect('#ffd700');
            flashScreen('#ffd70030');
        },
        'Open_Palm': () => {
            logAction('✋ Open Palm detected - Pause/Reset', 'success');
            createParticleEffect('#00d4ff');
        },
        'Closed_Fist': () => {
            logAction('✊ Closed Fist detected - Activate!', 'success');
            createParticleEffect('#b537ff');
            flashScreen('#b537ff30');
        },
        'Pointing_Up': () => {
            logAction('☝️ Pointing Up detected - Navigate', 'success');
            createParticleEffect('#00d4ff');
        },
        'ILoveYou': () => {
            logAction('🤟 ILoveYou detected - Special effect!', 'success');
            createParticleEffect('#ff006e');
            flashScreen('#ff006e30');
        },
        'OK_Sign': () => {
            logAction('👌 OK Sign detected - Perfect!', 'success');
            createParticleEffect('#00ff88');
            flashScreen('#00ff8830');
        },
        'Rock_On': () => {
            logAction('🤘 Rock On detected - Awesome!', 'success');
            createParticleEffect('#ff006e');
            flashScreen('#ff006e30');
        },
        'Call_Me': () => {
            logAction('🤙 Call Me detected - Hang loose!', 'success');
            createParticleEffect('#ffd700');
        },
        'Smile': () => {
            logAction('😊 Smile detected - Happy vibes!', 'success');
            createParticleEffect('#ffd700');
        },
        'MouthOpen': () => {
            logAction('😮 Mouth Open detected - Alert!', 'warning');
            createParticleEffect('#ff4757');
        },
        'EyebrowRaise': () => {
            logAction('🤨 Eyebrow Raise detected - Curious?', 'success');
            createParticleEffect('#00d4ff');
        }
    };

    const action = actions[gesture];
    if (action) action();
}

// Visual Effects
function createParticleEffect(color) {
    const container = elements.canvas.parentElement;
    const centerX = container.offsetWidth / 2;
    const centerY = container.offsetHeight / 2;

    for (let i = 0; i < 20; i++) {
        const particle = document.createElement('div');
        particle.className = 'effect-particle';
        particle.style.cssText = `
            left: ${centerX}px;
            top: ${centerY}px;
            width: ${Math.random() * 10 + 5}px;
            height: ${Math.random() * 10 + 5}px;
            background: ${color};
            --tx: ${(Math.random() - 0.5) * 200}px;
            --ty: ${(Math.random() - 0.5) * 200}px;
        `;
        container.appendChild(particle);

        setTimeout(() => particle.remove(), 1000);
    }
}

function flashScreen(color) {
    const flash = document.createElement('div');
    flash.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: ${color};
        pointer-events: none;
        z-index: 9999;
        animation: flashEffect 0.5s ease-out;
    `;
    document.body.appendChild(flash);

    const style = document.createElement('style');
    style.textContent = `
        @keyframes flashEffect {
            0% { opacity: 1; }
            100% { opacity: 0; }
        }
    `;
    document.head.appendChild(style);

    setTimeout(() => {
        flash.remove();
        style.remove();
    }, 500);
}

function createBackgroundParticles() {
    for (let i = 0; i < 30; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.cssText = `
            left: ${Math.random() * 100}%;
            top: ${Math.random() * 100}%;
            animation-delay: ${Math.random() * 20}s;
            animation-duration: ${15 + Math.random() * 10}s;
        `;
        elements.particles.appendChild(particle);
    }
}

// UI Functions
function updateStatus(message, active = false) {
    elements.statusBadge.textContent = message;
    if (active) {
        elements.statusBadge.classList.add('active');
    } else {
        elements.statusBadge.classList.remove('active');
    }
}

function logAction(message, type = 'success') {
    const logItem = document.createElement('div');
    logItem.className = `log-item ${type}`;
    logItem.textContent = `${new Date().toLocaleTimeString()}: ${message}`;

    elements.actionLog.insertBefore(logItem, elements.actionLog.firstChild);

    // Keep only last 20 items
    while (elements.actionLog.children.length > 20) {
        elements.actionLog.removeChild(elements.actionLog.lastChild);
    }
}

// Mode switching
function setMode(mode) {
    state.mode = mode;

    // Update button states
    document.querySelectorAll('.mode-btn').forEach(btn => {
        btn.classList.remove('active');
    });

    const activeBtn = document.querySelector(`[data-mode="${mode}"]`);
    if (activeBtn) activeBtn.classList.add('active');

    clearGestureDisplay();
    logAction(`Switched to ${mode} mode`, 'success');
}

// Event Listeners
elements.handModeBtn.addEventListener('click', () => setMode('hands'));
elements.faceModeBtn.addEventListener('click', () => setMode('face'));
elements.bothModeBtn.addEventListener('click', () => setMode('both'));

// Start the application
init();
