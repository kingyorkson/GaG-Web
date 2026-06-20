import Phaser from 'phaser';
import { COLORS, GAME_WIDTH, GAME_HEIGHT } from '../config/constants.js';
import { RecolorableButton } from '../ui/RecolorableButton.js';
import { SEEDS, getRandomRestock, RESTOCK_INTERVAL } from '../config/seeds.js';

export class TabletScene extends Phaser.Scene {
  constructor() {
    super({ key: 'TabletScene' });
  }

  init(data) {
    this.userData = data || {};
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

    this.createTabButtons();
    this.createHomeButton();

    this.currentTab = 'main';
    this.showMainMenu();
  }

  createTabButtons() {
    const b = this.bounds;
    const tabY = b.y + 50;
    const tabW = (b.w - 40) / 3;

    this.tabs = {
      seeds: new RecolorableButton(this, b.x + 10, tabY, tabW, 35, 'Seeds', COLORS.buttonGray, () => this.switchTab('seeds')),
      sell: new RecolorableButton(this, b.x + 15 + tabW, tabY, tabW, 35, 'Sell', COLORS.buttonGray, () => this.switchTab('sell')),
      inventory: new RecolorableButton(this, b.x + 20 + tabW * 2, tabY, tabW, 35, 'Inventory', COLORS.buttonGray, () => this.switchTab('inventory')),
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
      case 'inventory': this.showInventoryView(); break;
    }
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

  showInventoryView() {
    const b = this.bounds;
    const items = this.userData.inventory || [];

    this.add.text(GAME_WIDTH / 2, b.y + 80, 'Inventory', {
      fontSize: '22px', color: '#ffffff', fontFamily: 'Arial', fontStyle: 'bold',
    }).setOrigin(0.5);

    if (items.length === 0) {
      this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'Inventory is empty', {
        fontSize: '16px', color: '#aaaaaa', fontFamily: 'Arial',
      }).setOrigin(0.5);
      return;
    }

    let yOff = b.y + 120;
    const colCount = 4;
    const slotW = (b.w - 40) / colCount;

    items.forEach((item, idx) => {
      const col = idx % colCount;
      const row = Math.floor(idx / colCount);
      const x = b.x + 15 + col * slotW;
      const y = b.y + 120 + row * 55;

      const slot = this.add.graphics();
      slot.fillStyle(COLORS.inventorySlot, 1);
      slot.fillRoundedRect(x, y, slotW - 8, 45, 5);

      this.add.text(x + 5, y + 22, item.name, {
        fontSize: '11px', color: '#ffffff', fontFamily: 'Arial',
      }).setOrigin(0, 0.5);
    });
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
    this.children.each(child => {
      if (child !== this.cashText && child !== this.homeBtn &&
          !Object.values(this.tabs).includes(child) && child.depth < 200) {
        if (child.type === 'Container') {
          child.destroy();
        } else if (child.type === 'Graphics' && !child === this.children.list[0] && !child === this.children.list[1]) {
          child.destroy();
        }
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
