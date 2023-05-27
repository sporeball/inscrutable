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

let arrowPosition = 0;
let debounceTimer = 0;
let matchTimer = -1;

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

/**
 * housekeeping functions
 */

// initialize objects before the game starts
function init () {
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

function step_timers() {
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

function poll () {
  // shift causes repeated actions and should be ignored
  if (victus.keys.Shift) {
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
}

// shoot
function shoot () {
  if (debounceTimer > 0) {
    return;
  }
  // affect the playfield
  const squareToAffect = shot_LUT[arrowPosition];
  const orb = orbs[arrowPosition];
  field[squareToAffect].d.src = orb.d.src.replace('orb', 'square');
  // play sound
  sound_collision.reset();
  sound_collision.play();
  // debounce
  debounceTimer = 6;
  // try to make a match
  match();
}

// shoot forcefully to affect the center
function shootForceful () {
  if (debounceTimer > 0) {
    return;
  }
  // must be on a square orthogonally adjacent to the center square
  if (arrowPosition !== 1 && arrowPosition !== 4 && arrowPosition !== 7 && arrowPosition !== 10) {
    return;
  }
  // affect the center square of the playfield
  field[4].d.src = orbs[arrowPosition].d.src.replace('orb', 'square');
  // play sound
  sound_forceCollision.reset();
  sound_forceCollision.play();
  // debounce
  debounceTimer = 6;
  // try to make a match
  match();
}

// make a match
function match () {
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
  // play sound
  sound_match.reset();
  sound_match.play();
  // start match timer
  // the match will stick around for this many frames
  matchTimer = 24;
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
  step_timers();
  poll();
  draw();
  window.requestAnimationFrame(main);
}

init();

window.requestAnimationFrame(main);
