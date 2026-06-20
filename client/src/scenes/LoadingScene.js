import Phaser from 'phaser';
import { COLORS, GAME_WIDTH, GAME_HEIGHT } from '../config/constants.js';
import { ProgressBar } from '../ui/ProgressBar.js';
import { GrowthSystem } from '../systems/GrowthSystem.js';

export class LoadingScene extends Phaser.Scene {
  constructor() {
    super({ key: 'LoadingScene' });
  }

  init(data) {
    this.mode = data.mode || 'single';
    this.user = data.user || null;
    this.serverId = data.serverId || null;
    this.savedGardens = data.savedGardens || null;
  }

  create() {
    this.growthSystem = new GrowthSystem();

    this.cameras.main.setBackgroundColor(0x000000);

    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 60, 'Loading...', {
      fontSize: '28px', color: '#ffffff', fontFamily: 'Arial', fontStyle: 'bold',
    }).setOrigin(0.5);

    const barW = 400;
    const barX = (GAME_WIDTH - barW) / 2;
    const barY = GAME_HEIGHT / 2;

    this.statusText = this.add.text(GAME_WIDTH / 2, barY - 25, 'Loading assets...', {
      fontSize: '14px', color: '#aaaaaa', fontFamily: 'Arial',
    }).setOrigin(0.5);

    this.progressBar = new ProgressBar(this, barX, barY, barW, 20, COLORS.progressBarFill);
    this.startLoading();
  }

  async startLoading() {
    const steps = [
      { name: 'Loading assets...', weight: 20 },
      { name: 'Loading your garden...', weight: 30 },
      { name: 'Checking for other players...', weight: 20 },
      { name: 'Processing offline growth...', weight: 20 },
      { name: 'Finalizing...', weight: 10 },
    ];

    let totalProgress = 0;

    for (const step of steps) {
      this.statusText.setText(step.name);
      await this.simulateLoad(step.weight);
      totalProgress += step.weight;
      this.progressBar.setProgress(totalProgress);
    }

    await this.delay(500);
    this.cameras.main.fadeOut(500, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start('GardenScene', {
        mode: this.mode,
        user: this.user,
        serverId: this.serverId,
        savedGardens: this.savedGardens,
      });
    });
  }

  simulateLoad(weight) {
    return new Promise(resolve => {
      const duration = 300 + Math.random() * 600;
      this.time.delayedCall(duration, resolve);
    });
  }

  delay(ms) {
    return new Promise(resolve => this.time.delayedCall(ms, resolve));
  }
}
