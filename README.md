# Gesture Detector

A real-time hand gesture and face landmark detection application using MediaPipe.

## Features

- **Hand Gesture Recognition**: Detects hand gestures like "Open_Palm", "Closed_Fist", "Thumb_Up", etc.
- **Face Landmarking**: Detects and draws face mesh landmarks.
- **Dual Mode**: Can track both hands and face simultaneously.
- **Particle Effects**: Interactive particle system that responds to hand movements.

## Setup

1.  Clone the repository.
2.  Serve the files using a local web server.
    ```bash
    python3 -m http.server 8000
    ```
3.  Open `http://localhost:8000` in your browser.

## Technologies

- HTML5 / CSS3
- JavaScript (ES6+)
- [MediaPipe Tasks Vision](https://developers.google.com/mediapipe/solutions/vision)

## Notes

- This project uses local MediaPipe files located in the `vendor` directory to avoid CDN issues.
