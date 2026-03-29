# Experiment AI

A hands-free browser control system powered by real-time face gesture recognition — no hardware required, just your webcam.

## Features

- **Blink to click** — single blink triggers a click; double blink for right-click
- **Head nod to scroll** — nod down to scroll down, nod up to scroll up
- **Head tilt for navigation** — tilt left/right to go back/forward
- **Mouth open/close actions** — configurable per mode
- **Virtual cursor** — on-screen cursor driven by head pose with click animation
- **Calibration wizard** — 4-step setup that maps your personal head range
- **3 gesture modes** — Browsing, Reading, Presentation with different action presets
- **Live dashboard** — real-time blendshape monitor, FPS, confidence, session stats
- **Configurable sensitivity** — per-gesture sensitivity sliders and blink threshold tuning
- **Dark/light mode toggle**
- **Welcome onboarding** — first-time setup flow stored in localStorage

## Architecture

```
experiment-ai/
├── app/                         # React + Vite frontend
│   └── src/
│       ├── App.tsx              # Root component — routing, engine wiring
│       ├── hooks/
│       │   ├── useCamera.ts     # Webcam capture + offscreen canvas
│       │   ├── useGestureEngine.ts  # Web Worker bridge for the engine
│       │   └── useSettings.ts   # Persisted gesture settings
│       └── components/
│           ├── camera/          # CameraFeed — live video preview
│           ├── calibration/     # CalibrationWizard (4-step), CalibrationDot, GesturePractice
│           ├── cursor/          # VirtualCursor — animated head-tracked pointer
│           ├── dashboard/       # Dashboard, ConfidenceMeter, SessionStats
│           ├── layout/          # StatusBar, GestureToast
│           └── settings/        # Settings panel, GestureMapper
│
└── packages/
    └── engine/                  # TypeScript engine package (runs in Web Worker)
        └── src/
            ├── worker.ts        # Worker entry point — message bus
            ├── GestureEngine.ts # Orchestrates all detectors
            ├── FaceDetector.ts  # MediaPipe FaceLandmarker wrapper
            ├── BlinkDetector.ts # Eye aspect ratio + blink timing
            ├── HeadPoseDetector.ts  # Head orientation + scroll/navigation
            ├── MouthDetector.ts # Jaw open/close gestures
            ├── Calibrator.ts    # Range mapping + adaptive learning
            └── presets.ts       # Action presets per mode
```

**Data flow:**
```
Webcam → OffscreenCanvas → Web Worker → MediaPipe FaceLandmarker
  → BlinkDetector + HeadPoseDetector + MouthDetector
  → GestureEngine → postMessage → useGestureEngine hook
  → App.tsx (action dispatch) + VirtualCursor + GestureToast
```

## Gesture Mappings

| Gesture       | Browsing      | Reading       | Presentation  |
|---------------|---------------|---------------|---------------|
| Blink         | Click         | Scroll down   | Next slide    |
| Double blink  | Right-click   | Scroll up     | Prev slide    |
| Nod down      | Scroll down   | Page down     | Scroll down   |
| Nod up        | Scroll up     | Page up       | Scroll up     |
| Tilt left     | Back          | Back          | None          |
| Tilt right    | Forward       | Forward       | None          |
| Mouth open    | None          | None          | Fullscreen    |
| Mouth close   | None          | None          | None          |

All mappings are customizable per mode in the Settings screen.

## Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser. On first launch, the onboarding flow will guide you through calibration.

**Requirements:** A webcam and a browser with WebWorker + OffscreenCanvas support (Chrome 69+, Edge 79+, Firefox 105+).

## Tech Stack

| Layer       | Technology                                      |
|-------------|-------------------------------------------------|
| Frontend    | React 18, Vite, TypeScript                      |
| Animations  | Framer Motion                                   |
| Styling     | Tailwind CSS (dark mode)                        |
| Vision      | MediaPipe FaceLandmarker (WASM, runs off-thread) |
| Concurrency | Web Workers + OffscreenCanvas                   |
| Persistence | localStorage                                    |
| Monorepo    | npm workspaces                                  |

## Phase 2 Roadmap

- Eye-gaze tracking with screen coordinate mapping (replace head-pose cursor)
- Eye dwell click — hold gaze on element to trigger click without blinking
- Custom gesture recorder — define new gestures from any blendshape combination
- Profile sync via cloud storage
- Extension mode — run as a browser extension for system-wide control
- Accessibility audit and WCAG 2.1 AA compliance
