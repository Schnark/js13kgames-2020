/*global earth: true*/
earth =
(function () {
"use strict";

var GRID_WIDTH = 30,
	GRID_HEIGHT = 20,
	H = 10,
	D = 25,
	GRAVITY = 45,
	FRICTION = 4,
	V = 10,
	bgGradient, earthSprite,
	grid,
	lastPos;

function init (canvas) {
	var ctx, grad;
	bgGradient = canvas.createLinearGradient(0, 0, 0, GRID_HEIGHT * D);
	bgGradient.addColorStop(0, '#55f');
	bgGradient.addColorStop(1, '#aaf');

	earthSprite = document.createElement('canvas');
	earthSprite.height = D;
	earthSprite.width = D;
	ctx = earthSprite.getContext('2d');
	grad = ctx.createRadialGradient(D / 2, D / 2, 0, D / 2, D / 2, D);
	grad.addColorStop(0, '#fa5');
	grad.addColorStop(1, '#d82');
	ctx.fillStyle = '#fa5';
	ctx.fillRect(0, 0, D, D); //for some reason I sometimes get a one pixel gap in the center
	ctx.fillStyle = grad;
	ctx.fillRect(0, 0, D, D);

	lastPos = false;
}

function moveDown () {
	var x, y, i;
	for (y = GRID_HEIGHT - 1; y >= 0; y--) {
		for (x = 0; x < GRID_WIDTH; x++) {
			i = y * GRID_WIDTH + x;
			if (grid[i] && grid[i].y > 0.5) {
				if (y === GRID_HEIGHT - 1 || grid[(y + 1) * GRID_WIDTH + x]) {
					grid[i].y = 0;
					grid[i].vy = 0;
					grid[i].vx /= FRICTION;
				} else {
					grid[i].y -= 1;
					grid[(y + 1) * GRID_WIDTH + x] = grid[i];
					grid[i] = null;
				}
			}
		}
	}
}

function moveUp () {
	var x, y, i;
	for (y = 0; y < GRID_HEIGHT; y++) {
		for (x = 0; x < GRID_WIDTH; x++) {
			i = y * GRID_WIDTH + x;
			if (grid[i] && grid[i].y < -0.5) {
				if (y === 0 || grid[(y - 1) * GRID_WIDTH + x]) {
					grid[i].y = 0;
					grid[i].vy = 0;
					grid[i].vx /= FRICTION;
				} else {
					grid[i].y += 1;
					grid[(y - 1) * GRID_WIDTH + x] = grid[i];
					grid[i] = null;
				}
			}
		}
	}
}

function moveLeft () {
	var x, y, i;
	for (x = 0; x < GRID_WIDTH; x++) {
		for (y = 0; y < GRID_HEIGHT; y++) {
			i = y * GRID_WIDTH + x;
			if (grid[i] && grid[i].x < -0.5) {
				if (x === 0 || grid[y * GRID_WIDTH + x - 1]) {
					grid[i].x = 0;
					grid[i].vx = 0;
				} else {
					grid[i].x += 1;
					grid[y * GRID_WIDTH + x - 1] = grid[i];
					grid[i] = null;
				}
			}
		}
	}
}

function moveRight () {
	var x, y, i;
	for (x = GRID_WIDTH - 1; x >= 0; x--) {
		for (y = 0; y < GRID_HEIGHT; y++) {
			i = y * GRID_WIDTH + x;
			if (grid[i] && grid[i].x > 0.5) {
				if (x === GRID_WIDTH - 1 || grid[y * GRID_WIDTH + x + 1]) {
					grid[i].x = 0;
					grid[i].vx = 0;
				} else {
					grid[i].x -= 1;
					grid[y * GRID_WIDTH + x + 1] = grid[i];
					grid[i] = null;
				}
			}
		}
	}
}

function isDone () {
	var x, y, i;
	for (x = 0; x < GRID_WIDTH; x++) {
		for (y = 0; y < GRID_HEIGHT; y++) {
			i = y * GRID_WIDTH + x;
			if (y >= H && !grid[i]) {
				return false;
			}
		}
	}
	return true;
}

function move (dt) {
	var i;
	for (i = 0; i < grid.length; i++) {
		if (grid[i]) {
			grid[i].x += dt * grid[i].vx;
			grid[i].y += dt * grid[i].vy;
			grid[i].vy += dt * GRAVITY;
		}
	}
	moveDown();
	moveUp();
	moveLeft();
	moveRight();
	return isDone();
}

function draw (canvas) {
	var x, y, i;
	canvas.fillStyle = bgGradient;
	canvas.fillRect(0, 0, GRID_WIDTH * D, GRID_HEIGHT * D);
	for (x = 0; x < GRID_WIDTH; x++) {
		for (y = 0; y < GRID_HEIGHT; y++) {
			i = y * GRID_WIDTH + x;
			if (grid[i]) {
				canvas.drawImage(earthSprite, x * D, y * D);
			}
		}
	}
}

function initGrid (d) {
	var x, y, i;
	grid = [];
	for (x = 0; x < GRID_WIDTH; x++) {
		for (y = 0; y < GRID_HEIGHT; y++) {
			i = y * GRID_WIDTH + x;
			if (y >= H + (d[x - Math.floor((GRID_WIDTH - d.length) / 2)] || 0)) {
				grid[i] = {x: 0, y: 0, vx: 0, vy: 0};
			}
		}
	}
}

function onMousedown (x, y, e) {
	lastPos = {
		x: x,
		y: y,
		t: e.timeStamp
	};
	e.target.className = 'grabbing';
}

function onMousemove (x, y, e) {
	if (!e.buttons && !e.touches) {
		lastPos = false;
		e.target.className = 'grab';
	}
	if (!lastPos) {
		return;
	}
	var nextPos = {
		x: x,
		y: y,
		t: e.timeStamp
	},
	dx = nextPos.x - lastPos.x,
	dy = Math.min(0, nextPos.y - lastPos.y), //ignore downwards movement
	dt = nextPos.t - lastPos.t,
	i = Math.floor(nextPos.y / D) * GRID_WIDTH + Math.max(0, Math.min(GRID_WIDTH - 1, Math.floor(nextPos.x / D)));

	if (!grid[i]) { //empty, assume the element just below was meant
		i += GRID_WIDTH;
	} else if (grid[i - GRID_WIDTH] && grid[i + (dx > 0 ? 1 : -1)]) { //full neighbour, assume the element just above was meant
		i -= GRID_WIDTH;
	}

	if (dt && grid[i]) {
		if (grid[i].vy > 0) { //remove effect of gravity
			grid[i].vy = 0;
			grid[i].y = 0;
		}
		grid[i].vx += dx / dt * V;
		grid[i].vy += dy / dt * V;
	}

	lastPos = nextPos;
}

function onMouseup (e) {
	lastPos = false;
	e.target.className = 'grab';
}

function l1 () {
	initGrid([-1, -2, -1, 0, 1, 2, 1]);
}

function l2 () {
	initGrid([3, 3, 0, -1, -2, -2, -2, -2, -2, -1, 0, 3, 3]);
}

function l3 () {
	initGrid([-1, -2, -1, 0, 3, 4, 2, 0, 1, 2, 1, -2, -4, -3]);
}

function l4 () {
	initGrid([-1, -2, -1, -1, -1, -2, -1, 0, 1, 2, 3, 4, 3, 2, 1, 0, -1, -2, -1, -1, -2]);
}

function l5 () {
	initGrid([4, 4, 0, 0, 0, -1, 0, 0, -2, -3, 0, -1, -1]);
}

return {
	title: 'Earth',
	cursor: 'grab',
	init: init,
	w: GRID_WIDTH * D,
	h: GRID_HEIGHT * D,
	update: move,
	draw: draw,
	onMousedown: onMousedown,
	onMousemove: onMousemove,
	onMouseup: onMouseup,
	level: [l1, l2, l3, l4, l5]
};

})();