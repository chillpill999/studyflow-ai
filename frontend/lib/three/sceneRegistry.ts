import * as THREE from 'three';

export interface ThreeScenePlugin {
  id: string;
  register: () => void;
  initialize: (scene: THREE.Scene, camera: THREE.Camera, renderer: THREE.WebGLRenderer) => void;
  update: (delta: number, time: number) => void;
  pause: () => void;
  resume: () => void;
  dispose: () => void;
}

class SceneRegistry {
  private plugins: Map<string, ThreeScenePlugin> = new Map();
  private activePluginIds: Set<string> = new Set();

  public register(plugin: ThreeScenePlugin) {
    if (this.plugins.has(plugin.id)) {
      console.warn(`Three.js SceneRegistry: Plugin with ID "${plugin.id}" is already registered.`);
      return;
    }
    this.plugins.set(plugin.id, plugin);
    plugin.register();
  }

  public activate(id: string, scene: THREE.Scene, camera: THREE.Camera, renderer: THREE.WebGLRenderer) {
    const plugin = this.plugins.get(id);
    if (plugin && !this.activePluginIds.has(id)) {
      plugin.initialize(scene, camera, renderer);
      this.activePluginIds.add(id);
    }
  }

  public deactivate(id: string) {
    const plugin = this.plugins.get(id);
    if (plugin && this.activePluginIds.has(id)) {
      plugin.dispose();
      this.activePluginIds.delete(id);
    }
  }

  public updateAll(delta: number, time: number) {
    this.activePluginIds.forEach((id) => {
      const plugin = this.plugins.get(id);
      if (plugin) {
        plugin.update(delta, time);
      }
    });
  }

  public pauseAll() {
    this.activePluginIds.forEach((id) => {
      const plugin = this.plugins.get(id);
      if (plugin) {
        plugin.pause();
      }
    });
  }

  public resumeAll() {
    this.activePluginIds.forEach((id) => {
      const plugin = this.plugins.get(id);
      if (plugin) {
        plugin.resume();
      }
    });
  }

  public getActivePlugins(): ThreeScenePlugin[] {
    return Array.from(this.activePluginIds)
      .map(id => this.plugins.get(id))
      .filter((p): p is ThreeScenePlugin => p !== undefined);
  }

  public clear() {
    this.activePluginIds.forEach(id => this.deactivate(id));
    this.plugins.clear();
  }
}

export const sceneRegistry = new SceneRegistry();
export default sceneRegistry;
