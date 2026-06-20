import Phaser from 'phaser';
import { COLORS, GAME_WIDTH, GAME_HEIGHT } from '../config/constants.js';
import { RecolorableButton } from '../ui/RecolorableButton.js';
import { SEEDS, getRandomRestock, RESTOCK_INTERVAL } from '../config/seeds.js';
import { supabase } from '../systems/SupabaseClient.js';
import { ChatSystem } from '../systems/ChatSystem.js';
import { CallSystem } from '../systems/CallSystem.js';

export class TabletScene extends Phaser.Scene {
  constructor() {
    super({ key: 'TabletScene' });
  }

  init(data) {
    this.userData = data || {};
    this.section = data.section || null;
  }

  create() {
    this.cameras.main.setBackgroundColor(0x000000);

    const tw = GAME_WIDTH * 0.88;
    const th = GAME_HEIGHT * 0.9;
    const tx = (GAME_WIDTH - tw) / 2;
    const ty = (GAME_HEIGHT - th) / 2;
    this.bounds = { x: tx, y: ty, w: tw, h: th };

    const overlay = this.add.graphics();
    overlay.fillStyle(0x000000, 0.3);
    overlay.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    const panel = this.add.graphics();
    panel.fillStyle(COLORS.tabletBg, 0.97);
    panel.fillRoundedRect(tx, ty, tw, th, 25);
    panel.lineStyle(3, COLORS.tabletBorder, 1);
    panel.strokeRoundedRect(tx, ty, tw, th, 25);

    this.cashText = this.add.text(tx + tw - 20, ty + 20, `Cash: $${this.userData.cash || 0}`, {
      fontSize: '18px', color: '#ffd700', fontFamily: 'Arial', fontStyle: 'bold',
    }).setOrigin(1, 0);

    this.chatSystem = new ChatSystem();
    this.callSystem = new CallSystem();

    this.setupCallSubscriptions();
    this.setupKeyboard();

    this.createTabButtons();
    this.createHomeButton();

    if (this.section === 'friends') {
      this.switchTab('friends');
    } else {
      this.currentTab = 'main';
      this.showMainMenu();
    }
  }

  setupCallSubscriptions() {
    this.callSystem.onIncomingCall = (call) => {
      this.playRingSound();
      this.callSystem.sendNotification('Incoming Call', `${call.from_user_id} is calling you`);
      this.showIncomingCallUI(call);
    };
    this.callSystem.onCallUpdate = (call) => {
      if (call.status === 'answered' && this.callActiveOverlay) {
        this.callActiveOverlay.destroy();
        this.callActiveOverlay = null;
        this.showActiveCallUI(call);
      } else if (call.status === 'declined' || call.status === 'ended') {
        if (this.callActiveOverlay) { this.callActiveOverlay.destroy(); this.callActiveOverlay = null; }
        if (this.incomingCallOverlay) { this.incomingCallOverlay.destroy(); this.incomingCallOverlay = null; }
      }
    };
    if (this.userData.user?.id) {
      this.callSystem.subscribeToCalls(this.userData.user.id);
    }
  }

  setupKeyboard() {
    this.input.keyboard.on('keydown-ESC', () => {
      if (this.chatOverlay) { this.closeChat(); return; }
      if (this.incomingCallOverlay) { this.incomingCallOverlay.destroy(); this.incomingCallOverlay = null; return; }
      if (this.callActiveOverlay) { this.callActiveOverlay.destroy(); this.callActiveOverlay = null; return; }
    });
  }

  playRingSound() {
    this.callSystem.playRingSound();
  }

  createTabButtons() {
    const b = this.bounds;
    const tabY = b.y + 50;
    const tabCount = 3;
    const gap = 10;
    const tabW = (b.w - gap * (tabCount + 1)) / tabCount;

    this.tabs = {
      seeds: new RecolorableButton(this, b.x + gap, tabY, tabW, 35, 'Seeds', COLORS.buttonGray, () => this.switchTab('seeds')),
      sell: new RecolorableButton(this, b.x + gap * 2 + tabW, tabY, tabW, 35, 'Sell', COLORS.buttonGray, () => this.switchTab('sell')),
      friends: new RecolorableButton(this, b.x + gap * 3 + tabW * 2, tabY, tabW, 35, 'Friends', COLORS.buttonGray, () => this.switchTab('friends')),
    };
  }

