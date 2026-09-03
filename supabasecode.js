import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

import {
  createRemotePlayer,
  setRemoteHealth,
  die,
  healthData,
  setRemotePosition,
  setRemoteStats,
  setRemoteTeam,
  chooseSafeSpawn,
  players,
  playerConfig,
  localHealth
} from './main.js';

import { controls } from './threejs.js';

const supabaseURL = "https://tosdkyzrazpnghzmczgj.supabase.co";

const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRvc2RreXpyYXpwbmdoem1jemdqIiwicm9sZSI6MjA5Mzk3MDk0Mn0.xhw6Qk9iOHlT58TfZ58KsZZctDQKUbWZtvJh3mj-oXc";

const supabase = createClient(supabaseURL, supabaseKey);

const sleep = (ms) =>
  new Promise(resolve => setTimeout(resolve, ms));


export class Multiplayer {

  constructor() {

    this.words = [
      "able", "acid", "aged", "also", "area",
      "army", "away", "baby", "back", "ball",
      "band", "bank", "base", "bath", "bear",
      "beat", "bell", "belt", "best", "bill",
      "bird", "blow", "blue", "boat", "body",
      "bond", "bone", "book", "boom", "born",
      "boss", "both", "bowl", "bulk", "burn",
      "bush", "busy", "call", "calm", "came"
    ];

    this.uuid = crypto.randomUUID();

    this.roomCode = null;
    this.channel = null;

    console.log("Player UUID:", this.uuid);
  }


  generateRoomCode() {

    const shuffled = [...this.words]
      .sort(() => 0.5 - Math.random());

    return `${shuffled[0]}-${shuffled[1]}-${shuffled[2]}`;

    // return "ball-bear-bath";
  }


  createRoom() {

    this.roomCode = this.generateRoomCode();

    console.log(
      "Created room with code:",
      this.roomCode
    );

    this.channel = supabase.channel(this.roomCode);

    return this.roomCode;
  }


  subscribe() {

    if (!this.channel) {

      console.error(
        "No channel! Create or join a room first."
      );

      return;
    }


    this.channel

      .subscribe((status) => {

        console.log(
          "Channel status:",
          status
        );

      })


      // -----------------------------------
      // PLAYER POSITION / STATS
      // -----------------------------------

      .on(
        'broadcast',
        { event: 'playerStat' },
        (payload) => {

          const d = payload.payload;

          if (!d || !d.playerId) return;

          setRemotePosition(
            d.playerId,
            d.x,
            d.y,
            d.z
          );

        }
      )


      // -----------------------------------
      // PLAYER JOIN
      // -----------------------------------

      .on(
        'broadcast',
        { event: 'playerJoin' },
        async (payload) => {

          const d = payload.payload;

          console.warn(
            "Player joined:",
            d.username
          );

          await sleep(1000);


          const { data, error } = await supabase
            .from('players')
            .select()
            .eq(
              'servercode',
              this.roomCode
            );


          if (error) {

            console.error(
              "Error getting players:",
              error
            );

            return;
          }


          if (!data) return;


          for (let i = 0; i < data.length; i++) {

            const info = data[i];


            if (info.player !== this.uuid) {

              if (
                players.includes(
                  info.username
                )
              ) {

                continue;

              }


              createRemotePlayer(
                info.player,
                info.username,
                info.team
              );


              setRemotePosition(
                info.player,
                d.x,
                d.y,
                d.z
              );


              setRemoteHealth(
                info.player,
                100,
                true
              );


              players.push(
                info.username
              );

            }
          }

        }
      )


      // -----------------------------------
      // DAMAGE
      // -----------------------------------

      .on(
        'broadcast',
        { event: 'sendDamage' },
        (payload) => {

          const d = payload.payload;

          if (!d) return;


          console.log(
            "Damage received:",
            d.damage,
            "Target:",
            d.playerId
          );


          if (d.playerId === this.uuid) {

            // Subtract damage from CURRENT health
            healthData.health -= d.damage;


            // Prevent negative health
            if (healthData.health < 0) {

              healthData.health = 0;

            }


            let alive = true;


            if (healthData.health <= 0) {

              alive = false;


              controls
                .getObject()
                .position
                .set(0, 100, 0);


              die(
                d.sender,
                d.type,
                d.weapon
              );

            }


            setRemoteHealth(
              this.uuid,
              healthData.health,
              alive
            );


            console.log(
              "Health:",
              healthData.health
            );

          }

        }
      );

  }


  // -----------------------------------
  // SEND PLAYER STAT
  // -----------------------------------

