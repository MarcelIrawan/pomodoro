// Timer controls (F1): start/pause/resume, skip, reset — all keyboard reachable.
import { Button } from '../ui/Button.tsx';
import { IconPause, IconPlay, IconReset, IconSkip } from '../ui/Icons.tsx';

export interface ControlsProps {
  isRunning: boolean;
  onToggle: () => void;
  onSkip: () => void;
  onReset: () => void;
}

export function Controls({ isRunning, onToggle, onSkip, onReset }: ControlsProps) {
  return (
    <div class="controls" role="group" aria-label="Timer controls">
      <Button
        variant="ghost"
        size="md"
        onClick={onReset}
        aria-label="Reset timer (R)"
        title="Reset (R)"
      >
        <IconReset size={18} />
        <span>Reset</span>
      </Button>
      <Button
        variant="primary"
        size="lg"
        onClick={onToggle}
        aria-label={isRunning ? 'Pause timer (Space)' : 'Start timer (Space)'}
        title={isRunning ? 'Pause (Space)' : 'Start (Space)'}
      >
        {isRunning ? <IconPause size={22} /> : <IconPlay size={22} />}
        <span>{isRunning ? 'Pause' : 'Start'}</span>
      </Button>
      <Button
        variant="ghost"
        size="md"
        onClick={onSkip}
        aria-label="Skip current phase (S)"
        title="Skip (S)"
      >
        <IconSkip size={18} />
        <span>Skip</span>
      </Button>
    </div>
  );
}
