// ================= UI SYSTEM =================

// Health Display
export const healthDisplay = document.createElement('div');
healthDisplay.style = `
  position:fixed;right:22px;top:22px;color:white;
  width:220px;font-size:13px;font-weight:900;
  padding:10px 12px;background:rgba(10,12,16,0.62);
  border-right:4px solid #f44336;border-radius:6px;
  text-shadow:0 2px 4px rgba(0,0,0,0.7);
`;
healthDisplay.innerHTML = `
  <div style="display:flex;justify-content:space-between;margin-bottom:7px;">
    <span>HEALTH</span><span id="healthNumber">100</span>
  </div>
  <div style="height:10px;background:rgba(255,255,255,0.16);border-radius:999px;overflow:hidden;">
    <div id="healthFill" style="height:100%;width:100%;background:#ef4444;"></div>
  </div>
`;
document.body.appendChild(healthDisplay);
export const healthNumber = healthDisplay.querySelector('#healthNumber');
export const healthFill = healthDisplay.querySelector('#healthFill');

export function updateHealthDisplay(localHealth, PLAYER_MAX_HEALTH) {
  const pct = Math.max(0, localHealth / PLAYER_MAX_HEALTH) * 100;
  healthNumber.innerText = localHealth;
  healthFill.style.width = `${pct}%`;
}

// Weapon Display
export const weaponDisplay = document.createElement('div');
weaponDisplay.style = `
  position:fixed;right:22px;bottom:22px;color:white;
  font-size:15px;font-weight:800;text-align:right;
  padding:12px 14px;background:rgba(10,12,16,0.62);
  border-right:4px solid #f4c430;border-radius:6px;
  text-shadow:0 2px 4px rgba(0,0,0,0.7);
`;
document.body.appendChild(weaponDisplay);

// Room Display
export const roomDisplay = document.createElement('div');
roomDisplay.style = `
  position:fixed;left:22px;top:22px;color:white;
  font-size:13px;font-weight:800;letter-spacing:0;
  padding:9px 12px;background:rgba(10,12,16,0.54);
  border-radius:6px;text-shadow:0 2px 4px rgba(0,0,0,0.7);
  display:block;
`;
document.body.appendChild(roomDisplay);

// Timer Display
export const timerDisplay = document.createElement('div');
timerDisplay.style = `
  position:fixed;top:22px;left:50%;transform:translateX(-50%);
  color:white;font-size:20px;font-weight:950;padding:8px 14px;
  background:rgba(10,12,16,0.58);border-radius:6px;
  text-shadow:0 2px 4px rgba(0,0,0,0.7);display:block;
`;
document.body.appendChild(timerDisplay);

// Scoreboard Overlay
export const scoreboardOverlay = document.createElement('div');
scoreboardOverlay.style = `
  position:fixed;top:70px;left:50%;transform:translateX(-50%);
  width:min(720px,calc(100vw - 32px));display:none;z-index:35;
  color:white;background:rgba(7,9,12,0.88);border:1px solid rgba(255,255,255,0.15);
  border-radius:8px;padding:14px;font-family:Inter,Arial,sans-serif;
  box-shadow:0 20px 80px rgba(0,0,0,0.42);
`;
document.body.appendChild(scoreboardOverlay);

// Death Overlay
export const deathOverlay = document.createElement('div');
deathOverlay.style = `
  position:fixed;inset:0;display:none;align-items:center;justify-content:center;
  background:rgba(80,0,0,0.62);z-index:40;color:white;text-align:center;
  font-family:Inter,Arial,sans-serif;pointer-events:none;
`;
deathOverlay.innerHTML = `
  <div style="padding:26px 34px;background:rgba(8,10,12,0.78);border:1px solid rgba(255,255,255,0.16);border-radius:8px;">
    <div style="font-size:46px;font-weight:950;line-height:1;">YOU DIED</div>
    <div id="deathInfo" style="margin-top:10px;color:#d8dee6;font-size:16px;font-weight:800;"></div>
    <div id="respawnText" style="margin-top:10px;color:#d8dee6;font-size:16px;font-weight:800;">Respawning...</div>
  </div>
`;
document.body.appendChild(deathOverlay);
export const respawnText = deathOverlay.querySelector('#respawnText');

// Status Display
export const statusDisplay = document.createElement('div');
statusDisplay.style = `
  position:fixed;top:20px;left:50%;transform:translateX(-50%);
  color:white;font-family:Arial, sans-serif;font-size:18px;
  text-shadow:0 2px 4px rgba(0,0,0,0.7);display:none;
`;
document.body.appendChild(statusDisplay);

