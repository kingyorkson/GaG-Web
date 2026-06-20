import Phaser from 'phaser';
import { COLORS, GAME_WIDTH, GAME_HEIGHT } from '../config/constants.js';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  create() {
    this.cameras.main.setBackgroundColor(COLORS.background);
    const text = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'Loading...', {
      fontSize: '24px', color: '#ffffff', fontFamily: 'Arial',
    }).setOrigin(0.5);

    const isElectron = typeof window.electronAPI !== 'undefined';
    const isIOS = !isElectron && typeof Capacitor !== 'undefined';
    const params = new URLSearchParams(window.location.search);

    if (params.has('mode') && params.get('mode') === 'auth') {
      this.scene.start('AuthScene', { authOnly: true, webAuth: true });
    } else if (isElectron || isIOS) {
      this.scene.start('PreloadScene');
    } else {
      this.scene.start('WebLandingScene');
    }
  }
}