  createHomeButton() {
    const b = this.bounds;
    this.homeBtn = new RecolorableButton(this, b.x + 10, b.y + b.h - 45, 100, 35, 'Main Menu', COLORS.danger, () => {
      this.showConfirmDialog();
    });
  }

  showMainMenu() {
    this.clearContent();
    const b = this.bounds;
    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2;

    this.add.text(cx, b.y + 120, 'Tablet', {
      fontSize: '28px', color: '#ffffff', fontFamily: 'Arial', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(100);

    this.add.text(cx, cy, 'Select a tab above', {
      fontSize: '18px', color: '#aaaaaa', fontFamily: 'Arial',
    }).setOrigin(0.5).setDepth(100);
  }

  switchTab(tab) {
    this.currentTab = tab;
    this.clearContent();

    switch (tab) {
      case 'seeds': this.showSeedsShop(); break;
      case 'sell': this.showSellMenu(); break;
      case 'friends': this.showFriendsList(); break;
    }
  }

  async showFriendsList() {
    const b = this.bounds;
    this.add.text(GAME_WIDTH / 2, b.y + 90, 'Friends', {
      fontSize: '22px', color: '#ffffff', fontFamily: 'Arial', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(100);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'Sign in to see friends', {
        fontSize: '16px', color: '#aaaaaa', fontFamily: 'Arial',
      }).setOrigin(0.5).setDepth(100);
      return;
    }

    const { data: friends } = await supabase
      .from('friends')
      .select('friend_id, profiles!friends_friend_id_fkey(username)')
      .eq('user_id', user.id);

    const list = friends || [];
    if (list.length === 0) {
      this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'No friends yet', {
        fontSize: '16px', color: '#aaaaaa', fontFamily: 'Arial',
      }).setOrigin(0.5).setDepth(100);
      return;
    }

    let yOff = b.y + 130;
    list.forEach((f) => {
      const username = f.profiles?.username || 'Unknown';
      const row = this.add.graphics().setDepth(100);
      row.fillStyle(0x2d2d44, 0.8);
      row.fillRoundedRect(b.x + 15, yOff, b.w - 30, 50, 5);

      this.add.text(b.x + 25, yOff + 25, username, {
        fontSize: '16px', color: '#ffffff', fontFamily: 'Arial', fontStyle: 'bold',
      }).setOrigin(0, 0.5).setDepth(100);

      new RecolorableButton(this, b.x + b.w - 180, yOff + 7, 70, 35, 'Chat', COLORS.buttonGray, () => {
        this.openChat(f.friend_id, username);
      });

      new RecolorableButton(this, b.x + b.w - 95, yOff + 7, 70, 35, 'Call', COLORS.buttonGreen, () => {
        this.startCall(f.friend_id, username);
      });

      yOff += 60;
    });
  }

  async openChat(friendId, friendName) {
    this.chatOverlay = this.add.container(0, 0).setDepth(300);

    const pw = GAME_WIDTH * 0.7;
    const ph = GAME_HEIGHT * 0.65;
    const px = (GAME_WIDTH - pw) / 2;
    const py = (GAME_HEIGHT - ph) / 2;

    const bg = this.add.graphics();
    bg.fillStyle(0x1a1a2e, 0.97);
    bg.fillRoundedRect(px, py, pw, ph, 15);
    bg.lineStyle(2, 0x4ecca3, 1);
    bg.strokeRoundedRect(px, py, pw, ph, 15);
    this.chatOverlay.add(bg);

    const headerText = this.add.text(px + pw / 2, py + 20, friendName, {
      fontSize: '20px', color: '#ffffff', fontFamily: 'Arial', fontStyle: 'bold',
    }).setOrigin(0.5);
    this.chatOverlay.add(headerText);

    const closeBtn = new RecolorableButton(this, px + pw - 45, py + 10, 35, 35, 'X', COLORS.danger, () => this.closeChat());
    this.chatOverlay.add(closeBtn.graphics);
    this.chatOverlay.add(closeBtn.text);
    this.chatOverlay.add(closeBtn.zone);

    const msgAreaY = py + 55;
    const msgAreaH = ph - 120;
    const msgBg = this.add.graphics();
    msgBg.fillStyle(0x2d2d44, 0.8);
    msgBg.fillRoundedRect(px + 10, msgAreaY, pw - 20, msgAreaH, 8);
    this.chatOverlay.add(msgBg);

    this.chatMessages = [];
    this.chatMsgContainer = this.add.container(0, 0);
    this.chatOverlay.add(this.chatMsgContainer);

    const inputH = 40;
    const inputY = msgAreaY + msgAreaH + 10;
    const inputBg = this.add.graphics();
    inputBg.fillStyle(0x3d3d55, 1);
    inputBg.fillRoundedRect(px + 10, inputY, pw - 80, inputH, 8);
    this.chatOverlay.add(inputBg);

    const sendBtn = new RecolorableButton(this, px + pw - 60, inputY, 50, inputH, 'Send', COLORS.buttonGreen, () => this.sendChatMessage(friendId));

    this.chatInput = { value: '', x: px + 18, y: inputY + inputH / 2 };

    this.chatInputText = this.add.text(px + 18, inputY + inputH / 2, '', {
      fontSize: '15px', color: '#ffffff', fontFamily: 'Arial',
    }).setOrigin(0, 0.5);
    this.chatOverlay.add(this.chatInputText);

    this.chatInputPlaceholder = this.add.text(px + 18, inputY + inputH / 2, 'Type a message...', {
      fontSize: '15px', color: '#555555', fontFamily: 'Arial',
    }).setOrigin(0, 0.5);
    this.chatOverlay.add(this.chatInputPlaceholder);

    const inputZone = this.add.zone(px + 10 + (pw - 80) / 2, inputY + inputH / 2, pw - 80, inputH)
      .setInteractive({ useHandCursor: true });
    this.chatOverlay.add(inputZone);

    inputZone.on('pointerdown', () => {
      this.chatInputFocused = true;
    });

    this.currentChatInputHandler = (event) => {
      if (!this.chatInputFocused) return;
      if (event.key === 'Backspace') {
        this.chatInput.value = this.chatInput.value.slice(0, -1);
      } else if (event.key === 'Enter') {
        this.sendChatMessage(friendId);
        return;
      } else if (event.key.length === 1) {
        this.chatInput.value += event.key;
      }
      this.chatInputText.setText(this.chatInput.value);
      this.chatInputPlaceholder.setVisible(this.chatInput.value.length === 0);
    };
    this.input.keyboard.on('keydown', this.currentChatInputHandler);

    this.receivedMessages = {};
    this.loadMessages(friendId);
    this.subscribeToMessages(friendId);
  }

  async loadMessages(friendId) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const msgs = await this.chatSystem.getMessages(user.id, friendId);
    this.renderMessages(msgs);
  }

