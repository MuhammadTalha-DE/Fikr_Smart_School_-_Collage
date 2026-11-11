import { useEffect, useState } from 'react';
import { FiDownload, FiX, FiShare } from 'react-icons/fi';

const InstallAppPrompt = () => {
  const [installPrompt, setInstallPrompt] = useState(null);
  const [installed, setInstalled] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);

  useEffect(() => {
    const isInstalled = window.matchMedia('(display-mode: standalone)').matches
      || window.navigator.standalone === true;
    setInstalled(isInstalled);

    const handleBeforeInstall = (event) => {
      event.preventDefault();
      setInstallPrompt(event);
    };
    const handleInstalled = () => {
      setInstalled(true);
      setInstallPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleInstalled);
    };
  }, []);

  const install = async () => {
    if (!installPrompt) return;
    await installPrompt.prompt();
    const choice = await installPrompt.userChoice;
    if (choice.outcome === 'accepted') setInstalled(true);
    setInstallPrompt(null);
  };

  const isSecure = window.isSecureContext;
  const isAppleMobile = /iphone|ipad|ipod/i.test(window.navigator.userAgent);
  const canInstallNow = Boolean(installPrompt && isSecure);
  const title = canInstallNow ? 'Install Fikr School' : isSecure ? 'Add Fikr School to your device' : 'Install Fikr School securely';

  if (installed || dismissed) return null;

  return (
    <aside className="fixed bottom-4 right-4 z-[100] flex max-w-[calc(100vw-2rem)] items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-2xl sm:bottom-6 sm:right-6">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#183647] text-white">
        <FiDownload aria-hidden="true" />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-slate-900">{title}</p>
        <p className="text-xs text-slate-500">{canInstallNow ? 'Add the app to your device' : isSecure ? 'See browser installation steps' : 'This address needs HTTPS first'}</p>
      </div>
      {canInstallNow ? (
        <button
          type="button"
          onClick={install}
          className="shrink-0 rounded-xl bg-[#183647] px-3 py-2 text-sm font-semibold text-white hover:bg-[#24516a]"
        >
          Install
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setShowInstructions(true)}
          className="shrink-0 rounded-xl bg-[#183647] px-3 py-2 text-sm font-semibold text-white hover:bg-[#24516a]"
        >
          How to install
        </button>
      )}
      <button
        type="button"
        onClick={() => setDismissed(true)}
        aria-label="Dismiss install prompt"
        className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
      >
        <FiX aria-hidden="true" />
      </button>
      {showInstructions && (
        <div className="fixed inset-0 z-[110] flex items-end justify-center bg-slate-950/50 p-4 sm:items-center" role="presentation" onClick={() => setShowInstructions(false)}>
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="install-help-title"
            className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between">
              <h2 id="install-help-title" className="text-lg font-bold text-slate-900">Install Fikr School</h2>
              <button type="button" onClick={() => setShowInstructions(false)} aria-label="Close install help" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100">
                <FiX aria-hidden="true" />
              </button>
            </div>
            {!isSecure ? (
              <div className="space-y-3 text-sm text-slate-700">
                <p>Your current address is not secure, so this browser cannot install the app as a PWA.</p>
                <p>Open the same app from an HTTPS address. A local PC address such as <code className="rounded bg-slate-100 px-1">http://10.x.x.x</code> needs HTTPS before browser installation works.</p>
                <p className="text-xs text-slate-500">For development on the same device, localhost is allowed. For a phone, use a secure HTTPS deployment or configure HTTPS on your local network.</p>
              </div>
            ) : isAppleMobile ? (
              <div className="space-y-3 text-sm text-slate-700">
                <p>In Safari, tap the Share button <FiShare className="inline" aria-label="Share" /> at the bottom of the screen.</p>
                <p>Choose <strong>Add to Home Screen</strong>, then tap <strong>Add</strong>.</p>
              </div>
            ) : (
              <div className="space-y-3 text-sm text-slate-700">
                <p>Open your browser menu and choose <strong>Install app</strong> or <strong>Add to Home screen</strong>.</p>
                <p>In Chrome or Edge on desktop, you may also see an install icon at the right side of the address bar.</p>
                <p className="text-xs text-slate-500">Menu wording depends on the browser. If there is no install option, update the browser and open the site over HTTPS.</p>
              </div>
            )}
          </section>
        </div>
      )}
    </aside>
  );
};

export default InstallAppPrompt;