export function showStatus(message, ms = 900) {
  statusDisplay.innerText = message;
  statusDisplay.style.display = "block";

  window.clearTimeout(showStatus.hideTimer);
  showStatus.hideTimer = window.setTimeout(() => {
    statusDisplay.style.display = "none";
  }, ms);
}

// Crosshair
export const crosshair = document.createElement('div');
crosshair.style = `
  position:fixed;top:50%;left:50%;width:18px;height:18px;
  transform:translate(-50%,-50%);pointer-events:none;
`;
crosshair.innerHTML = `
  <div style="position:absolute;left:8px;top:0;width:2px;height:6px;background:white;"></div>
  <div style="position:absolute;left:8px;bottom:0;width:2px;height:6px;background:white;"></div>
  <div style="position:absolute;top:8px;left:0;width:6px;height:2px;background:white;"></div>
  <div style="position:absolute;top:8px;right:0;width:6px;height:2px;background:white;"></div>
`;
document.body.appendChild(crosshair);

// Scope Overlay
export const scopeOverlay = document.createElement('div');
scopeOverlay.style = `
  position:fixed;inset:0;display:none;pointer-events:none;z-index:20;
  background:radial-gradient(circle at center, transparent 0 27%, rgba(0,0,0,0.96) 28% 100%);
`;
scopeOverlay.innerHTML = `
  <div style="position:absolute;left:50%;top:0;width:2px;height:100%;background:rgba(255,255,255,0.72);transform:translateX(-50%);"></div>
  <div style="position:absolute;left:0;top:50%;width:100%;height:2px;background:rgba(255,255,255,0.72);transform:translateY(-50%);"></div>
  <div style="position:absolute;left:50%;top:50%;width:min(54vw,54vh);height:min(54vw,54vh);border:3px solid rgba(255,255,255,0.86);border-radius:50%;transform:translate(-50%,-50%);"></div>
`;
document.body.appendChild(scopeOverlay);

// Weapon Display Update
export function updateWeaponDisplay(weapon, ammo, currentSlot, isReloading) {
  const ammoText = weapon.name === "Knife"
    ? "MELEE"
    : `${ammo.mag}/${ammo.reserve}`;
  const reloadText = isReloading ? `<br><span style="color:#f4c430;font-weight:900;">RELOADING</span>` : "";

  weaponDisplay.innerHTML = `${currentSlot === "primary" ? "1" : "2"} | ${weapon.name}<br><span style="color:#b8c3cf;font-weight:700;">${ammoText}</span>${reloadText}`;
}

