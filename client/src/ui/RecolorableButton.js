import Phaser from 'phaser';
import { COLORS } from '../config/constants.js';

export class RecolorableButton {
  constructor(scene, x, y, w, h, label, color, callback) {
    this.scene = scene;
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.label = label;
    this.color = color;
    this.callback = callback;
    this.disabled = false;
    this.outlineOnly = false;
    this.visible = true;

    this.container = scene.add.container(0, 0);
    this.build();
  }

  build() {
    const g = this.scene.add.graphics();

    if (this.outlineOnly) {
      g.lineStyle(3, this.color, 1);
      g.strokeRoundedRect(1, 1, this.w - 2, this.h - 2, 8);
    } else {
      g.fillStyle(this.color, this.disabled ? 0.4 : 1);
      g.fillRoundedRect(0, 0, this.w, this.h, 8);

      if (!this.disabled) {
        g.lineStyle(1, 0xffffff, 0.2);
        g.strokeRoundedRect(0, 0, this.w, this.h, 8);
      }
    }

    const text = this.scene.add.text(this.w / 2, this.h / 2, this.label, {
      fontSize: this.h > 40 ? '16px' : '13px',
      color: this.disabled ? '#666666' : '#ffffff',
      fontFamily: 'Arial',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    this.container.add([g, text]);
    this.container.setPosition(this.x, this.y);

    if (!this.disabled) {
      this.container.setSize(this.w, this.h);
      this.container.setInteractive({ useHandCursor: true });
      this.container.on('pointerdown', () => {
        if (this.callback) this.callback();
      });
      this.container.on('pointerover', () => {
        if (!this.outlineOnly) {
          g.clear();
          g.fillStyle(this.color, 0.8);
          g.fillRoundedRect(0, 0, this.w, this.h, 8);
          g.lineStyle(2, 0xffffff, 0.3);
          g.strokeRoundedRect(0, 0, this.w, this.h, 8);
        }
      });
      this.container.on('pointerout', () => {
        if (!this.outlineOnly) {
          g.clear();
          g.fillStyle(this.color, 1);
          g.fillRoundedRect(0, 0, this.w, this.h, 8);
        }
      });
    }

    this.graphics = g;
    this.text = text;
  }

  setColor(color) {
    this.color = color;
    this.graphics.clear();
    if (this.outlineOnly) {
      this.graphics.lineStyle(3, color, 1);
      this.graphics.strokeRoundedRect(1, 1, this.w - 2, this.h - 2, 8);
    } else {
      this.graphics.fillStyle(color, this.disabled ? 0.4 : 1);
      this.graphics.fillRoundedRect(0, 0, this.w, this.h, 8);
    }
  }

  setOutlineOnly(val) {
    this.outlineOnly = val;
    this.setColor(this.color);
  }

  setDisabled(val) {
    this.disabled = val;
    this.container.removeInteractive();
    this.graphics.clear();
    this.graphics.fillStyle(this.color, val ? 0.4 : 1);
    this.graphics.fillRoundedRect(0, 0, this.w, this.h, 8);
    this.text.setColor(val ? '#666666' : '#ffffff');

    if (!val) {
      this.container.setInteractive({ useHandCursor: true });
      this.container.on('pointerdown', () => {
        if (this.callback) this.callback();
      });
    }
  }

  destroy() {
    this.container.destroy();
  }
}
