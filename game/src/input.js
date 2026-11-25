// input.js — keyboard and mouse input for Warung Cepat. One job: turn raw
// browser events into a per-frame view (held keys, pressed edges, clicks).

export function createInput(canvas) {
  const input = {
    held: new Set(),
    pressed: new Set(),
    mouseX: 0,
    mouseY: 0,
    mouseDown: false,
    clicked: false,
    clickedX: 0,
    clickedY: 0,
    anyKey: false,

    isDown(code) {
      return this.held.has(code);
    },

    wasPressed(code) {
      return this.pressed.has(code);
    },

    // Call once per frame after the game has read the input.
    endFrame() {
      this.pressed.clear();
      this.clicked = false;
    },

    attach() {
      window.addEventListener('keydown', (e) => {
        const tag = (e.target && e.target.tagName) || '';
        if (tag === 'INPUT' || tag === 'TEXTAREA') return;
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
          e.preventDefault();
        }
        if (!e.repeat) {
          this.held.add(e.code);
          this.pressed.add(e.code);
          this.anyKey = true;
        }
      });
      window.addEventListener('keyup', (e) => {
        this.held.delete(e.code);
      });
      window.addEventListener('blur', () => {
        this.held.clear();
      });
      canvas.addEventListener('mousemove', (e) => {
        const rect = canvas.getBoundingClientRect();
        this.mouseX = (e.clientX - rect.left) * (canvas.width / rect.width);
        this.mouseY = (e.clientY - rect.top) * (canvas.height / rect.height);
      });
      canvas.addEventListener('mousedown', (e) => {
        const rect = canvas.getBoundingClientRect();
        this.mouseX = (e.clientX - rect.left) * (canvas.width / rect.width);
        this.mouseY = (e.clientY - rect.top) * (canvas.height / rect.height);
        this.mouseDown = true;
        this.clicked = true;
        this.clickedX = this.mouseX;
        this.clickedY = this.mouseY;
        this.anyKey = true;
      });
      window.addEventListener('mouseup', () => {
        this.mouseDown = false;
      });
    },
  };
  return input;
}

// Movement keys, checked in priority order by the chef.
export const MOVE_KEYS = {
  up: ['KeyW', 'ArrowUp'],
  down: ['KeyS', 'ArrowDown'],
  left: ['KeyA', 'ArrowLeft'],
  right: ['KeyD', 'ArrowRight'],
};

export function moveVector(input) {
  let x = 0;
  let y = 0;
  if (MOVE_KEYS.left.some((c) => input.isDown(c))) x -= 1;
  if (MOVE_KEYS.right.some((c) => input.isDown(c))) x += 1;
  if (MOVE_KEYS.up.some((c) => input.isDown(c))) y -= 1;
  if (MOVE_KEYS.down.some((c) => input.isDown(c))) y += 1;
  if (x !== 0 && y !== 0) {
    x *= Math.SQRT1_2;
    y *= Math.SQRT1_2;
  }
  return { x, y };
}
