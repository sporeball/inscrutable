document.addEventListener('DOMContentLoaded', victus.setup({
  id: 'canvas',
  w: 288,
  h: 288,
  color: '#94fdff'
}));

const field = Array(9).fill(undefined);

function init () {
  for (let i = 0; i < 9; i++) {
    field[i] = new victus.Sprite('assets/square_black.png', 96, 96, 28, 28);
    field[i].x = (32 * (i % 3)) + 96;
    field[i].y = (32 * Math.floor(i / 3)) + 96;
  }
}

function main () {
  victus.clear();
  for (const square of field) {
    square.draw();
  }
  window.requestAnimationFrame(main);
}

init();

window.requestAnimationFrame(main);
