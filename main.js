// ================= IMPORTS =================
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160/build/three.module.js';

// Import THREE.js rendering module
import {
  scene, camera, renderer, controls, colliders, ladders, teamSpawns, spawnPoints,
  weaponHolder, gunModels, gunMixers, audioListener, gltfLoader, createPlayerMesh,
  tagPlayerMesh, getCameraWorldPosition, createBulletTracer, buildMap, loadGun,
  initRenderer, createBox, townMaterials
} from './threejs.js';

// Import UI module
import {
  healthDisplay, healthNumber, healthFill, updateHealthDisplay, weaponDisplay,
  roomDisplay, timerDisplay, scoreboardOverlay, deathOverlay, respawnText,
  statusDisplay, showStatus, crosshair, scopeOverlay, updateWeaponDisplay,
  renderScoreboard, showDeathScreen, createPlayerLabel, updateRemoteNameLabels,
  updateTimerDisplay, formatTime
} from './ui.js';

import { createLoginOverlay } from './ui.js';
import { Multiplayer } from './supabasecode.js';
const mp = new Multiplayer();

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
  // ================= GAME CONSTANTS & STATE =================
  const PLAYER_MAX_HEALTH = 100;
  const RIFLE_DAMAGE = 25;
  const RIFLE_RANGE = 100;
  const FIRE_COOLDOWN = 180;
  const RESPAWN_TIME = 5000;

  const playerHeight = 2;
  const playerRadius = 0.5;
  const gravity = 0.008;
  const jumpStrength = 0.15;
  const maxStepHeight = 0.38;

  let currentWeaponKey = "pistol";
  let lastShotTime = 0;
  let isReloading = false;

  const weaponBase = {
    x: 0.52,
    y: -0.52,
    z: -1
  };

  const adsOffset = {
    x: 0.22,
    y: -0.42,
    z: -0.62
  };
  let recoilKick = 0;

  // Multiplayer will be implemented manually
  const remotePlayers = {};
  export let players = [];
  const localPlayerId = mp.uuid;
  export let healthData = {health : 100}; 
 export let localHealth = 100;
  let isDead = false;
  let respawnTimer = null;
  let respawnCountdownTimer = null;
  let gameStarted = false;
  let isFiring = false; 
  let inGameMenuOpen = false;
  let matchDurationMs = 5 * 60 * 1000;
  let matchStartTime = null;
  let matchEnded = false;
  const damageContributors = new Map();
  let lastDamageInfo = null;
  const playerStats = {};
  const localStats = {
    score: 0,
    kills: 0,
    deaths: 0,
    assists: 0
  };


    const WEAPONS = {
      rifle: {
        slot: "1",
        type: "primary",
        name: "Assault Rifle",
        damage: 25,
        range: 100,
        cooldown: 300,
        magSize: 30,
        reserveAmmo: 90,
        reloadTime: 1300,
        fov: 42,
        skin: {base:0x1f2933, grip:0x111827, accent:0xf4c430, barrel:0x0f172a}
      },
      smg: {
        slot: "2",
        type: "primary",
        name: "SMG",
        damage: 16,
        range: 70,
        cooldown: 100,
        magSize: 35,
        reserveAmmo: 105,
        reloadTime: 1150,
        fov: 45,
        skin: {base:0x2b3642, grip:0x171717, accent:0x37d67a, barrel:0x0f172a}
      },
      shotgun: {
        slot: "3",
        type: "primary",
        name: "Shotgun",
        damage: 45,
        range: 38,
        cooldown: 1300,
        magSize: 2,
        reserveAmmo: 24,
        reloadTime: 1550,
        fov: 48,
        skin: {base:0x4a2c1a, grip:0x1c1511, accent:0xe76f51, barrel:0x202020}
      },
      sniper: {
        slot: "4",
        type: "primary",
        name: "Sniper",
        damage: 75,
        range: 160,
        cooldown: 2300,
        magSize: 3,
        reserveAmmo: 50,
        reloadTime: 1800,
        fov: 30,
        skin: {base:0x233142, grip:0x111827, accent:0x7dd3fc, barrel:0x050505}
      },
      pistol: {
        slot: "5",
        type: "sidearm",
        name: "Pistol",
        damage: 20,
        range: 55,
        cooldown: 1000,
        magSize: 12,
        reserveAmmo: 36,
        reloadTime: 1000,
        fov: 46,
        skin: {base:0x30343f, grip:0x161a22, accent:0xe5e7eb, barrel:0x111111}
      },
      knife: {
        slot: "6",
        type: "sidearm",
        name: "Knife",
        damage: 50,
        range: 2.4,
        cooldown: 420,
        magSize: Infinity,
        reserveAmmo: Infinity,
        reloadTime: 0,
        fov: 50,
        skin: {base:0x202020, grip:0x111111, accent:0xd6d3d1, barrel:0xbfc7d5}
      }
    };
  const loadout = {
    primary: "rifle",
    sidearm: "pistol"
  };
  const ammoState = {};
  let currentSlot = "primary";



  // ================= GAME CONFIG =================
 export let playerConfig = {
    username: "Player",
    roomCode: "LOCAL",
    team: "blue"
  };

  document.addEventListener('click', (e)=>{
    if(!gameStarted || isDead || inGameMenuOpen) return;
    controls.lock();
  });

  // ---------- INPUT ----------
  const keys = {w:false,a:false,s:false,d:false};

  document.addEventListener('keydown', async e=>{
    if(e.code==='KeyW') keys.w=true;
    if(e.code==='KeyS') keys.s=true;
    if(e.code==='KeyA') keys.a=true;
    if(e.code==='KeyD') keys.d=true;
    if(e.code==='Tab'){
      e.preventDefault();
      scoreboardOverlay.style.display = "block";
	const glblstat = await mp.getGlobalStats()
      console.log('glbl',glblstat);
      
      renderScoreboard(glblstat, mp.uuid, playerConfig);
    }

    if(gameStarted){
      if(e.code === 'Digit1') switchSlot("primary");
      if(e.code === 'Digit2') switchSlot("sidearm");
      if(e.code === 'KeyR') reloadWeapon();
    }
  });

  document.addEventListener('keyup', e=>{
    if(e.code==='KeyW') keys.w=false;
    if(e.code==='KeyS') keys.s=false;
    if(e.code==='KeyA') keys.a=false;
    if(e.code==='KeyD') keys.d=false;
    if(e.code==='Tab'){
      e.preventDefault();
      scoreboardOverlay.style.display = "none";
    }
  });


  function getTeamColor (color) {
    if (color === "red"){
      return 0xff3b30;
    }else{
    return 0x0000ff;
  }
  }

  // ---------- PHYSICS ----------
  const speed = 0.1;
  const playerVelocity = new THREE.Vector3();
  let canJump = false;




  function getPlayerBoxAt(position){
    const feetY = position.y - playerHeight;

    return new THREE.Box3().setFromCenterAndSize(
      new THREE.Vector3(position.x, feetY + playerHeight / 2, position.z),
      new THREE.Vector3(playerRadius * 2, playerHeight, playerRadius * 2)
    );
  }

  function movePlayer(dx,dz){
    const pos = controls.getObject().position;

    const newPos = pos.clone();
    newPos.x += dx;
    newPos.z += dz;

    const playerBox = getPlayerBoxAt(newPos);

    let collision = false;
    let stepUpY = null;

    for(let obj of colliders){
      const box = new THREE.Box3().setFromObject(obj);
      const playerBottom = playerBox.min.y;
      const isStandingOnTop = playerBottom >= box.max.y - 0.05;

      if(isStandingOnTop) continue;

      if(playerBox.intersectsBox(box)){
        const stepHeight = box.max.y - playerBottom;
        if(stepHeight > 0 && stepHeight <= maxStepHeight){
          stepUpY = Math.max(stepUpY ?? pos.y, box.max.y + playerHeight);
          continue;
        }

        collision = true;
        break;
      }
    }

    if(!collision){
      pos.x = newPos.x;
      pos.z = newPos.z;
      if(stepUpY !== null){
        pos.y = stepUpY;
        playerVelocity.y = 0;
        canJump = true;
      }
    }
  }

  function moveForward(dist){
    const dir = new THREE.Vector3();
    camera.getWorldDirection(dir);
    dir.y = 0;
    dir.normalize();
    movePlayer(dir.x * dist, dir.z * dist);
  }

  function moveRight(dist){
    const dir = new THREE.Vector3();
    camera.getWorldDirection(dir);
    dir.y = 0;
    dir.normalize();
    const right = new THREE.Vector3(-dir.z,0,dir.x);
    movePlayer(right.x * dist, right.z * dist);
  }

  function getActiveLadder(){
    const pos = controls.getObject().position;

    return ladders.find((ladder)=>
      Math.abs(pos.x - ladder.x) <= ladder.halfWidth &&
      Math.abs(pos.z - ladder.z) <= ladder.halfDepth &&
      pos.y >= ladder.minY - 0.25 &&
      pos.y <= ladder.maxY + 0.35
    );
  }

