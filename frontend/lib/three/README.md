# Three.js 3D Rendering System – The Study Flow

Welcome to the Three.js module. This engine is built using **React Three Fiber (R3F)** and **Drei** to implement a premium Apple-quality visual experience.

---

## 1. Single-Context View Architecture

Browsers strictly limit the maximum number of concurrent active WebGL canvases (usually ~8-16 depending on the device). Spawning multiple canvases for list items or sidebar icons will crash the tab.

To solve this, we use a **Single-Canvas Portaling Architecture**:
1. A single global `<Canvas>` is mounted at the top-level via `<SceneManager />`.
2. Individual 3D elements render inside standard DOM elements using Drei's `<View>` component.
3. The global Canvas has a `<View.Port />` which dynamically captures and projects all external views onto a single WebGL context.

---

## 2. Directory Structure

```text
frontend/
├── lib/three/
│   ├── config.ts         # Feature flags, quality profile metrics, lighting defaults
│   ├── capabilities.ts   # WebGL2/WebGPU hardware check and GPU tiering
│   ├── geometries.ts     # Preallocated geometry caches (box, sphere, torus, etc.)
│   ├── materials.ts      # Shared material caches (PearlMetal, FrostedGlass, Gold, etc.)
│   ├── events.ts         # Pointer and raycast event helper methods
│   ├── animation.ts      # Easing presets (floating, breathing, elasticScale)
│   ├── sceneRegistry.ts  # Scene plugin registry and lifecycle managers
│   └── renderQueue.ts    # Prioritized task queue (Priority 1-4 rendering budgets)
│
└── components/three/
    ├── SceneManager.tsx       # Global Canvas container + shared lighting rig
    ├── PerformanceManager.tsx # FPS monitoring and quality scaling
    ├── RenderScheduler.tsx    # Hook to trigger renderQueue loops on frame ticks
    ├── CameraController.tsx   # Mouse parallax camera interpolation
    ├── PostProcessing.tsx    # Ambient fog, tone mapping and bloom control
    ├── AssetPreloader.tsx     # WebGL shader compiler preloader
    ├── ThreeIcon.tsx          # 3D navigation menu view portals
    ├── FloatingGlassNodes.tsx # Interactive frosted nodes (Login backdrop)
    └── FlowFieldParticles.tsx # Instanced GPU particle simulation (Landing backdrop)
```

---

## 3. Caching & Memory Lifecycles

### Geometry & Material Caching
To prevent GPU memory leaks and garbage collection stutters, geometries and materials are pre-allocated once in `geometries.ts` and `materials.ts`.
* Do NOT instantiate `new THREE.BoxGeometry()` or `new THREE.MeshPhysicalMaterial()` inside component files.
* Import from the shared caches.

### VRAM Disposal
When the rendering engine unmounts, calls are made to `.dispose()` on all geometries and materials to clean GPU memory buffers.

---

## 4. Prioritized Rendering Queue & Budgets

The rendering loop runs through `renderQueue.ts` which classifies updates into four priorities:
* **Priority 1**: Core interactions (camera movement, drag actions).
* **Priority 2**: Hover/click animations.
* **Priority 3**: Medium-priority particles (`FlowFieldParticles`).
* **Priority 4**: Low-priority background decor (`FloatingGlassNodes`).

Under low performance constraints (consistently <50 FPS), the `PerformanceManager` degrades the profile (High -> Medium -> Low), reducing particle counts, disabling bloom, and skipping Priority 3/4 queue tasks.

---

## 5. Adding New Scene Plugins

To add a new scene (e.g. `CollaborativeGlobe` or `Avatar`), follow this pattern:
1. Define a plugin object implementing the `ThreeScenePlugin` interface:
   ```typescript
   import { ThreeScenePlugin } from 'src/lib/three/sceneRegistry';
   
   export const myScenePlugin: ThreeScenePlugin = {
     id: 'my-scene',
     register: () => console.log('Registered'),
     initialize: (scene, camera, renderer) => { ... },
     update: (delta, time) => { ... },
     pause: () => { ... },
     resume: () => { ... },
     dispose: () => { ... }
   };
   ```
2. Register it with `sceneRegistry.register(myScenePlugin)`.
