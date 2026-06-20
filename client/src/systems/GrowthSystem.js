import { SEEDS } from '../config/seeds.js';

export class GrowthSystem {
  constructor() {
    this.offlineGrowthKey = 'growing_gardening_offline';
  }

  processOfflineGrowth(gardenPlots) {
    const events = [];
    const now = Date.now();

    gardenPlots.forEach(plot => {
      if (!plot.plant || plot.plant.type !== 'seed') return;

      const elapsed = now - plot.plant.plantedAt;

      if (elapsed >= plot.plant.growTime && !plot.plant.harvestable) {
        plot.plant.grown = true;
        plot.plant.harvestable = true;
        events.push({
          name: plot.plant.name,
          event: 'Fully grown and ready to harvest!',
          plot,
        });
      } else if (elapsed > 0 && !plot.plant.grown) {
        const growthPct = Math.min(elapsed / plot.plant.growTime, 1);
        if (growthPct > 0.5 && !plot.plant.halfWayNotified) {
          plot.plant.halfWayNotified = true;
          events.push({
            name: plot.plant.name,
            event: 'Halfway grown!',
            plot,
          });
        }
        events.push({
          name: plot.plant.name,
          event: `Grew ${Math.floor(growthPct * 100)}% while offline`,
          plot,
        });
      }
    });

    this.saveOfflineGrowth(events);
    return events;
  }

  saveOfflineGrowth(events) {
    try {
      localStorage.setItem(this.offlineGrowthKey, JSON.stringify({
        timestamp: Date.now(),
        events,
      }));
    } catch {
      // localStorage not available
    }
  }

  getOfflineGrowth() {
    try {
      const data = localStorage.getItem(this.offlineGrowthKey);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  clearOfflineGrowth() {
    try {
      localStorage.removeItem(this.offlineGrowthKey);
    } catch {
      // ignore
    }
  }
}
