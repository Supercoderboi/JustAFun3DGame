// ================= THREE.JS RENDERING =================
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160/build/three.module.js';
import { PointerLockControls } from 'https://cdn.jsdelivr.net/npm/three@0.160/examples/jsm/controls/PointerLockControls.js';
import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three@0.160/examples/jsm/loaders/GLTFLoader.js';

// Audio listener for 3D sounds
export const audioListener = new THREE.AudioListener();
let cameraCreated = false;
export const gltfLoader = new GLTFLoader();

// Scene setup
export const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);

export const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);

export const weaponHolder = new THREE.Group();
scene.add(weaponHolder);

export const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Lighting
const light = new THREE.HemisphereLight(0xffffff, 0x444444);
light.position.set(0, 20, 0);
scene.add(light);

const sun = new THREE.DirectionalLight(0xffffff, 1.6);
sun.position.set(-12, 18, 8);
sun.castShadow = true;
scene.add(sun);

// Colliders and materials
export const colliders = [];
export const ladders = [];

export const townMaterials = {
  grass: new THREE.MeshStandardMaterial({ color: 0x4f7f3f, roughness: 0.9 }),
  road: new THREE.MeshStandardMaterial({ color: 0x2f3439, roughness: 0.86 }),
  sidewalk: new THREE.MeshStandardMaterial({ color: 0xb9b4a9, roughness: 0.78 }),
  brick: new THREE.MeshStandardMaterial({ color: 0xb35f48, roughness: 0.82 }),
  blue: new THREE.MeshStandardMaterial({ color: 0x627d98, roughness: 0.78 }),
  tan: new THREE.MeshStandardMaterial({ color: 0xc8a56a, roughness: 0.8 }),
  roof: new THREE.MeshStandardMaterial({ color: 0x3b3330, roughness: 0.72 }),
  crate: new THREE.MeshStandardMaterial({ color: 0x8a5a30, roughness: 0.9 }),
  trim: new THREE.MeshStandardMaterial({ color: 0xeee3ca, roughness: 0.65 }),
  concrete: new THREE.MeshStandardMaterial({ color: 0x9da3a8, roughness: 0.82 }),
  metal: new THREE.MeshStandardMaterial({ color: 0x202832, roughness: 0.55, metalness: 0.28 }),
  redWall: new THREE.MeshStandardMaterial({ color: 0x9f4f46, roughness: 0.78 }),
  blueWall: new THREE.MeshStandardMaterial({ color: 0x496f91, roughness: 0.78 })
};

// Map building functions
export function createBox(x, z, w, h, d, material, { collider = true, y = 0, cast = true } = {}) {
  const m = new THREE.Mesh(
    new THREE.BoxGeometry(w, h, d),
    material
  );
  m.position.set(x, y + h / 2, z);
  m.castShadow = cast;
  m.receiveShadow = true;
  scene.add(m);
  if (collider) colliders.push(m);
  return m;
}

export function createBuilding(x, z, w, h, d, material) {
  const building = createBox(x, z, w, h, d, material);
  createBox(x, z, w + 0.25, 0.22, d + 0.25, townMaterials.roof, { y: h });

  const windowCount = Math.max(1, Math.floor(w / 2));
  for (let i = 0; i < windowCount; i++) {
    const offset = -w / 2 + 0.8 + i * 1.6;
    createBox(x + offset, z + d / 2 + 0.03, 0.45, 0.45, 0.06, townMaterials.metal, { collider: false, y: 1.05, cast: false });
  }

  createBox(x, z + d / 2 + 0.05, 0.75, 1.05, 0.08, townMaterials.trim, { collider: false, y: 0, cast: false });
  return building;
}

export function createLadder(x, z, team) {
  const sideColor = team === "blue" ? townMaterials.blue : townMaterials.brick;

  createBox(x - 0.38, z, 0.08, 3.1, 0.08, townMaterials.metal, { collider: false, y: 0.15 });
  createBox(x + 0.38, z, 0.08, 3.1, 0.08, townMaterials.metal, { collider: false, y: 0.15 });

  for (let i = 0; i < 8; i++) {
    createBox(x, z, 0.9, 0.07, 0.09, sideColor, { collider: false, y: 0.42 + i * 0.34 });
  }

  ladders.push({
    x,
    z,
    minY: 2,
    maxY: 5.25,
    halfWidth: 0.9,
    halfDepth: 1.0
  });
}

