import Phaser from 'phaser';
import { COLORS, GAME_WIDTH, GAME_HEIGHT } from '../config/constants.js';
import { supabase } from '../systems/SupabaseClient.js';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  async create() {
    this.cameras.main.setBackgroundColor(COLORS.background);
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'Loading...', {
      fontSize: '24px', color: '#ffffff', fontFamily: 'Arial',
    }).setOrigin(0.5);

    const isElectron = typeof window.electronAPI !== 'undefined';
    const isIOS = !isElectron && typeof Capacitor !== 'undefined';
    const params = new URLSearchParams(window.location.search);

    const discordHash = localStorage.getItem('gag_discord_hash');
    if (discordHash && discordHash !== 'waiting') {
      localStorage.removeItem('gag_discord_hash');
      const q = new URLSearchParams(discordHash.replace('#', '?'));
      const at = q.get('access_token');
      const rt = q.get('refresh_token');
      if (at && rt) {
        await supabase.auth.setSession({ access_token: at, refresh_token: rt });
      }
      this.scene.start('AuthScene', { discordCallback: true });
      return;
    }

    if (params.has('mode') && params.get('mode') === 'auth') {
      this.scene.start('AuthScene', { authOnly: true, webAuth: true });
    } else if (isElectron || isIOS) {
      this.scene.start('PreloadScene');
    } else {
      this.scene.start('WebLandingScene');
    }
  }
}
