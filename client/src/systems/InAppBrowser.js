export class InAppBrowser {
  constructor() {
    this.isElectron = typeof window.electronAPI !== 'undefined';
    this.isIOS = !this.isElectron && typeof Capacitor !== 'undefined';
    this.authResolve = null;
  }

  open(url) {
    return new Promise((resolve) => {
      this.authResolve = resolve;
      if (this.isElectron) {
        this.openExternal(url);
      } else if (this.isIOS) {
        this.openIOS(url);
      } else {
        this.openTab(url);
      }
    });
  }

  openExternal(url) {
    window.electronAPI.minimizeWindow();
    window.electronAPI.openAuthUrl(url).then((hash) => {
      window.electronAPI.restoreWindow();
      this.resolve(hash);
    });
  }

  openTab(url) {
    const popup = window.open(url, '_blank');
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
    if (this.isElectron && window.electronAPI.closeAuthUrl) {
      window.electronAPI.closeAuthUrl();
    }
  }
}