// Scoreboard Rendering
export function renderScoreboard(playerStats, localPlayerId, playerConfig) {
  
  console.log('scoreboard', playerStats,localPlayerId,playerConfig);
  
  const rows = Object.values(playerStats).sort((a, b) => b.score - a.score);

  scoreboardOverlay.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
      <div style="font-size:20px;font-weight:950;">LEADERBOARD</div>
      <div style="color:#b8c3cf;font-weight:800;">${playerConfig.roomCode || ""}</div>
    </div>
    <div style="display:grid;grid-template-columns:1.5fr 0.8fr repeat(4,0.5fr);gap:8px;color:#9ca3af;font-size:12px;font-weight:900;border-bottom:1px solid rgba(255,255,255,0.12);padding-bottom:7px;">
      <div>PLAYER</div><div>TEAM</div><div>PTS</div><div>K</div><div>D</div><div>A</div>
    </div>
    ${rows.map((p) => `
      <div style="display:grid;grid-template-columns:1.5fr 0.8fr repeat(4,0.5fr);gap:8px;padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.06);font-weight:800;">
        <div>${p.username}${p.id === localPlayerId ? " (you)" : ""}</div>
        <div style="color:${p.team === "blue" ? "#60a5fa" : "#f87171"};">${p.team?.toUpperCase() || "-"}</div>
        <div>${p.score}</div><div>${p.kills}</div><div>${p.deaths}</div><div>${p.assists}</div>
      </div>
    `).join("")}
  `;
}

// Death Screen
export function showDeathScreen(opponentId, remotePlayers, lastDamageInfo, WEAPONS, loadout) {
  const opponent = remotePlayers[opponentId] || { username: "Unknown", currentWeapon: "unknown" };

  let weaponKey = opponent.currentWeapon || lastDamageInfo?.weapon || "rifle";
  const opponentWeapon = WEAPONS[weaponKey]?.name || "Unknown Weapon";
  const playerWeapon = WEAPONS[loadout.primary]?.name || "Unknown Weapon";

  const deathInfo = deathOverlay.querySelector('#deathInfo');
  if (deathInfo) {
    deathInfo.innerHTML = `
      <div>Opponent: ${opponent.username}</div>
      <div>Opponent Weapon: ${opponentWeapon}</div>
      <div>Your Weapon: ${playerWeapon}</div>
    `;
  }
  deathOverlay.style.display = "flex";
}

// Player Label Updates
export function updateRemoteNameLabels(remotePlayers, camera, window, playerConfig) {
  for (const player of Object.values(remotePlayers)) {
    if (!player.alive) {
      player.nameLabel.style.display = "none";
      continue;
    }

    const isTeammate = player.team === playerConfig.team;

    const labelPos = player.mesh.position.clone();
    labelPos.y += 2.8;
    labelPos.project(camera);

    const visible = labelPos.z < 1;
    player.nameLabel.style.display = visible ? "block" : "none";
    player.nameLabel.style.left = `${(labelPos.x * 0.5 + 0.5) * window.innerWidth}px`;
    player.nameLabel.style.top = `${(-labelPos.y * 0.5 + 0.5) * window.innerHeight}px`;
  }
}

// Create remote player label
export function createPlayerLabel(username, PLAYER_MAX_HEALTH) {
  const nameLabel = document.createElement('div');
  nameLabel.style = `
    position:fixed;color:white;font-family:Arial, sans-serif;font-size:13px;text-align:center;
    text-shadow:0 2px 4px rgba(0,0,0,0.8);pointer-events:none;
  `;
  nameLabel.innerHTML = `
    <div class="nameText">${username || "Player"}</div>
    <div style="width:58px;height:6px;background:rgba(0,0,0,0.55);margin:4px auto 0;border-radius:999px;overflow:hidden;">
      <div class="remoteHealthFill" style="height:100%;width:100%;background:#22c55e;"></div>
    </div>
  `;
  document.body.appendChild(nameLabel);
  return nameLabel;
}

// Format time display
export function formatTime(ms) {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

// Timer update
// ui.js: Change this function to use the global timerDisplay directly if not passed
export function updateTimerDisplay(matchStartTime, matchDurationMs, element = timerDisplay) {
  if (!matchStartTime || !element) {
    if (element) element.innerText = "--:--";
    return;
  }

  const remaining = matchDurationMs - (Date.now() - matchStartTime);
  element.innerText = formatTime(remaining);

  return remaining <= 0;
}
// You can add this to your ui.js or a new file
export function createLoginOverlay(myGeneratedCode, onLoginCallback) {
  const loginOverlay = document.createElement('div');
  loginOverlay.style = `
    position: fixed; inset: 0; display: flex; align-items: center; justify-content: center;
    background: radial-gradient(circle at center, rgba(15, 17, 23, 0.98) 0%, #07090c 100%);
    z-index: 1000; font-family: 'Inter', sans-serif; color: white;
  `;

  // Weapon Definitions
  const primaries = [
    { id: 'rifle', name: 'ASSAULT', icon: '🔫' },
    { id: 'smg', name: 'SMG', icon: '⚡' },
    { id: 'shotgun', name: 'SHOTGUN', icon: '🔥' },
    { id: 'sniper', name: 'SNIPER', icon: '🔭' }
  ];
  const secondaries = [
    { id: 'pistol', name: 'PISTOL', icon: '🍱' },
    { id: 'knife', name: 'KNIFE', icon: '🔪' }
  ];
  
  let selectedPrimary = 'rifle';
  let selectedSecondary = 'pistol';
  let isCreating = true;

  const loginBox = document.createElement('div');
  loginBox.style = `
    width: 480px; padding: 40px; background: rgba(15, 18, 25, 0.95);
    border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 16px;
  `;

  loginBox.innerHTML = `
    <h1 style="margin: 0 0 25px; letter-spacing: 4px; font-weight: 900; text-align: center;">SYSTEM LOGIN</h1>
    
    <div style="display: flex; gap: 10px; margin-bottom: 25px;">
      <button id="modeCreate" style="flex: 1; padding: 10px; background: #ef4444; border: none; border-radius: 6px; color: white; font-weight: 900; cursor: pointer;">CREATE</button>
      <button id="modeJoin" style="flex: 1; padding: 10px; background: #1e293b; border: none; border-radius: 6px; color: white; font-weight: 900; cursor: pointer;">JOIN</button>
    </div>

    <div style="text-align: left; margin-bottom: 20px;">
      <label style="font-size: 10px; font-weight: 900; color: #f4c430;">CODENAME</label>
      <input id="loginUser" type="text" placeholder="OPERATOR NAME" style="width: 100%; padding: 12px; background: #0f172a; border: 1px solid #1e293b; border-radius: 8px; color: white; margin-top: 5px; outline: none; box-sizing: border-box;">
    </div>

    <div id="roomSection" style="text-align: left; margin-bottom: 20px;">
      <label style="font-size: 10px; font-weight: 900; color: #f4c430;">ROOM CODE</label>
      <input id="roomCode" type="text" value="${myGeneratedCode}" disabled style="width: 100%; padding: 12px; background: rgba(255,255,255,0.05); border: 1px solid #1e293b; border-radius: 8px; color: #f4c430; margin-top: 5px; outline: none; box-sizing: border-box; font-weight: 900; letter-spacing: 2px;">
    </div>

    <div style="text-align: left; margin-bottom: 15px;">
      <label style="font-size: 10px; font-weight: 900; color: #f4c430;">PRIMARY LOADOUT</label>
      <div id="primaryGrid" style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-top: 8px;">
        ${primaries.map(w => `<div id="p-${w.id}" style="padding: 10px 5px; background: #1e293b; border: 2px solid ${w.id==='rifle'?'#ef4444':'transparent'}; border-radius: 8px; cursor: pointer; text-align: center; font-size: 9px; font-weight: 900;">${w.icon}<br>${w.name}</div>`).join('')}
      </div>
    </div>

    <div style="text-align: left; margin-bottom: 30px;">
      <label style="font-size: 10px; font-weight: 900; color: #f4c430;">SECONDARY SLOT</label>
      <div id="secondaryGrid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 8px;">
        ${secondaries.map(w => `<div id="s-${w.id}" style="padding: 10px; background: #1e293b; border: 2px solid ${w.id==='pistol'?'#ef4444':'transparent'}; border-radius: 8px; cursor: pointer; text-align: center; font-size: 10px; font-weight: 900;">${w.icon} ${w.name}</div>`).join('')}
      </div>
    </div>

    <button id="startBtn" style="width: 100%; padding: 18px; background: #ef4444; color: white; border: none; border-radius: 8px; font-weight: 900; cursor: pointer; text-transform: uppercase;">Confirm & Deploy</button>
  `;

  document.body.appendChild(loginOverlay);
  loginOverlay.appendChild(loginBox);

  const roomInput = loginBox.querySelector('#roomCode');
  const modeCreate = loginBox.querySelector('#modeCreate');
  const modeJoin = loginBox.querySelector('#modeJoin');

  modeCreate.onclick = () => {
    isCreating = true;
    modeCreate.style.background = '#ef4444';
    modeJoin.style.background = '#1e293b';
    roomInput.value = myGeneratedCode; // Use your passed code
    roomInput.disabled = true;
    roomInput.style.color = '#f4c430';
  };

  modeJoin.onclick = () => {
    isCreating = false;
    modeJoin.style.background = '#ef4444';
    modeCreate.style.background = '#1e293b';
    roomInput.value = ''; // Clear for user input
    roomInput.disabled = false;
    roomInput.style.color = '#white';
    roomInput.placeholder = 'ENTER CODE';
    roomInput.focus();
  };

  // Weapon selection event listeners
  primaries.forEach(w => {
    loginBox.querySelector(`#p-${w.id}`).onclick = (e) => {
      selectedPrimary = w.id;
      primaries.forEach(v => loginBox.querySelector(`#p-${v.id}`).style.borderColor = 'transparent');
      e.currentTarget.style.borderColor = '#ef4444';
    };
  });

  secondaries.forEach(w => {
    loginBox.querySelector(`#s-${w.id}`).onclick = (e) => {
      selectedSecondary = w.id;
      secondaries.forEach(v => loginBox.querySelector(`#s-${v.id}`).style.borderColor = 'transparent');
      e.currentTarget.style.borderColor = '#ef4444';
    };
  });

  loginBox.querySelector('#startBtn').onclick = () => {
    const data = {
      username: loginBox.querySelector('#loginUser').value || "Operator",
      roomCode: roomInput.value || myGeneratedCode,
      primary: selectedPrimary,
      secondary: selectedSecondary,
      isHost: isCreating
    };
    loginOverlay.remove();
    onLoginCallback(data);
  };
}