export function createTeamBuilding(centerX, team) {
  const isBlue = team === "blue";
  const wallMat = isBlue ? townMaterials.blueWall : townMaterials.redWall;
  const frontX = centerX + (isBlue ? 6 : -6);
  const rearX = centerX + (isBlue ? -6 : 6);
  const signX = centerX + (isBlue ? -6.25 : 6.25);
  const stairHoleX = centerX + (isBlue ? -2.3 : 2.3);
  const holeSideSign = isBlue ? -1 : 1;

  createBox(centerX, 0, 12.4, 0.18, 14.4, townMaterials.sidewalk, { collider: false, y: 0, cast: false });
  createBox(centerX, 2.25, 11.6, 0.24, 9.5, townMaterials.concrete, { y: 3 });
  createBox(centerX + holeSideSign * -3.95, -4.75, 3.7, 0.24, 3.9, townMaterials.concrete, { y: 3 });
  createBox(centerX + holeSideSign * 2.0, -6.2, 7.6, 0.24, 1.0, townMaterials.concrete, { y: 3 });
  createBox(stairHoleX + holeSideSign * -2.0, -3.9, 2.8, 0.24, 3.2, townMaterials.concrete, { y: 3 });
  createBox(centerX, 0, 12.8, 0.28, 14.8, townMaterials.roof, { y: 6.05 });

  createBox(rearX, -5.1, 0.35, 3, 3.8, wallMat);
  createBox(rearX, 5.1, 0.35, 3, 3.8, wallMat);
  createBox(frontX, 0, 0.35, 3, 14, wallMat);
  createBox(centerX, -7, 12, 3, 0.35, wallMat);
  createBox(centerX, 7, 12, 3, 0.35, wallMat);

  createBox(rearX, 0, 0.35, 3, 14, wallMat, { y: 3 });
  createBox(frontX, -5.2, 0.35, 3, 3.6, wallMat, { y: 3 });
  createBox(frontX, 5.2, 0.35, 3, 3.6, wallMat, { y: 3 });
  createBox(frontX, 0, 0.35, 0.75, 4.2, wallMat, { y: 3 });
  createBox(frontX, 0, 0.35, 0.65, 4.2, wallMat, { y: 5.35 });
  createBox(centerX, -7, 12, 3, 0.35, wallMat, { y: 3 });
  createBox(centerX, 7, 12, 3, 0.35, wallMat, { y: 3 });

  createBox(frontX + (isBlue ? 0.75 : -0.75), 0, 1.2, 0.18, 4.8, townMaterials.metal, { y: 3.02 });
  createBox(signX, 0, 0.12, 1.2, 4.8, isBlue ? townMaterials.blue : townMaterials.brick, { collider: false, y: 3.7, cast: false });

  createLadder(stairHoleX, -3.9, team);

  createBox(centerX, 7.28, 12.8, 0.18, 0.25, townMaterials.trim, { collider: false, y: 3.12, cast: false });
  createBox(centerX, -7.28, 12.8, 0.18, 0.25, townMaterials.trim, { collider: false, y: 3.12, cast: false });
  createBox(rearX + (isBlue ? -0.18 : 0.18), -3.4, 0.08, 2.1, 1.2, townMaterials.metal, { collider: false, y: 0, cast: false });
  createBox(rearX + (isBlue ? -0.18 : 0.18), 3.4, 0.08, 2.1, 1.2, townMaterials.metal, { collider: false, y: 0, cast: false });
}

// Build the map
export function buildMap() {
  createBox(0, 0, 78, 0.2, 50, townMaterials.grass, { collider: false, y: -0.12, cast: false });
  createBox(0, 0, 28, 0.08, 20, townMaterials.road, { collider: false, y: 0.01, cast: false });
  createBox(0, 0, 6, 0.1, 46, townMaterials.road, { collider: false, y: 0.02, cast: false });
  createBox(0, -12, 55, 0.08, 4, townMaterials.sidewalk, { collider: false, y: 0.03, cast: false });
  createBox(0, 12, 55, 0.08, 4, townMaterials.sidewalk, { collider: false, y: 0.03, cast: false });

  createTeamBuilding(-18, "blue");
  createTeamBuilding(18, "red");

  createBox(0, 0, 4, 1.2, 4, townMaterials.crate);
  createBox(-5, 6, 3, 1.4, 2.2, townMaterials.crate);
  createBox(5, -6, 3, 1.4, 2.2, townMaterials.crate);
  createBox(0, 10, 8, 1, 1.6, townMaterials.concrete);
  createBox(0, -10, 8, 1, 1.6, townMaterials.concrete);

  createBox(0, -25, 78, 5, 2, townMaterials.roof);
  createBox(0, 25, 78, 5, 2, townMaterials.roof);
  createBox(-39, 0, 2, 5, 50, townMaterials.roof);
  createBox(39, 0, 2, 5, 50, townMaterials.roof);
}

// Spawn points
export const teamSpawns = {
  blue: [
    new THREE.Vector3(-30, 2, -4),
    new THREE.Vector3(-30, 2, 4)
  ],
  red: [
    new THREE.Vector3(30, 2, -4),
    new THREE.Vector3(30, 2, 4)
  ]
};

export const spawnPoints = [...teamSpawns.blue, ...teamSpawns.red];

// Controls setup
export const controls = new PointerLockControls(camera, document.body);
scene.add(controls.getObject());
controls.getObject().position.copy(spawnPoints[0]);
camera.position.set(0, 0, 0);

