import Phaser from 'phaser';
import { COLORS, GAME_WIDTH, GAME_HEIGHT, AUTH_TYPES } from '../config/constants.js';
import { RecolorableButton } from '../ui/RecolorableButton.js';
import { AuthSystem } from '../systems/AuthSystem.js';
import { ProgressBar } from '../ui/ProgressBar.js';

export class AuthScene extends Phaser.Scene {
  constructor() {
    super({ key: 'AuthScene' });
  }

  init(data) {
    this.returnScene = data.returnScene || 'MenuScene';
  }

  create() {
    this.authSystem = new AuthSystem();

    this.cameras.main.setBackgroundColor(COLORS.background);
    this.createAuthScreen();
    this.setupGamepad();
  }

  createAuthScreen() {
    const overlay = this.add.graphics();
    overlay.fillStyle(0x000000, 0.8);
    overlay.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    const pw = 500;
    const ph = 350;
    const px = (GAME_WIDTH - pw) / 2;
    const py = (GAME_HEIGHT - ph) / 2;

    const panel = this.add.graphics();
    panel.fillStyle(COLORS.tabletBg, 0.95);
    panel.fillRoundedRect(px, py, pw, ph, 20);
    panel.lineStyle(2, COLORS.tabletBorder, 1);
    panel.strokeRoundedRect(px, py, pw, ph, 20);

    this.add.text(GAME_WIDTH / 2, py + 30, 'Sign In', {
      fontSize: '28px', color: '#ffffff', fontFamily: 'Arial', fontStyle: 'bold',
    }).setOrigin(0.5);

    const btnW = 200;
    const btnH = 50;
    const cx = GAME_WIDTH / 2;

    this.guestBtn = new RecolorableButton(this, cx - btnW - 10, py + 100, btnW, btnH, 'Guest User', COLORS.buttonGray, () => {
      this.showGuestForm();
    });

    this.discordBtn = new RecolorableButton(this, cx + 10, py + 100, btnW, btnH, 'Discord', COLORS.buttonDiscord, () => {
      this.startDiscordAuth();
    });

    this.backBtn = new RecolorableButton(this, px + pw - 50, py + 10, 35, 35, 'X', COLORS.danger, () => {
      this.scene.start(this.returnScene);
    });
  }

  showGuestForm() {
    this.clearMainButtons();

    const pw = 500;
    const ph = 400;
    const px = (GAME_WIDTH - pw) / 2;
    const py = (GAME_HEIGHT - ph) / 2;

    this.add.text(GAME_WIDTH / 2, py + 40, 'Guest Account', {
      fontSize: '24px', color: '#ffffff', fontFamily: 'Arial', fontStyle: 'bold',
    }).setOrigin(0.5);

    this.formData = { username: '', password: '', mode: 'login' };

    this.add.text(GAME_WIDTH / 2 - 170, py + 90, 'Username:', {
      fontSize: '16px', color: '#aaaaaa', fontFamily: 'Arial',
    });

    this.usernameInput = this.createInput(px + 60, py + 115, pw - 120, 35, '');

    this.add.text(GAME_WIDTH / 2 - 170, py + 170, 'Password:', {
      fontSize: '16px', color: '#aaaaaa', fontFamily: 'Arial',
    });

    this.passwordInput = this.createInput(px + 60, py + 195, pw - 120, 35, '', true);

    this.loginBtn = new RecolorableButton(this, px + 40, py + 260, (pw - 120) / 2, 40, 'Sign In', COLORS.buttonGreen, () => {
      this.handleGuestLogin();
    });

    this.createBtn = new RecolorableButton(this, px + 70 + (pw - 120) / 2, py + 260, (pw - 120) / 2, 40, 'Create Account', COLORS.buttonGray, () => {
      this.showCreateAccountForm();
    });

    this.errorText = this.add.text(GAME_WIDTH / 2, py + 320, '', {
      fontSize: '14px', color: '#e74c3c', fontFamily: 'Arial',
    }).setOrigin(0.5);

    this.backBtn2 = new RecolorableButton(this, px + pw - 50, py + 10, 35, 35, 'X', COLORS.danger, () => {
      this.scene.start(this.returnScene);
    });
  }

