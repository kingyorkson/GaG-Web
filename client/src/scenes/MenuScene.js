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
      this.openMultiplayerMenu();
    });

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
    const overlay = this.add.graphics().setDepth(DEPTH.OVERLAY);
    overlay.fillStyle(0x0f0f23, 1);
    overlay.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    const titleText = this.add.text(GAME_WIDTH / 2, 60, 'Accounts', {
      fontSize: '28px', color: '#ffffff', fontFamily: 'Arial', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(DEPTH.OVERLAY + 10);

    let yOff = 120;
    this.users.forEach((user) => {
      const isActive = this.currentUser && this.currentUser.id === user.id;
      const bgColor = user.type === AUTH_TYPES.DISCORD ? COLORS.buttonDiscord : COLORS.buttonGray;
      const btn = new RecolorableButton(this, GAME_WIDTH / 2 - 140, yOff, 250, 40, user.username, isActive ? COLORS.buttonGreenOutline : bgColor, () => {
        this.switchUser(user);
        this.cleanupOverlay([overlay, titleText]);
      });
      if (isActive) {
        btn.setOutlineOnly(true);
      }

      const delBtn = new RecolorableButton(this, GAME_WIDTH / 2 + 120, yOff, 32, 36, 'X', COLORS.danger, () => {
        this.cleanupOverlay([overlay, titleText]);
        this.confirmDeleteAccount(user);
      });
      yOff += 50;
    });

    const addBtn = new RecolorableButton(this, GAME_WIDTH / 2 - 140, yOff + 20, 280, 45, 'Add Account', COLORS.buttonGray, () => {
      this.cleanupOverlay([overlay, titleText]);
      this.scene.start('AuthScene', { returnScene: 'MenuScene' });
    });

    const signOutBtn = new RecolorableButton(this, GAME_WIDTH / 2 - 140, yOff + 80, 280, 45, 'Sign Out', COLORS.danger, () => {
      this.cleanupOverlay([overlay, titleText]);
      this.signOut();
    });

    const backBtn = new RecolorableButton(this, GAME_WIDTH / 2 - 140, yOff + 140, 280, 45, 'Back', COLORS.buttonGray, () => {
      this.cleanupOverlay([overlay, titleText]);
    });
  }

  async confirmDeleteAccount(user) {
    const overlay = this.add.graphics().setDepth(DEPTH.OVERLAY);
    overlay.fillStyle(0x0f0f23, 1);
    overlay.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    const msg = this.add.text(GAME_WIDTH / 2, 140, `Delete "${user.username}"?\nThis cannot be undone.`, {
      fontSize: '22px', color: '#ffffff', fontFamily: 'Arial', align: 'center',
    }).setOrigin(0.5, 0.5).setDepth(DEPTH.OVERLAY + 10);

    const yesBtn = new RecolorableButton(this, GAME_WIDTH / 2 - 140, 240, 120, 45, 'Delete', COLORS.danger, async () => {
      this.cleanupOverlay([overlay, msg, yesBtn, noBtn]);
      await this.deleteAccount(user);
    });

    const noBtn = new RecolorableButton(this, GAME_WIDTH / 2 + 20, 240, 120, 45, 'Cancel', COLORS.buttonGray, () => {
      this.cleanupOverlay([overlay, msg, yesBtn, noBtn]);
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

  openMultiplayerMenu() {
    const overlay = this.add.graphics().setDepth(DEPTH.OVERLAY);
    overlay.fillStyle(0x0f0f23, 1);
    overlay.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    const titleText = this.add.text(GAME_WIDTH / 2, 60, 'Multiplayer', {
      fontSize: '28px', color: '#ffffff', fontFamily: 'Arial', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(DEPTH.OVERLAY + 10);

    const quickBtn = new RecolorableButton(this, GAME_WIDTH / 2 - 120, 140, 240, 50, 'Quick Play', COLORS.buttonGreen, () => {
      this.cleanupOverlay([overlay, titleText, quickBtn, joinBtn, serversBtn, backBtn]);
      this.scene.start('LoadingScene', { mode: 'multiplayer', user: this.currentUser });
    });

    const joinBtn = new RecolorableButton(this, GAME_WIDTH / 2 - 120, 210, 240, 50, 'Join Server', COLORS.buttonGray, () => {
      this.showMessage('Enter a server ID to join');
    });

    const serversBtn = new RecolorableButton(this, GAME_WIDTH / 2 - 120, 280, 240, 50, 'My Servers', COLORS.buttonGray, () => {
      this.showMessage('Create and manage your servers');
    });

    const backBtn = new RecolorableButton(this, GAME_WIDTH / 2 - 120, 380, 240, 50, 'Back', COLORS.danger, () => {
      this.cleanupOverlay([overlay, titleText, quickBtn, joinBtn, serversBtn, backBtn]);
    });
  }

  async openQRCodeModal() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      this.showMessage('Sign in first to use Mobile Code');
      return;
    }

    const overlay = this.add.graphics().setDepth(DEPTH.OVERLAY);
    overlay.fillStyle(0x0f0f23, 1);
    overlay.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    const titleText = this.add.text(GAME_WIDTH / 2, 60, 'Mobile App Sign-In Code', {
      fontSize: '24px', color: '#ffffff', fontFamily: 'Arial', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(DEPTH.OVERLAY + 10);

    const code = String(Math.floor(100000 + Math.random() * 900000));

    const { error: insertError } = await supabase
      .from('auth_codes')
      .insert({ code, user_id: user.id });

    if (insertError) {
      const errText = this.add.text(GAME_WIDTH / 2, 170, 'Server error - try again', {
        fontSize: '20px', color: '#ff4444', fontFamily: 'Arial',
      }).setOrigin(0.5).setDepth(DEPTH.OVERLAY + 10);

      const retryBtn = new RecolorableButton(this, GAME_WIDTH / 2 - 80, 230, 160, 45, 'Retry', COLORS.buttonGray, () => {
        this.cleanupOverlay([overlay, titleText, errText, retryBtn, backBtn]);
        this.openQRCodeModal();
      });

      const backBtn = new RecolorableButton(this, GAME_WIDTH / 2 - 80, 290, 160, 45, 'Back', COLORS.danger, () => {
        this.cleanupOverlay([overlay, titleText, errText, retryBtn, backBtn]);
      });
      return;
    }

    const codeText = this.add.text(GAME_WIDTH / 2, 160, code, {
      fontSize: '72px', color: '#4ecca3', fontFamily: 'Courier New', fontStyle: 'bold',
      letterSpacing: 16,
    }).setOrigin(0.5).setDepth(DEPTH.OVERLAY + 10);

    const hint = this.add.text(GAME_WIDTH / 2, 240, 'Open G&G Mobile on your iPhone\nand enter this code', {
      fontSize: '16px', color: '#aaaaaa', fontFamily: 'Arial',
      align: 'center',
    }).setOrigin(0.5).setDepth(DEPTH.OVERLAY + 10);

    const expireText = this.add.text(GAME_WIDTH / 2, 310, 'Expires in 5 minutes', {
      fontSize: '14px', color: '#888888', fontFamily: 'Arial',
    }).setOrigin(0.5).setDepth(DEPTH.OVERLAY + 10);

    const backBtn = new RecolorableButton(this, GAME_WIDTH / 2 - 60, 370, 120, 40, 'Close', COLORS.danger, () => {
      this.cleanupOverlay([overlay, titleText, codeText, hint, expireText, backBtn]);
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
    const overlay = this.add.graphics().setDepth(DEPTH.OVERLAY);
    overlay.fillStyle(0x0f0f23, 1);
    overlay.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    const titleText = this.add.text(GAME_WIDTH / 2, 60, 'Settings', {
      fontSize: '28px', color: '#ffffff', fontFamily: 'Arial', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(DEPTH.OVERLAY + 10);

    const cloudLabel = this.add.text(GAME_WIDTH / 2 - 120, 140, 'Cloud Save Sync', {
      fontSize: '18px', color: '#ffffff', fontFamily: 'Arial',
    }).setDepth(DEPTH.OVERLAY + 10);

    const savedSettings = this.saveSystem.getSettings();
    const initialCloudState = savedSettings.cloudSyncEnabled !== false;

    this.cloudSyncToggle = new RecolorableButton(this, GAME_WIDTH / 2 + 50, 130, 70, 35, '', COLORS.buttonGray, () => {
      this.cloudSyncToggle.isOn = !this.cloudSyncToggle.isOn;
      this.saveSystem.setSetting('cloudSyncEnabled', this.cloudSyncToggle.isOn);
      this.cloudSyncToggle.setColor(this.cloudSyncToggle.isOn ? COLORS.buttonGreen : COLORS.buttonGray);
      this.cloudSyncToggle.setText(this.cloudSyncToggle.isOn ? 'ON' : 'OFF');
    });
    this.cloudSyncToggle.isOn = initialCloudState;
    this.cloudSyncToggle.setColor(initialCloudState ? COLORS.buttonGreen : COLORS.buttonGray);
    this.cloudSyncToggle.setText(initialCloudState ? 'ON' : 'OFF');

    const conflictInfo = this.add.text(GAME_WIDTH / 2, 190, 'Check for save conflicts between local and cloud\nwhen starting the game.', {
      fontSize: '13px', color: '#888888', fontFamily: 'Arial', align: 'center',
    }).setOrigin(0.5).setDepth(DEPTH.OVERLAY + 10);

    const backBtn = new RecolorableButton(this, GAME_WIDTH / 2 - 80, 270, 160, 45, 'Back', COLORS.danger, () => {
      this.cleanupOverlay([overlay, titleText, cloudLabel, conflictInfo, backBtn, this.cloudSyncToggle]);
    });
  }

  async openFriendsMenu() {
    const overlay = this.add.graphics().setDepth(DEPTH.OVERLAY);
    overlay.fillStyle(0x0f0f23, 1);
    overlay.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    const titleText = this.add.text(GAME_WIDTH / 2, 40, 'Friends', {
      fontSize: '28px', color: '#ffffff', fontFamily: 'Arial', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(DEPTH.OVERLAY + 10);

    const elements = [overlay, titleText];
    let yOff = 90;
    let sectionY = yOff;

    if (!this.currentUser) {
      this.add.text(GAME_WIDTH / 2, sectionY, 'Sign in to use friends.', {
        fontSize: '18px', color: '#888888', fontFamily: 'Arial',
      }).setOrigin(0.5).setDepth(DEPTH.OVERLAY + 10);
    } else {
      const addBtn = new RecolorableButton(this, GAME_WIDTH - 160, 35, 140, 35, 'Add Friend', COLORS.buttonGreen, () => {
        this.cleanupOverlay(elements);
        this.openAddFriend();
      });
      elements.push(addBtn);

      const [friendList, pendingRequests] = await Promise.all([
        this.networkSystem.getFriends(),
        this.networkSystem.getPendingFriendRequests(),
      ]);

      const friendNames = new Set(friendList.map(f => f.id));

      if (pendingRequests.length > 0) {
        this.add.text(GAME_WIDTH / 2 - 150, sectionY, 'Pending Requests:', {
          fontSize: '16px', color: '#ffcc00', fontFamily: 'Arial', fontStyle: 'bold',
        }).setDepth(DEPTH.OVERLAY + 10);
        sectionY += 30;
        pendingRequests.forEach((r, i) => {
          const y = sectionY + i * 40;
          this.add.text(GAME_WIDTH / 2 - 150, y, `${r.username} wants to be friends`, {
            fontSize: '15px', color: '#ffffff', fontFamily: 'Arial',
          }).setDepth(DEPTH.OVERLAY + 10);
          const acceptBtn = new RecolorableButton(this, GAME_WIDTH / 2 + 50, y - 8, 80, 30, 'Accept', COLORS.buttonGreen, async () => {
            await this.networkSystem.acceptFriendRequest(r.id);
            this.cleanupOverlay(elements);
            this.openFriendsMenu();
          });
          elements.push(acceptBtn);
          const declineBtn = new RecolorableButton(this, GAME_WIDTH / 2 + 140, y - 8, 80, 30, 'Decline', COLORS.danger, async () => {
            await this.networkSystem.declineFriendRequest(r.id);
            this.cleanupOverlay(elements);
            this.openFriendsMenu();
          });
          elements.push(declineBtn);
        });
        sectionY += pendingRequests.length * 40 + 20;
      }

      this.add.text(GAME_WIDTH / 2 - 150, sectionY, 'My Friends:', {
        fontSize: '16px', color: '#4ecca3', fontFamily: 'Arial', fontStyle: 'bold',
      }).setDepth(DEPTH.OVERLAY + 10);
      sectionY += 30;

      if (friendList.length === 0) {
        this.add.text(GAME_WIDTH / 2, sectionY, 'No friends yet. Press "Add Friend" to find someone!', {
          fontSize: '15px', color: '#888888', fontFamily: 'Arial',
        }).setOrigin(0.5).setDepth(DEPTH.OVERLAY + 10);
      } else {
        friendList.forEach((f, i) => {
          this.add.text(GAME_WIDTH / 2 - 150, sectionY + i * 35, `• ${f.username}`, {
            fontSize: '16px', color: '#ffffff', fontFamily: 'Arial',
          }).setDepth(DEPTH.OVERLAY + 10);
        });
      }
    }

    const backBtn = new RecolorableButton(this, GAME_WIDTH / 2 - 80, GAME_HEIGHT - 65, 160, 45, 'Back', COLORS.danger, () => {
      this.cleanupOverlay(elements);
    });
    elements.push(backBtn);
  }

  openAddFriend() {
    const overlay = this.add.graphics().setDepth(DEPTH.OVERLAY);
    overlay.fillStyle(0x0f0f23, 1);
    overlay.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    const titleText = this.add.text(GAME_WIDTH / 2, 50, 'Add Friend', {
      fontSize: '28px', color: '#ffffff', fontFamily: 'Arial', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(DEPTH.OVERLAY + 10);

    const hintText = this.add.text(GAME_WIDTH / 2, 100, 'Enter a username to search:', {
      fontSize: '16px', color: '#aaaaaa', fontFamily: 'Arial',
    }).setOrigin(0.5).setDepth(DEPTH.OVERLAY + 10);

    const elements = [overlay, titleText, hintText];
    let inputObj = null;

    const x = GAME_WIDTH / 2 - 120;
    const y = 135;
    const w = 240;
    const h = 35;

    const bg = this.add.graphics().setDepth(DEPTH.OVERLAY + 10);
    bg.fillStyle(0x2d2d44, 1);
    bg.fillRoundedRect(x, y, w, h, 5);
    bg.lineStyle(1, 0x555555, 1);
    bg.strokeRoundedRect(x, y, w, h, 5);
    elements.push(bg);

    const text = this.add.text(x + 10, y + h / 2, '', {
      fontSize: '16px', color: '#ffffff', fontFamily: 'Arial',
    }).setOrigin(0, 0.5).setDepth(DEPTH.OVERLAY + 10);
    elements.push(text);

    const placeholderText = this.add.text(x + 10, y + h / 2, 'username', {
      fontSize: '16px', color: '#555555', fontFamily: 'Arial',
    }).setOrigin(0, 0.5).setDepth(DEPTH.OVERLAY + 10);
    elements.push(placeholderText);

    const statusText = this.add.text(GAME_WIDTH / 2, 195, '', {
      fontSize: '14px', color: '#4ecca3', fontFamily: 'Arial',
    }).setOrigin(0.5).setDepth(DEPTH.OVERLAY + 10);
    elements.push(statusText);

    inputObj = { bg, text, placeholderText, value: '', x, y, w, h, focused: false };

    const zone = this.add.zone(x + w / 2, y + h / 2, w, h).setInteractive({ useHandCursor: true }).setDepth(DEPTH.OVERLAY + 10);
    zone.on('pointerdown', () => {
      inputObj.focused = true;
      bg.clear();
      bg.fillStyle(0x3d3d55, 1);
      bg.fillRoundedRect(x, y, w, h, 5);
      bg.lineStyle(2, 0x4ecca3, 1);
      bg.strokeRoundedRect(x, y, w, h, 5);
      this.currentInput = inputObj;
    });
    elements.push(zone);

    const sendBtn = new RecolorableButton(this, GAME_WIDTH / 2 - 60, 220, 120, 40, 'Send Request', COLORS.buttonGreen, async () => {
      const name = inputObj.value.trim();
      if (!name) { statusText.setText('Enter a username'); return; }
      statusText.setText('Searching...');
      sendBtn.setDisabled(true);
      const result = await this.networkSystem.sendFriendRequest(name);
      if (result.success) {
        statusText.setText('Friend request sent!');
        inputObj.value = '';
        text.setText('');
        placeholderText.setVisible(true);
      } else {
        statusText.setText(result.error || 'Failed to send request');
      }
      sendBtn.setDisabled(false);
    });
    elements.push(sendBtn);

    const keyboardHandler = (event) => {
      if (!inputObj.focused) return;
      if (event.key === 'Backspace') {
        inputObj.value = inputObj.value.slice(0, -1);
      } else if (event.key === 'Enter') {
        inputObj.focused = false;
        bg.clear();
        bg.fillStyle(0x2d2d44, 1);
        bg.fillRoundedRect(x, y, w, h, 5);
        bg.lineStyle(1, 0x555555, 1);
        bg.strokeRoundedRect(x, y, w, h, 5);
        const name = inputObj.value.trim();
        if (!name) { statusText.setText('Enter a username'); return; }
        statusText.setText('Searching...');
        sendBtn.setDisabled(true);
        this.networkSystem.sendFriendRequest(name).then(result => {
          if (result.success) {
            statusText.setText('Friend request sent!');
            inputObj.value = '';
            text.setText('');
            placeholderText.setVisible(true);
          } else {
            statusText.setText(result.error || 'Failed to send request');
          }
          sendBtn.setDisabled(false);
        });
        return;
      } else if (event.key.length === 1) {
        inputObj.value += event.key;
      }
      text.setText(inputObj.value);
      placeholderText.setVisible(inputObj.value.length === 0);
    };

    this.input.keyboard.on('keydown', keyboardHandler);
    elements.push({ destroy: () => this.input.keyboard.off('keydown', keyboardHandler) });

    const backBtn = new RecolorableButton(this, GAME_WIDTH / 2 - 80, GAME_HEIGHT - 65, 160, 45, 'Back', COLORS.danger, () => {
      this.input.keyboard.off('keydown', keyboardHandler);
      this.cleanupOverlay(elements);
      this.openFriendsMenu();
    });
    elements.push(backBtn);
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
