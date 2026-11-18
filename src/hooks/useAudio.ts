// Audio engine (ADR-007): tick via Web Audio oscillator, completion sounds via
// HTMLAudioElement files bundled under /sounds/<pack>/, with a synthesized
// Web Audio fallback so the app works even before sound assets exist.

import type { Phase, SoundPackName } from "../types/index.ts";
import { useSettings } from "./useSettings.ts";

const TICK_FREQ = 880;
const WAV_FILE: Record<Phase, string> = {
  work: "workEnd.wav",
  shortBreak: "breakEnd.wav",
  longBreak: "breakEnd.wav",
};

let audioContext: AudioContext | null = null;

export function ensureAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!audioContext) {
    const Ctor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    audioContext = new Ctor();
  }
  if (audioContext.state === "suspended") {
    void audioContext.resume();
  }
  return audioContext;
}

function beep(
  ctx: AudioContext,
  frequency: number,
  seconds: number,
  volume: number,
  type: OscillatorType = "sine",
): void {
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();
  oscillator.type = type;
  oscillator.frequency.value = frequency;
  gain.gain.setValueAtTime(0, ctx.currentTime);
  gain.gain.linearRampToValueAtTime(volume, ctx.currentTime + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + seconds);
  oscillator.connect(gain).connect(ctx.destination);
  oscillator.start();
  oscillator.stop(ctx.currentTime + seconds + 0.02);
}

function synthCompletion(ctx: AudioContext, phase: Phase, volume: number): void {
  if (phase === "work") {
    // Warm major chord: C4 E4 G4 (A4 on top)
    beep(ctx, 261.63, 1.2, volume * 0.5);
    beep(ctx, 329.63, 1.2, volume * 0.45);
    beep(ctx, 392.0, 1.2, volume * 0.4);
    beep(ctx, 523.25, 1.0, volume * 0.3);
  } else {
    // Softer variant for breaks
    beep(ctx, 392.0, 0.9, volume * 0.4);
    beep(ctx, 523.25, 0.9, volume * 0.35);
  }
}

export function playCompletionSound(phase: Phase): void {
  const { settings } = useSettings();
  const volume = Math.min(1, Math.max(0, settings.value.soundVolume));
  const pack = settings.value.soundPack as SoundPackName;
  const ctx = ensureAudioContext();

  const audio = new Audio(`/sounds/${pack}/${WAV_FILE[phase]}`);
  audio.volume = volume;
  const fallbackPlay = () => {
    if (ctx) synthCompletion(ctx, phase, volume);
  };
  audio.addEventListener("error", fallbackPlay, { once: true });
  audio.play().catch(fallbackPlay);
}

export function playTick(tickCount = 1): void {
  const { settings } = useSettings();
  if (!settings.value.tickSound || settings.value.reducedMotion) return;
  const ctx = ensureAudioContext();
  if (!ctx) return;
  const volume = Math.min(1, Math.max(0, settings.value.soundVolume)) * 0.4;
  for (let i = 0; i < tickCount; i += 1) {
    beep(ctx, TICK_FREQ, 0.03, volume, "square");
  }
}

/** Silent no-op when ticks are disabled — called once per second from the timer. */
export function maybeTick(secondRemaining: number): void {
  const { settings } = useSettings();
  if (!settings.value.tickSound || settings.value.reducedMotion) return;
  if (secondRemaining <= 0) return;
  playTick(1);
}

/** Element preloading on pack change so first completion is not delayed. */
const preloaded = new Set<string>();
export function preloadSoundPack(pack: SoundPackName): void {
  for (const file of Object.values(WAV_FILE)) {
    const path = `/sounds/${pack}/${file}`;
    if (preloaded.has(path)) continue;
    const audio = new Audio(path);
    audio.preload = "auto";
    preloaded.add(path);
  }
}