  showCreateAccountForm() {
    this.clearMainButtons();

    const pw = 500;
    const ph = 450;
    const px = (GAME_WIDTH - pw) / 2;
    const py = (GAME_HEIGHT - ph) / 2;

    this.add.text(GAME_WIDTH / 2, py + 40, 'Create Account', {
      fontSize: '24px', color: '#ffffff', fontFamily: 'Arial', fontStyle: 'bold',
    }).setOrigin(0.5);

    this.add.text(GAME_WIDTH / 2 - 170, py + 85, 'Username:', {
      fontSize: '16px', color: '#aaaaaa', fontFamily: 'Arial',
    });

    this.usernameInput = this.createInput(px + 60, py + 110, pw - 120, 35, '');

    this.add.text(GAME_WIDTH / 2 - 170, py + 160, 'Password:', {
      fontSize: '16px', color: '#aaaaaa', fontFamily: 'Arial',
    });

    this.passwordInput = this.createInput(px + 60, py + 185, pw - 120, 35, '', true);

    this.add.text(GAME_WIDTH / 2 - 170, py + 235, 'Confirm Password:', {
      fontSize: '16px', color: '#aaaaaa', fontFamily: 'Arial',
    });

    this.confirmInput = this.createInput(px + 60, py + 260, pw - 120, 35, '', true);

    this.createBtn = new RecolorableButton(this, px + 60, py + 320, pw - 120, 40, 'Create', COLORS.buttonGreen, () => {
      this.handleAccountCreation();
    });

    this.errorText = this.add.text(GAME_WIDTH / 2, py + 380, '', {
      fontSize: '14px', color: '#e74c3c', fontFamily: 'Arial',
    }).setOrigin(0.5);

    this.backBtn3 = new RecolorableButton(this, px + pw - 50, py + 10, 35, 35, 'X', COLORS.danger, () => {
      this.scene.start(this.returnScene);
    });
  }

  createInput(x, y, w, h, placeholder, isPassword = false) {
    const bg = this.add.graphics();
    bg.fillStyle(0x2d2d44, 1);
    bg.fillRoundedRect(x, y, w, h, 5);
    bg.lineStyle(1, 0x555555, 1);
    bg.strokeRoundedRect(x, y, w, h, 5);

    const displayChar = isPassword ? '*' : '';
    const text = this.add.text(x + 10, y + h / 2, '', {
      fontSize: '16px', color: '#ffffff', fontFamily: 'Arial',
    }).setOrigin(0, 0.5);

    const placeholderText = this.add.text(x + 10, y + h / 2, placeholder, {
      fontSize: '16px', color: '#555555', fontFamily: 'Arial',
    }).setOrigin(0, 0.5);

    const inputObj = { bg, text, placeholderText, value: '', x, y, w, h, isPassword, focused: false };

    const hitArea = this.add.zone(x + w / 2, y + h / 2, w, h).setInteractive({ useHandCursor: true });
    hitArea.on('pointerdown', () => {
      inputObj.focused = true;
      bg.clear();
      bg.fillStyle(0x3d3d55, 1);
      bg.fillRoundedRect(x, y, w, h, 5);
      bg.lineStyle(2, COLORS.progressBarFill, 1);
      bg.strokeRoundedRect(x, y, w, h, 5);
      this.currentInput = inputObj;
    });

    this.input.keyboard.on('keydown', (event) => {
      if (this.currentInput !== inputObj) return;
      if (event.key === 'Backspace') {
        inputObj.value = inputObj.value.slice(0, -1);
      } else if (event.key === 'Enter') {
        inputObj.focused = false;
        bg.clear();
        bg.fillStyle(0x2d2d44, 1);
        bg.fillRoundedRect(x, y, w, h, 5);
        bg.lineStyle(1, 0x555555, 1);
        bg.strokeRoundedRect(x, y, w, h, 5);
        return;
      } else if (event.key.length === 1) {
        inputObj.value += event.key;
      }
      const display = isPassword ? '•'.repeat(inputObj.value.length) : inputObj.value;
      text.setText(display);
      placeholderText.setVisible(inputObj.value.length === 0);
    });

    return inputObj;
  }

