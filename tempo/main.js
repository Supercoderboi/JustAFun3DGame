// import { Multiplayer } from "./supabasecode.js";

// const mp = new Multiplayer();







// window.addEventListener('keydown', (e) => {
//   e.preventDefault();
//   console.log(e.key);
//   if(e.key === 'n') {
//     mp.createRoom();
//     mp.subscribe();
//   }else if (e.key === 'j') {
//     const code = prompt("code?");
//     mp.joinGame(code);
//     mp.subscribe();
//   }else if (e.key === 's'){
//     const payload = {
//     playerId: mp.uuid,
//     PlayerUsername: "test123",
//     x: mouse.x,
//     y: mouse.y,
//     z: 56,
//     health: 100
//     }
//     console.log(payload);
//     mp.sendStat(payload);
//   }
// })

// let mouse = { x: 0, y: 0 };

// window.addEventListener("mousemove", (e) => {
//   mouse.x = e.clientX;
//   mouse.y = e.clientY;
// });