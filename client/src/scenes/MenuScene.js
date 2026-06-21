import Phaser from 'phaser';
import { COLORS, GAME_WIDTH, GAME_HEIGHT, AUTH_TYPES } from '../config/constants.js';
import { RecolorableButton } from '../ui/RecolorableButton.js';
import { AuthSystem } from '../systems/AuthSystem.js';
import { SaveSystem } from '../systems/SaveSystem.js';
import { NetworkSystem } from '../systems/NetworkSystem.js';
import { supabase } from '../systems/SupabaseClient.js';

const DEPTH = {
  BG: 0,
  CONTAINER: 5,
  FRAME: 10,
  CONTENT: 20,
  BUTTONS: 30,
  OVERLAY: 100,
};

export class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MenuScene' });
  }

  init(data) {
    this.autoLogin = data?.autoLogin || null;
  }

  create() {
    this.authSystem = new AuthSystem();
    this.networkSystem = new NetworkSystem();
    this.saveSystem = new SaveSystem();
    this.currentUser = null;
    this.users = [];

    this.cameras.main.setBackgroundColor(COLORS.background);

    if (this.textures.exists('tablet_bg')) {
      this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'tablet_bg')
        .setDisplaySize(GAME_WIDTH, GAME_HEIGHT).setAlpha(0.3).setDepth(DEPTH.BG);
    }

    this.tabletContainer = this.add.container(0, 0).setDepth(DEPTH.CONTAINER);
    this.createTabletFrame();
    this.createMenuContent();

    this.loadUsers();
    this.setupGamepad();

    if (this.autoLogin) {
      this.switchUser(this.autoLogin);
    }
  }

  createTabletFrame() {
    const tw = GAME_WIDTH * 0.85;
    const th = GAME_HEIGHT * 0.85;
    const tx = (GAME_WIDTH - tw) / 2;
    const ty = (GAME_HEIGHT - th) / 2;

    const g = this.add.graphics().setDepth(DEPTH.FRAME);
    g.fillStyle(COLORS.tabletBg, 0.92);
    g.fillRoundedRect(tx, ty, tw, th, 20);
    g.lineStyle(3, 0x4ecca3, 0.8);
    g.strokeRoundedRect(tx, ty, tw, th, 20);

    this.tabletBounds = { x: tx, y: ty, w: tw, h: th };
    this.tabletContainer.add(g);
  }

  createMenuContent() {
    const bounds = this.tabletBounds;
    const cx = GAME_WIDTH / 2;
    const titleY = bounds.y + 60;

    this.add.text(cx, titleY, 'Growing & Gardening 2D', {
      fontSize: '36px',
      color: '#ffffff',
      fontFamily: 'Arial',
      fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(DEPTH.CONTENT);

    const btnW = 260;
    const btnH = 55;
    const btnX = cx - btnW / 2;

    this.singlePlayerBtn = new RecolorableButton(this, btnX, titleY + 100, btnW, btnH, 'Single Player', COLORS.buttonGreen, () => {
      this.startSinglePlayer();
    });

    this.multiplayerBtn = new RecolorableButton(this, btnX, titleY + 175, btnW, btnH, 'Multiplayer', COLORS.buttonGray, () => {
      if (this.currentUser) {
        this.scene.start('LoadingScene', { mode: 'multiplayer', user: this.currentUser });
      }
    });
    this.multiplayerBtn.setDisabled(true);

    this.friendsBtn = new RecolorableButton(this, btnX, titleY + 250, btnW, btnH, 'Friends', COLORS.buttonGray, () => {
      this.openFriendsMenu();
    });

    this.settingsBtn = new RecolorableButton(this, btnX, titleY + 325, btnW, btnH, 'Settings', COLORS.buttonGray, () => {
      this.openSettingsMenu();
    });

    this.userBtn = null;
    this.profileBtn = null;

    this.mobileQRBtn = new RecolorableButton(this, GAME_WIDTH - 160, GAME_HEIGHT - 50, 140, 35, 'Mobile Code', COLORS.buttonGray, () => {
      this.openQRCodeModal();
    });
  }

  async loadUsers() {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('username, auth_type, discord_username, cash')
        .eq('id', session.user.id)
        .single();

      if (profile) {
        this.currentUser = {
          id: session.user.id,
          username: profile.username,
          type: profile.auth_type,
          cash: profile.cash || 100,
          inventory: [],
        };
        this.switchUser(this.currentUser);
      }
    }
    this.updateUserUI();
  }

  updateUserUI() {
    if (this.userBtn) { this.userBtn.destroy(); this.userBtn = null; }
    if (this.profileBtn) { this.profileBtn.destroy(); this.profileBtn = null; }

    const bounds = this.tabletBounds;
    const topRightX = bounds.x + bounds.w - 10;

    if (this.currentUser) {
      this.profileBtn = new RecolorableButton(this, topRightX - 120, bounds.y + 15, 110, 35, 'Profile', COLORS.buttonGray, () => {
        this.openProfileMenu();
      });

      const nameText = this.add.text(topRightX - 240, bounds.y + 22, this.currentUser.username, {
        fontSize: '16px',
        color: '#ffffff',
        fontFamily: 'Arial',
      }).setOrigin(1, 0.5);
    } else {
      this.userBtn = new RecolorableButton(this, topRightX - 120, bounds.y + 15, 110, 35, 'Sign In', COLORS.buttonGray, () => {
        this.scene.start('AuthScene', { returnScene: 'MenuScene' });
      });
    }
  }

  openProfileMenu() {
    const bounds = this.tabletBounds;
    const overlay = this.add.graphics().setDepth(DEPTH.OVERLAY);
    overlay.fillStyle(0x000000, 0.7);
    overlay.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    const pw = 400;
    const ph = 350;
    const px = (GAME_WIDTH - pw) / 2;
    const py = (GAME_HEIGHT - ph) / 2;

    const panel = this.add.graphics().setDepth(DEPTH.OVERLAY);
    panel.fillStyle(COLORS.tabletBg, 0.95);
    panel.fillRoundedRect(px, py, pw, ph, 15);
    panel.lineStyle(2, COLORS.tabletBorder, 1);
    panel.strokeRoundedRect(px, py, pw, ph, 15);

    const titleText = this.add.text(GAME_WIDTH / 2, py + 25, 'Accounts', {
      fontSize: '22px', color: '#ffffff', fontFamily: 'Arial', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(DEPTH.OVERLAY);

    const accountsContainer = this.add.container(0, 0);
    let yOff = py + 60;

    this.users.forEach((user, idx) => {
      const isActive = this.currentUser && this.currentUser.id === user.id;
      const bgColor = user.type === AUTH_TYPES.DISCORD ? COLORS.buttonDiscord : COLORS.buttonGray;
      const btn = new RecolorableButton(this, px + 20, yOff, pw - 80, 40, user.username, isActive ? COLORS.buttonGreenOutline : bgColor, () => {
        this.switchUser(user);
        this.cleanupOverlay([overlay, panel, titleText, accountsContainer]);
      });
      if (isActive) {
        btn.setOutlineOnly(true);
      }

      const delBtn = new RecolorableButton(this, px + pw - 55, yOff + 2, 32, 36, 'X', COLORS.danger, () => {
        this.cleanupOverlay([overlay, panel, titleText, accountsContainer]);
        this.confirmDeleteAccount(user);
      });
      yOff += 50;
    });

    const addBtn = new RecolorableButton(this, px + 20, py + ph - 95, pw - 40, 35, 'Add Account', COLORS.buttonGray, () => {
      this.cleanupOverlay([overlay, panel, titleText, accountsContainer]);
      this.scene.start('AuthScene', { returnScene: 'MenuScene' });
    });

    const signOutBtn = new RecolorableButton(this, px + 20, py + ph - 50, pw - 40, 35, 'Sign Out', COLORS.danger, () => {
      this.cleanupOverlay([overlay, panel, titleText, accountsContainer]);
      this.signOut();
    });

    const closeBtn = new RecolorableButton(this, px + pw - 50, py + 10, 35, 35, 'X', COLORS.danger, () => {
      this.cleanupOverlay([overlay, panel, titleText, accountsContainer, addBtn, signOutBtn, closeBtn]);
    });
  }

  async confirmDeleteAccount(user) {
    const overlay = this.add.graphics().setDepth(DEPTH.OVERLAY + 10);
    overlay.fillStyle(0x000000, 0.8);
    overlay.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    const pw = 320;
    const ph = 180;
    const px = (GAME_WIDTH - pw) / 2;
    const py = (GAME_HEIGHT - ph) / 2;

    const panel = this.add.graphics().setDepth(DEPTH.OVERLAY + 10);
    panel.fillStyle(COLORS.tabletBg, 0.95);
    panel.fillRoundedRect(px, py, pw, ph, 15);
    panel.lineStyle(2, COLORS.tabletBorder, 1);
    panel.strokeRoundedRect(px, py, pw, ph, 15);

    const msg = this.add.text(GAME_WIDTH / 2, py + 40, `Delete "${user.username}"?\nThis cannot be undone.`, {
      fontSize: '16px', color: '#ffffff', fontFamily: 'Arial', align: 'center',
    }).setOrigin(0.5, 0.5).setDepth(DEPTH.OVERLAY + 20);

    const yesBtn = new RecolorableButton(this, px + 30, py + 110, 120, 40, 'Delete', COLORS.danger, async () => {
      this.cleanupOverlay([overlay, panel, msg, yesBtn, noBtn]);
      await this.deleteAccount(user);
    });

    const noBtn = new RecolorableButton(this, px + pw - 150, py + 110, 120, 40, 'Cancel', COLORS.buttonGray, () => {
      this.cleanupOverlay([overlay, panel, msg, yesBtn, noBtn]);
      this.openProfileMenu();
    });
  }

  async deleteAccount(user) {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { error } = await supabase.rpc('delete_user_account');
    if (error) {
      this.showMessage('Failed to delete account');
      return;
    }

    if (this.currentUser && this.currentUser.id === user.id) {
      await supabase.auth.signOut();
      this.currentUser = null;
      this.users = this.users.filter(u => u.id !== user.id);
      this.switchUser(null);
      this.updateUserUI();
    } else {
      this.users = this.users.filter(u => u.id !== user.id);
    }

    this.showMessage('Account deleted');
  }

  async signOut() {
    await supabase.auth.signOut();
    this.currentUser = null;
    this.switchUser(null);
    this.updateUserUI();
    this.showMessage('Signed out');
  }

  async openQRCodeModal() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      this.showMessage('Sign in first to use Mobile Code');
      return;
    }

    const overlay = this.add.graphics().setDepth(DEPTH.OVERLAY + 10);
    overlay.fillStyle(0x000000, 0.8);
    overlay.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    const pw = 400;
    const ph = 360;
    const px = (GAME_WIDTH - pw) / 2;
    const py = (GAME_HEIGHT - ph) / 2;

    const panel = this.add.graphics().setDepth(DEPTH.OVERLAY + 10);
    panel.fillStyle(COLORS.tabletBg, 0.95);
    panel.fillRoundedRect(px, py, pw, ph, 15);
    panel.lineStyle(2, COLORS.tabletBorder, 1);
    panel.strokeRoundedRect(px, py, pw, ph, 15);

    const titleText = this.add.text(GAME_WIDTH / 2, py + 25, 'Mobile App Sign-In Code', {
      fontSize: '18px', color: '#ffffff', fontFamily: 'Arial', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(DEPTH.OVERLAY + 20);

    const code = String(Math.floor(100000 + Math.random() * 900000));

    const { error: insertError } = await supabase
      .from('auth_codes')
      .insert({ code, user_id: user.id });

    if (insertError) {
      const errText = this.add.text(GAME_WIDTH / 2, py + 120, 'Server error - try again', {
        fontSize: '18px', color: '#ff4444', fontFamily: 'Arial',
      }).setOrigin(0.5).setDepth(DEPTH.OVERLAY + 20);

      const retryBtn = new RecolorableButton(this, GAME_WIDTH / 2 - 60, py + 180, 120, 35, 'Retry', COLORS.buttonGray, () => {
        this.cleanupOverlay([overlay, panel, titleText, errText, retryBtn, closeBtn]);
        this.openQRCodeModal();
      });

      const closeBtn = new RecolorableButton(this, px + pw - 50, py + 10, 35, 35, 'X', COLORS.danger, () => {
        this.cleanupOverlay([overlay, panel, titleText, errText, retryBtn, closeBtn]);
      });
      return;
    }

    const codeText = this.add.text(GAME_WIDTH / 2, py + 110, code, {
      fontSize: '64px', color: '#4ecca3', fontFamily: 'Courier New', fontStyle: 'bold',
      letterSpacing: 12,
    }).setOrigin(0.5).setDepth(DEPTH.OVERLAY + 20);

    const hint = this.add.text(GAME_WIDTH / 2, py + 180, 'Open G&G Mobile on your iPhone\nand enter this code', {
      fontSize: '14px', color: '#aaaaaa', fontFamily: 'Arial',
      align: 'center',
    }).setOrigin(0.5).setDepth(DEPTH.OVERLAY + 20);

    const expireText = this.add.text(GAME_WIDTH / 2, py + 250, 'Expires in 5 minutes', {
      fontSize: '12px', color: '#888888', fontFamily: 'Arial',
    }).setOrigin(0.5).setDepth(DEPTH.OVERLAY + 20);

    const closeBtn = new RecolorableButton(this, px + pw - 50, py + 10, 35, 35, 'X', COLORS.danger, () => {
      this.cleanupOverlay([overlay, panel, titleText, codeText, hint, expireText, closeBtn]);
    });
  }

  switchUser(user) {
    this.currentUser = user;
    if (user) {
      this.multiplayerBtn.setDisabled(false);
      this.multiplayerBtn.setColor(COLORS.buttonGreen);
    } else {
      this.multiplayerBtn.setDisabled(true);
      this.multiplayerBtn.setColor(COLORS.buttonGray);
    }
    this.updateUserUI();
  }

  startSinglePlayer(forceCloud = null) {
    const saved = this.saveSystem.loadLocal();
    if (saved && this.currentUser) {
      const settings = this.saveSystem.getSettings();
      const cloudConflictCheck = settings.cloudSyncEnabled || (this.cloudSyncToggle && this.cloudSyncToggle.isOn);
      if (cloudConflictCheck) {
        this.checkCloudConflict(saved);
      } else {
        this.startGameWithSave(saved);
      }
    } else {
      this.startGameWithSave(saved);
    }
  }

  async startGameWithSave(saved) {
    if (saved && saved.gardens) {
      this.scene.start('LoadingScene', {
        mode: 'single',
        user: this.currentUser,
        savedGardens: saved.gardens,
      });
    } else {
      this.scene.start('LoadingScene', { mode: 'single', user: this.currentUser });
    }
  }

  async checkCloudConflict(localData) {
    const cloudData = await this.saveSystem.loadCloud();
    if (!cloudData) {
      this.startGameWithSave(localData);
      return;
    }

    const localTime = localData.lastModified || 0;
    const cloudTime = cloudData.lastModified || 0;
    const diff = Math.abs(localTime - cloudTime);

    if (diff > 5000) {
      this.showConflictPopup(localData, cloudData, localTime, cloudTime);
    } else {
      const latest = localTime >= cloudTime ? localData : cloudData;
      this.startGameWithSave(latest);
    }
  }

  showConflictPopup(localData, cloudData, localTime, cloudTime) {
    const bounds = this.tabletBounds;
    const pw = 500;
    const ph = 300;
    const px = (GAME_WIDTH - pw) / 2;
    const py = (GAME_HEIGHT - ph) / 2;

    const overlay = this.add.graphics().setDepth(DEPTH.OVERLAY + 10);
    overlay.fillStyle(0x000000, 0.8);
    overlay.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    const panel = this.add.graphics().setDepth(DEPTH.OVERLAY + 10);
    panel.fillStyle(COLORS.tabletBg, 0.95);
    panel.fillRoundedRect(px, py, pw, ph, 15);
    panel.lineStyle(2, 0xff4444, 1);
    panel.strokeRoundedRect(px, py, pw, ph, 15);

    const titleText = this.add.text(GAME_WIDTH / 2, py + 30, 'Save Conflict Detected', {
      fontSize: '22px', color: '#ff4444', fontFamily: 'Arial', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(DEPTH.OVERLAY + 20);

    const fmt = (ts) => {
      if (!ts) return 'Never';
      const d = new Date(ts);
      return `${d.toLocaleDateString()} ${d.toLocaleTimeString()}`;
    };

    const localStr = `Local: ${fmt(localTime)}`;
    const cloudStr = `Cloud: ${fmt(cloudTime)}`;

    const localLabel = this.add.text(px + 30, py + 75, localStr, {
      fontSize: '15px', color: '#cccccc', fontFamily: 'Arial',
    }).setDepth(DEPTH.OVERLAY + 20);

    const cloudLabel = this.add.text(px + 30, py + 105, cloudStr, {
      fontSize: '15px', color: '#cccccc', fontFamily: 'Arial',
    }).setDepth(DEPTH.OVERLAY + 20);

    const useLocalBtn = new RecolorableButton(this, px + 30, py + 150, 200, 45, 'Use Local Save', COLORS.buttonGreen, () => {
      this.cleanupOverlay([overlay, panel, titleText, localLabel, cloudLabel, useLocalBtn, useCloudBtn, cancelConflictBtn]);
      this.startGameWithSave(localData);
    });

    const useCloudBtn = new RecolorableButton(this, px + pw - 230, py + 150, 200, 45, 'Use Cloud Save', COLORS.buttonGray, () => {
      if (this.currentUser && this.saveSystem) {
        this.saveSystem.saveCloud(cloudData);
      }
      this.cleanupOverlay([overlay, panel, titleText, localLabel, cloudLabel, useLocalBtn, useCloudBtn, cancelConflictBtn]);
      this.startGameWithSave(cloudData);
    });

    const cancelConflictBtn = new RecolorableButton(this, GAME_WIDTH / 2 - 50, py + ph - 50, 100, 35, 'Cancel', COLORS.buttonGray, () => {
      this.cleanupOverlay([overlay, panel, titleText, localLabel, cloudLabel, useLocalBtn, useCloudBtn, cancelConflictBtn]);
    });
  }

  openSettingsMenu() {
    const bounds = this.tabletBounds;
    const pw = 400;
    const ph = 280;
    const px = (GAME_WIDTH - pw) / 2;
    const py = (GAME_HEIGHT - ph) / 2;

    const overlay = this.add.graphics().setDepth(DEPTH.OVERLAY);
    overlay.fillStyle(0x000000, 0.7);
    overlay.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    const panel = this.add.graphics().setDepth(DEPTH.OVERLAY);
    panel.fillStyle(COLORS.tabletBg, 0.95);
    panel.fillRoundedRect(px, py, pw, ph, 15);
    panel.lineStyle(2, COLORS.tabletBorder, 1);
    panel.strokeRoundedRect(px, py, pw, ph, 15);

    const titleText = this.add.text(GAME_WIDTH / 2, py + 25, 'Settings', {
      fontSize: '22px', color: '#ffffff', fontFamily: 'Arial', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(DEPTH.OVERLAY);

    const cloudLabel = this.add.text(px + 20, py + 70, 'Cloud Save Sync', {
      fontSize: '16px', color: '#ffffff', fontFamily: 'Arial',
    }).setDepth(DEPTH.OVERLAY);

    const savedSettings = this.saveSystem.getSettings();
    const initialCloudState = savedSettings.cloudSyncEnabled !== false;

    this.cloudSyncToggle = new RecolorableButton(this, px + pw - 80, py + 62, 60, 30, '', COLORS.buttonGray, () => {
      this.cloudSyncToggle.isOn = !this.cloudSyncToggle.isOn;
      this.saveSystem.setSetting('cloudSyncEnabled', this.cloudSyncToggle.isOn);
      this.cloudSyncToggle.setColor(this.cloudSyncToggle.isOn ? COLORS.buttonGreen : COLORS.buttonGray);
      this.cloudSyncToggle.setText(this.cloudSyncToggle.isOn ? 'ON' : 'OFF');
    });
    this.cloudSyncToggle.isOn = initialCloudState;
    this.cloudSyncToggle.setColor(initialCloudState ? COLORS.buttonGreen : COLORS.buttonGray);
    this.cloudSyncToggle.setText(initialCloudState ? 'ON' : 'OFF');

    const conflictInfo = this.add.text(px + 20, py + 110, 'Check for save conflicts between\nlocal and cloud when starting the game.', {
      fontSize: '12px', color: '#888888', fontFamily: 'Arial',
    }).setDepth(DEPTH.OVERLAY);

    const closeBtn = new RecolorableButton(this, px + pw - 50, py + 10, 35, 35, 'X', COLORS.danger, () => {
      this.cleanupOverlay([overlay, panel, titleText, cloudLabel, conflictInfo, closeBtn, this.cloudSyncToggle]);
    });
  }

  openFriendsMenu() {
    if (!this.currentUser) return;
    this.scene.start('TabletScene', { section: 'friends', user: this.currentUser });
  }

  showMessage(msg) {
    const text = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 90, msg, {
      fontSize: '14px', color: '#4ecca3', fontFamily: 'Arial',
      backgroundColor: '#00000088', padding: { x: 8, y: 4 },
    }).setOrigin(0.5).setDepth(DEPTH.OVERLAY + 50);
    this.time.delayedCall(2000, () => text.destroy());
  }

  setupGamepad() {
    this.input.gamepad.on('connected', (pad) => {
      this.gamepad = pad;
    });
  }

  update() {
    if (this.gamepad) {
      if (Phaser.Input.Gamepad.Gamepad && this.gamepad.A) {
        if (this.singlePlayerBtn && this.singlePlayerBtn.visible) {
          this.startSinglePlayer();
          this.gamepad = null;
        }
      }
    }
  }

  cleanupOverlay(objects) {
    objects.forEach(obj => {
      if (obj && obj.destroy) obj.destroy();
    });
  }
}
