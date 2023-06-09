document.addEventListener('DOMContentLoaded', victus.setup({
  id: 'canvas',
  w: 288,
  h: 288,
  color: '#94fdff'
}));

const arrow = new victus.Sprite('assets/arrow_down.png', 96, 64, 28, 28);
// 9-square playfield
const field = Array(9).fill(undefined);
const orbs = Array(12).fill(undefined);

let lastMatch;

const sound_move = new victus.Sound('assets/move.wav');
const sound_moveFast = new victus.Sound('assets/fast_move.wav');
const sound_collision = new victus.Sound('assets/collision.wav');
const sound_forceCollision = new victus.Sound('assets/force_collision.wav');
const sound_match = new victus.Sound('assets/match.wav');
const sound_switchOut = new victus.Sound('assets/switch_out.wav');
const sound_gameOver = new victus.Sound('assets/death.wav');
const sound_restart = new victus.Sound('assets/restart.wav');

let arrowPosition = 0;
let debounceTimer = 0;
let matchTimer = -1;

let score = 0;
let moves = 10;
let time = 15;

// lookup table for the player arrow
// each element contains sprite, x and y
const arrow_LUT = [
  {sprite: 'assets/arrow_down.png', x: 96, y: 64},
  {sprite: 'assets/arrow_down.png', x: 128, y: 64},
  {sprite: 'assets/arrow_down.png', x: 160, y: 64},
  {sprite: 'assets/arrow_left.png', x: 192, y: 96},
  {sprite: 'assets/arrow_left.png', x: 192, y: 128},
  {sprite: 'assets/arrow_left.png', x: 192, y: 160},
  {sprite: 'assets/arrow_up.png', x: 160, y: 192},
  {sprite: 'assets/arrow_up.png', x: 128, y: 192},
  {sprite: 'assets/arrow_up.png', x: 96, y: 192},
  {sprite: 'assets/arrow_right.png', x: 64, y: 160},
  {sprite: 'assets/arrow_right.png', x: 64, y: 128},
  {sprite: 'assets/arrow_right.png', x: 64, y: 96}
];

// lookup table for orb positions
// each element contains x and y
const orb_LUT = [
  {x: 96, y: 32},
  {x: 128, y: 32},
  {x: 160, y: 32},
  {x: 224, y: 96},
  {x: 224, y: 128},
  {x: 224, y: 160},
  {x: 160, y: 224},
  {x: 128, y: 224},
  {x: 96, y: 224},
  {x: 32, y: 160},
  {x: 32, y: 128},
  {x: 32, y: 96}
];

// lookup table for shooting
// each element contains the playfield square that will be affected
// by a shot at the given position
const shot_LUT = [
  0,
  1,
  2,
  2,
  5,
  8,
  8,
  7,
  6,
  6,
  3,
  0
];

// table of matches
// each element contains a list of playfield squares that, if they
// are all the same color, form a valid match
const match_LUT = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6]
];

// lookup table for color combination
// each element contains a square path, an orb path, and the color that they combine into
const combination_LUT = [
  ['assets/square_black.png', 'assets/orb_red.png', 'assets/square_red.png'],
  ['assets/square_black.png', 'assets/orb_green.png', 'assets/square_green.png'],
  ['assets/square_black.png', 'assets/orb_blue.png', 'assets/square_blue.png'],
  ['assets/square_red.png', 'assets/orb_red.png', 'assets/square_red.png'],
  ['assets/square_red.png', 'assets/orb_green.png', 'assets/square_yellow.png'],
  ['assets/square_red.png', 'assets/orb_blue.png', 'assets/square_magenta.png'],
  ['assets/square_green.png', 'assets/orb_red.png', 'assets/square_yellow.png'],
  ['assets/square_green.png', 'assets/orb_green.png', 'assets/square_green.png'],
  ['assets/square_green.png', 'assets/orb_blue.png', 'assets/square_cyan.png'],
  ['assets/square_blue.png', 'assets/orb_red.png', 'assets/square_magenta.png'],
  ['assets/square_blue.png', 'assets/orb_green.png', 'assets/square_cyan.png'],
  ['assets/square_blue.png', 'assets/orb_blue.png', 'assets/square_blue.png'],
  ['assets/square_cyan.png', 'assets/orb_red.png', 'assets/square_white.png'],
  ['assets/square_cyan.png', 'assets/orb_green.png', 'assets/square_white.png'],
  ['assets/square_cyan.png', 'assets/orb_blue.png', 'assets/square_white.png'],
  ['assets/square_magenta.png', 'assets/orb_red.png', 'assets/square_white.png'],
  ['assets/square_magenta.png', 'assets/orb_green.png', 'assets/square_white.png'],
  ['assets/square_magenta.png', 'assets/orb_blue.png', 'assets/square_white.png'],
  ['assets/square_yellow.png', 'assets/orb_red.png', 'assets/square_white.png'],
  ['assets/square_yellow.png', 'assets/orb_green.png', 'assets/square_white.png'],
  ['assets/square_yellow.png', 'assets/orb_blue.png', 'assets/square_white.png'],
  ['assets/square_white.png', 'assets/orb_red.png', 'assets/square_red.png'],
  ['assets/square_white.png', 'assets/orb_green.png', 'assets/square_green.png'],
  ['assets/square_white.png', 'assets/orb_blue.png', 'assets/square_blue.png'],
];