  handleGuestLogin() {
    const username = this.usernameInput.value.trim();
    const password = this.passwordInput.value;

    if (!username || !password) {
      this.showError('Please fill in all fields');
      return;
    }

    this.showProgressBar('Signing in...');
    this.authSystem.loginGuest(username, password).then(result => {
      if (result.success) {
        this.authSystem.saveUser(result.user);
        this.progressComplete(() => {
          this.scene.start(this.returnScene);
        });
      } else {
        this.hideProgressBar();
        this.showError(result.error || 'Invalid credentials');
      }
    });
  }

  async handleAccountCreation() {
    const username = this.usernameInput.value.trim();
    const password = this.passwordInput.value;
    const confirm = this.confirmInput.value;

    if (!username || !password || !confirm) {
      this.showError('Please fill in all fields');
      return;
    }

    if (password !== confirm) {
      this.showError('Passwords do not match');
      return;
    }

    const validationError = this.validatePassword(password);
    if (validationError) {
      this.showError(validationError);
      return;
    }

    this.showProgressBar('Creating account...');

    try {
      const result = await this.authSystem.createGuestAccount(username, password);
      if (result.success) {
        this.authSystem.saveUser(result.user);
        this.progressComplete(() => {
          this.scene.start(this.returnScene);
        });
      } else {
        this.hideProgressBar();
        this.showError(result.error || 'Account creation failed');
      }
    } catch (err) {
      this.hideProgressBar();
      this.showError('Server error. Please try again.');
    }
  }

  validatePassword(password) {
    if (password.length < 8) return 'Password must be 8 or more characters';
    if (!/[A-Z]/.test(password)) return 'Password needs at least one uppercase letter';
    if (!/[a-z]/.test(password)) return 'Password needs at least one lowercase letter';
    if (!/[0-9]/.test(password)) return 'Password needs at least one number';
    if (!/[^A-Za-z0-9]/.test(password)) return 'Password needs at least one symbol';
    return null;
  }

