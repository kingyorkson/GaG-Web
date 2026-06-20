import Phaser from 'phaser';
import { COLORS, GAME_WIDTH, GAME_HEIGHT } from '../config/constants.js';
import { RecolorableButton } from '../ui/RecolorableButton.js';
import { supabase } from '../systems/SupabaseClient.js';

const DEPTH = {
  BG: 0, CONTAINER: 5, FRAME: 10, CONTENT: 20, BUTTONS: 30,
};

export class WebLandingScene extends Phaser.Scene {
  constructor() {
    super({ key: 'WebLandingScene' });
  }

  create() {
    this.cameras.main.setBackgroundColor(COLORS.background);

    if (this.textures.exists('tablet_bg')) {
      this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'tablet_bg')
        .setDisplaySize(GAME_WIDTH, GAME_HEIGHT).setAlpha(0.3).setDepth(DEPTH.BG);
    }

    this.tabletContainer = this.add.container(0, 0).setDepth(DEPTH.CONTAINER);
    this.createFrame();
    this.createContent();
  }

  createFrame() {
    const tw = GAME_WIDTH * 0.8;
    const th = GAME_HEIGHT * 0.6;
    const tx = (GAME_WIDTH - tw) / 2;
    const ty = (GAME_HEIGHT - th) / 2;

    const g = this.add.graphics().setDepth(DEPTH.FRAME);
    g.fillStyle(COLORS.tabletBg, 0.92);
    g.fillRoundedRect(tx, ty, tw, th, 20);
    g.lineStyle(3, 0x4ecca3, 0.8);
    g.strokeRoundedRect(tx, ty, tw, th, 20);

    this.bounds = { x: tx, y: ty, w: tw, h: th };
    this.tabletContainer.add(g);
  }

  createContent() {
    const cx = GAME_WIDTH / 2;
    const bounds = this.bounds;

    this.add.text(cx, bounds.y + 50, 'Growing & Gardening 2D', {
      fontSize: '30px', color: '#ffffff', fontFamily: 'Arial', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(DEPTH.CONTENT);

    this.add.text(cx, bounds.y + 95, 'Web Edition', {
      fontSize: '16px', color: '#4ecca3', fontFamily: 'Arial',
    }).setOrigin(0.5).setDepth(DEPTH.CONTENT);

    const btnW = 280;
    const btnH = 55;
    const btnX = cx - btnW / 2;

    new RecolorableButton(this, btnX, bounds.y + 150, btnW, btnH, 'Play Game', COLORS.buttonGreen, () => {
      this.startGame();
    });

    new RecolorableButton(this, btnX, bounds.y + 225, btnW, btnH, 'Create Account', COLORS.buttonGray, () => {
      this.openCreateAccount();
    });

    this.add.text(cx, bounds.y + bounds.h - 30, 'Create an account to save your progress across devices.\nPlaying as guest saves locally only.', {
      fontSize: '11px', color: '#888888', fontFamily: 'Arial', align: 'center',
    }).setOrigin(0.5).setDepth(DEPTH.CONTENT);
  }

  async startGame() {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('username, auth_type, cash')
        .eq('id', session.user.id)
        .single();
      if (profile) {
        const user = {
          id: session.user.id,
          username: profile.username,
          type: profile.auth_type,
          cash: profile.cash || 100,
          inventory: [],
        };
        this.scene.start('PreloadScene', { autoLogin: user });
        return;
      }
    }
    this.scene.start('PreloadScene');
  }

  openCreateAccount() {
    window.open(window.location.origin + window.location.pathname + '?mode=auth', 'gag-auth', 'width=500,height=700');
  }
}