function moveBot(bot, dx, dz, botId) {
  const pos = bot.mesh.position;
  const radius = playerRadius || 0.6;
  const h = playerHeight || 2;

  // --- SEPARATION LOGIC (The "Anti-Swarm" Fix) ---
  // Bots look at other bots and push away if they are too close
  for (let id in remotePlayers) {
    if (id === botId) continue;
    const other = remotePlayers[id];
    if (!other.mesh) continue;

    const dist = pos.distanceTo(other.mesh.position);
    if (dist < 1.5) { // Minimum distance between bots
      const pushDir = new THREE.Vector3().subVectors(pos, other.mesh.position).normalize();
      dx += pushDir.x * 0.02;
      dz += pushDir.z * 0.02;
    }
  }

  // --- AXIAL COLLISION (Wall Sliding) ---
  const boxX = new THREE.Box3().setFromCenterAndSize(
    new THREE.Vector3(pos.x + dx, pos.y, pos.z),
    new THREE.Vector3(radius * 2, h, radius * 2)
  );
  if (!colliders.some(obj => boxX.intersectsBox(new THREE.Box3().setFromObject(obj)))) {
    pos.x += dx;
  }

  const boxZ = new THREE.Box3().setFromCenterAndSize(
    new THREE.Vector3(pos.x, pos.y, pos.z + dz),
    new THREE.Vector3(radius * 2, h, radius * 2)
  );
  if (!colliders.some(obj => boxZ.intersectsBox(new THREE.Box3().setFromObject(obj)))) {
    pos.z += dz;
  }

   // 3. Vertical Physics (Gravity)
  bot.velocity = bot.velocity || { y: 0 };
  bot.velocity.y -= 1;
  pos.y += bot.velocity.y;

  // Ground clamp: playerHeight / 2 keeps center at 1.0 (feet at 0)
  if (pos.y < (h / 2)) {
    pos.y = 0;
    bot.velocity.y = 0;
  }
}




 




  function climbLadder(ladder){
    const pos = controls.getObject().position;
    const climbSpeed = 0.075;

    if(keys.w){
      pos.y = Math.min(ladder.maxY, pos.y + climbSpeed);
    }

    if(keys.s){
      pos.y = Math.max(ladder.minY, pos.y - climbSpeed);
    }

    // Center while climbing, then loosen at the top so A/D can step onto the platform.
    if(pos.y < ladder.maxY - 0.35){
      pos.x += (ladder.x - pos.x) * 0.18;
      pos.z += (ladder.z - pos.z) * 0.18;
    }
    playerVelocity.y = 0;
    canJump = true;
  }

 export function chooseSafeSpawn(team){
    const spawns = teamSpawns[team] || spawnPoints;
    const enemies = Object.values(remotePlayers).filter((player)=>player.alive && player.team !== team);

    if(enemies.length === 0){
      return spawns[Math.floor(Math.random() * spawns.length)].clone();
    }

    let bestSpawn = spawns[0];
    let bestScore = -Infinity;

    for(const spawn of spawns){
      let nearestEnemy = Infinity;
      let pressure = 0;

      for(const enemy of enemies){
        const enemyWorldPos = enemy.mesh.position.clone();
        enemyWorldPos.y += playerHeight;
        const distance = spawn.distanceTo(enemyWorldPos);
        nearestEnemy = Math.min(nearestEnemy, distance);

        if(distance < 16){
          pressure += (16 - distance) * 3;
        }
      }

      const score = nearestEnemy - pressure + Math.random() * 0.5;
      if(score > bestScore){
        bestScore = score;
        bestSpawn = spawn;
      }
    }
    console.log('safespawn', bestSpawn, '     ', bestSpawn.clone());
    
    return bestSpawn.clone();
  }

  // jump
  document.addEventListener('keydown',(e)=>{
    if(e.code==='Space' && canJump){
      playerVelocity.y = jumpStrength;
      canJump = false;
    }
  });



  
  function vectorPayload(vector){
    return {x:vector.x,y:vector.y,z:vector.z};
  }

  function vectorFromPayload(payload){
    return new THREE.Vector3(payload.x, payload.y, payload.z);
  }

  // ---------- WEAPON ----------

  weaponHolder.position.set(0.35, -0.25, -0.6);
  weaponHolder.rotation.set(0, 0, 0);
  camera.add(weaponHolder);

  let gun = null;

  function weaponPart(w,h,d,color,x,y,z){
    const part = new THREE.Mesh(
      new THREE.BoxGeometry(w,h,d),
      new THREE.MeshStandardMaterial({color, roughness:0.72, metalness:0.08})
    );
    part.position.set(x,y,z);
    part.castShadow = true;
    return part;
  }

  function createWeaponModel(weapon){
    const key = currentWeaponKey;

    // GLB WEAPONS
    if(gunModels[key]){
      const model = gunModels[key].clone();

      model.position.set(0.52,-0.52,-1);
      model.rotation.set(0,0,0);
      model.scale.set(1,1,1);

      return model;
    }

    // FALLBACK (ORIGINAL CODE BELOW)
    const model = new THREE.Group();
    const skin = weapon.skin;

    if(weapon.name === "Knife"){
      model.add(weaponPart(0.14,0.18,0.55,skin.grip,0,-0.14,0.12));
      model.add(weaponPart(0.1,0.08,0.85,skin.barrel,0,0.02,-0.5));
      model.add(weaponPart(0.28,0.05,0.16,skin.accent,0,0.02,-0.08));
      model.position.set(0.44,-0.48,-0.82);
      model.rotation.set(-0.18,-0.35,0.16);
      return model;
    }

    model.add(weaponPart(0.34,0.22,0.9,skin.base,0,0,0));
    model.add(weaponPart(0.18,0.34,0.18,skin.grip,-0.06,-0.25,0.18));
    model.add(weaponPart(0.18,0.14,0.65,skin.barrel,0,0.02,-0.75));
    model.add(weaponPart(0.38,0.06,0.28,skin.accent,0,0.16,-0.12));

    model.position.set(0.52,-0.52,-1);
    return model;
  }


  function switchWeapon(name) {
    if (!gunModels[name]) return;

    // hide all guns
    for (const k in gunModels) {
      gunModels[k].visible = false;
    }

    currentWeaponKey = name;

    const gun = gunModels[name];

    weaponHolder.clear();
    weaponHolder.add(gun);

    gun.visible = true;

    gun.position.set(0, 0, 0);
    gun.rotation.set(0, 0, 0);
    console.log('cwk', currentWeaponKey);
    
    updateWeaponDisplay({name :WEAPONS[currentWeaponKey].name},{mag:  WEAPONS[currentWeaponKey].magSize, reserve: WEAPONS[currentWeaponKey].magSize},currentSlot, false);

  }


  function switchSlot(slot){
    console.log('loadout', loadout);
    
    if(!loadout[slot] || currentSlot === slot) return;
    currentSlot = slot;
    console.log('current', currentSlot, loadout[slot]);
    
    switchWeapon(loadout[slot]);
  }

