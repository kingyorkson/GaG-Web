import { COLORS, GAME_WIDTH, GAME_HEIGHT, INVENTORY_SLOTS } from '../config/constants.js';
import { SEEDS } from '../config/seeds.js';

export class InventoryUI {
  constructor(scene, onClose) {
    this.scene = scene;
    this.onClose = onClose;
    this.visible = false;
    this.selectedSeed = null;
    this.inventoryItems = [];
    this.container = scene.add.container(0, 0).setDepth(150);
    this.build();
  }

  build() {
    const invH = 180;
    const invY = GAME_HEIGHT - invH;

    this.bg = this.scene.add.graphics();
    this.bg.fillStyle(0x1a1a2e, 0.95);
    this.bg.fillRoundedRect(0, invY, GAME_WIDTH, invH, 10);
    this.bg.lineStyle(2, COLORS.tabletBorder, 1);
    this.bg.strokeRoundedRect(0, invY, GAME_WIDTH, invH, 10);

    this.slotsContainer = this.scene.add.container(0, 0);

    this.permanentSlots = this.scene.add.graphics();
    this.permanentSlots.fillStyle(COLORS.inventorySlot, 1);
    this.permanentSlots.fillRoundedRect(10, invY + 10, 180, 50, 5);
    this.permanentSlots.lineStyle(1, COLORS.buttonGreenOutline, 0.5);
    this.permanentSlots.strokeRoundedRect(10, invY + 10, 180, 50, 5);

    this.scene.add.text(20, invY + 15, 'Sledgehammer', {
      fontSize: '11px', color: '#ffffff', fontFamily: 'Arial',
    });

    this.scene.add.text(20, invY + 35, 'Shovel', {
      fontSize: '11px', color: '#ffffff', fontFamily: 'Arial',
    });

    this.sledgeHit = this.scene.add.zone(10, invY + 10, 85, 50).setInteractive({ useHandCursor: true });
    this.sledgeHit.on('pointerdown', () => {
      this.scene.currentTool = 'sledgehammer';
      this.scene.showMessage('Sledgehammer selected - click a plot to place a prop');
    });

    this.shovelHit = this.scene.add.zone(105, invY + 10, 85, 50).setInteractive({ useHandCursor: true });
    this.shovelHit.on('pointerdown', () => {
      this.scene.currentTool = null;
      if (this.scene.placedProps.length > 0) {
        const prop = this.scene.placedProps.pop();
        if (prop.graphics) prop.graphics.destroy();
        if (prop.plot) prop.plot.plant = null;
        this.scene.showMessage('Removed last prop');
      }
    });

    this.slotBounds = [];
    this.slotGraphics = [];
    this.slotTexts = [];

    for (let i = 0; i < INVENTORY_SLOTS; i++) {
      const col = i % 10;
      const row = Math.floor(i / 10);
      const sx = 210 + col * 103;
      const sy = invY + 10 + row * 55;

      const slot = this.scene.add.graphics();
      slot.fillStyle(COLORS.inventorySlot, 0.8);
      slot.fillRoundedRect(sx, sy, 98, 48, 4);
      slot.lineStyle(1, 0x444444, 0.5);
      slot.strokeRoundedRect(sx, sy, 98, 48, 4);

      const slotText = this.scene.add.text(sx + 5, sy + 24, '', {
        fontSize: '10px', color: '#ffffff', fontFamily: 'Arial',
      }).setOrigin(0, 0.5);

      const hit = this.scene.add.zone(sx + 49, sy + 24, 98, 48).setInteractive({ useHandCursor: true });
      hit.slotIndex = i;

      this.slotBounds.push({ x: sx, y: sy, w: 98, h: 48 });
      this.slotGraphics.push(slot);
      this.slotTexts.push(slotText);
    }

    this.container.add([this.bg, this.permanentSlots, this.slotsContainer]);
    this.container.setVisible(false);
  }

  show() {
    this.visible = true;
    this.container.setVisible(true);
    this.renderSlots();
  }

  hide() {
    this.visible = false;
    this.container.setVisible(false);
    this.selectedSeed = null;
    if (this.onClose) this.onClose();
  }

  renderSlots() {
    const items = this.scene.user ? this.scene.user.inventory : [];

    this.slotTexts.forEach((text, i) => {
      if (i < items.length) {
        text.setText(items[i].name);
      } else {
        text.setText('');
      }
    });

    this.slotBounds.forEach((slot, i) => {
      const hit = this.scene.children.list.find(c => c.type === 'Zone' && c.slotIndex === i);
      if (hit) {
        hit.removeAllListeners('pointerdown');
        if (i < items.length) {
          hit.on('pointerdown', () => {
            this.selectedSeed = items[i].id;
            this.updateSelectedDisplay();
            this.hide();
            this.scene.showMessage(`Selected ${items[i].name} - click a soil plot to plant`);
          });
        } else {
          hit.on('pointerdown', () => {});
        }
      }
    });
  }

  updateSelectedDisplay() {
    if (this.selectedSeed) {
      const seed = SEEDS.find(s => s.id === this.selectedSeed);
      if (seed) {
        this.scene.showMessage(`Selected: ${seed.name}`);
      }
    }
  }

  showPropSelector(callback) {
    this.show();
    const items = this.scene.user ? this.scene.user.inventory : [];

    this.slotBounds.forEach((slot, i) => {
      const hit = this.scene.children.list.find(c => c.type === 'Zone' && c.slotIndex === i);
      if (hit) {
        hit.removeAllListeners('pointerdown');
        if (i < items.length && items[i].type === 'prop') {
          hit.on('pointerdown', () => {
            callback(items[i].id);
          });
        } else {
          hit.on('pointerdown', () => {
            callback(null);
          });
        }
      }
    });
  }

  removeFromInventory(seedId) {
    if (!this.scene.user || !this.scene.user.inventory) return;
    const idx = this.scene.user.inventory.findIndex(i => i.id === seedId);
    if (idx > -1) {
      this.scene.user.inventory.splice(idx, 1);
      this.renderSlots();
    }
  }
}