/**
 * housekeeping functions
 */

// initialize objects before the game starts
function init () {
  // reset variables
  arrowPosition = 0;
  debounceTimer = 0;
  matchTimer = -1;
  score = 0;
  moves = 10;
  time = 15;
  arrow.d.src = 'assets/arrow_down.png';
  arrow.x = 96;
  arrow.y = 64;
  document.getElementById('score').innerHTML = 'score: 0';
  document.getElementById('moves').innerHTML = 'moves: 10';
  document.getElementById('time').innerHTML = 'time: 15.0';
  document.getElementById('status').innerHTML = '&nbsp;';
  // populate playfield
  for (let i = 0; i < 9; i++) {
    field[i] = new victus.Sprite('assets/square_black.png', 96, 96, 28, 28);
    field[i].x = (32 * (i % 3)) + 96;
    field[i].y = (32 * Math.floor(i / 3)) + 96;
  }
  // populate orbs
  for (let i = 0; i < 12; i++) {
    orbs[i] = new victus.Sprite('assets/orb_red.png', 96, 32, 28, 28);
    orbs[i].d.src = randomOrb();
    orbs[i].x = orb_LUT[i].x;
    orbs[i].y = orb_LUT[i].y;
  }
}

function step_frame_timers () {
  if (debounceTimer > 0) {
    debounceTimer--;
  }
  if (matchTimer > 0) {
    matchTimer--;
  }
  // for match timer
  if (matchTimer === 0) {
    // clear the matching squares
    for (const square of lastMatch) {
      field[square].d.src = 'assets/square_black.png';
    }
    // decrement one more time so it doesn't happen repeatedly
    matchTimer--;
  }
}

function step_timer () {
  if (moves === 0 || time === 0) {
    return;
  }
  time -= 1 / 60;
  document.getElementById('time').innerHTML = `time: ${time.toFixed(1)}`;
  if (time < 0) {
    time = 0;
    document.getElementById('time').innerHTML = 'time: 0.0';
    // remove arrow
    arrow.d.src = 'assets/transparent.png';
    // play sound
    sound_gameOver.reset();
    sound_gameOver.play();
    // update UI
    document.getElementById('status').innerHTML = `game over! space to restart`;
  }
}

function poll () {
  // shift causes repeated actions and should be ignored
  if (victus.keys.Shift) {
    return;
  }
  // none of the actions should work if the player has no moves or time left
  if (moves === 0 || time === 0) {
    if (victus.keys[' ']) {
      sound_restart.reset();
      sound_restart.play();
      init();
    }
    return;
  }
  // D: move (1 square clockwise)
  if (victus.keys.d) {
    move();
  }
  // F: fast move (3 squares clockwise)
  else if (victus.keys.f) {
    move({ fast: true });
  }
  // J: shoot (affects the outside)
  else if (victus.keys.j) {
    shoot();
  }
  // K: forceful shoot (affects the center)
  else if (victus.keys.k) {
    shootForceful();
  }
  // Q: red switch out
  else if (victus.keys.q) {
    switchOut('red');
  }
  // W: green switch out
  else if (victus.keys.w) {
    switchOut('green');
  }
  // E: blue switch out
  else if (victus.keys.e) {
    switchOut('blue');
  }
}

/**
 * gameplay functions
 */

// move clockwise by some number of squares
function move (options = {}) {
  if (debounceTimer > 0) {
    return;
  }
  if (options.fast) {
    arrowPosition += 3;
    sound_moveFast.reset();
    sound_moveFast.play();
  }
  else {
    arrowPosition++;
    sound_move.reset();
    sound_move.play();
  }
  arrowPosition %= 12;
  // update values
  const {sprite, x, y} = arrow_LUT[arrowPosition];
  arrow.d.src = sprite;
  arrow.x = x;
  arrow.y = y;
  // debounce
  debounceTimer = 6;
  // this action costs a move
  useMove();
}

// shoot
function shoot () {
  if (debounceTimer > 0 || matchTimer > 0) {
    return;
  }
  // affect the playfield
  const squareToAffect = shot_LUT[arrowPosition];
  const orb = orbs[arrowPosition];
  field[squareToAffect].d.src = combine(field[squareToAffect].d.src, orb.d.src);
  // change the orb
  orbs[arrowPosition].d.src = randomOrb();
  // play sound
  sound_collision.reset();
  sound_collision.play();
  // debounce
  debounceTimer = 6;
  // try to make a match
  match();
  // this action costs a move
  useMove();
}