function resetAmmo(primaryKey, secondaryKey) {
  // Use the keys passed from the login menu
  const keys = [primaryKey, secondaryKey];
  
  for (const key of keys) {
    const weapon = WEAPONS[key];
    
    if (!weapon) {
      console.error(`Weapon ID "${key}" not found in WEAPONS object!`);
      continue; 
    }

    ammoState[key] = {
      mag: weapon.magSize,
      reserve: weapon.reserveAmmo
    };
  }
}
  function reloadWeapon() {
    const weapon = WEAPONS[currentWeaponKey];
    const ammo = ammoState[currentWeaponKey];

    if (!ammo || ammo.reserve <= 0 || isReloading) return;

    isReloading = true;

    const anim = gunMixers[currentWeaponKey];

    // 🎬 play reload animation ONLY
    if (anim?.actions?.reload) {
      const reload = anim.actions.reload;
      reload.reset();
      reload.setLoop(THREE.LoopOnce);
      reload.clampWhenFinished = true;
      reload.play();
    }

    // 🔊 Play reload sound if present
    const gunModel = gunModels[currentWeaponKey];
    if (gunModel && gunModel.userData.audio) {
      // If already playing, stop
      if (gunModel.userData.audio.isPlaying) {
        gunModel.userData.audio.stop();
      }
      gunModel.userData.audio.setVolume(0.8);
      gunModel.userData.audio.setLoop(false);
      gunModel.userData.audio.play();
    }

    showStatus("Reloading...", 800);

    setTimeout(() => {
      const needed = weapon.magSize - ammo.mag;
      const taken = Math.min(needed, ammo.reserve);
      ammo.mag += taken;
      ammo.reserve -= taken;
      isReloading = false;
      // console.log(currentWeaponKey, currentSlot);
      
      updateWeaponDisplay({name :WEAPONS[currentWeaponKey].name},{mag:  WEAPONS[currentWeaponKey].magSize, reserve: WEAPONS[currentWeaponKey].magSize},currentSlot, false);
    }, weapon.reloadTime || 1200);
  }

 function rebuildCurrentWeapon(){
    if(gun) weaponHolder.remove(gun);
    const weaponData = WEAPONS[currentWeaponKey];
    const ammo = ammoState[currentWeaponKey];
    gun = createWeaponModel(weaponData);
    weaponHolder.add(gun);
    // Corrected parameter pass:
    updateWeaponDisplay({name :WEAPONS[currentWeaponKey].name},{mag:  WEAPONS[currentWeaponKey].magSize, reserve: WEAPONS[currentWeaponKey].magSize},currentSlot, false);
}

  function applyLoadout(primary, sidearm){
    loadout.primary = primary;
    loadout.sidearm = sidearm;
    primarySelect.value = primary;
    sidearmSelect.value = sidearm;
    gamePrimarySelect.value = primary;
    gameSidearmSelect.value = sidearm;
    resetAmmo(primary, sidearm);
    currentSlot = "primary";
    currentWeaponKey = loadout.primary;
    isReloading = false;
    isFiring = false;
    rebuildCurrentWeapon();
    showStatus("Loadout updated", 700);
  }

  function toggleInGameMenu(forceOpen=null){
    // In-game menu disabled - game runs directly
  }


  resetAmmo(loadout.primary, loadout.sidearm);
  gun = createWeaponModel(WEAPONS[currentWeaponKey]);
  weaponHolder.add(gun);
  updateWeaponDisplay({name :WEAPONS[currentWeaponKey].name},{mag:  WEAPONS[currentWeaponKey].magSize, reserve: WEAPONS[currentWeaponKey].magSize},currentSlot, false);

  const muzzleFlash = new THREE.Mesh(
    new THREE.BoxGeometry(0.12,0.12,0.12),
    new THREE.MeshBasicMaterial({color:0xffee88})
  );
  muzzleFlash.position.set(0.5,-0.5,-1.55);
  muzzleFlash.visible = false;
  weaponHolder.add(muzzleFlash);

  // ---------- AIM ----------
  let aiming = false;

  document.addEventListener('mousedown',(e)=>{
    if(!controls.isLocked || isDead) return;
    if(e.button===0){
      isFiring = true;
      shoot();
    }
    if(e.button===2){
      aiming = true;
    }
  });
  document.addEventListener('mouseup',(e)=>{
    if(e.button===0) isFiring = false;
    if(e.button===2) aiming = false;
  });
  window.addEventListener('blur', ()=>{
    isFiring = false;
    aiming = false;
  });
  document.addEventListener('contextmenu', e=>e.preventDefault());

  // ---------- CROSSHAIR ----------
  // Crosshair already created in ui.js

  // ---------- MULTIPLAYER ----------
  // Player mesh creation imported from threejs.js

  export function createRemotePlayer(id, username, team="red"){
    const mesh = createPlayerMesh(getTeamColor(team));
    scene.add(mesh);
    tagPlayerMesh(mesh, id);

    const nameLabel = createPlayerLabel(username, PLAYER_MAX_HEALTH);

    remotePlayers[id] = {
      id,
      username,
      mesh,
      health: PLAYER_MAX_HEALTH,
      alive: true,
      team,
      score: 0,
      kills: 0,
      deaths: 0,
      assists: 0,
      nameLabel
    };
    
    return remotePlayers[id];
  }

  export function setRemoteHealth(id, health, alive=true){
    const player = remotePlayers[id];
    if(!player) return;

    player.health = health;
    player.alive = alive;
    player.mesh.visible = alive;
    player.mesh.userData.playerId = id;

    const fill = player.nameLabel.querySelector('.remoteHealthFill');
    if(fill){
      fill.style.width = `${Math.max(0, health / PLAYER_MAX_HEALTH) * 100}%`;
      fill.style.background = health > 50 ? "#22c55e" : health > 25 ? "#f59e0b" : "#ef4444";
    }
  }

