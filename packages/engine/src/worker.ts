import { GestureEngine } from './engine.js';
import type { WorkerInMessage, WorkerOutMessage } from './types.js';

let engine: GestureEngine | null = null;

function emit(message: WorkerOutMessage): void {
  self.postMessage(message);
}

self.onmessage = async (event: MessageEvent<WorkerInMessage>) => {
  const msg = event.data;
  switch (msg.type) {
    case 'start': {
      engine = new GestureEngine(emit);
      try { await engine.start(msg.canvas); }
      catch (error) { emit({ type: 'error', message: error instanceof Error ? error.message : 'Failed to start engine' }); }
      break;
    }
    case 'stop': { engine?.stop(); engine = null; break; }
    case 'set-mode': { engine?.setMode(msg.mode); break; }
    case 'set-mapping': { engine?.setGestureMapping(msg.gesture, msg.action); break; }
    case 'set-sensitivity': { engine?.setSensitivity(msg.gesture, msg.level); break; }
    case 'set-blink-threshold': { engine?.setBlinkThreshold(msg.ms); break; }
    case 'start-calibration': { engine?.startCalibration(msg.screenWidth, msg.screenHeight); break; }
    case 'record-calibration-point': { engine?.recordCalibrationPoint(msg.position); break; }
    case 'finish-calibration': { engine?.finishCalibration(); break; }
    case 'load-calibration': { engine?.loadCalibration(msg.data); break; }
  }
};
