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

let arrowPosition = 0;
let debounceTimer = 0;

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

function debounce () {
  if (debounceTimer > 0) {
    debounceTimer--;
  }
}

function poll () {
  if (victus.keys.Shift) {
    return;
  }
  if (victus.keys.d) {
    move();
  } else if (victus.keys.f) {
    move({ fast: true });
  }
}

function move (options = {}) {
  if (debounceTimer > 0) {
    return;
  }
  if (options.fast) {
    arrowPosition += 3;
  }
  else {
    arrowPosition++;
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

function randomOrb () {
  const arr = ['assets/orb_red.png', 'assets/orb_green.png', 'assets/orb_blue.png'];
  return arr[Math.floor(Math.random() * arr.length)];
}

function main () {
  victus.clear();
  debounce();
  poll();
  draw();
  window.requestAnimationFrame(main);
}

init();

window.requestAnimationFrame(main);