  subscribeToMessages(friendId) {
    this.chatSystem.onMessage = (msg) => {
      if (msg.from_user_id === friendId && !this.receivedMessages[msg.id]) {
        this.receivedMessages[msg.id] = true;
        this.renderMessages([msg]);
      }
    };
    const { data: { user } } = supabase.auth.getUser().then(({ data }) => {
      if (data?.user) this.chatSystem.subscribeToMessages(data.user.id);
    });
  }

  renderMessages(msgs) {
    msgs.forEach(msg => {
      if (this.receivedMessages[msg.id]) return;
      this.receivedMessages[msg.id] = true;

      const isMine = msg.from_user_id === this.userData.user?.id;
      const pw = GAME_WIDTH * 0.7;
      const px = (GAME_WIDTH - pw) / 2;
      const msgAreaY = (GAME_HEIGHT - GAME_HEIGHT * 0.65) / 2 + 55;
      const maxW = pw - 60;

      const fontSize = msg.content.length > 60 ? '13px' : msg.content.length > 30 ? '14px' : '15px';
      const textObj = this.add.text(0, 0, msg.content, {
        fontSize, color: '#ffffff', fontFamily: 'Arial', wordWrap: { width: maxW - 20 },
      });
      const tw = Math.min(textObj.width + 20, maxW);
      const th = Math.max(textObj.height + 14, 30);
      textObj.destroy();

      const msgX = isMine ? px + pw - tw - 15 : px + 15;
      const existingCount = Object.keys(this.receivedMessages).length;
      const msgY = msgAreaY + 10 + (existingCount - 1) * (th + 4);

      const bubble = this.add.graphics();
      bubble.fillStyle(isMine ? 0x4ecca3 : 0x3d3d55, 0.9);
      bubble.fillRoundedRect(msgX, msgY, tw, th, 8);
      this.chatMsgContainer.add(bubble);

      const txt = this.add.text(msgX + 10, msgY + 7, msg.content, {
        fontSize, color: '#ffffff', fontFamily: 'Arial', wordWrap: { width: maxW - 20 },
      });
      this.chatMsgContainer.add(txt);
    });
  }

