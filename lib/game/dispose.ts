import * as THREE from 'three';

/** Recursively dispose geometries, materials and textures created for a scene graph. */
export function disposeObject3D(root: THREE.Object3D): void {
  const geometries = new Set<THREE.BufferGeometry>();
  const materials = new Set<THREE.Material>();
  root.traverse((object) => {
    const mesh = object as THREE.Mesh;
    if (mesh.geometry) geometries.add(mesh.geometry);
    if (mesh.material) {
      if (Array.isArray(mesh.material)) mesh.material.forEach((material) => materials.add(material));
      else materials.add(mesh.material);
    }
  });
  geometries.forEach((geometry) => geometry.dispose());
  materials.forEach((material) => {
    const record = material as THREE.Material & Record<string, unknown>;
    for (const key of [
      'map',
      'lightMap',
      'aoMap',
      'emissiveMap',
      'bumpMap',
      'normalMap',
      'roughnessMap',
      'metalnessMap',
      'alphaMap',
      'envMap',
    ]) {
      const texture = record[key];
      if (texture instanceof THREE.Texture) texture.dispose();
    }
    material.dispose();
  });
}

export function makeCanvasTexture(
  width: number,
  height: number,
  draw: (ctx: CanvasRenderingContext2D) => void,
): THREE.CanvasTexture | null {
  if (typeof document === 'undefined') return null;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  draw(ctx);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}
