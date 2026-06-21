import Phaser from 'phaser';
import { COLORS, GAME_WIDTH, GAME_HEIGHT, INVENTORY_SLOTS, PERMANENT_SLOTS } from '../config/constants.js';
import { SEEDS } from '../config/seeds.js';
import { RecolorableButton } from '../ui/RecolorableButton.js';
import { InventoryUI } from '../ui/InventoryUI.js';
import { GrowthSystem } from '../systems/GrowthSystem.js';
import { SaveSystem } from '../systems/SaveSystem.js';

const DEPTH = {
  BACKGROUND: 0,
  GRAPHICS: 10,
  PLANTS: 20,
  ZONES: 25,
  HOVER: 30,
  UI_BG: 40,
  UI: 50,
  BUTTONS: 60,
  ARROWS: 65,
  OVERLAY: 100,
  POPUP: 200,
};

export class GardenScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GardenScene' });
  }

  init(data) {
    this.mode = data.mode || 'single';
    this.user = data.user || null;
    this.serverId = data.serverId || null;
    this.otherPlayers = data.otherPlayers || [];
    this.savedGardens = data.savedGardens || null;
  }

  create() {
    this.growthSystem = new GrowthSystem();
    this.saveSystem = new SaveSystem(this.user);
    this.gardens = [];
    this.currentGardenIndex = 0;
    this.placedProps = [];
    this.tabletOpen = false;
    this.inventoryOpen = false;
    this.currentTool = null;
    this.cash = 100;
    this.adminPanelOpen = false;
    this.adminPromptOpen = false;

    if (this.savedGardens) {
      this.gardens = this.savedGardens;
    }

    this.events.on('shutdown', this.shutdown, this);

    this.cameras.main.fadeIn(500, 0, 0, 0);
    this.createGarden(0);
    this.createUI();
    this.setupKeyboard();
    this.setupGamepad();
    this.processOfflineGrowth();
  }

  createGarden(index) {
    this.gardens[index] = this.gardens[index] || this.createGardenData();
    const garden = this.gardens[index];

    if (this.gardenContainer) this.gardenContainer.destroy();
    if (this.plotContainer) this.plotContainer.destroy();
    if (this.plantContainer) this.plantContainer.destroy();

    this.gardenContainer = this.add.container(0, 0).setDepth(DEPTH.BACKGROUND);
    this.plotContainer = this.add.container(0, 0).setDepth(DEPTH.ZONES);
    this.plantContainer = this.add.container(0, 0).setDepth(DEPTH.PLANTS);

    const g = this.add.graphics();
    g.fillStyle(COLORS.grass, 1);
    g.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    this.gardenContainer.add(g);

    const plotSize = 80;
    const cols = 8;
    const rows = 6;
    const startX = (GAME_WIDTH - cols * plotSize) / 2;
    const startY = (GAME_HEIGHT - rows * plotSize) / 2;

    const soilG = this.add.graphics();
    soilG.fillStyle(COLORS.soil, 1);
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const x = startX + col * plotSize;
        const y = startY + row * plotSize;
        soilG.fillRoundedRect(x + 2, y + 2, plotSize - 4, plotSize - 4, 5);
      }
    }
    this.gardenContainer.add(soilG);

    garden.plots.forEach(plot => {
      const zone = this.add.zone(plot.x + plot.w / 2, plot.y + plot.h / 2, plot.w, plot.h)
        .setInteractive({ useHandCursor: true });
      zone.on('pointerdown', () => this.onPlotClick(plot));
      zone.on('pointerover', () => this.onPlotHover(plot, true));
      zone.on('pointerout', () => this.onPlotHover(plot, false));
      plot.zone = zone;
      this.plotContainer.add(zone);

      if (plot.plant) {
        this.renderPlant(plot);
      }
    });

    this.plotHighlight = this.add.graphics().setDepth(DEPTH.HOVER);
    this.plotHighlight.setVisible(false);

    this.hoverText = this.add.text(0, 0, '', {
      fontSize: '14px', color: '#ffffff', fontFamily: 'Arial',
      backgroundColor: '#000000aa', padding: { x: 5, y: 3 },
    }).setVisible(false).setDepth(DEPTH.OVERLAY);
  }

  createGardenData() {
    const plotSize = 80;
    const cols = 8;
    const rows = 6;
    const startX = (GAME_WIDTH - cols * plotSize) / 2;
    const startY = (GAME_HEIGHT - rows * plotSize) / 2;
    const plots = [];

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const x = startX + col * plotSize;
        const y = startY + row * plotSize;
        plots.push({ x, y, w: plotSize, h: plotSize, plant: null, row, col });
      }
    }

    return { plots, name: `Garden ${this.gardens.length + 1}` };
  }

  get currentGarden() {
    return this.gardens[this.currentGardenIndex];
  }

  get gardenPlots() {
    return this.currentGarden ? this.currentGarden.plots : [];
  }

  createUI() {
    this.gardenUI = this.add.container(0, 0).setDepth(DEPTH.UI);

    this.tabletBtn = new RecolorableButton(this, 10, 10, 90, 35, 'Tablet', COLORS.buttonGray, () => {
      this.openTablet();
    }, DEPTH.BUTTONS);

    if (this.mode !== 'single') {
      this.navLeftBtn = new RecolorableButton(this, 5, GAME_HEIGHT / 2 - 20, 40, 40, '<', COLORS.buttonGray, () => {
        this.navigateGarden(-1);
      }, DEPTH.ARROWS);
      this.navRightBtn = new RecolorableButton(this, GAME_WIDTH - 45, GAME_HEIGHT / 2 - 20, 40, 40, '>', COLORS.buttonGray, () => {
        this.navigateGarden(1);
      }, DEPTH.ARROWS);
    }

    this.invBtn = new RecolorableButton(this, GAME_WIDTH / 2 - 25, GAME_HEIGHT - 30, 50, 25, '▲', COLORS.buttonGray, () => {
      this.toggleInventory();
    }, DEPTH.BUTTONS);

    this.collectAllBtn = new RecolorableButton(this, GAME_WIDTH - 120, GAME_HEIGHT - 50, 110, 35, 'Collect All', COLORS.buttonGreen, () => {
      this.collectAllHarvest();
    }, DEPTH.BUTTONS);

    this.cashText = this.add.text(GAME_WIDTH / 2, 15, `$${this.cash}`, {
      fontSize: '20px', color: '#ffd700', fontFamily: 'Arial', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(DEPTH.OVERLAY);
  }

  navigateGarden(direction) {
    const newIndex = this.currentGardenIndex + direction;
    if (newIndex < 0 || newIndex >= this.gardens.length) return;
    this.currentGardenIndex = newIndex;
    this.createGarden(newIndex);
  }

  openTablet() {
    if (this.tabletOpen) return;
    if (this.inventoryOpen) this.toggleInventory();
    this.tabletOpen = true;

    if (this.textures.exists('tablet_bootup')) {
      const video = this.add.video(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'tablet_bootup');
      video.setDepth(DEPTH.POPUP + 10);
      video.play();
      video.once('complete', () => {
        video.destroy();
        this.launchTabletScene();
      });
    } else {
      this.launchTabletScene();
    }
  }

  launchTabletScene() {
    this.scene.launch('TabletScene', {
      user: this.user,
      cash: this.cash,
      gardenPlots: this.gardenPlots,
      inventory: this.user ? this.user.inventory : [],
    });
    this.scene.bringToTop('TabletScene');
  }

  closeTablet() {
    this.tabletOpen = false;
    this.scene.stop('TabletScene');
  }

  toggleInventory() {
    this.inventoryOpen = !this.inventoryOpen;
    if (this.inventoryOpen) {
      if (this.tabletOpen) this.closeTablet();
      if (!this.inventoryUI) {
        this.inventoryUI = new InventoryUI(this, () => {
          this.inventoryOpen = false;
        });
      }
      this.inventoryUI.show();
    } else {
      if (this.inventoryUI) this.inventoryUI.hide();
    }
  }

  onPlotClick(plot) {
    if (this.currentTool === 'sledgehammer') {
      this.placePropMode(plot);
      return;
    }

    if (this.inventoryUI && this.inventoryUI.visible && this.inventoryUI.selectedSeed) {
      this.plantSeed(plot, this.inventoryUI.selectedSeed);
      this.inventoryUI.selectedSeed = null;
      this.inventoryUI.updateSelectedDisplay();
      return;
    }

    if (plot.plant) {
      this.showPlantInfo(plot);
    }
  }

  placePropMode(plot) {
    if (this.placedProps.length >= 50) return;
    if (!this.inventoryUI) return;

    this.inventoryUI.showPropSelector((propId) => {
      if (propId) {
        const prop = this.add.graphics();
        prop.fillStyle(0x888888, 0.7);
        prop.fillRect(plot.x + 10, plot.y + 10, plot.w - 20, plot.h - 20);
        this.placedProps.push({ id: propId, x: plot.x, y: plot.y, graphics: prop, plot });
        plot.plant = { type: 'prop', id: propId, graphics: prop };
      }
      this.inventoryUI.hide();
    });
  }

  plantSeed(plot, seedId) {
    if (plot.plant) return;
    const seed = SEEDS.find(s => s.id === seedId);
    if (!seed) return;

    plot.plant = {
      type: 'seed',
      seedId: seed.id,
      name: seed.name,
      plantedAt: Date.now(),
      growTime: seed.growTime,
      grown: false,
      harvestable: false,
      renewable: seed.type === 'renewable',
    };

    this.renderPlant(plot);

    if (this.user && this.inventoryUI) {
      this.inventoryUI.removeFromInventory(seedId);
    }
  }

  renderPlant(plot) {
    if (!plot.plant || plot.plant.type !== 'seed') return;
    const cx = plot.x + plot.w / 2;
    const cy = plot.y + plot.h / 2;
    const texKey = `seed_${plot.plant.seedId}`;
    let graphic;

    if (this.textures.exists(texKey)) {
      const img = this.add.image(cx, cy, texKey).setDisplaySize(plot.w - 10, plot.h - 10);
      if (plot.plant.grown) {
        img.setTint(0xffffff);
        const border = this.add.graphics();
        border.lineStyle(2, 0xffd700, 1);
        border.strokeCircle(cx, cy, plot.w / 2 - 5);
        graphic = this.add.container(0, 0, [border, img]);
      } else {
        img.setTint(0xaaaaaa);
        graphic = img;
      }
    } else {
      const g = this.add.graphics();
      if (plot.plant.grown) {
        g.fillStyle(0x2ecc71, 1);
        g.fillCircle(cx, cy, 20);
        g.fillStyle(0xe74c3c, 1);
        g.fillCircle(cx, cy, 10);
      } else {
        g.fillStyle(0x27ae60, 1);
        g.fillCircle(cx, cy, 10);
        g.fillStyle(0x2ecc71, 1);
        g.fillCircle(cx, cy - 5, 5);
      }
      graphic = g;
    }

    if (graphic) {
      this.plantContainer.add(graphic);
      plot.plant.graphics = graphic;
    }
  }

  onPlotHover(plot, isOver) {
    if (!isOver) {
      this.plotHighlight.setVisible(false);
      this.hoverText.setVisible(false);
      return;
    }

    this.plotHighlight.clear();
    this.plotHighlight.lineStyle(2, COLORS.buttonGreenOutline, 1);
    this.plotHighlight.strokeRoundedRect(plot.x, plot.y, plot.w, plot.h, 5);
    this.plotHighlight.setVisible(true);

    if (plot.plant) {
      const p = plot.plant;
      let text = `${p.name}`;
      if (p.type === 'seed') {
        if (p.harvestable) {
          text += '\nReady to harvest!';
        } else if (p.grown) {
          text += '\nGrowing...';
        } else {
          const elapsed = Date.now() - p.plantedAt;
          const remaining = Math.max(0, p.growTime - elapsed);
          const mins = Math.floor(remaining / 60000);
          const secs = Math.floor((remaining % 60000) / 1000);
          text += `\nTime: ${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
        }
      }
      this.hoverText.setText(text);
      this.hoverText.setPosition(plot.x + 5, plot.y - 30);
      this.hoverText.setVisible(true);
    }
  }

  showPlantInfo(plot) {
    if (!plot.plant || !plot.plant.harvestable) return;

    if (this.harvestPopup) this.harvestPopup.forEach(o => o.destroy());
    this.harvestPopup = [];

    const overlay = this.add.graphics().setDepth(DEPTH.POPUP);
    overlay.fillStyle(0x000000, 0.5);
    overlay.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    this.harvestPopup.push(overlay);

    const msg = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 50, `Harvest ${plot.plant.name}?`, {
      fontSize: '20px', color: '#ffffff', fontFamily: 'Arial',
    }).setOrigin(0.5).setDepth(DEPTH.POPUP);
    this.harvestPopup.push(msg);

    const hBtn = new RecolorableButton(this, GAME_WIDTH / 2 - 60, GAME_HEIGHT / 2, 50, 30, '✓', COLORS.buttonGreen, () => {
      this.harvestPlant(plot);
      if (this.harvestPopup) this.harvestPopup.forEach(o => o.destroy());
      this.harvestPopup = null;
    });
    this.harvestPopup.push(hBtn);

    const cBtn = new RecolorableButton(this, GAME_WIDTH / 2 + 10, GAME_HEIGHT / 2, 50, 30, 'X', COLORS.danger, () => {
      if (this.harvestPopup) this.harvestPopup.forEach(o => o.destroy());
      this.harvestPopup = null;
    });
    this.harvestPopup.push(cBtn);
  }

  harvestPlant(plot) {
    if (!plot.plant || !plot.plant.harvestable) return;
    const seed = SEEDS.find(s => s.id === plot.plant.seedId);
    if (!seed) return;

    this.cash += seed.sellPrice;
    this.cashText.setText(`$${this.cash}`);

    if (plot.plant.graphics) plot.plant.graphics.destroy();

    if (plot.plant.renewable) {
      plot.plant.plantedAt = Date.now();
      plot.plant.grown = false;
      plot.plant.harvestable = false;
      this.renderPlant(plot);
    } else {
      plot.plant = null;
    }
  }

  collectAllHarvest() {
    this.gardenPlots.forEach(plot => {
      if (plot.plant && plot.plant.harvestable) {
        this.harvestPlant(plot);
      }
    });
  }

  processOfflineGrowth() {
    const offlineGrowth = this.growthSystem.processOfflineGrowth(this.gardenPlots);
    if (offlineGrowth.length > 0) {
      const timeline = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 3, '', {
        fontSize: '16px', color: '#ffffff', fontFamily: 'Arial',
        backgroundColor: '#000000aa', padding: { x: 10, y: 10 },
      }).setOrigin(0.5).setDepth(200);

      let tText = 'Offline Growth:\n';
      offlineGrowth.forEach(g => {
        tText += `${g.name} - ${g.event}\n`;
      });
      timeline.setText(tText);

      this.time.delayedCall(4000, () => timeline.destroy());
    }
  }

  setupKeyboard() {
    this.input.keyboard.on('keydown-TAB', (event) => {
      event.preventDefault();
      if (!this.tabletOpen) {
        this.openTablet();
      } else {
        this.closeTablet();
      }
    });

    this.input.keyboard.on('keydown-F7', (event) => {
      event.preventDefault();
      this.toggleAdminPanel();
    });
  }

  toggleAdminPanel() {
    if (this.adminPanelOpen) {
      this.closeAdminPanel();
    } else {
      this.openAdminPanel();
    }
  }

  openAdminPanel() {
    this.adminPanelOpen = true;
    this.adminPanelElements = [];

    const px = 10;
    const py = 10;
    const pw = 220;

    const bg = this.add.graphics().setDepth(DEPTH.POPUP);
    bg.fillStyle(0x1a1a2e, 0.95);
    bg.fillRoundedRect(px, py, pw, 340, 8);
    bg.lineStyle(2, 0x4ecca3, 1);
    bg.strokeRoundedRect(px, py, pw, 340, 8);
    this.adminPanelElements.push(bg);

    const title = this.add.text(px + 10, py + 12, 'Admin Panel', {
      fontSize: '16px', color: '#4ecca3', fontFamily: 'Arial', fontStyle: 'bold',
    }).setDepth(DEPTH.POPUP + 1);
    this.adminPanelElements.push(title);

    const closeBtn = new RecolorableButton(this, px + pw - 30, py + 8, 22, 22, 'X', COLORS.danger, () => {
      this.closeAdminPanel();
    });
    this.adminPanelElements.push(closeBtn);

    const addCashBtn = new RecolorableButton(this, px + 10, py + 50, pw - 20, 35, 'Add Cash', COLORS.buttonGreen, () => {
      this.adminPromptCash();
    });
    this.adminPanelElements.push(addCashBtn);

    const managePlayersBtn = new RecolorableButton(this, px + 10, py + 95, pw - 20, 35, 'Manage Players', COLORS.buttonGray, () => {
      this.adminManagePlayers();
    });
    this.adminPanelElements.push(managePlayersBtn);
  }

  closeAdminPanel() {
    this.adminPanelOpen = false;
    if (this.adminPanelElements) {
      this.adminPanelElements.forEach(el => { if (el && el.destroy) el.destroy(); });
      this.adminPanelElements = [];
    }
  }

  adminPromptCash() {
    if (this.adminPromptOpen) return;
    this.adminPromptOpen = true;

    const overlay = this.add.graphics().setDepth(DEPTH.POPUP + 10);
    overlay.fillStyle(0x000000, 0.5);
    overlay.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    const px = GAME_WIDTH / 2 - 120;
    const py = GAME_HEIGHT / 2 - 60;
    const pw = 240;
    const ph = 120;

    const panel = this.add.graphics().setDepth(DEPTH.POPUP + 10);
    panel.fillStyle(0x1a1a2e, 1);
    panel.fillRoundedRect(px, py, pw, ph, 8);
    panel.lineStyle(2, 0x4ecca3, 1);
    panel.strokeRoundedRect(px, py, pw, ph, 8);

    const label = this.add.text(GAME_WIDTH / 2, py + 15, 'Set Cash:', {
      fontSize: '16px', color: '#ffffff', fontFamily: 'Arial',
    }).setOrigin(0.5).setDepth(DEPTH.POPUP + 20);

    const inputBg = this.add.graphics().setDepth(DEPTH.POPUP + 20);
    inputBg.fillStyle(0x2d2d44, 1);
    inputBg.fillRoundedRect(px + 20, py + 40, pw - 40, 30, 4);

    const inputText = this.add.text(px + 30, py + 55, '', {
      fontSize: '16px', color: '#ffffff', fontFamily: 'Arial',
    }).setDepth(DEPTH.POPUP + 20);

    const promptElements = [overlay, panel, label, inputBg, inputText];
    let inputValue = '';
    let focused = true;

    const submit = () => {
      const amount = parseInt(inputValue, 10);
      if (!isNaN(amount) && amount >= 0) {
        this.cash = amount;
        if (this.inventoryUI) this.inventoryUI.updateCash(amount);
        this.showMessage(`Cash set to $${amount}`);
      }
      promptElements.forEach(el => el.destroy());
      this.input.keyboard.off('keydown', handler);
      this.adminPromptOpen = false;
    };

    const handler = (event) => {
      if (!focused) return;
      if (event.key === 'Enter') { submit(); return; }
      if (event.key === 'Backspace') { inputValue = inputValue.slice(0, -1); }
      else if (event.key.length === 1 && /[0-9]/.test(event.key)) { inputValue += event.key; }
      inputText.setText(inputValue);
    };

    this.input.keyboard.on('keydown', handler);

    const okBtn = new RecolorableButton(this, GAME_WIDTH / 2 - 30, py + 80, 60, 28, 'OK', COLORS.buttonGreen, submit);
    promptElements.push(okBtn);
  }

  adminManagePlayers() {
    this.closeAdminPanel();
    const players = [this.user || { username: 'Player', id: 'local' }];
    if (this.otherPlayers) {
      this.otherPlayers.forEach(p => {
        if (!players.find(x => x.id === p.userId)) {
          players.push({ username: p.username, id: p.userId });
        }
      });
    }

    const overlay = this.add.graphics().setDepth(DEPTH.POPUP + 10);
    overlay.fillStyle(0x000000, 0.5);
    overlay.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    const px = GAME_WIDTH / 2 - 150;
    const py = 80;
    const pw = 300;

    const panel = this.add.graphics().setDepth(DEPTH.POPUP + 10);
    panel.fillStyle(0x1a1a2e, 1);
    panel.fillRoundedRect(px, py, pw, 40 + players.length * 45 + 20, 8);
    panel.lineStyle(2, 0x4ecca3, 1);
    panel.strokeRoundedRect(px, py, pw, 40 + players.length * 45 + 20, 8);

    const title = this.add.text(GAME_WIDTH / 2, py + 15, 'Players', {
      fontSize: '18px', color: '#4ecca3', fontFamily: 'Arial', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(DEPTH.POPUP + 20);

    const elements = [overlay, panel, title];

    players.forEach((p, i) => {
      const y = py + 45 + i * 45;
      const t = this.add.text(px + 15, y, p.username, {
        fontSize: '15px', color: '#ffffff', fontFamily: 'Arial',
      }).setDepth(DEPTH.POPUP + 20);
      elements.push(t);
    });

    const backBtn = new RecolorableButton(this, GAME_WIDTH / 2 - 50, py + 45 + players.length * 45 + 10, 100, 32, 'Back', COLORS.danger, () => {
      elements.forEach(el => el.destroy());
      this.input.keyboard.off('keydown');
    });
    elements.push(backBtn);
  }

  setupGamepad() {
    this.input.gamepad.on('connected', (pad) => {
      this.gamepad = pad;
    });
  }

  update() {
    this.gardenPlots.forEach(plot => {
      if (plot.plant && plot.plant.type === 'seed' && !plot.plant.harvestable) {
        const elapsed = Date.now() - plot.plant.plantedAt;
        if (elapsed >= plot.plant.growTime) {
          plot.plant.grown = true;
          plot.plant.harvestable = true;

          if (plot.plant.graphics) {
            plot.plant.graphics.destroy();
            this.renderPlant(plot);
          }

          const seed = SEEDS.find(s => s.id === plot.plant.seedId);
          if (seed && seed.type === 'single') {
            plot.plant.harvestable = true;
          }
        }
      }
    });

    if (this.gamepad) {
      if (this.gamepad.X && !this.tabletOpen) {
        this.openTablet();
        this.gamepad = null;
      }
      if (this.gamepad.B && this.tabletOpen) {
        this.closeTablet();
        this.gamepad = null;
      }
    }
  }

  showMessage(msg) {
    const text = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 10, msg, {
      fontSize: '14px', color: '#4ecca3', fontFamily: 'Arial',
      backgroundColor: '#00000088', padding: { x: 8, y: 4 },
    }).setOrigin(0.5, 1).setDepth(DEPTH.POPUP);

    this.time.delayedCall(2000, () => text.destroy());
  }

  shutdown() {
    if (this.gardens.length > 0) {
      const cleanGardens = this.gardens.map(garden => ({
        ...garden,
        plots: garden.plots.map(plot => ({
          x: plot.x, y: plot.y, w: plot.w, h: plot.h,
          row: plot.row, col: plot.col,
          plant: plot.plant ? {
            type: plot.plant.type,
            seedId: plot.plant.seedId,
            name: plot.plant.name,
            plantedAt: plot.plant.plantedAt,
            growTime: plot.plant.growTime,
            grown: plot.plant.grown,
            harvestable: plot.plant.harvestable,
            renewable: plot.plant.renewable,
          } : null,
        })),
      }));
      this.saveSystem.saveGarden(cleanGardens);
    }
  }
}