function getPlayerIdFromHit(object) {
  let obj = object;

  while (obj) {
    if (obj.userData && obj.userData.playerId) {
      return obj.userData.playerId;
    }
    obj = obj.parent;
  }

  return null;
}

  export function setRemoteTeam(id, team){
    const player = remotePlayers[id];
    if(!team) return;
    if(!player || player.team === team) return;

    scene.remove(player.mesh);
    player.mesh = createPlayerMesh(getTeamColor(team));
    scene.add(player.mesh);
    player.team = team;
  }

  export function setRemotePosition(id, x, y, z){
    const player = remotePlayers[id];
    if(!player) return;

    player.mesh.position.set(x, y - playerHeight, z);
  }

  export function setRemoteStats(id, stats={}){
    const player = remotePlayers[id];
    if(!player) return;

    player.score = stats.score ?? player.score ?? 0;
    player.kills = stats.kills ?? player.kills ?? 0;
    player.deaths = stats.deaths ?? player.deaths ?? 0;
    player.assists = stats.assists ?? player.assists ?? 0;
  }

  function hasLineOfSightTo(player){
    const origin = getCameraWorldPosition();
    const target = player.mesh.position.clone();
    target.y += 1.5;

    const direction = target.clone().sub(origin);
    const distance = direction.length();
    direction.normalize();

    const raycaster = new THREE.Raycaster(origin, direction, 0, distance);
    return raycaster.intersectObjects(colliders, false).length === 0;
  }

  

  function getRemotePlayerHit(id){
    const player = remotePlayers[id];
    if(!player || !player.alive) return null;

    return {
      id,
      distance: getCameraWorldPosition().distanceTo(player.mesh.position)
    };
  }

  function getLocalPlayerStats(){
    return {
      username: playerConfig.username || "Player",
      team: playerConfig.team,
      health: localHealth,
      score: localStats.score,
      kills: localStats.kills,
      deaths: localStats.deaths,
      assists: localStats.assists
    };
  }

  function updateLocalStats(delta){
    localStats.score += delta.score || 0;
    localStats.kills += delta.kills || 0;
    localStats.deaths += delta.deaths || 0;
    localStats.assists += delta.assists || 0;
    renderScoreboard(getLocalPlayerStats(), mp.uuid, playerConfig);
  }

  function getKillPoints(shotType){
    if(shotType === "headshot") return 100;
    if(shotType === "noscope") return 70;
    return 50;
  }

  function recordPlayerStats(id, stats){
    if(!stats) return;
    playerStats[id] = {
      id,
      username: stats.username || playerStats[id]?.username || "Player",
      team: stats.team || playerStats[id]?.team || "red",
      score: stats.score ?? playerStats[id]?.score ?? 0,
      kills: stats.kills ?? playerStats[id]?.kills ?? 0,
      deaths: stats.deaths ?? playerStats[id]?.deaths ?? 0,
      assists: stats.assists ?? playerStats[id]?.assists ?? 0
    };
  }

  
  function handleDeathScoring(payload){
    if(payload.killerId === localPlayerId){
      updateLocalStats({score:getKillPoints(payload.shotType), kills:1});
    }

    const assisted = payload.assists?.includes(localPlayerId) && payload.killerId !== localPlayerId;
    if(assisted){
      updateLocalStats({score:25, assists:1});
    }
    
    // Update dead player's stats
    if(playerStats[payload.id]){
      playerStats[payload.id].deaths = (playerStats[payload.id].deaths || 0) + 1;
    }
    
    // Update killer's stats in playerStats
    if(playerStats[payload.killerId]){
      playerStats[payload.killerId].kills = (playerStats[payload.killerId].kills || 0) + 1;
      playerStats[payload.killerId].score = (playerStats[payload.killerId].score || 0) + getKillPoints(payload.shotType);
    }
  }



