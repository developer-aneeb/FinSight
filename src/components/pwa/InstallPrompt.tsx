"use client";

import { useEffect, useState } from "react";

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handler as EventListener);
    return () => window.removeEventListener('beforeinstallprompt', handler as EventListener);
  }, []);

  const onInstall = async () => {
    if (!deferredPrompt) return;
    try {
      deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      setVisible(false);
      setDeferredPrompt(null);
      // eslint-disable-next-line no-console
      console.log('Install choice', choice);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn('Install prompt failed', err);
    }
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-6 right-4 z-50">
      <div className="flex items-center gap-3 rounded-lg bg-white/95 px-3 py-2 shadow-lg dark:bg-slate-800/95">
        <div className="text-sm text-slate-900 dark:text-slate-100">Install FinSight for quick access</div>
        <button
          onClick={onInstall}
          className="rounded-md bg-sky-600 px-3 py-1 text-sm font-medium text-white hover:bg-sky-700"
        >
          Install
        </button>
        <button
          onClick={() => setVisible(false)}
          className="rounded-md px-2 py-1 text-sm text-slate-600 hover:bg-slate-100"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}
