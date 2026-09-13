const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const gamesData = [
  // 2017 Season (Sophomore) - 14 Games
  { date: '2017-02-18', opponent: 'Albright', saves: 6, goals_allowed: 7, shots_faced: 13, result: 'win', team_score: 10, opponent_score: 7, location: 'Collegeville, Pa.' },
  { date: '2017-02-22', opponent: 'Mary Washington', saves: 9, goals_allowed: 6, shots_faced: 15, result: 'win', team_score: 9, opponent_score: 6, location: 'Collegeville, Pa.' },
  { date: '2017-02-25', opponent: 'Frostburg State', saves: 9, goals_allowed: 13, shots_faced: 22, result: 'loss', team_score: 8, opponent_score: 13, location: 'Collegeville, Pa.' },
  { date: '2017-03-01', opponent: 'at SUNY Cortland', saves: 7, goals_allowed: 14, shots_faced: 21, result: 'loss', team_score: 9, opponent_score: 14, location: 'Cortland, N.Y.' },
  { date: '2017-03-08', opponent: 'Eastern', saves: 8, goals_allowed: 7, shots_faced: 15, result: 'win', team_score: 10, opponent_score: 7, location: 'Collegeville, Pa.' },
  { date: '2017-03-11', opponent: 'at #10 Cabrini', saves: 16, goals_allowed: 8, shots_faced: 24, result: 'win', team_score: 10, opponent_score: 8, location: 'Radnor, Pa.' },
  { date: '2017-03-18', opponent: 'at Montclair State', saves: 7, goals_allowed: 11, shots_faced: 18, result: 'loss', team_score: 9, opponent_score: 11, location: 'Montclair, N.J.' },
  { date: '2017-03-25', opponent: 'McDaniel', saves: 10, goals_allowed: 9, shots_faced: 19, result: 'win', team_score: 16, opponent_score: 9, location: 'Collegeville, Pa.' },
  { date: '2017-04-01', opponent: 'at Muhlenberg', saves: 10, goals_allowed: 8, shots_faced: 18, result: 'win', team_score: 13, opponent_score: 8, location: 'Allentown, Pa.' },
  { date: '2017-04-08', opponent: '#11 Dickinson', saves: 6, goals_allowed: 14, shots_faced: 20, result: 'loss', team_score: 10, opponent_score: 15, location: 'Collegeville, Pa.' },
  { date: '2017-04-15', opponent: 'at #12 Franklin & Marshall', saves: 12, goals_allowed: 12, shots_faced: 24, result: 'loss', team_score: 11, opponent_score: 12, location: 'Lancaster, Pa.' },
  { date: '2017-04-19', opponent: '#9 Gettysburg', saves: 8, goals_allowed: 12, shots_faced: 20, result: 'loss', team_score: 4, opponent_score: 13, location: 'Collegeville, Pa.' },
  { date: '2017-04-22', opponent: 'at Haverford', saves: 4, goals_allowed: 2, shots_faced: 6, result: 'win', team_score: 11, opponent_score: 8, location: 'Haverford, Pa.' },
  { date: '2017-04-29', opponent: 'Washington College', saves: 2, goals_allowed: 4, shots_faced: 6, result: 'loss', team_score: 8, opponent_score: 9, location: 'Collegeville, Pa.' },

  // 2018 Season (Junior) - 8 Games
  { date: '2018-02-17', opponent: 'Albright', saves: 8, goals_allowed: 9, shots_faced: 17, result: 'loss', team_score: 8, opponent_score: 9, location: 'Collegeville, Pa.' },
  { date: '2018-02-21', opponent: 'at Mary Washington', saves: 11, goals_allowed: 10, shots_faced: 21, result: 'win', team_score: 13, opponent_score: 10, location: 'Fredericksburg, Va.' },
  { date: '2018-02-24', opponent: 'at Stockton', saves: 12, goals_allowed: 15, shots_faced: 27, result: 'loss', team_score: 14, opponent_score: 15, location: 'Galloway, N.J.' },
  { date: '2018-02-28', opponent: '#8 Cortland', saves: 13, goals_allowed: 16, shots_faced: 29, result: 'loss', team_score: 10, opponent_score: 16, location: 'Collegeville, Pa.' },
  { date: '2018-03-10', opponent: '#10 Cabrini', saves: 10, goals_allowed: 14, shots_faced: 24, result: 'loss', team_score: 8, opponent_score: 14, location: 'Collegeville, Pa.' },
  { date: '2018-03-17', opponent: 'Montclair State', saves: 4, goals_allowed: 14, shots_faced: 18, result: 'loss', team_score: 13, opponent_score: 16, location: 'Collegeville, Pa.' },
  { date: '2018-03-24', opponent: 'at McDaniel', saves: 22, goals_allowed: 8, shots_faced: 30, result: 'win', team_score: 11, opponent_score: 8, location: 'Westminster, Md.' },
  { date: '2018-03-31', opponent: '#11 Franklin & Marshall', saves: 21, goals_allowed: 10, shots_faced: 31, result: 'win', team_score: 13, opponent_score: 10, location: 'Collegeville, Pa.' },

  // 2019 Season (Senior) - 2 Games
  { date: '2019-03-19', opponent: 'Bryn Athyn', saves: 2, goals_allowed: 0, shots_faced: 2, result: 'win', team_score: 19, opponent_score: 1, location: 'Collegeville, Pa.' },
  { date: '2019-04-13', opponent: 'at Washington College', saves: 1, goals_allowed: 1, shots_faced: 2, result: 'win', team_score: 17, opponent_score: 6, location: 'Chestertown, Md.' }
];

async function seed() {
  const userIds = [
    '0f066eb3-d0fa-43dd-8925-34f761e9281c', // eshevitz96@gmail.com
    'aefbf2f5-48d5-467c-b491-c1657a40ecb2'  // e@cmmncreators.com
  ];

  for (const uid of userIds) {
    // Delete existing game_sessions for this user
    await supabase.from('game_sessions').delete().eq('user_id', uid);

    for (const g of gamesData) {
      // Create game record
      const { data: gameRow, error: gErr } = await supabase
        .from('games')
        .insert({
          opponent_name: g.opponent,
          game_date: g.date,
          location: g.location,
          result: g.result,
          team_score: g.team_score,
          opponent_score: g.opponent_score
        })
        .select()
        .single();

      if (gErr) {
        console.error('Error inserting into games:', gErr);
        continue;
      }

      // Create game_session record
      const { error: sErr } = await supabase
        .from('game_sessions')
        .insert({
          user_id: uid,
          game_id: gameRow.id,
          opponent: g.opponent,
          location: g.location,
          scheduled_date: g.date,
          game_type: 'game',
          saves: g.saves,
          goals_allowed: g.goals_allowed,
          shots_faced: g.shots_faced,
          save_pct: Number((g.saves / g.shots_faced).toFixed(4)),
          status: 'complete'
        });

      if (sErr) {
        console.error('Error inserting into game_sessions:', sErr);
      }
    }
    console.log(`Successfully populated 24 games and game_sessions for user: ${uid}`);
  }
}

seed();
