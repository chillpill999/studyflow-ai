import * as THREE from 'three';

// Global cache objects for reusable geometries
export const boxGeometry = new THREE.BoxGeometry(1, 1, 1);
export const sphereGeometry = new THREE.SphereGeometry(0.5, 32, 32);
export const torusGeometry = new THREE.TorusGeometry(0.6, 0.15, 16, 100);
export const torusKnotGeometry = new THREE.TorusKnotGeometry(0.4, 0.12, 120, 16);
export const icosahedronGeometry = new THREE.IcosahedronGeometry(0.6, 1);
export const capsuleGeometry = new THREE.CapsuleGeometry(0.3, 0.6, 4, 16);

// Expose a cleanup method to dispose resources when appropriate
export const disposeGeometries = () => {
  boxGeometry.dispose();
  sphereGeometry.dispose();
  torusGeometry.dispose();
  torusKnotGeometry.dispose();
  icosahedronGeometry.dispose();
  capsuleGeometry.dispose();
};
