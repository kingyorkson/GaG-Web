export class RecolorableButton {
  constructor(scene, x, y, w, h, label, color, callback, depth) {
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
    this._depth = depth;
    this._alpha = 1;

    this.build();
  }

  setDepth(depth) {
    this._depth = depth;
    if (this.graphics) this.graphics.setDepth(depth);
    if (this.text) this.text.setDepth(depth);
  }

  build() {
    this.graphics = this.scene.add.graphics();
    if (this._depth !== undefined) this.graphics.setDepth(this._depth);

    this.text = this.scene.add.text(this.x + this.w / 2, this.y + this.h / 2, this.label, {
      fontSize: this.h > 40 ? '16px' : '13px',
      color: '#ffffff',
      fontFamily: 'Arial',
      fontStyle: 'bold',
    }).setOrigin(0.5);
    if (this._depth !== undefined) this.text.setDepth(this._depth);

    this.zone = this.scene.add.zone(this.x + this.w / 2, this.y + this.h / 2, this.w, this.h)
      .setInteractive({ useHandCursor: true });
    if (this._depth !== undefined) this.zone.setDepth(this._depth);

    this.drawGraphics();

    if (!this.disabled) {
      this.zone.on('pointerdown', () => {
        if (this.callback) this.callback();
      });
      this.zone.on('pointerover', () => {
        if (!this.outlineOnly) {
          this.drawGraphics(0.8);
        }
      });
      this.zone.on('pointerout', () => {
        if (!this.outlineOnly) {
          this.drawGraphics(1);
        }
      });
    }

    this.allObjects = [this.graphics, this.text, this.zone];
  }

  drawGraphics(alpha) {
    if (alpha === undefined) alpha = this.disabled ? 0.4 : 1;
    this._alpha = alpha;
    this.graphics.clear();
    if (this.outlineOnly) {
      this.graphics.lineStyle(3, this.color, 1);
      this.graphics.strokeRoundedRect(this.x + 1, this.y + 1, this.w - 2, this.h - 2, 8);
    } else {
      this.graphics.fillStyle(this.color, alpha);
      this.graphics.fillRoundedRect(this.x, this.y, this.w, this.h, 8);
      if (!this.disabled) {
        this.graphics.lineStyle(1, 0xffffff, 0.2);
        this.graphics.strokeRoundedRect(this.x, this.y, this.w, this.h, 8);
      }
    }
  }

  setColor(color) {
    this.color = color;
    this.drawGraphics(this._alpha);
  }

  setOutlineOnly(val) {
    this.outlineOnly = val;
    this.drawGraphics(this._alpha);
  }

  setText(text) {
    this.text.setText(text);
  }

  setDisabled(val) {
    this.disabled = val;
    this.text.setColor(val ? '#666666' : '#ffffff');
    if (val) {
      this.zone.removeInteractive();
    } else {
      this.zone.setInteractive({ useHandCursor: true });
    }
    this.drawGraphics();
  }

  destroy() {
    this.allObjects.forEach(o => o.destroy());
  }
}