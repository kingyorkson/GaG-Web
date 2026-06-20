import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, COLORS } from './config/constants.js';
import { BootScene } from './scenes/BootScene.js';
import { PreloadScene } from './scenes/PreloadScene.js';
import { WebLandingScene } from './scenes/WebLandingScene.js';
import { MenuScene } from './scenes/MenuScene.js';
import { AuthScene } from './scenes/AuthScene.js';
import { LoadingScene } from './scenes/LoadingScene.js';
import { GardenScene } from './scenes/GardenScene.js';
import { TabletScene } from './scenes/TabletScene.js';

const config = {
  type: Phaser.AUTO,
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  parent: document.body,
  backgroundColor: COLORS.background,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  input: {
    gamepad: true,
  },
  scene: [BootScene, PreloadScene, WebLandingScene, MenuScene, AuthScene, LoadingScene, GardenScene, TabletScene],
};

const game = new Phaser.Game(config);

window.addEventListener('resize', () => {
  game.scale.refresh();
});
