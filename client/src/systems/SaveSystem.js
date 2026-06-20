import { supabase } from './SupabaseClient.js';

const LOCAL_KEY = 'gag_save_data';
const SETTINGS_KEY = 'gag_settings';

export class SaveSystem {
  constructor(user = null) {
    this.user = user;
  }

  getSettings() {
    try {
      const raw = localStorage.getItem(SETTINGS_KEY);
      return raw ? JSON.parse(raw) : { cloudSyncEnabled: false };
    } catch {
      return { cloudSyncEnabled: false };
    }
  }

  saveSettings(settings) {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  }

  setSetting(key, value) {
    const settings = this.getSettings();
    settings[key] = value;
    this.saveSettings(settings);
  }

  async saveCloud(data) {
    await this.saveToCloud(data);
  }

  async loadCloud() {
    return this.loadFromCloud();
  }

  async saveGarden(gardenData) {
    const data = {
      gardens: gardenData,
      lastModified: Date.now(),
      version: 1,
    };

    localStorage.setItem(LOCAL_KEY, JSON.stringify(data));

    if (this.user) {
      await this.saveToCloud(data);
    }
  }

  async loadGarden() {
    const local = this.loadLocal();
    let cloud = null;

    if (this.user) {
      cloud = await this.loadFromCloud();
    }

    return { local, cloud };
  }

  loadLocal() {
    try {
      const raw = localStorage.getItem(LOCAL_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  hasLocalSave() {
    return localStorage.getItem(LOCAL_KEY) !== null;
  }

  async loadFromCloud() {
    if (!this.user) return null;
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('garden_data')
        .eq('id', this.user.id)
        .single();
      if (error || !data?.garden_data) return null;
      return data.garden_data;
    } catch {
      return null;
    }
  }

  async saveToCloud(data) {
    if (!this.user) return;
    try {
      await supabase.from('profiles').update({
        garden_data: data,
      }).eq('id', this.user.id);
    } catch {
    }
  }

  hasConflict(local, cloud) {
    if (!local || !cloud) return false;
    return Math.abs(local.lastModified - cloud.lastModified) > 5000;
  }

  async resolveConflict(choice) {
    const { local, cloud } = await this.loadGarden();
    if (!local && !cloud) return null;

    if (choice === 'local' && local) {
      if (this.user) await this.saveToCloud(local);
      return local;
    } else if (choice === 'cloud' && cloud) {
      localStorage.setItem(LOCAL_KEY, JSON.stringify(cloud));
      return cloud;
    }

    return local || cloud;
  }
}