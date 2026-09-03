import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';
import {createRemotePlayer, setRemoteHealth, die, healthData, setRemotePosition, setRemoteStats, setRemoteTeam, chooseSafeSpawn, players, playerConfig, localHealth } from './main.js';
import { controls } from './threejs.js';

const supabaseURL = "https://tosdkyzrazpnghzmczgj.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRvc2RreXpyYXpwbmdoem1jemdqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgzOTQ5NDIsImV4cCI6MjA5Mzk3MDk0Mn0.xhw6Qk9iOHlT58TfZ58KsZZctDQKUbWZtvJh3mj-oXc";
const supabase = createClient(supabaseURL, supabaseKey);
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
export class Multiplayer {
  constructor() {
    this.words = [
      "able","acid","aged","also","area","army","away","baby","back","ball",
      "band","bank","base","bath","bear","beat","bell","belt","best","bill",
      "bird","blow","blue","boat","body","bond","bone","book","boom","born",
      "boss","both","bowl","bulk","burn","bush","busy","call","calm","came"
    ];

    
    this.uuid = crypto.randomUUID();

    console.log("Player UUID:", this.uuid);
  }

  generateRoomCode() {
    const shuffled = [...this.words].sort(() => 0.5 - Math.random());
    return `${shuffled[0]}-${shuffled[1]}-${shuffled[2]}`;
    // return "ball-bear-bath"
  }

  createRoom() {
    this.roomCode = this.generateRoomCode();

    console.log("Created room with code:", this.roomCode);

    this.channel = supabase.channel(this.roomCode);
    
    return this.roomCode;
  }

  subscribe() {
    if (!this.channel) {
      console.error("No channel! Create or join a room first.");
      return;
    }

    this.channel.subscribe((status) => {
        // console.log("Channel status:", status);  
      })
      .on('broadcast', { event: 'playerStat' }, (payload) => {
        // console.log("Received:", payload);
        const d = payload.payload;
        setRemotePosition(d.playerId, d.x,d.y,d.z)
        // console.log(d.health)

        
      })
      .on('broadcast', {event : 'playerJoin'},async (payload) => {
        console.warn("login: ", payload.payload.username);
        const d = payload.payload
        
        // createRemotePlayer(d.playerId, d.username, d.team);
        // setRemotePosition(d.playerId,d.x,d.y,d.z );
        // setRemoteHealth(d.playerId, 100, true);
        await sleep(1000);

        const { data, error } = await supabase
        .from('players')
        .select()
        .eq('servercode', this.roomCode)
        // console.log(this.roomCode)

        // console.log("search: ",data, error);

        for(let i = 0; i < data.length; i++) {
          // console.log(data[i]);
          const info = data[i];

          if(info.player !== this.uuid) {
            if(players.includes(info.username)) {

            }else {
            createRemotePlayer(info.player, info.username, info.team);
            setRemotePosition(info.player, d.x,d.y,d.z);
            setRemoteHealth(info.player, 100, true);
            players.push(info.username);
            }
          }
        }
        // if(players.includes(d.username)){
        
        // }else {
        //   this.broadcastJoinData(playerConfig.username, playerConfig.team,0,0,0);
        //   players.push(d.username);
        // }
      })
      .on('broadcast', {event : 'sendDamage'}, (payload) => {
        const d = payload.payload;
        console.log(localHealth, "   ", healthData.health)
        if(d.playerId === this.uuid) {
          healthData.health = localHealth - d.damage;
          let health;
        if(healthData.health < 0) {
          health = false;
          controls.getObject().position.set(0,100,0);
          die(d.sender, d.type,d.weapon);
          
        }else {
          health = true;
        }

        setRemoteHealth(this.uuid,healthData.health,health)
        }
      })
      

  }

  sendStat(playerStats) {
    if (!this.channel) return;

    this.channel.send({
      type: 'broadcast',
      event: 'playerStat',
      payload: playerStats,
    });

    const {error,data} = await supabase
    .from('players')
    .update(
	health: healthData.health
    })
    .eq('player' , this.uuid )
	.select()
  }

  async joinGame(gameId,username,team, x,y,z) {
    this.roomCode = gameId;
    this.channel = supabase.channel(this.roomCode);
    // console.log("joind game with code: ", this.roomCode);
    
    const { data, error } = await supabase
        .from('players')
        .select()
        .eq('servercode', this.roomCode)
        // console.log(this.roomCode)

        // console.log("search: ",data, error);
        let blue=0;
        let red = 0;
        for(let i = 0; i < data.length; i++) {
          // console.log(data[i]);
          const info = data[i];
          if(info.team === 'blue') {
            blue++
          }else {
            red++
          }




          if(info.player !== this.uuid) {
            if(players.includes(info.username)) {
              
            }else {
            createRemotePlayer(info.player, info.username, info.team);
            setRemotePosition(info.player, 0,0,0);
            setRemoteHealth(info.player, 100, true);
            players.push(info.username);
            }
          }
        }
        let finTeam = '';
        
        if(blue <= red) {
          finTeam = 'blue';
        }else if( red <= blue) {
          finTeam = 'red';
        }
        console.warn("TEAM ALERT", red, blue, finTeam)

        const spawn = chooseSafeSpawn(finTeam);
       
        playerConfig.team = finTeam;
        controls.getObject().position.set(spawn.x,spawn.y,spawn.z);
        this.broadcastJoinData(username,finTeam,spawn.x,spawn.y,spawn.z,gameId);
  }
  async broadcastJoinData(username, team,x,y,z,gameId){
    const { error } = await supabase
  .from('players')
  .insert({  player: this.uuid, username: username, servercode:gameId, team:team })

  console.log(error? error : "");
    this.channel.send({
      type: 'broadcast',
      event: 'playerJoin',
      payload: {
      playerId : this.uuid,
      username: username,
      team : team,
      x:x,
      y:y,
      z:z,
      }
    })
  }

  sendDamage(playerID, damage,type, weapon) {
    console.log('sending damage to', playerID);
    
    this.channel.send({
      type : 'broadcast',
      event: 'sendDamage',
      payload: {
        playerId : playerID,
        damage: damage,
        sender : this.uuid,
        type : type,
        weapon : weapon,
      }
    })
  }
  async sendGameStat(k, d, s, a, ) {
    const {error,data} = await supabase
    .from('players')
    .update({kills : k,
      deaths : d,
      score : s,
      assists : a,
	health: healthData.health
    })
    .eq('player' , this.uuid )
	.select()
	console.log('sentData', k,d,a,s);
	if(error) {
		console.warn("error: ", error);
	}else {
		console.log(data, this.getGlobalStats());
	}
  }
  async getGlobalStats() {
    const { data, error } = await supabase
        .from('players')
        .select()
        .eq('servercode', this.roomCode)
	console.log('getglblstat', data);	
    return error? console.error('err', error) : data;
     
  }
}
