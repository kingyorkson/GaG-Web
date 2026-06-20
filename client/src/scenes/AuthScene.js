import Phaser from 'phaser';
import { COLORS, GAME_WIDTH, GAME_HEIGHT, AUTH_TYPES } from '../config/constants.js';
import { RecolorableButton } from '../ui/RecolorableButton.js';
import { AuthSystem } from '../systems/AuthSystem.js';
import { supabase } from '../systems/SupabaseClient.js';
import { ProgressBar } from '../ui/ProgressBar.js';
import { InAppBrowser } from '../systems/InAppBrowser.js';

export class AuthScene extends Phaser.Scene {
  constructor() {
    super({ key: 'AuthScene' });
  }

  init(data) {
    this.returnScene = data.returnScene || 'MenuScene';
  }

  create() {
    this.authSystem = new AuthSystem();
    this.setupAuthListener();

    this.cameras.main.setBackgroundColor(COLORS.background);
    this.createAuthScreen();
    this.setupGamepad();
  }

  setupAuthListener() {
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

    new RecolorableButton(this, cx - btnW - 10, py + 100, btnW, btnH, 'Guest User', COLORS.buttonGray, () => {
      this.showGuestForm();
    });

    new RecolorableButton(this, cx + 10, py + 100, btnW, btnH, 'Discord', COLORS.buttonDiscord, () => {
      this.startDiscordAuth();
    });

    new RecolorableButton(this, px + pw - 50, py + 10, 35, 35, 'X', COLORS.danger, () => {
      this.scene.start(this.returnScene);
    });
  }

  showGuestForm() {
    this.children.removeAll(true);

    const pw = 500;
    const ph = 400;
    const px = (GAME_WIDTH - pw) / 2;
    const py = (GAME_HEIGHT - ph) / 2;

    const panel = this.add.graphics();
    panel.fillStyle(COLORS.tabletBg, 0.95);
    panel.fillRoundedRect(px, py, pw, ph, 20);
    panel.lineStyle(2, COLORS.tabletBorder, 1);
    panel.strokeRoundedRect(px, py, pw, ph, 20);

    this.add.text(GAME_WIDTH / 2, py + 40, 'Guest Account', {
      fontSize: '24px', color: '#ffffff', fontFamily: 'Arial', fontStyle: 'bold',
    }).setOrigin(0.5);

    this.formFields = {};

    this.add.text(GAME_WIDTH / 2 - 170, py + 90, 'Username:', {
      fontSize: '16px', color: '#aaaaaa', fontFamily: 'Arial',
    });

    this.formFields.username = this.createInput(px + 60, py + 115, pw - 120, 35, '');

    this.add.text(GAME_WIDTH / 2 - 170, py + 170, 'Password:', {
      fontSize: '16px', color: '#aaaaaa', fontFamily: 'Arial',
    });

    this.formFields.password = this.createInput(px + 60, py + 195, pw - 120, 35, '', true);

    new RecolorableButton(this, px + 40, py + 260, (pw - 120) / 2, 40, 'Sign In', COLORS.buttonGreen, () => {
      this.handleGuestLogin();
    });

    new RecolorableButton(this, px + 70 + (pw - 120) / 2, py + 260, (pw - 120) / 2, 40, 'Create Account', COLORS.buttonGray, () => {
      this.showCreateAccountForm();
    });

    this.errorText = this.add.text(GAME_WIDTH / 2, py + 320, '', {
      fontSize: '14px', color: '#e74c3c', fontFamily: 'Arial',
    }).setOrigin(0.5);

    new RecolorableButton(this, px + pw - 50, py + 10, 35, 35, 'X', COLORS.danger, () => {
      this.scene.start(this.returnScene);
    });
  }