// shoot forcefully to affect the center
function shootForceful () {
  if (debounceTimer > 0 || matchTimer > 0) {
    return;
  }
  // must be on a square orthogonally adjacent to the center square
  if (arrowPosition !== 1 && arrowPosition !== 4 && arrowPosition !== 7 && arrowPosition !== 10) {
    return;
  }
  // affect the center square of the playfield
  field[4].d.src = combine(field[4].d.src, orbs[arrowPosition].d.src);
  // change the orb
  orbs[arrowPosition].d.src = randomOrb();
  // play sound
  sound_forceCollision.reset();
  sound_forceCollision.play();
  // debounce
  debounceTimer = 6;
  // try to make a match
  match();
  // this action costs a move
  useMove();
}

// combine two colors
function combine (squarePath, orbPath) {
  const matchingCombination = combination_LUT.find(combination => {
    if (combination[0].slice(combination[0].indexOf('assets')) === squarePath.slice(squarePath.indexOf('assets')) && combination[1].slice(combination[1].indexOf('assets')) === orbPath.slice(orbPath.indexOf('assets'))) {
      return true;
    }
    return false;
  });
  return matchingCombination[2];
}

function switchOut (color) {
  if (debounceTimer > 0) {
    return;
  }
  // change the orb
  if (color === 'red') {
    orbs[arrowPosition].d.src = 'assets/orb_red.png';
  } else if (color === 'green') {
    orbs[arrowPosition].d.src = 'assets/orb_green.png';
  } else if (color === 'blue') {
    orbs[arrowPosition].d.src = 'assets/orb_blue.png';
  }
  // play sound
  sound_switchOut.reset();
  sound_switchOut.play();
  // debounce
  debounceTimer = 6;
  // this action costs a move
  useMove();
}

// make a match
function match () {
  if (matchTimer > 0) {
    return;
  }
  const validMatch = match_LUT.find(match => {
    if (match.every((square, index, array) => field[square].d.src === field[array[0]].d.src && field[square].d.src.slice(field[square].d.src.indexOf('assets')) !== 'assets/square_black.png')) {
      return true;
    }
    return false;
  });
  if (validMatch === undefined) {
    return;
  }
  // set the match
  lastMatch = validMatch;
  // add to score
  const color = field[validMatch[0]].d.src.slice(field[validMatch[0]].d.src.indexOf('assets'));
  const includesCenter = validMatch.includes(4);
  addToScore({ color, includesCenter });
  // play sound
  sound_match.reset();
  sound_match.play();
  // start match timer
  // the match will stick around for this many frames
  matchTimer = 24;
}

// add to the player's score based on what color they matched
// and whether the match includes the center of the playfield
// this will also add to their number of remaining moves
function addToScore (options) {
  let scoreToAdd = 0;
  let movesToAdd = 0;
  let timeToAdd = 0;
  const color = options.color.slice(options.color.indexOf('_') + 1, -4);
  switch (color) {
    case 'red':
    case 'green':
    case 'blue':
      scoreToAdd += 1000;
      movesToAdd += 10;
      timeToAdd += 5;
      break;
    case 'cyan':
    case 'magenta':
    case 'yellow':
      scoreToAdd += 2000;
      movesToAdd += 15;
      timeToAdd += 10;
      break;
    case 'white':
      scoreToAdd += 5000;
      movesToAdd += 20;
      timeToAdd += 15;
      break;
  }
  if (options.includesCenter) {
    scoreToAdd += 500;
    movesToAdd += 5;
    timeToAdd += 5;
  }
  score += scoreToAdd;
  moves += movesToAdd;
  time += timeToAdd;
  document.getElementById('score').innerHTML = `score: ${score}`;
}

function useMove () {
  moves--;
  document.getElementById('moves').innerHTML = `moves: ${moves}`;
  // end the game if there are no moves remaining
  if (moves === 0) {
    // remove arrow
    arrow.d.src = 'assets/transparent.png';
    // play sound
    sound_gameOver.reset();
    sound_gameOver.play();
    // update UI
    document.getElementById('status').innerHTML = `game over! space to restart`;
  }
}

/**
 * utility functions
 */

// return a random orb (red, green, or blue)
function randomOrb () {
  const arr = ['assets/orb_red.png', 'assets/orb_green.png', 'assets/orb_blue.png'];
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * main
 */

// draw all objects
function draw () {
  // playfield
  for (const square of field) {
    square.draw();
  }
  // orbs
  for (const orb of orbs) {
    orb.draw();
  }
  // arrow
  arrow.draw();
}

function main () {
  victus.clear();
  step_frame_timers();
  step_timer();
  poll();
  draw();
  window.requestAnimationFrame(main);
}

init();

window.requestAnimationFrame(main);
