import Phaser from 'phaser';
import { COLORS, GAME_WIDTH, GAME_HEIGHT, INVENTORY_SLOTS, PERMANENT_SLOTS } from '../config/constants.js';
import { SEEDS } from '../config/seeds.js';
import { RecolorableButton } from '../ui/RecolorableButton.js';
import { InventoryUI } from '../ui/InventoryUI.js';
import { GrowthSystem } from '../systems/GrowthSystem.js';

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
  }

  create() {
    this.growthSystem = new GrowthSystem();
    this.gardens = [];
    this.currentGardenIndex = 0;
    this.placedProps = [];
    this.tabletOpen = false;
    this.inventoryOpen = false;
    this.currentTool = null;
    this.cash = 100;

    this.cameras.main.fadeIn(500, 0, 0, 0);
    this.createGarden(0);
    this.createUI();
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

    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

    if (isTouchDevice) {
      this.tabletBtn = new RecolorableButton(this, 10, 10, 90, 35, 'Tablet', COLORS.buttonGray, () => {
        this.openTablet();
      });
    }

    if (this.mode !== 'single') {
      this.navLeftBtn = new RecolorableButton(this, 5, GAME_HEIGHT / 2 - 20, 40, 40, '<', COLORS.buttonGray, () => {
        this.navigateGarden(-1);
      });
      this.navRightBtn = new RecolorableButton(this, GAME_WIDTH - 45, GAME_HEIGHT / 2 - 20, 40, 40, '>', COLORS.buttonGray, () => {
        this.navigateGarden(1);
      });
    }

    this.inventoryArrow = this.add.graphics().setDepth(DEPTH.UI_BG);
    const arrowX = GAME_WIDTH / 2 - 25;
    const arrowY = GAME_HEIGHT - 30;
    this.inventoryArrow.fillStyle(COLORS.buttonGray, 0.8);
    this.inventoryArrow.fillRoundedRect(arrowX, arrowY, 50, 25, 5);
    const arrowZone = this.add.zone(GAME_WIDTH / 2, arrowY + 12, 50, 25)
      .setInteractive({ useHandCursor: true }).setDepth(DEPTH.BUTTONS);
    arrowZone.on('pointerdown', () => this.toggleInventory());
    this.gardenUI.add(arrowZone);
    const arrowLabel = this.add.text(GAME_WIDTH / 2, arrowY + 12, '▲', {
      fontSize: '12px', color: '#ffffff', fontFamily: 'Arial',
    }).setOrigin(0.5).setDepth(DEPTH.UI_BG);

    this.collectAllBtn = new RecolorableButton(this, GAME_WIDTH - 120, GAME_HEIGHT - 50, 110, 35, 'Collect All', COLORS.buttonGreen, () => {
      this.collectAllHarvest();
    });

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
}