  startDiscordAuth() {
    const overlay = this.add.graphics();
    overlay.fillStyle(0x000000, 0.9);
    overlay.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 30, 'Opening Discord authorization...', {
      fontSize: '20px', color: '#ffffff', fontFamily: 'Arial',
    }).setOrigin(0.5);

    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 15, 'Please continue in the browser window that was opened.', {
      fontSize: '14px', color: '#aaaaaa', fontFamily: 'Arial',
    }).setOrigin(0.5);

    this.showProgressBar('Waiting for authorization...');

    const authUrl = this.authSystem.getDiscordAuthUrl();
    window.open(authUrl, '_blank');

    this.authSystem.waitForDiscordCallback().then(result => {
      this.hideProgressBar();
      if (result.success) {
        this.authSystem.saveUser(result.user);
        this.progressComplete(() => {
          this.scene.start(this.returnScene);
        });
      } else {
        this.showDiscordUsernamePrompt(result);
      }
    });
  }

  showDiscordUsernamePrompt(authData) {
    const pw = 500;
    const ph = 300;
    const px = (GAME_WIDTH - pw) / 2;
    const py = (GAME_HEIGHT - ph) / 2;

    this.add.text(GAME_WIDTH / 2, py + 30, 'Choose Username', {
      fontSize: '22px', color: '#ffffff', fontFamily: 'Arial', fontStyle: 'bold',
    }).setOrigin(0.5);

    this.add.text(GAME_WIDTH / 2, py + 70, 'Select how to get your username:', {
      fontSize: '14px', color: '#aaaaaa', fontFamily: 'Arial',
    }).setOrigin(0.5);

    this.add.text(px + 60, py + 110, 'Option:', {
      fontSize: '16px', color: '#aaaaaa', fontFamily: 'Arial',
    });

    let selectedOption = 'discord';
    let usernameValue = '';

    const optionBox = this.add.graphics();
    optionBox.fillStyle(0x2d2d44, 1);
    optionBox.fillRoundedRect(px + 130, py + 105, 280, 30, 5);

    const optionText = this.add.text(px + 140, py + 120, 'Use my Discord username', {
      fontSize: '14px', color: '#ffffff', fontFamily: 'Arial',
    }).setOrigin(0, 0.5);

    const optionHit = this.add.zone(px + 130, py + 105, 280, 30).setInteractive({ useHandCursor: true });
    optionHit.on('pointerdown', () => {
      selectedOption = selectedOption === 'discord' ? 'custom' : 'discord';
      optionText.setText(selectedOption === 'discord' ? 'Use my Discord username' : 'Let me create my own username');
      if (selectedOption === 'discord') {
        usernameInput.setVisible(false);
        usernameBg.setVisible(false);
      } else {
        usernameInput.setVisible(true);
        usernameBg.setVisible(true);
      }
    });

    const usernameBg = this.add.graphics();
    usernameBg.fillStyle(0x2d2d44, 1);
    usernameBg.fillRoundedRect(px + 60, py + 155, pw - 120, 35, 5);
    usernameBg.setVisible(false);

    const usernameInput = this.add.text(px + 70, py + 172, '', {
      fontSize: '16px', color: '#ffffff', fontFamily: 'Arial',
    }).setOrigin(0, 0.5).setVisible(false);

    const nextBtn = new RecolorableButton(this, px + 60, py + 220, pw - 120, 40, 'Next', COLORS.buttonGreen, () => {
      const finalUsername = selectedOption === 'discord' ? authData.discordUsername : usernameValue;
      if (!finalUsername) { this.showError('Please enter a username'); return; }
      this.finalizeDiscordAccount(authData, finalUsername);
    });
  }

  async finalizeDiscordAccount(authData, username) {
    this.showProgressBar('Finalizing account...');
    const result = await this.authSystem.createDiscordAccount(authData, username);
    if (result.success) {
      this.authSystem.saveUser(result.user);
      this.progressComplete(() => {
        this.scene.start(this.returnScene);
      });
    } else {
      this.hideProgressBar();
      this.showError(result.error || 'Failed to create account');
    }
  }

  showProgressBar(text) {
    this.progressContainer = this.add.container(0, 0);
    const pw = 300;
    const ph = 60;
    const px = (GAME_WIDTH - pw) / 2;
    const py = GAME_HEIGHT - 80;

    const bg = this.add.graphics();
    bg.fillStyle(0x000000, 0.8);
    bg.fillRoundedRect(px - 10, py - 10, pw + 20, ph + 20, 10);

    const progressText = this.add.text(GAME_WIDTH / 2, py + 10, text, {
      fontSize: '14px', color: '#ffffff', fontFamily: 'Arial',
    }).setOrigin(0.5);

    this.progressBar = new ProgressBar(this, px, py + 25, pw, 15, COLORS.progressBarFill);
    this.progressContainer.add([bg, progressText, this.progressBar]);
    this.progressBar.startFill(2000);
  }

  hideProgressBar() {
    if (this.progressContainer) {
      this.progressContainer.destroy();
      this.progressContainer = null;
    }
  }

  progressComplete(callback) {
    if (this.progressBar) {
      this.progressBar.onComplete(() => {
        this.hideProgressBar();
        if (callback) callback();
      });
    } else {
      if (callback) callback();
    }
  }

  showError(msg) {
    if (this.errorText) {
      this.errorText.setText(msg);
    }
  }

  clearMainButtons() {
    if (this.guestBtn) { this.guestBtn.destroy(); }
    if (this.discordBtn) { this.discordBtn.destroy(); }
    if (this.backBtn) { this.backBtn.destroy(); }
  }

  setupGamepad() {
    this.input.gamepad.on('connected', (pad) => {
      this.gamepad = pad;
    });
  }

  update() {
    if (this.gamepad) {
      if (this.gamepad.B) {
        this.scene.start(this.returnScene);
        this.gamepad = null;
      }
    }
  }
}