function respawnBot(id) {
  const bot = remotePlayers[id];
  if (!bot) return;

  const spawnArr = teamSpawns[bot.team];
  const spawn = spawnArr[Math.floor(Math.random() * spawnArr.length)].clone();

  bot.mesh.position.copy(spawn);
  bot.health = PLAYER_MAX_HEALTH;
  bot.alive = true;
  bot.mesh.visible = true;

  // --- ADD THESE IDENTIFIERS ---
  bot.mesh.userData.isBot = true;
  bot.mesh.userData.botId = id;
  bot.isBot = true; // Flag for the logic in the shoot function
  // -----------------------------

  setRemoteHealth(id, bot.health, true);
}


  
//test




  function sendShot(hitPlayerId, hitPoint, origin, endPoint) {
    // TODO: Implement custom multiplayer shot syncing
    // This function should broadcast shot events to other players
    // Parameters available for implementation:
    // - hitPlayerId: ID of hit player (null for miss)
    // - hitPoint: THREE.Vector3 of hit location
    // - origin: THREE.Vector3 of shot origin
    // - endPoint: THREE.Vector3 of shot end point
    // - currentWeaponKey: weapon name
  }
  function sendDamage(targetId, damage, shotType="normal"){
    // TODO: Implement custom multiplayer damage syncing
    // Prevent friendly fire
    const target = remotePlayers[targetId];
    if(target && target.team === playerConfig.team){
      console.log("Friendly fire prevented");
      return;
    }else {
      mp.sendDamage(targetId, damage,shotType,currentWeaponKey);
    }
    // Parameters available for implementation:
    // - targetId: ID of target player
    // - damage: damage amount
    // - shotType: "normal", "melee", "headshot", "noscope"
    // - playerConfig.username: shooter name
    // - playerConfig.team: shooter team
    // - currentWeaponKey: weapon used
  }

  function applyLocalDamage(payload){
    if(isDead) return;

    const damage = payload.damage;
    const shooterId = payload.shooterId;
    damageContributors.set(shooterId, (damageContributors.get(shooterId) || 0) + damage);
    lastDamageInfo = {
      shooterId,
      shotType: payload.shotType || "normal",
      weapon: payload.weapon || "unknown"
    };
    
    // Store opponent's weapon for death screen
    const opponent = remotePlayers[shooterId];
    if(opponent){
      opponent.currentWeapon = payload.weapon || "rifle";
    }

    localHealth = Math.max(0, localHealth - damage);
    updateHealthDisplay();

    if(localHealth <= 0){
      (shooterId, lastDamageInfo.shotType);
    }
  }

  export async function die(killerId, shotType="normal",weapon){
    isDead = true;
    isFiring = false;
    aiming = false;
    isReloading = false;
    controls.unlock();
    showDeathScreen(killerId,remotePlayers,{weapon:weapon}, WEAPONS,{primary:currentWeaponKey});
    respawnText.innerText = `Respawning in ${Math.ceil(RESPAWN_TIME / 1000)}...`;
    console.warn('died', RESPAWN_TIME);
    updateLocalStats({deaths:1});
	  
    const sta = getLocalPlayerStats();
    mp.sendGameStat(sta.kills, sta.deaths, sta.score,sta.assists)
    
    

    let secondsLeft = Math.ceil(RESPAWN_TIME / 1000);
    // console.log('secleft ', secondsLeft);
    
    while(secondsLeft !== 0) {
    await sleep(1000);
      secondsLeft -= 1;
      // console.log('seconds ledt', secondsLeft);
      
      respawnText.innerText = secondsLeft > 0 ? `Respawning in ${secondsLeft}...` : "" ;
    }
    respawn();
  }

  function respawn(){
    localHealth = 100;
    healthData.health = 100;
    isDead = false;
    damageContributors.clear();
    lastDamageInfo = null;
    deathOverlay.style.display = "none";
    window.clearInterval(respawnCountdownTimer);
    updateHealthDisplay(100, 100);
    resetAmmo(loadout.primary, loadout.sidearm);
    currentSlot = "primary";
    currentWeaponKey = loadout.primary;
    if(gun) weaponHolder.remove(gun);
    gun = createWeaponModel(WEAPONS[currentWeaponKey]);
    weaponHolder.add(gun);
    // console.log(WEAPONS[currentWeaponKey]);
    
    updateWeaponDisplay({name :WEAPONS[currentWeaponKey].name},{mag:  WEAPONS[currentWeaponKey].magSize, reserve: WEAPONS[currentWeaponKey].magSize},currentSlot, false);

    const spawn = chooseSafeSpawn(playerConfig.team);
    controls.getObject().position.copy(spawn);
    playerVelocity.set(0,0,0);

    // TODO: Implement custom multiplayer respawn event
  }

