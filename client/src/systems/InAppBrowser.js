export class InAppBrowser {
  constructor() {
    this.isElectron = typeof window.electronAPI !== 'undefined';
    this.isIOS = !this.isElectron && typeof Capacitor !== 'undefined';
    this.authResolve = null;
  }

  open(url, existingPopup) {
    return new Promise((resolve) => {
      this.authResolve = resolve;
      if (this.isIOS) {
        this.openIOS(url);
      } else {
        this.openTab(url, existingPopup);
      }
    });
  }

  async startExternalFlow(supabase) {
    window.electronAPI.minimizeWindow();

    const redirectTo = 'https://kingyorkson.github.io/GaG-Web/auth/callback.html';

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'discord',
      options: {
        redirectTo,
        skipBrowserRedirect: true,
      },
    });
    if (error || !data?.url) {
      window.electronAPI.restoreWindow();
      return { success: false, error: error?.message || 'Failed to get Discord auth URL' };
    }

    const hash = await window.electronAPI.openAuthWindow(data.url);
    window.electronAPI.restoreWindow();
    if (hash) {
      return { success: true, hash };
    }
    return { success: false, error: 'Authentication was cancelled or failed' };
  }

  openTab(url, existingPopup) {
    const popup = existingPopup || window.open(url, '_blank');
    if (!popup) { this.resolve(''); return; }
    if (existingPopup && url) popup.location.href = url;
    const handler = (event) => {
      if (event.data?.type === 'supabase-auth' && event.origin === window.location.origin) {
        window.removeEventListener('message', handler);
        this.resolve(event.data.hash || '');
        if (!popup.closed) popup.close();
      }
    };
    window.addEventListener('message', handler);
    const poll = setInterval(() => {
      if (popup.closed) {
        clearInterval(poll);
        window.removeEventListener('message', handler);
        this.resolve('');
      }
    }, 1000);
  }

  openIOS(url) {
    const Browser = Capacitor.Plugins.Browser;
    if (!Browser) { this.resolve(''); return; }
    Browser.open({ url });
    Browser.addListener('browserPageLoaded', (event) => {
      if (event.url.includes('/auth/callback.html')) {
        const hash = event.url.split('#')[1] || '';
        this.resolve('#' + hash);
        Browser.close();
      }
    });
  }

  resolve(data) {
    if (this.authResolve) {
      this.authResolve(data);
      this.authResolve = null;
    }
  }

  close() {
  }
}
