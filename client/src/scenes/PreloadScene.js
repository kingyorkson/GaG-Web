import Phaser from 'phaser';
import { COLORS, GAME_WIDTH, GAME_HEIGHT } from '../config/constants.js';

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super({ key: 'PreloadScene' });
  }

  preload() {
    const barW = 400;
    const barH = 30;
    const barX = (GAME_WIDTH - barW) / 2;
    const barY = GAME_HEIGHT / 2;

    const bgBar = this.add.graphics();
    bgBar.fillStyle(COLORS.progressBarBg, 1);
    bgBar.fillRect(barX, barY, barW, barH);

    const fillBar = this.add.graphics();

    const loadingText = this.add.text(GAME_WIDTH / 2, barY - 40, 'Loading assets...', {
      fontSize: '18px',
      color: '#ffffff',
      fontFamily: 'Arial',
    }).setOrigin(0.5);

    this.load.on('progress', (value) => {
      fillBar.clear();
      fillBar.fillStyle(COLORS.progressBarFill, 1);
      fillBar.fillRect(barX + 2, barY + 2, (barW - 4) * value, barH - 4);
    });

    this.load.on('complete', () => {
      fillBar.destroy();
      bgBar.destroy();
      loadingText.destroy();
    });

    this.load.image('tablet_bg', 'assets/images/tablet_bg.png');
    this.load.image('slot_bg', 'assets/images/slot_bg.png');
    this.load.image('soil', 'assets/images/ui/soil.png');
    this.load.image('grass', 'assets/images/ui/grass.png');
    this.load.image('dirt', 'assets/images/ui/dirt.png');
    this.load.image('shovel', 'assets/images/items/shovel.png');
    this.load.image('sledgehammer', 'assets/images/items/sledgehammer.png');
    this.load.video('tablet_bootup', 'assets/video/tablet_bootup.mp4');

    // Seed textures
    const seeds = ['carrot','strawberry','blueberry','tulip','tomato','apple',
      'bamboo','corn','cactus','pineapple','mushroom','green_bean','banana',
      'coconut','mango','dragon_fruit','cherry','sunflower','venus_fire_trap',
      'pomegranate','poison_apple','venom_spitter','moon_bloom','dragons_breath'];
    seeds.forEach(s => this.load.image(`seed_${s}`, `assets/images/seeds/${s}.png`));
  }

  create() {
    this.scene.start('MenuScene');
  }
}