  async sendChatMessage(friendId) {
    const text = this.chatInput?.value?.trim();
    if (!text) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await this.chatSystem.sendMessage(user.id, friendId, text);
    this.renderMessages([{
      id: Date.now(),
      from_user_id: user.id,
      to_user_id: friendId,
      content: text,
      created_at: new Date().toISOString(),
    }]);

    this.chatInput.value = '';
    this.chatInputText.setText('');
    this.chatInputPlaceholder.setVisible(true);
  }

  closeChat() {
    this.chatSystem.onMessage = null;
    this.chatSystem.unsubscribe();
    if (this.currentChatInputHandler) {
      this.input.keyboard.off('keydown', this.currentChatInputHandler);
      this.currentChatInputHandler = null;
    }
    this.chatInputFocused = false;
    if (this.chatOverlay) { this.chatOverlay.destroy(); this.chatOverlay = null; }
  }

  async startCall(friendId, friendName) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const call = await this.callSystem.startCall(user.id, friendId);
    if (call) {
      this.showMessage(`Calling ${friendName}...`);
      this.showCallingUI(call.id, friendName);
    }
  }

  showCallingUI(callId, friendName) {
    this.callActiveOverlay = this.add.container(0, 0).setDepth(400);

    const pw = 350;
    const ph = 180;
    const px = (GAME_WIDTH - pw) / 2;
    const py = (GAME_HEIGHT - ph) / 2;

    const bg = this.add.graphics();
    bg.fillStyle(0x1a1a2e, 0.95);
    bg.fillRoundedRect(px, py, pw, ph, 15);
    bg.lineStyle(2, 0x4ecca3, 1);
    bg.strokeRoundedRect(px, py, pw, ph, 15);
    this.callActiveOverlay.add(bg);

    this.callActiveOverlay.add(this.add.text(px + pw / 2, py + 35, `Calling ${friendName}...`, {
      fontSize: '18px', color: '#ffffff', fontFamily: 'Arial',
    }).setOrigin(0.5));

    this.callActiveOverlay.add(this.add.text(px + pw / 2, py + 65, 'Waiting for answer', {
      fontSize: '14px', color: '#aaaaaa', fontFamily: 'Arial',
    }).setOrigin(0.5));

    const hangUpBtn = new RecolorableButton(this, px + pw / 2 - 50, py + 110, 100, 40, 'Hang Up', COLORS.danger, () => {
      this.callSystem.hangUp(callId);
      if (this.callActiveOverlay) { this.callActiveOverlay.destroy(); this.callActiveOverlay = null; }
    });
  }

  showIncomingCallUI(call) {
    if (this.incomingCallOverlay) return;
    this.incomingCallOverlay = this.add.container(0, 0).setDepth(400);

    this.playRingSound();
    this.ringInterval = setInterval(() => this.playRingSound(), 1500);

    const pw = 350;
    const ph = 180;
    const px = (GAME_WIDTH - pw) / 2;
    const py = (GAME_HEIGHT - ph) / 2;

    const bg = this.add.graphics();
    bg.fillStyle(0x1a1a2e, 0.95);
    bg.fillRoundedRect(px, py, pw, ph, 15);
    bg.lineStyle(2, 0xff4444, 1);
    bg.strokeRoundedRect(px, py, pw, ph, 15);
    this.incomingCallOverlay.add(bg);

    this.incomingCallOverlay.add(this.add.text(px + pw / 2, py + 35, `Incoming Call`, {
      fontSize: '18px', color: '#ff4444', fontFamily: 'Arial', fontStyle: 'bold',
    }).setOrigin(0.5));

    this.incomingCallOverlay.add(this.add.text(px + pw / 2, py + 65, `From: ${call.from_user_id}`, {
      fontSize: '14px', color: '#ffffff', fontFamily: 'Arial',
    }).setOrigin(0.5));

    const answerBtn = new RecolorableButton(this, px + 20, py + 110, 130, 40, 'Answer', COLORS.buttonGreen, () => {
      clearInterval(this.ringInterval);
      this.callSystem.answerCall(call.id);
      if (this.incomingCallOverlay) { this.incomingCallOverlay.destroy(); this.incomingCallOverlay = null; }
    });

    const declineBtn = new RecolorableButton(this, px + pw - 150, py + 110, 130, 40, 'Decline', COLORS.danger, () => {
      clearInterval(this.ringInterval);
      this.callSystem.declineCall(call.id);
      if (this.incomingCallOverlay) { this.incomingCallOverlay.destroy(); this.incomingCallOverlay = null; }
    });
  }

  showActiveCallUI(call) {
    this.callActiveOverlay = this.add.container(0, 0).setDepth(400);

    const pw = 350;
    const ph = 200;
    const px = (GAME_WIDTH - pw) / 2;
    const py = (GAME_HEIGHT - ph) / 2;

    const bg = this.add.graphics();
    bg.fillStyle(0x1a1a2e, 0.95);
    bg.fillRoundedRect(px, py, pw, ph, 15);
    bg.lineStyle(2, 0x4ecca3, 2);
    bg.strokeRoundedRect(px, py, pw, ph, 15);
    this.callActiveOverlay.add(bg);

    this.callActiveOverlay.add(this.add.text(px + pw / 2, py + 40, 'In Call', {
      fontSize: '20px', color: '#4ecca3', fontFamily: 'Arial', fontStyle: 'bold',
    }).setOrigin(0.5));

    this.callActiveOverlay.add(this.add.text(px + pw / 2, py + 75, 'Microphone active', {
      fontSize: '14px', color: '#aaaaaa', fontFamily: 'Arial',
    }).setOrigin(0.5));

    const hangUpBtn = new RecolorableButton(this, px + pw / 2 - 50, py + 120, 100, 40, 'Hang Up', COLORS.danger, () => {
      this.callSystem.hangUp(call.id);
      if (this.callActiveOverlay) { this.callActiveOverlay.destroy(); this.callActiveOverlay = null; }
    });
  }

  showSeedsShop() {
    const b = this.bounds;
    const startY = b.y + 100;
    this.seedsContainer = this.add.container(0, 0);

    this.add.text(GAME_WIDTH / 2, b.y + 80, 'Seed Shop', {
      fontSize: '22px', color: '#ffffff', fontFamily: 'Arial', fontStyle: 'bold',
    }).setOrigin(0.5);

    this.restockTimer = RESTOCK_INTERVAL;
    this.currentStock = getRandomRestock();

    this.add.text(b.x + b.w - 120, b.y + 85, 'Restock:', {
      fontSize: '12px', color: '#aaaaaa', fontFamily: 'Arial',
    });

    this.restockBar = this.add.graphics();
    this.restockBarX = b.x + b.w - 120;
    this.restockBarY = b.y + 100;
    this.restockBarW = 100;
    this.restockBarH = 8;
    this.drawRestockBar();

    let yOff = startY;
    const colW = (b.w - 40) / 3;

    this.currentStock.forEach((seed, idx) => {
      const col = idx % 3;
      const row = Math.floor(idx / 3);
      const x = b.x + 15 + col * colW;
      const y = startY + row * 70;

      const card = this.add.graphics();
      card.fillStyle(0x2d2d44, 1);
      card.fillRoundedRect(x, y, colW - 10, 60, 8);

      this.add.text(x + 10, y + 8, seed.name, {
        fontSize: '14px', color: '#ffffff', fontFamily: 'Arial', fontStyle: 'bold',
      });

      this.add.text(x + 10, y + 28, `$${seed.cost}`, {
        fontSize: '16px', color: '#ffd700', fontFamily: 'Arial',
      });

      const buyBtn = new RecolorableButton(this, x + colW - 80, y + 15, 60, 28, 'Buy', COLORS.buttonGreen, () => {
        this.buySeed(seed);
      });
    });
  }

  drawRestockBar() {
    this.restockBar.clear();
    this.restockBar.fillStyle(COLORS.progressBarBg, 1);
    this.restockBar.fillRect(this.restockBarX, this.restockBarY, this.restockBarW, this.restockBarH);

    const pct = 1 - (this.restockTimer / RESTOCK_INTERVAL);
    this.restockBar.fillStyle(COLORS.progressBarFill, 1);
    this.restockBar.fillRect(this.restockBarX, this.restockBarY, this.restockBarW * pct, this.restockBarH);
  }

  buySeed(seed) {
    const cash = this.userData.cash || 0;
    if (cash < seed.cost) {
      this.showMessage('Not enough cash!');
      return;
    }

    this.userData.cash = cash - seed.cost;
    this.cashText.setText(`Cash: $${this.userData.cash}`);

    if (!this.userData.inventory) this.userData.inventory = [];
    this.userData.inventory.push({ id: seed.id, name: seed.name, type: 'seed' });

    this.showMessage(`Bought ${seed.name}!`);
  }

  showSellMenu() {
    const b = this.bounds;
    const items = this.userData.inventory || [];

    this.add.text(GAME_WIDTH / 2, b.y + 80, 'Sell Menu', {
      fontSize: '22px', color: '#ffffff', fontFamily: 'Arial', fontStyle: 'bold',
    }).setOrigin(0.5);

    const sellAllBtn = new RecolorableButton(this, GAME_WIDTH / 2 - 60, b.y + 110, 120, 35, 'Sell All', COLORS.buttonGray, () => {
      this.sellAllFruits();
    });

    const foodItems = items.filter(item => item.type === 'seed');
    if (foodItems.length === 0) {
      this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'No fruit or food in your inventory', {
        fontSize: '16px', color: '#aaaaaa', fontFamily: 'Arial',
      }).setOrigin(0.5);
      return;
    }

    let yOff = b.y + 160;
    foodItems.forEach((item, idx) => {
      const seed = SEEDS.find(s => s.id === item.id);
      if (!seed) return;
      const price = seed.sellPrice;

      const row = this.add.graphics();
      row.fillStyle(0x2d2d44, 0.8);
      row.fillRoundedRect(b.x + 15, yOff, b.w - 30, 35, 5);

      this.add.text(b.x + 25, yOff + 17, item.name, {
        fontSize: '14px', color: '#ffffff', fontFamily: 'Arial',
      }).setOrigin(0, 0.5);

      this.add.text(b.x + b.w - 130, yOff + 17, `$${price}`, {
        fontSize: '14px', color: '#ffd700', fontFamily: 'Arial',
      }).setOrigin(0, 0.5);

      new RecolorableButton(this, b.x + b.w - 70, yOff + 5, 50, 25, 'Sell', COLORS.buttonGreen, () => {
        this.sellItem(item, seed);
      });

      yOff += 40;
    });
  }

  sellAllFruits() {
    const items = this.userData.inventory || [];
    let total = 0;
    const toRemove = [];

    items.forEach(item => {
      if (item.type === 'seed') {
        const seed = SEEDS.find(s => s.id === item.id);
        if (seed) {
          total += seed.sellPrice;
          toRemove.push(item);
        }
      }
    });

    toRemove.forEach(item => {
      const idx = this.userData.inventory.indexOf(item);
      if (idx > -1) this.userData.inventory.splice(idx, 1);
    });

    this.userData.cash = (this.userData.cash || 0) + total;
    this.cashText.setText(`Cash: $${this.userData.cash}`);
    this.showMessage(`Sold all! Earned $${total}`);
    this.switchTab('sell');
  }

  sellItem(item, seed) {
    const idx = this.userData.inventory.indexOf(item);
    if (idx > -1) this.userData.inventory.splice(idx, 1);

    this.userData.cash = (this.userData.cash || 0) + seed.sellPrice;
    this.cashText.setText(`Cash: $${this.userData.cash}`);
    this.showMessage(`Sold ${item.name} for $${seed.sellPrice}`);
    this.switchTab('sell');
  }

  showConfirmDialog() {
    const overlay = this.add.graphics();
    overlay.fillStyle(0x000000, 0.7);
    overlay.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    const pw = 300;
    const ph = 150;
    const px = (GAME_WIDTH - pw) / 2;
    const py = (GAME_HEIGHT - ph) / 2;

    const panel = this.add.graphics();
    panel.fillStyle(COLORS.tabletBg, 1);
    panel.fillRoundedRect(px, py, pw, ph, 15);

    this.add.text(GAME_WIDTH / 2, py + 30, 'Return to Main Menu?', {
      fontSize: '18px', color: '#ffffff', fontFamily: 'Arial',
    }).setOrigin(0.5);

    const yesBtn = new RecolorableButton(this, px + 20, py + 80, pw / 2 - 30, 40, 'Yes', COLORS.buttonGreen, () => {
      this.chatSystem.unsubscribe();
      this.callSystem.unsubscribe();
      this.scene.stop('TabletScene');
      this.scene.stop('GardenScene');
      this.scene.start('MenuScene');
    });

    const noBtn = new RecolorableButton(this, px + pw / 2 + 10, py + 80, pw / 2 - 30, 40, 'No', COLORS.danger, () => {
      overlay.destroy(); panel.destroy(); yesBtn.destroy(); noBtn.destroy();
    });
  }

  showMessage(msg) {
    const text = this.add.text(GAME_WIDTH / 2, this.bounds.y + this.bounds.h - 10, msg, {
      fontSize: '14px', color: '#4ecca3', fontFamily: 'Arial',
      backgroundColor: '#00000088', padding: { x: 8, y: 4 },
    }).setOrigin(0.5, 1).setDepth(200);

    this.time.delayedCall(2000, () => text.destroy());
  }

  clearContent() {
    const keep = [this.cashText, this.homeBtn, ...Object.values(this.tabs)];
    this.children.each(child => {
      if (keep.includes(child)) return;
      if (child.depth >= 200) return;
      if (child.type === 'Container' || child.type === 'Graphics' || child.type === 'Text' || child.type === 'Zone') {
        child.destroy();
      }
    });
    this.seedsContainer = null;
  }

  update(time) {
    if (this.currentTab === 'seeds' && this.restockTimer) {
      this.restockTimer -= this.game.loop.delta;
      this.drawRestockBar();

      if (this.restockTimer <= 0) {
        this.restockTimer = RESTOCK_INTERVAL;
        this.currentStock = getRandomRestock();
        this.showMessage('Shop restocked!');
        this.switchTab('seeds');
      }
    }
  }
}