  showCreateAccountForm() {
    this.children.removeAll(true);

    const pw = 500;
    const ph = 450;
    const px = (GAME_WIDTH - pw) / 2;
    const py = (GAME_HEIGHT - ph) / 2;

    const panel = this.add.graphics();
    panel.fillStyle(COLORS.tabletBg, 0.95);
    panel.fillRoundedRect(px, py, pw, ph, 20);
    panel.lineStyle(2, COLORS.tabletBorder, 1);
    panel.strokeRoundedRect(px, py, pw, ph, 20);

    this.add.text(GAME_WIDTH / 2, py + 40, 'Create Account', {
      fontSize: '24px', color: '#ffffff', fontFamily: 'Arial', fontStyle: 'bold',
    }).setOrigin(0.5);

    this.formFields = {};

    this.add.text(GAME_WIDTH / 2 - 170, py + 85, 'Username:', {
      fontSize: '16px', color: '#aaaaaa', fontFamily: 'Arial',
    });

    this.formFields.username = this.createInput(px + 60, py + 110, pw - 120, 35, '');

    this.add.text(GAME_WIDTH / 2 - 170, py + 160, 'Password:', {
      fontSize: '16px', color: '#aaaaaa', fontFamily: 'Arial',
    });

    this.formFields.password = this.createInput(px + 60, py + 185, pw - 120, 35, '', true);

    this.add.text(GAME_WIDTH / 2 - 170, py + 235, 'Confirm Password:', {
      fontSize: '16px', color: '#aaaaaa', fontFamily: 'Arial',
    });

    this.formFields.confirm = this.createInput(px + 60, py + 260, pw - 120, 35, '', true);

    new RecolorableButton(this, px + 60, py + 320, pw - 120, 40, 'Create', COLORS.buttonGreen, () => {
      this.handleAccountCreation();
    });

    this.errorText = this.add.text(GAME_WIDTH / 2, py + 380, '', {
      fontSize: '14px', color: '#e74c3c', fontFamily: 'Arial',
    }).setOrigin(0.5);

    new RecolorableButton(this, px + pw - 50, py + 10, 35, 35, 'X', COLORS.danger, () => {
      this.scene.start(this.returnScene);
    });
  }