function updateBots() {
  // Bot updates disabled - implement custom multiplayer bot behavior
  if (Object.keys(remotePlayers).length === 0) return;
  const now = performance.now();

  for (const botId in remotePlayers) {
    const bot = remotePlayers[botId];
    if (!bot.isBot || !bot.alive) continue;

    let target = null;
    let minDist = Infinity;

    // --- TARGETING ---
    if (!isDead && playerConfig.team !== bot.team) {
      const d = bot.mesh.position.distanceTo(controls.getObject().position);
      target = { id: localPlayerId, pos: controls.getObject().position, isLocal: true };
      minDist = d;
    }
    for (const id in remotePlayers) {
      const other = remotePlayers[id];
      if (id === botId || !other.alive || other.team === bot.team) continue; // Prevent friendly fire
      const d = bot.mesh.position.distanceTo(other.mesh.position);
      if (d < minDist) { minDist = d; target = { id, pos: other.mesh.position, isLocal: false }; }
    }

    // --- MOVEMENT LOGIC ---
    if (target && minDist < 45) {
      // Smooth Rotation
      const lookTarget = new THREE.Vector3(target.pos.x, bot.mesh.position.y, target.pos.z);
      bot.mesh.lookAt(lookTarget);

      const dir = new THREE.Vector3().subVectors(target.pos, bot.mesh.position).normalize();
      
      // Strafe vector (perpendicular to direction)
      const strafe = new THREE.Vector3(-dir.z, 0, dir.x);
      const strafeMod = Math.sin(now * 0.002 + (botId.length)) * 0.04;

      if (minDist > 15) {
        // Approach
        moveBot(bot, dir.x * 0.05 + strafe.x * strafeMod, dir.z * 0.05 + strafe.z * strafeMod, botId);
      } else if (minDist < 10) {
        // Back away if too close (Prevents swarming)
        moveBot(bot, -dir.x * 0.04 + strafe.x * strafeMod, -dir.z * 0.04 + strafe.z * strafeMod, botId);
      } else {
        // Hold ground and strafe
        moveBot(bot, strafe.x * strafeMod * 2, strafe.z * strafeMod * 2, botId);
      }
    } else {
      // --- IDLE WANDER ---
      bot.wanderTime = bot.wanderTime || 0;
      if (now > bot.wanderTime) {
        bot.wanderAngle = Math.random() * Math.PI * 2;
        bot.wanderTime = now + Math.random() * 3000 + 2000;
      }
      moveBot(bot, Math.cos(bot.wanderAngle) * 0.03, Math.sin(bot.wanderAngle) * 0.03, botId);
      const walkLook = bot.mesh.position.clone().add(new THREE.Vector3(Math.cos(bot.wanderAngle), 0, Math.sin(bot.wanderAngle)));
      bot.mesh.lookAt(walkLook);
    }

    // --- SHOOTING ---
    if (target && minDist < 35) {
      bot.lastShot = bot.lastShot || 0;
      if (now - bot.lastShot > 800 + (Math.random() * 400)) { 
        bot.lastShot = now;

        const rayDir = new THREE.Vector3().subVectors(target.pos, bot.mesh.position).normalize();
        const wallRay = new THREE.Raycaster(bot.mesh.position, rayDir);
        const wallHits = wallRay.intersectObjects(colliders, false);

        if (wallHits.length === 0 || wallHits[0].distance > minDist) {
          sendShot(target.id, target.pos, bot.mesh.position, target.pos);
          
          if (Math.random() < 0.35) { // Reduced accuracy for more natural feel
            if (target.isLocal) {
               // Apply damage to local player
               lastDamageInfo = {
                 shooterId: botId,
                 shotType: "normal",
                 weapon: bot.currentWeapon || "rifle"
               };
               const botWeapon = WEAPONS[bot.currentWeapon || "rifle"];
               localHealth = Math.max(0, localHealth - (botWeapon?.damage || 10));
               updateHealthDisplay();
               if(localHealth <= 0){
                 die(botId, "normal");
               }
            } else {
               // TODO: Implement damage event for other remote players
               // You can send this through your custom multiplayer system
            }
          }
        }
      }
    }
  }
}

