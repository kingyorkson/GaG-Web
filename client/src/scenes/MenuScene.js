import Phaser from 'phaser';
import { COLORS, GAME_WIDTH, GAME_HEIGHT, AUTH_TYPES } from '../config/constants.js';
import { RecolorableButton } from '../ui/RecolorableButton.js';
import { AuthSystem } from '../systems/AuthSystem.js';
import { NetworkSystem } from '../systems/NetworkSystem.js';
import { supabase } from '../systems/SupabaseClient.js';

export class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MenuScene' });
  }

  create() {
    this.authSystem = new AuthSystem();
    this.networkSystem = new NetworkSystem();
    this.currentUser = null;
    this.users = [];

    this.cameras.main.setBackgroundColor(COLORS.background);

    if (this.textures.exists('tablet_bg')) {
      this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'tablet_bg').setDisplaySize(GAME_WIDTH, GAME_HEIGHT).setAlpha(0.3);
    }

    this.tabletContainer = this.add.container(0, 0);
    this.createTabletFrame();
    this.createMenuContent();

    this.loadUsers();
    this.setupGamepad();
  }

  createTabletFrame() {
    const tw = GAME_WIDTH * 0.85;
    const th = GAME_HEIGHT * 0.85;
    const tx = (GAME_WIDTH - tw) / 2;
    const ty = (GAME_HEIGHT - th) / 2;

    const g = this.add.graphics();
    g.fillStyle(COLORS.tabletBg, 0.95);
    g.fillRoundedRect(tx, ty, tw, th, 20);
    g.lineStyle(3, COLORS.tabletBorder, 1);
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
    }).setOrigin(0.5);

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

    this.signInBtn = new RecolorableButton(this, btnX, titleY + 250, btnW, btnH, 'Sign In', COLORS.buttonGray, () => {
      this.scene.start('AuthScene', { returnScene: 'MenuScene' });
    });

    this.friendsBtn = new RecolorableButton(this, btnX, titleY + 325, btnW, btnH, 'Friends', COLORS.buttonGray, () => {
      this.openFriendsMenu();
    });

    this.userBtn = null;
    this.profileBtn = null;
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
    const overlay = this.add.graphics();
    overlay.fillStyle(0x000000, 0.7);
    overlay.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    const pw = 400;
    const ph = 300;
    const px = (GAME_WIDTH - pw) / 2;
    const py = (GAME_HEIGHT - ph) / 2;

    const panel = this.add.graphics();
    panel.fillStyle(COLORS.tabletBg, 0.95);
    panel.fillRoundedRect(px, py, pw, ph, 15);
    panel.lineStyle(2, COLORS.tabletBorder, 1);
    panel.strokeRoundedRect(px, py, pw, ph, 15);

    const titleText = this.add.text(GAME_WIDTH / 2, py + 25, 'Accounts', {
      fontSize: '22px', color: '#ffffff', fontFamily: 'Arial', fontStyle: 'bold',
    }).setOrigin(0.5);

    const accountsContainer = this.add.container(0, 0);
    let yOff = py + 60;

    this.users.forEach((user, idx) => {
      const isActive = this.currentUser && this.currentUser.id === user.id;
      const bgColor = user.type === AUTH_TYPES.DISCORD ? COLORS.buttonDiscord : COLORS.buttonGray;
      const btn = new RecolorableButton(this, px + 20, yOff, pw - 40, 40, user.username, isActive ? COLORS.buttonGreenOutline : bgColor, () => {
        this.switchUser(user);
        this.cleanupOverlay([overlay, panel, titleText, accountsContainer]);
      });
      if (isActive) {
        btn.setOutlineOnly(true);
      }
      yOff += 50;
    });

    const addBtn = new RecolorableButton(this, px + 20, py + ph - 50, pw - 40, 35, 'Add Account', COLORS.buttonGray, () => {
      this.cleanupOverlay([overlay, panel, titleText, accountsContainer]);
      this.scene.start('AuthScene', { returnScene: 'MenuScene' });
    });

    const closeBtn = new RecolorableButton(this, px + pw - 50, py + 10, 35, 35, 'X', COLORS.danger, () => {
      this.cleanupOverlay([overlay, panel, titleText, accountsContainer, addBtn, closeBtn]);
    });
  }

  switchUser(user) {
    this.currentUser = user;
    this.multiplayerBtn.setDisabled(false);
    this.multiplayerBtn.setColor(COLORS.buttonGreen);
    this.updateUserUI();
  }

  startSinglePlayer() {
    this.scene.start('LoadingScene', { mode: 'single', user: this.currentUser });
  }

  openFriendsMenu() {
    if (!this.currentUser) return;
    this.scene.start('TabletScene', { section: 'friends', user: this.currentUser });
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
