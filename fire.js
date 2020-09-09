/*global fire: true*/
fire =
(function () {
"use strict";

var HEIGHT = 400, //height of canvas
	WIDTH = 1000, //width of canvas
	MAX_FLAME = 110,
	WARN_FLAME = 90,
	MIN_FLAME = 10,
	FLAME_DIFF = 20,
	SHUTDOWN_TIME = 5,
	OIL = 5000,

	oil, flame, shutdown,
	flameCanvas, animateFlame, bgPattern,
	isPressed;

function initFlame () {
	//based on http://fabiensanglard.net/doom_fire_psx/
	var WIDTH = 80, HEIGHT = 80,
		ctx, imageData, flame = [], color;

	flameCanvas = document.createElement('canvas');
	flameCanvas.width = WIDTH;
	flameCanvas.height = HEIGHT;
	ctx = flameCanvas.getContext('2d');
	imageData = ctx.createImageData(WIDTH, HEIGHT);
	color = [
		0x07, 0x07, 0x07,
		0x1F, 0x07, 0x07,
		0x2F, 0x0F, 0x07,
		0x47, 0x0F, 0x07,
		0x57, 0x17, 0x07,
		0x67, 0x1F, 0x07,
		0x77, 0x1F, 0x07,
		0x8F, 0x27, 0x07,
		0x9F, 0x2F, 0x07,
		0xAF, 0x3F, 0x07,
		0xBF, 0x47, 0x07,
		0xC7, 0x47, 0x07,
		0xDF, 0x4F, 0x07,
		0xDF, 0x57, 0x07,
		0xDF, 0x57, 0x07,
		0xD7, 0x5F, 0x07,
		0xD7, 0x5F, 0x07,
		0xD7, 0x67, 0x0F,
		0xCF, 0x6F, 0x0F,
		0xCF, 0x77, 0x0F,
		0xCF, 0x7F, 0x0F,
		0xCF, 0x87, 0x17,
		0xC7, 0x87, 0x17,
		0xC7, 0x8F, 0x17,
		0xC7, 0x97, 0x1F,
		0xBF, 0x9F, 0x1F,
		0xBF, 0x9F, 0x1F,
		0xBF, 0xA7, 0x27,
		0xBF, 0xA7, 0x27,
		0xBF, 0xAF, 0x2F,
		0xB7, 0xAF, 0x2F,
		0xB7, 0xB7, 0x2F,
		0xB7, 0xB7, 0x37,
		0xCF, 0xCF, 0x6F,
		0xDF, 0xDF, 0x9F,
		0xEF, 0xEF, 0xC7,
		0xFF, 0xFF, 0xFF
	];

	function init () {
		var i;
		for (i = 0; i < WIDTH * HEIGHT; i++) {
			flame[i] = 0;
		}
		for (i = 0; i < WIDTH; i++) {
			flame[(HEIGHT - 1) * WIDTH + i] = 36;
		}
		for (i = 0; i < HEIGHT; i++) {
			spreadFire();
		}
	}

	function spreadOne (i) {
		var pixel = flame[i], rand;
		if (pixel === 0) {
			flame[i - WIDTH] = 0;
		} else {
			rand = Math.floor(Math.random() * 3) - 1;
			flame[i + rand - WIDTH] = pixel - Math.floor(Math.random() * 2);
		}
	}

	function spreadFire () {
		var x, y;
		for (x = 0; x < WIDTH; x++) {
			for (y = 1; y < HEIGHT; y++) {
				spreadOne(y * WIDTH + x);
			}
		}
	}

	function show () {
		var x, y, i;
		for (x = 0; x < WIDTH; x++) {
			for (y = 0; y < HEIGHT; y++) {
				i = WIDTH * y + x;
				imageData.data[4 * i] = color[3 * flame[i]];
				imageData.data[4 * i + 1] = color[3 * flame[i] + 1];
				imageData.data[4 * i + 2] = color[3 * flame[i] + 2];
				imageData.data[4 * i + 3] = flame[i] <= 5 ? flame[i] * 50 : 255;
			}
		}
		ctx.putImageData(imageData, 0, 0);
	}

	function animateFlame () {
		spreadFire();
		show();
	}

	init();

	return animateFlame;
}

function init (canvas) {
	var bgCanvas, ctx;
	oil = OIL;
	flame = 0;
	shutdown = 0;
	isPressed = false;

	animateFlame = initFlame();

	bgCanvas = document.createElement('canvas');
	bgCanvas.width = 80;
	bgCanvas.height = 80;
	ctx = bgCanvas.getContext('2d');
	ctx.fillStyle = '#fa8';
	ctx.fillRect(0, 0, 80, 80);
	ctx.strokeStyle = '#a86';
	ctx.beginPath();
	ctx.moveTo(0, 0);
	ctx.lineTo(80, 0);
	ctx.lineTo(80, 40);
	ctx.lineTo(0, 40);
	ctx.lineTo(0, 0);
	ctx.moveTo(40, 40);
	ctx.lineTo(40, 80);
	ctx.stroke();
	bgPattern = canvas.createPattern(bgCanvas, 'repeat');
}

function burn (dt, incDec) {
	if (shutdown > 0) {
		shutdown -= dt;
		if (shutdown >= 0) {
			return;
		}
		dt = -shutdown;
		shutdown = 0;
	}
	oil -= flame * dt;
	if (oil <= 0) {
		return true;
	}
	flame += FLAME_DIFF * dt * incDec;
	if (flame >= MAX_FLAME) {
		shutdown = SHUTDOWN_TIME;
		flame = 0;
	} else if (flame < MIN_FLAME) {
		flame = MIN_FLAME;
	}
}

function update (dt) {
	return burn(dt, isPressed ? 1 : -1);
}

function draw (canvas) {
	canvas.fillStyle = bgPattern;
	canvas.fillRect(0, 0, WIDTH, HEIGHT);
	canvas.fillStyle = '#320';
	canvas.beginPath();
	canvas.moveTo(700, 360);
	canvas.lineTo(720, 400);
	canvas.lineTo(100, 400);
	canvas.lineTo(120, 360);
	canvas.closePath();
	canvas.fill();
	canvas.save();
	canvas.beginPath();
	canvas.moveTo(700, 120);
	canvas.quadraticCurveTo(720, 240, 700, 360);
	canvas.lineTo(120, 360);
	canvas.quadraticCurveTo(100, 240, 120, 120);
	canvas.closePath();
	canvas.clip();
	canvas.fillStyle = '#eee';
	canvas.fillRect(0, 0, WIDTH, HEIGHT);
	canvas.fillStyle = '#000';
	canvas.fillRect(0, 360 - 240 * oil / OIL, WIDTH, 400);
	canvas.restore();
	canvas.strokeStyle = '#888';
	canvas.lineWidth = 6;
	canvas.stroke();
	canvas.fillStyle = '#888';
	canvas.beginPath();
	canvas.moveTo(700, 360);
	canvas.lineTo(840, 320);
	canvas.lineTo(800, 320);
	canvas.lineTo(700, 350);
	canvas.closePath();
	canvas.fill();
	if (flame) {
		animateFlame();
		canvas.save();
		canvas.beginPath();
		canvas.moveTo(800, 320);
		canvas.quadraticCurveTo(780, 320 - flame, 810, 320 - 2 * flame);
		canvas.lineTo(830, 320 - 2 * flame);
		canvas.quadraticCurveTo(860, 320 - flame, 840, 320);
		canvas.closePath();
		canvas.clip();
		canvas.drawImage(flameCanvas, 780, 320 - 2 * flame, 80, 2 * flame);
		canvas.restore();
	}
	canvas.fillStyle = '#aaa';
	canvas.fillRect(510, 30, 120, 60);
	canvas.fillStyle = '#888';
	canvas.beginPath();
	canvas.arc(520, 40, 4, 0, 2 * Math.PI);
	canvas.fill();
	canvas.beginPath();
	canvas.arc(620, 40, 4, 0, 2 * Math.PI);
	canvas.fill();
	canvas.beginPath();
	canvas.arc(520, 80, 4, 0, 2 * Math.PI);
	canvas.fill();
	canvas.beginPath();
	canvas.arc(620, 80, 4, 0, 2 * Math.PI);
	canvas.fill();
	canvas.lineWidth = 2;
	if (shutdown > 0 || (flame >= WARN_FLAME && Date.now() % 500 < 250)) {
		canvas.fillStyle = '#fa0';
	} else {
		canvas.fillStyle = '#750';
	}
	canvas.beginPath();
	canvas.arc(544, 60, 20, 0, 2 * Math.PI);
	canvas.fill();
	canvas.stroke();
	if (shutdown > 0 || (flame >= WARN_FLAME && Date.now() % 500 >= 250)) {
		canvas.fillStyle = '#fa0';
	} else {
		canvas.fillStyle = '#750';
	}
	canvas.beginPath();
	canvas.arc(596, 60, 20, 0, 2 * Math.PI);
	canvas.fill();
	canvas.stroke();
	canvas.restore();
}

function onKeydown (e) {
	if (e.keyCode === 32) {
		isPressed = true;
	}
}

function onKeyup (e) {
	if (e.keyCode === 32) {
		isPressed = false;
	}
}

function onMousedown () {
	isPressed = true;
}

function onMouseup () {
	isPressed = false;
}

return {
	title: 'Fire',
	init: init,
	w: WIDTH,
	h: HEIGHT,
	update: update,
	draw: draw,
	onKeydown: onKeydown,
	onKeyup: onKeyup,
	onMousedown: onMousedown,
	onMouseup: onMouseup
};

})();