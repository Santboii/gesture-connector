// Type declarations for fingerpose library
declare module 'fingerpose' {
    export class GestureDescription {
        constructor(name: string);
        addCurl(finger: number, curl: number, weight?: number): void;
        addDirection(finger: number, direction: number, weight?: number): void;
    }

    export class GestureEstimator {
        constructor(gestures: GestureDescription[]);
        estimate(landmarks: any[], minConfidence: number): {
            gestures: Array<{ name: string; score: number }>;
        };
    }

    export enum Finger {
        Thumb = 0,
        Index = 1,
        Middle = 2,
        Ring = 3,
        Pinky = 4,
    }

    export enum FingerCurl {
        NoCurl = 0,
        HalfCurl = 1,
        FullCurl = 2,
    }

    export enum FingerDirection {
        VerticalUp = 0,
        VerticalDown = 1,
        HorizontalLeft = 2,
        HorizontalRight = 3,
        DiagonalUpLeft = 4,
        DiagonalUpRight = 5,
        DiagonalDownLeft = 6,
        DiagonalDownRight = 7,
    }
}
