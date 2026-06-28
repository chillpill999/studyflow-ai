import * as THREE from 'three';

// 1. Pearl Metal Material: High metalness, clearcoat reflection, pink-violet tint
export const pearlMetalMaterial = new THREE.MeshPhysicalMaterial({
  color: new THREE.Color('#F0E6F2'),
  metalness: 0.85,
  roughness: 0.12,
  clearcoat: 1.0,
  clearcoatRoughness: 0.1,
  ior: 1.55,
  reflectivity: 0.8,
});

// 2. Frosted Glass Material: High physical transmission and thickness refraction
export const frostedGlassMaterial = new THREE.MeshPhysicalMaterial({
  color: new THREE.Color('#FFFFFF'),
  metalness: 0.05,
  roughness: 0.22,
  transmission: 0.92, // Refractive transparency
  thickness: 1.2, // Refraction thickness
  ior: 1.45,
  transparent: true,
  opacity: 0.8,
});

// 3. Gold Metallic Material: High-polished golden alloy
export const goldMetallicMaterial = new THREE.MeshPhysicalMaterial({
  color: new THREE.Color('#D4AF37'),
  metalness: 1.0,
  roughness: 0.15,
  clearcoat: 0.5,
  clearcoatRoughness: 0.2,
});

// 4. Glass Glow Material: High emissive color for neon highlight points
export const glassGlowMaterial = new THREE.MeshPhysicalMaterial({
  color: new THREE.Color('#8B5CF6'),
  emissive: new THREE.Color('#7C3AED'),
  emissiveIntensity: 1.5,
  transparent: true,
  opacity: 0.7,
  roughness: 0.1,
});

// 5. Transparent Crystal Material: High refraction and diamond-like cuts
export const transparentCrystalMaterial = new THREE.MeshPhysicalMaterial({
  color: new THREE.Color('#E0F2FE'),
  metalness: 0.0,
  roughness: 0.05,
  transmission: 0.95,
  thickness: 2.0,
  ior: 1.8, // Diamond index of refraction
  transparent: true,
  opacity: 0.6,
});

// 6. Accent Material: Premium deep violet clearcoat lacquer
export const accentMaterial = new THREE.MeshPhysicalMaterial({
  color: new THREE.Color('#B998D2'),
  metalness: 0.6,
  roughness: 0.2,
  clearcoat: 1.0,
  clearcoatRoughness: 0.1,
});

// VRAM Disposal helper
export const disposeMaterials = () => {
  pearlMetalMaterial.dispose();
  frostedGlassMaterial.dispose();
  goldMetallicMaterial.dispose();
  glassGlowMaterial.dispose();
  transparentCrystalMaterial.dispose();
  accentMaterial.dispose();
};
