document.addEventListener('DOMContentLoaded', victus.setup({
  id: 'canvas',
  w: 288,
  h: 288,
  color: '#94fdff'
}));

const arrow = new victus.Sprite('assets/arrow_down.png', 96, 64, 28, 28);
// 9-square playfield
const field = Array(9).fill(undefined);

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

function init () {
  // populate playfield
  for (let i = 0; i < 9; i++) {
    field[i] = new victus.Sprite('assets/square_black.png', 96, 96, 28, 28);
    field[i].x = (32 * (i % 3)) + 96;
    field[i].y = (32 * Math.floor(i / 3)) + 96;
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
  // arrow
  arrow.draw();
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