// Attach audio listener to camera
export function attachAudioListenerToCamera() {
  if (!cameraCreated && typeof camera !== 'undefined' && camera.add) {
    camera.add(audioListener);
    cameraCreated = true;
  }
}
setTimeout(attachAudioListenerToCamera, 1000);

// Gun models
export const gunModels = {};
export const gunMixers = {};

export function loadGun(name, path) {
  gltfLoader.load(path, (gltf) => {
    const model = gltf.scene;
    model.visible = false;
    scene.add(model);
    gunModels[name] = model;

    let audio = null;
    model.traverse((child) => {
      if (child.isAudio) {
        audio = child;
      }
    });

    if (!audio && gltf.audio && gltf.audio.length > 0) {
      audio = gltf.audio[0];
    }

    if (audio) {
      gunModels[name].userData.audio = audio;
    }

    const mixer = new THREE.AnimationMixer(model);
    const actions = {};
    gltf.animations.forEach((clip) => {
      actions[clip.name] = mixer.clipAction(clip);
    });
    gunMixers[name] = { mixer, actions };
    console.log("Loaded gun:", name, audio ? "with audio" : "");
  });
}

// Create player mesh
export function createPlayerMesh(color = 0xff3b30) {
  const g = new THREE.Group();
  g.userData.health = 100;

  const suit = new THREE.MeshStandardMaterial({ color, roughness: 0.72 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x1f2933, roughness: 0.8 });
  const skin = new THREE.MeshStandardMaterial({ color: 0xd8a47f, roughness: 0.7 });
  const visor = new THREE.MeshStandardMaterial({ color: 0x101820, roughness: 0.35, metalness: 0.2 });

  const body = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.38, 0.8, 4, 8),
    suit
  );
  body.userData.hitZone = "body";
  body.position.y = 1.15;
  g.add(body);

  const head = new THREE.Mesh(
    new THREE.SphereGeometry(0.36, 16, 12),
    skin
  );
  head.userData.hitZone = "head";
  head.position.y = 2.02;
  g.add(head);

  const helmet = new THREE.Mesh(
    new THREE.SphereGeometry(0.4, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.55),
    dark
  );
  helmet.userData.hitZone = "head";
  helmet.position.y = 2.1;
  g.add(helmet);

  const visorMesh = new THREE.Mesh(
    new THREE.BoxGeometry(0.5, 0.12, 0.08),
    visor
  );
  visorMesh.userData.hitZone = "head";
  visorMesh.position.set(0, 2.03, -0.32);
  g.add(visorMesh);

  const armGeo = new THREE.CapsuleGeometry(0.12, 0.62, 4, 8);
  const leftArm = new THREE.Mesh(armGeo, suit);
  leftArm.position.set(-0.48, 1.28, 0);
  leftArm.rotation.z = 0.15;
  g.add(leftArm);

  const rightArm = leftArm.clone();
  rightArm.position.x = 0.48;
  rightArm.rotation.z = -0.15;
  g.add(rightArm);

  const legGeo = new THREE.CapsuleGeometry(0.14, 0.58, 4, 8);
  const leftLeg = new THREE.Mesh(legGeo, dark);
  leftLeg.position.set(-0.18, 0.35, 0);
  g.add(leftLeg);

  const rightLeg = leftLeg.clone();
  rightLeg.position.x = 0.18;
  g.add(rightLeg);

  g.traverse((child) => {
    if (child.isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });

  return g;
}

export function tagPlayerMesh(object, playerId) {
  object.traverse(child => {
    if (child.isMesh) {
      child.userData.playerId = playerId;
    }
  });
}

// Utility functions
export function getCameraWorldPosition() {
  const worldPosition = new THREE.Vector3();
  camera.getWorldPosition(worldPosition);
  return worldPosition;
}

export function createBulletTracer(start, end, color = 0xfff3a3) {
  if (start.distanceTo(end) < 0.2) return;

  const direction = end.clone().sub(start);
  const length = direction.length();
  const midpoint = start.clone().add(end).multiplyScalar(0.5);
  const tracer = new THREE.Mesh(
    new THREE.CylinderGeometry(0.025, 0.025, length, 8),
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.85 })
  );

  tracer.position.copy(midpoint);
  tracer.quaternion.setFromUnitVectors(
    new THREE.Vector3(0, 1, 0),
    direction.normalize()
  );
  scene.add(tracer);

  window.setTimeout(() => scene.remove(tracer), 90);
}

export function vectorPayload(vector) {
  return { x: vector.x, y: vector.y, z: vector.z };
}

export function vectorFromPayload(payload) {
  return new THREE.Vector3(payload.x, payload.y, payload.z);
}

// Initialize renderer
export function initRenderer() {
  buildMap();
  loadGun("pistol", "models/pistol/p.glb");
  loadGun("shotgun", "models/shotgun/s.glb");
  loadGun("sniper", "models/sniper rifle/sn.glb");
loadGun("smg", "models/smg/smg.glb");
}
