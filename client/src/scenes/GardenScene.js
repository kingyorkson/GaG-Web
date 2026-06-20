import Phaser from 'phaser';
import { COLORS, GAME_WIDTH, GAME_HEIGHT, INVENTORY_SLOTS, PERMANENT_SLOTS } from '../config/constants.js';
import { SEEDS } from '../config/seeds.js';
import { RecolorableButton } from '../ui/RecolorableButton.js';
import { InventoryUI } from '../ui/InventoryUI.js';
import { GrowthSystem } from '../systems/GrowthSystem.js';

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
    this.gardenPlots = [];
    this.placedProps = [];
    this.tabletOpen = false;
    this.inventoryOpen = false;
    this.currentTool = null;
    this.cash = 100;

    this.cameras.main.fadeIn(500, 0, 0, 0);
    this.createGarden();
    this.createUI();
    this.setupGamepad();
    this.processOfflineGrowth();
  }

  createGarden() {
    const g = this.add.graphics();

    g.fillStyle(COLORS.grass, 1);
    g.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    const plotSize = 80;
    const cols = 8;
    const rows = 6;
    const startX = (GAME_WIDTH - cols * plotSize) / 2;
    const startY = (GAME_HEIGHT - rows * plotSize) / 2;

    g.fillStyle(COLORS.soil, 1);
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const x = startX + col * plotSize;
        const y = startY + row * plotSize;
        g.fillRoundedRect(x + 2, y + 2, plotSize - 4, plotSize - 4, 5);
        this.gardenPlots.push({ x, y, w: plotSize, h: plotSize, plant: null, row, col });
      }
    }

    this.gardenPlots.forEach(plot => {
      const zone = this.add.zone(plot.x + plot.w / 2, plot.y + plot.h / 2, plot.w, plot.h)
        .setInteractive({ useHandCursor: true });
      zone.on('pointerdown', () => this.onPlotClick(plot));
      zone.on('pointerover', () => this.onPlotHover(plot, true));
      zone.on('pointerout', () => this.onPlotHover(plot, false));
      plot.zone = zone;
    });

    this.plotHighlight = this.add.graphics();
    this.plotHighlight.setVisible(false);

    this.plantSprites = [];
    this.hoverText = this.add.text(0, 0, '', {
      fontSize: '14px', color: '#ffffff', fontFamily: 'Arial',
      backgroundColor: '#000000aa', padding: { x: 5, y: 3 },
    }).setVisible(false).setDepth(100);
  }

  createUI() {
    this.gardenUI = this.add.container(0, 0).setDepth(50);

    this.tabletBtn = new RecolorableButton(this, 10, 10, 90, 35, 'Tablet', COLORS.buttonGray, () => {
      this.openTablet();
    });

    this.inventoryArrow = this.add.graphics();
    const arrowX = GAME_WIDTH / 2 - 25;
    const arrowY = GAME_HEIGHT - 30;
    this.inventoryArrow.fillStyle(COLORS.buttonGray, 0.8);
    this.inventoryArrow.fillRoundedRect(arrowX, arrowY, 50, 25, 5);
    const arrowZone = this.add.zone(GAME_WIDTH / 2, arrowY + 12, 50, 25)
      .setInteractive({ useHandCursor: true });
    arrowZone.on('pointerdown', () => this.toggleInventory());
    this.add.text(GAME_WIDTH / 2, arrowY + 12, '▲', {
      fontSize: '12px', color: '#ffffff', fontFamily: 'Arial',
    }).setOrigin(0.5);

    this.collectAllBtn = new RecolorableButton(this, GAME_WIDTH - 120, GAME_HEIGHT - 50, 110, 35, 'Collect All', COLORS.buttonGreen, () => {
      this.collectAllHarvest();
    });

    this.cashText = this.add.text(GAME_WIDTH / 2, 15, `$${this.cash}`, {
      fontSize: '20px', color: '#ffd700', fontFamily: 'Arial', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(100);
  }

  openTablet() {
    if (this.inventoryOpen) this.toggleInventory();
    this.tabletOpen = true;

    if (this.textures.exists('tablet_bootup')) {
      const video = this.add.video(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'tablet_bootup');
      video.setDepth(200);
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
    if (plot.plant && plot.plant.type === 'seed') {
      const cx = plot.x + plot.w / 2;
      const cy = plot.y + plot.h / 2;
      const texKey = `seed_${plot.plant.seedId}`;

      if (this.textures.exists(texKey)) {
        const img = this.add.image(cx, cy, texKey).setDisplaySize(plot.w - 10, plot.h - 10);
        if (plot.plant.grown) {
          img.setTint(0xffffff);
          const border = this.add.graphics();
          border.lineStyle(2, 0xffd700, 1);
          border.strokeCircle(cx, cy, plot.w / 2 - 5);
          plot.plant.graphics = this.add.container(0, 0, [border, img]);
        } else {
          img.setTint(0xaaaaaa);
          plot.plant.graphics = img;
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
        plot.plant.graphics = g;
      }
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

    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 50, `Harvest ${plot.plant.name}?`, {
      fontSize: '20px', color: '#ffffff', fontFamily: 'Arial',
    }).setOrigin(0.5);

    const hBtn = new RecolorableButton(this, GAME_WIDTH / 2 - 60, GAME_HEIGHT / 2, 50, 30, '✓', COLORS.buttonGreen, () => {
      this.harvestPlant(plot);
    });
    const cBtn = new RecolorableButton(this, GAME_WIDTH / 2 + 10, GAME_HEIGHT / 2, 50, 30, 'X', COLORS.danger, () => {
      hBtn.destroy(); cBtn.destroy();
    });
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
      if (this.gamepad.X) {
        this.openTablet();
        this.gamepad = null;
      }
    }
  }
}