async function shoot() {
  if (isReloading || !gun) return;
  
  // Check firing cooldown
  const now = Date.now();
  if (now - lastShotTime < WEAPONS[currentWeaponKey].cooldown) return;
  lastShotTime = now;
  
  const weapon = WEAPONS[currentWeaponKey];
  const ammo = ammoState[currentWeaponKey];
  if (!ammo || ammo.mag <= 0) {
    reloadWeapon();
    return;
  }

  // --- SHOOTING LOGIC ---
  ammo.mag -= 1;
  console.log(ammo);
  
  updateWeaponDisplay({name :WEAPONS[currentWeaponKey].name},{mag:  ammo.mag, reserve: ammo.reserve},currentSlot, false);
  
  const origin = getCameraWorldPosition();
  const direction = new THREE.Vector3();
  camera.getWorldDirection(direction);
  const endPoint = origin.clone().add(direction.multiplyScalar(100));
  
  const raycaster = new THREE.Raycaster(origin, direction, 0, 100);
  const hits = raycaster.intersectObjects(scene.children, true);
  let hitPlayerId = null;
  let hitPoint = null;
  
  for (const hit of hits) {
    const playerId = getPlayerIdFromHit(hit.object);
    console.log(playerId);
    if (playerId) {
      hitPla
	loadGun("smg", "models/smg/smg.glb");yerId = playerId;
      hitPoint = hit.point;
      console.log(WEAPONS[currentWeaponKey].damage);
      sendDamage(playerId,WEAPONS[currentWeaponKey].damage);
	    const glbstat = await mp.getGlobalStats();
	    for(let i = 0; i >= glbstat.length; i++) {
		    if(glbstat[i].player === playerID) {
			    if(glbstsat[i].health - WEAPONS[currentWeaponKey].damage === 0) {
				    
				    mp.sentGameStat();
			    }
		    }
	    }
    
      break;
    }
  }

  sendShot(hitPlayerId, hitPoint, origin, endPoint);
}

  // Function to make bot movement smoother and more natural
  function updateBotMovement(botId) {
    const bot = controls.getObject(); // Replace with bot's actual object
    const targetPosition = new THREE.Vector3(
      Math.random() * 20 - 10, // Random X position
      bot.position.y,          // Keep Y constant
      Math.random() * 20 - 10  // Random Z position
    );

    const moveSpeed = 0.02; // Adjust speed for smoother movement

    // Interpolate bot position towards the target
    bot.position.lerp(targetPosition, moveSpeed);

    // Add slight randomness to simulate natural movement
    bot.position.x += (Math.random() - 0.5) * 0.1;
    bot.position.z += (Math.random() - 0.5) * 0.1;

    // Repeat movement update
    setTimeout(() => updateBotMovement(botId), 100);
  }

  // Bot movement initialization removed - implement custom multiplayer behavior

  // Function to display death screen with opponent details
 
let userInputData
  // Auto-start game with default settings