  async sendStat(playerStats) {

    if (!this.channel) {

      console.warn(
        "Cannot send stats: no channel."
      );

      return;
    }


    this.channel.send({

      type: 'broadcast',

      event: 'playerStat',

      payload: playerStats

    });


    const { error, data } =
      await supabase

        .from('players')

        .update({

          health: healthData.health

        })

        .eq(
          'player',
          this.uuid
        )

        .select();


    if (error) {

      console.error(
        "Error updating health:",
        error
      );

    }

  }


  // -----------------------------------
  // JOIN GAME
  // -----------------------------------

  async joinGame(
    gameId,
    username,
    team,
    x,
    y,
    z
  ) {

    this.roomCode = gameId;

    this.channel =
      supabase.channel(
        this.roomCode
      );


    console.log(
      "Joining game:",
      this.roomCode
    );


    const { data, error } =
      await supabase

        .from('players')

        .select()

        .eq(
          'servercode',
          this.roomCode
        );


    if (error) {

      console.error(
        "Error getting players:",
        error
      );

      return;
    }


    let blue = 0;
    let red = 0;


    if (data) {

      for (
        let i = 0;
        i < data.length;
        i++
      ) {

        const info = data[i];


        // Count teams

        if (info.team === 'blue') {

          blue++;

        } else {

          red++;

        }


        // Create remote players

        if (info.player !== this.uuid) {

          if (
            players.includes(
              info.username
            )
          ) {

            continue;

          }


          createRemotePlayer(
            info.player,
            info.username,
            info.team
          );


          setRemotePosition(
            info.player,
            0,
            0,
            0
          );


          setRemoteHealth(
            info.player,
            100,
            true
          );


          players.push(
            info.username
          );

        }

      }

    }


    // -----------------------------------
    // SELECT TEAM
    // -----------------------------------

    let finTeam = '';


    if (blue <= red) {

      finTeam = 'blue';

    } else if (red <= blue) {

      finTeam = 'red';

    }


    console.warn(
      "TEAM ALERT",
      "Red:",
      red,
      "Blue:",
      blue,
      "Selected:",
      finTeam
    );


    // -----------------------------------
    // SELECT SPAWN
    // -----------------------------------

    const spawn =
      chooseSafeSpawn(
        finTeam
      );


    playerConfig.team =
      finTeam;


    controls
      .getObject()
      .position
      .set(
        spawn.x,
        spawn.y,
        spawn.z
      );


    // -----------------------------------
    // BROADCAST JOIN
    // -----------------------------------

    await this.broadcastJoinData(
      username,
      finTeam,
      spawn.x,
      spawn.y,
      spawn.z,
      gameId
    );

  }


  // -----------------------------------
  // BROADCAST JOIN DATA
  // -----------------------------------

  async broadcastJoinData(
    username,
    team,
    x,
    y,
    z,
    gameId
  ) {

    const { error } =
      await supabase

        .from('players')

        .insert({

          player: this.uuid,

          username: username,

          servercode: gameId,

          team: team

        });


    console.log(
      error ? error : ""
    );


    if (error) {

      console.error(
        "Error inserting player:",
        error
      );

      return;
    }


    if (!this.channel) {

      console.error(
        "No channel available."
      );

      return;
    }


    this.channel.send({

      type: 'broadcast',

      event: 'playerJoin',

      payload: {

        playerId: this.uuid,

        username: username,

        team: team,

        x: x,

        y: y,

        z: z

      }

    });

  }


  // -----------------------------------
  // SEND DAMAGE
  // -----------------------------------

  sendDamage(
    playerID,
    damage,
    type,
    weapon
  ) {

    if (!this.channel) {

      console.warn(
        "Cannot send damage: no channel."
      );

      return;
    }


    console.log(
      'Sending damage to',
      playerID
    );


    this.channel.send({

      type: 'broadcast',

      event: 'sendDamage',

      payload: {

        playerId: playerID,

        damage: damage,

        sender: this.uuid,

        type: type,

        weapon: weapon

      }

    });

  }


  // -----------------------------------
  // SEND GAME STATS
  // -----------------------------------

  async sendGameStat(
    k,
    d,
    s,
    a
  ) {

    const { error, data } =
      await supabase

        .from('players')

        .update({

          kills: k,

          deaths: d,

          score: s,

          assists: a,

          health: healthData.health

        })

        .eq(
          'player',
          this.uuid
        )

        .select();


    console.log(
      'sentData',
      k,
      d,
      a,
      s
    );


    if (error) {

      console.warn(
        "Error:",
        error
      );

    } else {

      console.log(
        data,
        await this.getGlobalStats()
      );

    }

  }


  // -----------------------------------
  // GET GLOBAL STATS
  // -----------------------------------

  async getGlobalStats() {

    const { data, error } =
      await supabase

        .from('players')

        .select()

        .eq(
          'servercode',
          this.roomCode
        );


    console.log(
      'getglblstat',
      data
    );


    if (error) {

      console.error(
        'Error:',
        error
      );

      return null;
    }


    return data;

  }

}