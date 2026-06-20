import Phaser from 'phaser';

export class ControllerSystem {
  constructor(scene) {
    this.scene = scene;
    this.gamepad = null;
    this.lastButtonStates = {};
    this.setupGamepad();
  }

  setupGamepad() {
    if (this.scene.input.gamepad) {
      this.scene.input.gamepad.on('connected', (pad) => {
        this.gamepad = pad;
        console.log(`Controller connected: ${pad.id}`);
      });

      this.scene.input.gamepad.on('disconnected', () => {
        this.gamepad = null;
      });
    }

    // Also poll for gamepads that connect after scene start
    this.pollInterval = this.scene.time.addEvent({
      delay: 500,
      callback: () => {
        if (!this.gamepad && navigator.getGamepads) {
          const pads = navigator.getGamepads();
          for (const pad of pads) {
            if (pad) {
              this.gamepad = pad;
              console.log(`Controller detected: ${pad.id}`);
              break;
            }
          }
        }
      },
      loop: true,
    });
  }

  isButtonPressed(buttonIndex) {
    if (!this.gamepad) return false;
    try {
      const btn = this.gamepad.buttons[buttonIndex];
      return btn && btn.pressed;
    } catch {
      return false;
    }
  }

  isButtonJustPressed(buttonIndex) {
    if (!this.gamepad) return false;
    try {
      const btn = this.gamepad.buttons[buttonIndex];
      const pressed = btn && btn.pressed;
      const key = `btn_${buttonIndex}`;
      const wasPressed = this.lastButtonStates[key] || false;
      this.lastButtonStates[key] = pressed;
      return pressed && !wasPressed;
    } catch {
      return false;
    }
  }

  getAxisValue(axisIndex) {
    if (!this.gamepad) return 0;
    try {
      return this.gamepad.axes[axisIndex] || 0;
    } catch {
      return 0;
    }
  }

  getLeftStickX() { return this.getAxisValue(0); }
  getLeftStickY() { return this.getAxisValue(1); }
  getRightStickX() { return this.getAxisValue(2); }
  getRightStickY() { return this.getAxisValue(3); }

  // Standard controller button mappings
  get A() { return this.isButtonJustPressed(0); }
  get B() { return this.isButtonJustPressed(1); }
  get X() { return this.isButtonJustPressed(2); }
  get Y() { return this.isButtonJustPressed(3); }
  get LB() { return this.isButtonJustPressed(4); }
  get RB() { return this.isButtonJustPressed(5); }
  get LT() { return this.isButtonPressed(6); }
  get RT() { return this.isButtonPressed(7); }
  get BACK() { return this.isButtonJustPressed(8); }
  get START() { return this.isButtonJustPressed(9); }
  get L3() { return this.isButtonJustPressed(10); }
  get R3() { return this.isButtonJustPressed(11); }
  get DPAD_UP() { return this.isButtonJustPressed(12); }
  get DPAD_DOWN() { return this.isButtonJustPressed(13); }
  get DPAD_LEFT() { return this.isButtonJustPressed(14); }
  get DPAD_RIGHT() { return this.isButtonJustPressed(15); }

  destroy() {
    if (this.pollInterval) {
      this.pollInterval.remove();
    }
  }
}