  createInput(x, y, w, h, placeholder, isPassword = false) {
    const bg = this.add.graphics();
    bg.fillStyle(0x2d2d44, 1);
    bg.fillRoundedRect(x, y, w, h, 5);
    bg.lineStyle(1, 0x555555, 1);
    bg.strokeRoundedRect(x, y, w, h, 5);

    const text = this.add.text(x + 10, y + h / 2, '', {
      fontSize: '16px', color: '#ffffff', fontFamily: 'Arial',
    }).setOrigin(0, 0.5);

    const placeholderText = this.add.text(x + 10, y + h / 2, placeholder, {
      fontSize: '16px', color: '#555555', fontFamily: 'Arial',
    }).setOrigin(0, 0.5);

    const inputObj = { bg, text, placeholderText, value: '', x, y, w, h, isPassword, focused: false };

    const zone = this.add.zone(x + w / 2, y + h / 2, w, h).setInteractive({ useHandCursor: true });
    zone.on('pointerdown', () => {
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

  async handleGuestLogin() {
    const username = this.formFields.username?.value?.trim();
    const password = this.formFields.password?.value;

    if (!username || !password) {
      this.showError('Please fill in all fields');
      return;
    }

    this.showProgressBar('Signing in...');
    const result = await this.authSystem.loginGuest(username, password);
    if (result.success) {
      this.authSystem.saveUser(result.user);
      this.progressComplete(() => this.scene.start(this.returnScene));
    } else {
      this.hideProgressBar();
      this.showError(result.error || 'Invalid credentials');
    }
  }

  async handleAccountCreation() {
    const username = this.formFields.username?.value?.trim();
    const password = this.formFields.password?.value;
    const confirm = this.formFields.confirm?.value;

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
        this.progressComplete(() => this.scene.start(this.returnScene));
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

  async startDiscordAuth() {
    this.children.removeAll(true);

    const overlay = this.add.graphics().setDepth(50);
    overlay.fillStyle(0x000000, 0.9);
    overlay.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 30, 'Opening Discord authorization...', {
      fontSize: '20px', color: '#ffffff', fontFamily: 'Arial',
    }).setOrigin(0.5).setDepth(50);

    this.showProgressBar('Waiting for Discord...');

    const result = await this.authSystem.loginWithDiscord();
    if (!result.success) {
      this.hideProgressBar();
      this.showError(result.error || 'Failed to start Discord auth');
      return;
    }

    this.browser = new InAppBrowser();
    this.waitingForDiscord = true;
    const hash = await this.browser.open(result.url);

    if (hash) {
      const q = new URLSearchParams(hash.replace('#', '?'));
      const at = q.get('access_token');
      const rt = q.get('refresh_token');
      if (at && rt) {
        await supabase.auth.setSession({ access_token: at, refresh_token: rt });
      }
      this.handleDiscordCallback();
    } else {
      this.hideProgressBar();
      this.showError('Authentication was cancelled');
    }
  }

  async handleDiscordCallback() {
    if (!this.waitingForDiscord) return;
    this.waitingForDiscord = false;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      this.hideProgressBar();
      this.showError('Discord authentication failed');
      return;
    }

    const discordUsername = user.user_metadata?.full_name || user.user_metadata?.user_name || 'DiscordUser';

    const { data: profile } = await supabase
      .from('profiles')
      .select('username')
      .eq('id', user.id)
      .single();

    if (profile?.username) {
      this.hideProgressBar();
      this.showSuccess('Authenticated with Discord!');
      this.authSystem.saveUser({ id: user.id, username: profile.username, type: 'discord' });
      this.progressComplete(() => this.scene.start(this.returnScene));
    } else {
      this.hideProgressBar();
      this.showDiscordUsernamePrompt(user, discordUsername);
    }
  }

  showDiscordUsernamePrompt(user, discordUsername) {
    this.children.removeAll(true);

    const pw = 500;
    const ph = 300;
    const px = (GAME_WIDTH - pw) / 2;
    const py = (GAME_HEIGHT - ph) / 2;

    const panel = this.add.graphics();
    panel.fillStyle(COLORS.tabletBg, 0.95);
    panel.fillRoundedRect(px, py, pw, ph, 20);
    panel.lineStyle(2, COLORS.tabletBorder, 1);
    panel.strokeRoundedRect(px, py, pw, ph, 20);

    this.add.text(GAME_WIDTH / 2, py + 30, 'Choose Username', {
      fontSize: '22px', color: '#ffffff', fontFamily: 'Arial', fontStyle: 'bold',
    }).setOrigin(0.5);
    this.add.text(GAME_WIDTH / 2, py + 65, `Discord: ${discordUsername}`, {
      fontSize: '14px', color: '#aaaaaa', fontFamily: 'Arial',
    }).setOrigin(0.5);

    let useDiscordName = true;
    const toggleText = this.add.text(GAME_WIDTH / 2, py + 110, 'Use my Discord username ✅', {
      fontSize: '16px', color: '#ffffff', fontFamily: 'Arial',
      backgroundColor: '#2d2d44', padding: { x: 10, y: 5 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    toggleText.on('pointerdown', () => {
      useDiscordName = !useDiscordName;
      toggleText.setText(useDiscordName ? 'Use my Discord username ✅' : 'Let me create my own username');
      customInputZone.setVisible(!useDiscordName);
      customInputBg.setVisible(!useDiscordName);
    });

    const customInputBg = this.add.graphics();
    customInputBg.fillStyle(0x2d2d44, 1);
    customInputBg.fillRoundedRect(px + 60, py + 155, pw - 120, 35, 5);
    customInputBg.setVisible(false);

    let customUsername = '';
    const customInputText = this.add.text(px + 70, py + 172, '', {
      fontSize: '16px', color: '#ffffff', fontFamily: 'Arial',
    }).setOrigin(0, 0.5).setVisible(false);

    const customInputZone = this.add.zone(px + 60 + (pw - 120) / 2, py + 172, pw - 120, 35)
      .setInteractive({ useHandCursor: true }).setVisible(false);

    customInputZone.on('pointerdown', () => {
      this.currentInput = { value: customUsername, text: customInputText };
      this.input.keyboard.on('keydown', (event) => {
        if (event.key === 'Backspace') customUsername = customUsername.slice(0, -1);
        else if (event.key.length === 1) customUsername += event.key;
        customInputText.setText(customUsername);
      });
    });

    new RecolorableButton(this, px + 60, py + 220, pw - 120, 40, 'Next', COLORS.buttonGreen, async () => {
      const finalUsername = useDiscordName ? discordUsername : customUsername;
      if (!finalUsername) { this.showError('Please enter a username'); return; }

      const { error } = await supabase.from('profiles').update({
        username: finalUsername,
        auth_type: 'discord',
        discord_username: discordUsername,
        cash: 100,
        inventory: [],
        garden_data: {},
      }).eq('id', user.id);

      if (error) { this.showError(error.message); return; }

      this.showSuccess('Account created!');
      this.authSystem.saveUser({ id: user.id, username: finalUsername, type: 'discord' });
      this.progressComplete(() => this.scene.start(this.returnScene));
    });
  }

  showProgressBar(text) {
    if (this.progressContainer) this.hideProgressBar();
    this.progressContainer = this.add.container(0, 0);
    const pw = 300, ph = 60;
    const px = (GAME_WIDTH - pw) / 2, py = GAME_HEIGHT - 80;

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
    if (this.progressContainer) { this.progressContainer.destroy(); this.progressContainer = null; }
  }

  progressComplete(callback) {
    if (this.progressBar) {
      this.progressBar.onComplete(() => { this.hideProgressBar(); if (callback) callback(); });
    } else if (callback) { callback(); }
  }

  showError(msg) {
    if (this.errorText) this.errorText.setText(msg);
  }

  showSuccess(msg) {
    const t = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 100, msg, {
      fontSize: '16px', color: '#4ecca3', fontFamily: 'Arial',
    }).setOrigin(0.5).setDepth(200);
    this.time.delayedCall(2000, () => t.destroy());
  }

  setupGamepad() {
    this.input.gamepad.on('connected', (pad) => { this.gamepad = pad; });
  }

  update() {
    if (this.gamepad && this.gamepad.B) {
      this.scene.start(this.returnScene);
      this.gamepad = null;
    }
  }
}