function autoStartGame() {
    // Generate your UUID here
    const myCustomUUID = mp.createRoom(); 

    // Pass the UUID into the menu
    createLoginOverlay(myCustomUUID, (data) => {
        console.log("Full Game Data:", data);
        userInputData = data;
        // Apply data to game state
        playerConfig.username = data.username;
        playerConfig.roomCode = data.roomCode;
        currentWeaponKey = data.primary;
        playerConfig.roomCode = data.roomCode;
        
        currentWeaponKey = data.primary; 

    // FIX: Pass the specific weapons chosen in the menu to resetAmmo
        resetAmmo(data.primary, data.secondary);
        // Initialize Ammo for selected loadout
        loadout.primary = data.primary;
        loadout.sidearm = data.secondary;
        const x = controls.getObject().position.x;
        const y = controls.getObject().position.y;
        const z = controls.getObject().position.z;


        mp.broadcastJoinData(playerConfig.username, playerConfig.team,x,y,z,myCustomUUID);
        animate();
        if(data.roomCode !== myCustomUUID) {
              
          mp.joinGame(data.roomCode, playerConfig.username, playerConfig.team,x,y,z);
        }
        mp.subscribe();

        // Start 
        matchStartTime = Date.now();
        console.log(playerConfig);
        players.push(playerConfig.username);
        startGame();
        controls.lock();
        
        // Update the UI display with the final code
        roomDisplay.innerText = `${data.roomCode}`;
    });
}


  function startGame(){
    gameStarted = true;
      
    
    // Fix the health display call (needs numbers)
    updateHealthDisplay(localHealth, PLAYER_MAX_HEALTH);
    


    // Initial timer render
    
    
    
    currentSlot = "primary";
    currentWeaponKey = loadout.primary;
    if(gun) weaponHolder.remove(gun);
    gun = createWeaponModel(WEAPONS[currentWeaponKey]);
    weaponHolder.add(gun);
        // Fix the weapon display call (needs objects)
    const currentWeapon = WEAPONS[currentWeaponKey];
    const currentAmmo = ammoState[currentWeaponKey];
    updateWeaponDisplay({name :WEAPONS[currentWeaponKey].name},{mag:  WEAPONS[currentWeaponKey].magSize, reserve: WEAPONS[currentWeaponKey].magSize},currentSlot, false);
    console.log({name :WEAPONS[currentWeaponKey].name},{mag:  WEAPONS[currentWeaponKey].magSize, reserve: WEAPONS[currentWeaponKey].magSize},currentSlot, false);

    roomDisplay.innerText = `LOCAL GAME | ${playerConfig.team.toUpperCase()}`;
    recordPlayerStats(localPlayerId, getLocalPlayerStats());
    
    switchSlot('sidearm');
    switchSlot('primary')
    
    updateTimerDisplay(matchStartTime, matchDurationMs, timerDisplay);
    // console.log(loadout, currentWeaponKey);


    controls.getObject().position.copy(chooseSafeSpawn(playerConfig.team));

    // TODO: Implement custom player registration to your multiplayer backend
    

    // --- PLAYER SPAWNING SYSTEM ---
    // Spawn other players using: createRemotePlayer(id, username, team)
    // Update positions: setRemotePosition(id, x, y, z)
    // Update health: setRemoteHealth(id, health, alive)
    // Example: createRemotePlayer("player-1", "John", "blue");

    setInterval(()=>{
      updateTimerDisplay(matchStartTime, matchDurationMs, timerDisplay);
      if(scoreboardOverlay.style.display === "block"){
        renderScoreboard();
      }
    },250);
  }

  // Auto-start the game on page load
  setTimeout(() => {
    autoStartGame();
    controls.lock();
  }, 100);

  function applyVerticalPhysics(){
    const pos = controls.getObject().position;
    const previousFeetY = pos.y - playerHeight;

    playerVelocity.y -= gravity;
    pos.y += playerVelocity.y;

    let landed = false;
    let highestLandingY = 0;

    const playerBox = getPlayerBoxAt(pos);

    for(const obj of colliders){
      const box = new THREE.Box3().setFromObject(obj);
      const horizontallyOverlaps =
        playerBox.max.x > box.min.x &&
        playerBox.min.x < box.max.x &&
        playerBox.max.z > box.min.z &&
        playerBox.min.z < box.max.z;

      if(!horizontallyOverlaps) continue;

      const currentFeetY = pos.y - playerHeight;
      const fallingOntoTop =
        playerVelocity.y <= 0 &&
        previousFeetY >= box.max.y &&
        currentFeetY <= box.max.y;

      if(fallingOntoTop && box.max.y > highestLandingY){
        landed = true;
        highestLandingY = box.max.y;
      }
    }

    if(landed){
      pos.y = highestLandingY + playerHeight;
      playerVelocity.y = 0;
      canJump = true;
      return;
    }

    if(pos.y < playerHeight){
      pos.y = playerHeight;
      playerVelocity.y = 0;
      canJump = true;
    } else {
      canJump = false;
    }
  }

  // ---------- LOOP ----------
  async function animate() {
    requestAnimationFrame(animate);

    const delta = 0.016;

    if (controls.isLocked && !isDead && !matchEnded && !inGameMenuOpen) {
      const activeLadder = getActiveLadder();

      if (activeLadder && (keys.w || keys.s)) {
        if (keys.a) moveRight(-speed * 0.45);
        if (keys.d) moveRight(speed * 0.45);
        climbLadder(activeLadder);
      } else {
        if (keys.w) moveForward(speed);
        if (keys.s) moveForward(-speed);
        if (keys.a) moveRight(-speed);
        if (keys.d) moveRight(speed);
        applyVerticalPhysics();
      }

      if (isFiring) {
        shoot();

    }
  }
    
    

    // update all animations
    for (const k in gunMixers) {
      gunMixers[k].mixer.update(delta);
    }

    // Update bots
    updateBots();

    const weapon = WEAPONS[currentWeaponKey];
    const scoped = aiming && currentWeaponKey === "sniper";

    camera.fov = aiming ? weapon.fov : 75;

    if (gunModels[currentWeaponKey]) {
      gunModels[currentWeaponKey].position.set(
        aiming ? 0.22 : 0.52,
        aiming ? -0.42 : -0.52,
        aiming ? -0.62 : -1
      );
    }

    // Accessing the position components
    const x = controls.getObject().position.x;
    const y = controls.getObject().position.y;
    const z = controls.getObject().position.z;

    mp.sendStat({
      playerId : mp.uuid,
      username: playerConfig.username,
      team : playerConfig.team,
      health: localHealth,
      x : x,
      y : y,
      z : z
    })
    if(localHealth > healthData.health) { 
    localHealth = healthData.health
    updateHealthDisplay(localHealth, PLAYER_MAX_HEALTH)}
    // Or as a Three.js Vector3 object
    const playerPos = controls.getObject().position;

    updateBots();

    scopeOverlay.style.display = scoped ? "block" : "none";
    crosshair.style.display = scoped ? "none" : "block";
    weaponHolder.visible = !scoped;

    camera.updateProjectionMatrix();

    // updateRemoteNameLabels()
    renderer.render(scene, camera);
  }

  // Initialize the game
      initRenderer();
  
  // Update health display with initial value
  updateHealthDisplay(localHealth, PLAYER_MAX_HEALTH);
  
  // Start animation loop





