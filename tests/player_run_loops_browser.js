/* node tests/player_run_loops_browser.js [생김새 ...]
   실제 거리에서 Shift 달리기 49칸·크기·루프 경계·걷기/대기 전환을 검사한다. */
'use strict';
process.env.HERO_MOTION = 'run';
require('./player_walk_loops_browser.js');
