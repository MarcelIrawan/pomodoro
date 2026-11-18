// Install prompt + SW update surface (usePWA hook per ADR-003 layout).

import { signal } from "@preact/signals";
import { useEffect } from "preact/hooks";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const deferredPrompt = signal<BeforeInstallPromptEvent | null>(null);
const swUpdateFound = signal(false);
const installed = signal(false);

export function usePWA() {
  useEffect(() => {
    const onBeforeInstall = (event: Event) => {
      event.preventDefault();
      deferredPrompt.value = event as BeforeInstallPromptEvent;
    };
    const onInstalled = () => {
      installed.value = true;
      deferredPrompt.value = null;
    };
    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const install = async (): Promise<boolean> => {
    const prompt = deferredPrompt.value;
    if (!prompt) return false;
    prompt.prompt();
    const choice = await prompt.userChoice;
    deferredPrompt.value = null;
    return choice.outcome === "accepted";
  };

  return {
    canInstall: deferredPrompt,
    swUpdateFound,
    installed,
    install,
    notifyUpdate: () => {
      swUpdateFound.value = true;
    },
  };
}
