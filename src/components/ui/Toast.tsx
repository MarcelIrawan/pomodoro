// Lightweight toast system: module-level signal list + <ToastHost/> mounted in App.
import { signal } from '@preact/signals';
import { useEffect, useState } from 'preact/hooks';
import { IconCheck, IconClose, IconSparkles } from './Icons.tsx';
import { cn } from '../../utils/cn.ts';

export interface ToastItem {
  id: number;
  message: string;
  kind: 'success' | 'info' | 'achievement' | 'error';
}

const toasts = signal<ToastItem[]>([]);
let nextId = 1;
const TOAST_MS = 4000;

export function showToast(message: string, kind: ToastItem['kind'] = 'info'): void {
  const id = nextId++;
  toasts.value = [...toasts.value, { id, message, kind }];
  setTimeout(() => {
    toasts.value = toasts.value.filter((t) => t.id !== id);
  }, TOAST_MS);
}

export function ToastHost() {
  const [items, setItems] = useState<ToastItem[]>([]);
  useEffect(() => {
    const off = toasts.subscribe((value) => setItems(value));
    return off;
  }, []);

  return (
    <div class="toast-host" role="status" aria-live="polite" aria-atomic="false">
      {items.map((toast) => (
        <div key={toast.id} class={cn('toast', `toast--${toast.kind}`)}>
          <span class="toast__icon" aria-hidden="true">
            {toast.kind === 'achievement' ? (
              <IconSparkles size={18} />
            ) : toast.kind === 'success' ? (
              <IconCheck size={18} />
            ) : (
              <IconCheck size={18} />
            )}
          </span>
          <span class="toast__message">{toast.message}</span>
        </div>
      ))}
    </div>
  );
}

export function ConfettiBurst({ trigger }: { trigger: number }) {
  const [burstKey, setBurstKey] = useState(0);
  useEffect(() => {
    if (trigger > 0) setBurstKey((k) => k + 1);
  }, [trigger]);

  if (burstKey === 0) return null;
  const particles = Array.from({ length: 26 }, (_, i) => {
    const angle = (i / 26) * Math.PI * 2;
    const distance = 90 + (i % 5) * 28;
    return {
      id: i,
      dx: Math.cos(angle) * distance,
      dy: Math.sin(angle) * distance - 30,
      hue: (i * 47) % 360,
      delay: (i % 7) * 40,
    };
  });
  return (
    <div class="confetti-stage" aria-hidden="true" key={burstKey}>
      {particles.map((p) => (
        <span
          key={p.id}
          class="confetti-particle"
          style={{
            '--dx': `${p.dx.toFixed(1)}px`,
            '--dy': `${p.dy.toFixed(1)}px`,
            '--hue': `${p.hue}`,
            '--delay': `${p.delay}ms`,
          }}
        />
      ))}
    </div>
  );
}

export function ToastClose() {
  return <IconClose size={14} />;
}
