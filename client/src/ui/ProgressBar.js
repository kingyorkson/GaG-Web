import { COLORS } from '../config/constants.js';

export class ProgressBar {
  constructor(scene, x, y, w, h, fillColor) {
    this.scene = scene;
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.fillColor = fillColor || COLORS.progressBarFill;
    this.progress = 0;
    this.completeCallback = null;

    this.bg = scene.add.graphics();
    this.bg.fillStyle(COLORS.progressBarBg, 1);
    this.bg.fillRoundedRect(x, y, w, h, 4);

    this.fill = scene.add.graphics();
    this.draw();
  }

  draw() {
    this.fill.clear();
    this.fill.fillStyle(this.fillColor, 1);
    this.fill.fillRoundedRect(this.x + 1, this.y + 1, (this.w - 2) * Math.min(this.progress / 100, 1), this.h - 2, 3);
  }

  setProgress(pct) {
    this.progress = Math.min(pct, 100);
    this.draw();
    if (this.progress >= 100 && this.completeCallback) {
      this.completeCallback();
    }
  }

  startFill(duration) {
    const steps = 50;
    const stepDuration = duration / steps;
    let step = 0;

    this.timer = this.scene.time.addEvent({
      delay: stepDuration,
      callback: () => {
        step++;
        this.setProgress((step / steps) * 100);
        if (step >= steps) {
          this.timer.remove();
        }
      },
      loop: true,
    });
  }

  onComplete(callback) {
    this.completeCallback = callback;
  }

  destroy() {
    if (this.timer) this.timer.remove();
    this.bg.destroy();
    this.fill.destroy();
  }
}
