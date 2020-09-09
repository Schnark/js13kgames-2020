(function(){var showTime, audio, play, air, earth, fire, water;
/*global showTime: true*/
showTime =
(function () {
"use strict";

var ctx, current = [-1, -1, -1],
	ON = '#f00', OFF = '#400';

function init () {
	var canvas = document.getElementById('time');
	ctx = canvas.getContext('2d', {alpha: false});
	ctx.fillRect(0, 0, 79, 40);
	ctx.fillStyle = ON;
	ctx.beginPath();
	ctx.arc(27, 14, 2, 0, 2 * Math.PI);
	ctx.arc(27, 26, 2, 0, 2 * Math.PI);
	ctx.fill();
	ctx.lineWidth = 3;
	ctx.fillStyle = '#000';
}

function drawDigit (x, y, d) {
	var segments = [
		'1110111',
		'0010010',
		'1011101',
		'1011011',
		'0111010',
		'1101011',
		'1101111',
		'1010010',
		'1111111',
		'1111011'
	][d];
	ctx.save();
	ctx.translate(x, y);
	ctx.fillRect(0, 0, 20, 36);

	ctx.strokeStyle = segments[0] === '1' ? ON : OFF;
	ctx.beginPath();
	ctx.moveTo(5, 2);
	ctx.lineTo(15, 2);
	ctx.stroke();

	ctx.strokeStyle = segments[1] === '1' ? ON : OFF;
	ctx.beginPath();
	ctx.moveTo(2, 5);
	ctx.lineTo(2, 15);
	ctx.stroke();

	ctx.strokeStyle = segments[2] === '1' ? ON : OFF;
	ctx.beginPath();
	ctx.moveTo(18, 5);
	ctx.lineTo(18, 15);
	ctx.stroke();

	ctx.strokeStyle = segments[3] === '1' ? ON : OFF;
	ctx.beginPath();
	ctx.moveTo(5, 18);
	ctx.lineTo(15, 18);
	ctx.stroke();

	ctx.strokeStyle = segments[4] === '1' ? ON : OFF;
	ctx.beginPath();
	ctx.moveTo(2, 21);
	ctx.lineTo(2, 31);
	ctx.stroke();

	ctx.strokeStyle = segments[5] === '1' ? ON : OFF;
	ctx.beginPath();
	ctx.moveTo(18, 21);
	ctx.lineTo(18, 31);
	ctx.stroke();

	ctx.strokeStyle = segments[6] === '1' ? ON : OFF;
	ctx.beginPath();
	ctx.moveTo(5, 34);
	ctx.lineTo(15, 34);
	ctx.stroke();

	ctx.restore();
}

function showTime (t) {
	var min = Math.floor(t / 60), sec = t - 60 * min, s0 = Math.floor(sec / 10), s1 = sec % 10;
	if (min !== current[0]) {
		current[0] = min;
		drawDigit(2, 2, min);
	}
	if (s0 !== current[1]) {
		current[1] = s0;
		drawDigit(32, 2, s0);
	}
	if (s1 !== current[2]) {
		current[2] = s1;
		drawDigit(57, 2, s1);
	}
}

init();

return showTime;

})();/*global audio: true*/
/*global AudioContext*/
audio =
(function () {
"use strict";

var TICK = 1 / 3, //up to 1 / 6
	audioContext,
	metronomeOscillator, metronomeGain,
	notesOscillator = [], notesGain = [], noteIndex = 0,
	needsInit = true,
	isMuted = false,
	startTime = -1, lastTime,
	notes = [
		//Auf den Erfinder des Metronoms, (probably) by Anton Schindler,
		//based on the Symphony No. 8 by Ludwig van Beethoven
		['d', 2], null,
		['d', 2], null,
		['d', 2], null,
		['d', 2], null,
		['d', 2], null,
		['d', 2], null,
		['d', 2], null,
		['c#', 1], ['e', 1],
		['d', 2], null,
		['c#', 1], ['e', 1],
		['d', 2], null,
		['c#', 1], ['e', 1], //c?
		['d', 3], null,
		null, ['B', 1],
		['B', 1], ['A', 1],
		['A', 1], ['B', 1],
		['c', 2], null,
		['A', 1], ['B', 1],
		['G', 2], null,
		['G', 2], null,
		null, null,
		null, null
	], freqs = {
		G: 220 * Math.pow(2, -1 / 6),
		A: 220,
		B: 220 * Math.pow(2, 1 / 6),
		c: 220 * Math.pow(2, 1 / 4),
		'c#': 220 * Math.pow(2, 1 / 3),
		d: 220 * Math.pow(2, 5 / 12),
		e: 220 * Math.pow(2, 7 / 12)
	}, factor = 1, tempo = 3,
	checkbox;

function init () {
	needsInit = false;
	if (!window.AudioContext) {
		isMuted = true;
		return;
	}

	checkbox = document.getElementById('audio');
	checkbox.addEventListener('change', onChange);
	onChange();

	audioContext = new AudioContext();
	metronomeOscillator = audioContext.createOscillator();
	notesOscillator[0] = audioContext.createOscillator();
	notesOscillator[1] = audioContext.createOscillator();
	metronomeOscillator.frequency.value = 194;
	notesOscillator[0].type = 'triangle';
	notesOscillator[1].type = 'triangle';
	metronomeGain = audioContext.createGain();
	notesGain[0] = audioContext.createGain();
	notesGain[1] = audioContext.createGain();
	metronomeGain.gain.value = 0;
	notesGain[0].gain.value = 0;
	notesGain[1].gain.value = 0;
	metronomeOscillator.connect(metronomeGain);
	notesOscillator[0].connect(notesGain[0]);
	notesOscillator[1].connect(notesGain[1]);
	metronomeGain.connect(audioContext.destination);
	notesGain[0].connect(audioContext.destination);
	notesGain[1].connect(audioContext.destination);
	metronomeOscillator.start();
	notesOscillator[0].start();
	notesOscillator[1].start();
}

function onChange () {
	isMuted = !checkbox.checked;
	startTime = -1;
}

function start () {
	startTime = audioContext.currentTime;
	lastTime = 0;
	factor = 1;
	TICK = 1 / tempo;
}

function queueMetronome (n) {
	var t = startTime + n * TICK;
	metronomeGain.gain.setValueAtTime(0.01, t);
	metronomeGain.gain.exponentialRampToValueAtTime(0.5, t + 0.1);
	metronomeGain.gain.exponentialRampToValueAtTime(0.01, t + 0.2);
	metronomeGain.gain.setValueAtTime(0, t + 0.3);
}

function queueNote (n, freq, duration) {
	var t = startTime + n * TICK, end = t + duration * TICK;
	notesOscillator[noteIndex].frequency.setValueAtTime(freq, t);
	notesGain[noteIndex].gain.setValueAtTime(0.001, t);
	notesGain[noteIndex].gain.exponentialRampToValueAtTime(0.05, t + 0.05);
	notesGain[noteIndex].gain.linearRampToValueAtTime(0.05, end - 0.1);
	notesGain[noteIndex].gain.exponentialRampToValueAtTime(0.001, end - 0.05);
	notesGain[noteIndex].gain.setValueAtTime(0, end);
	noteIndex = 1 - noteIndex;
}

function queueAudio () {
	var note;
	if (startTime + lastTime * TICK - audioContext.currentTime > 0) {
		return;
	}
	lastTime++;
	if (lastTime % 2 === 1) {
		queueMetronome(lastTime);
	}
	note = notes[(lastTime - 1) % notes.length];
	if (note) {
		queueNote(lastTime, freqs[note[0]] * factor, note[1]);
	}
	if ((lastTime - 1) % notes.length === notes.length - 1) {
		TICK = 1 / tempo;
		factor = Math.pow(2, (Math.floor(3 * Math.random()) - 1) / 12);
	}
}

function handleAudio (newTempo) {
	if (newTempo) {
		tempo = newTempo;
	}
	if (needsInit) {
		init();
	}
	if (isMuted) {
		return;
	}
	if (startTime < 0) {
		start();
	}
	queueAudio();
}

return function (tempo) {
	try {
		handleAudio(tempo);
	} catch (e) {
		//some not really reproducible error when switching on and off fast
	}
};
})();/*global play: true, showTime, audio*/
play =
(function () {
"use strict";

var FADE_DURATION = 300,
	canvas, ctx,
	titleElement, levelElement,
	startTime, prevTime, fadeTime,
	eventHandlers = {},
	scaleFactor,
	rAF = window.requestAnimationFrame || window.mozRequestAnimationFrame;

function init () {
	canvas = document.getElementById('canvas');
	ctx = canvas.getContext('2d', {alpha: false});
	window.addEventListener('keydown', onKeydown);
	window.addEventListener('keyup', onKeyup);
	canvas.addEventListener('mousedown', onMousedown);
	canvas.addEventListener('mousemove', onMousemove);
	canvas.addEventListener('mouseup', onMouseup);
	canvas.addEventListener('touchstart', onTouchstart, {passive: false});
	canvas.addEventListener('touchmove', onTouchmove, {passive: false});
	canvas.addEventListener('touchend', onTouchend);
	canvas.addEventListener('touchcancel', onTouchend);
	canvas.addEventListener('click', onClick);
	window.addEventListener('resize', scale);

	titleElement = document.getElementById('title');
	levelElement = document.getElementById('level');
}

function scale () {
	var docEl = document.documentElement;
	scaleFactor = Math.min(
		1,
		docEl.clientWidth / canvas.width,
		(docEl.clientHeight - 40) / canvas.height //40: height of panel
	);
	canvas.style.width = (canvas.width * scaleFactor) + 'px';
	canvas.style.height = (canvas.height * scaleFactor) + 'px';
}

function onKeydown (e) {
	if (eventHandlers.onKeydown) {
		e.preventDefault();
		eventHandlers.onKeydown(e);
	}
}

function onKeyup (e) {
	if (eventHandlers.onKeyup) {
		eventHandlers.onKeyup(e);
	}
}

function onMousedown (e) {
	if (eventHandlers.onMousedown) {
		e.preventDefault();
		eventHandlers.onMousedown(
			(e.clientX - canvas.offsetLeft) / scaleFactor,
			(e.clientY - canvas.offsetTop) / scaleFactor, e);
	}
}

function onMousemove (e) {
	if (eventHandlers.onMousemove) {
		e.preventDefault();
		eventHandlers.onMousemove(
			(e.clientX - canvas.offsetLeft) / scaleFactor,
			(e.clientY - canvas.offsetTop) / scaleFactor, e);
	}
}

function onMouseup (e) {
	if (eventHandlers.onMouseup) {
		eventHandlers.onMouseup(e);
	}
}

function onTouchstart (e) {
	if (eventHandlers.onMousedown) {
		e.preventDefault();
		eventHandlers.onMousedown(
			(e.changedTouches[0].clientX - canvas.offsetLeft) / scaleFactor,
			(e.changedTouches[0].clientY - canvas.offsetTop) / scaleFactor, e);
	}
}

function onTouchmove (e) {
	if (eventHandlers.onMousemove) {
		e.preventDefault();
		eventHandlers.onMousemove(
			(e.changedTouches[0].clientX - canvas.offsetLeft) / scaleFactor,
			(e.changedTouches[0].clientY - canvas.offsetTop) / scaleFactor, e);
	}
}

function onTouchend (e) {
	if (eventHandlers.onMouseup) {
		eventHandlers.onMouseup(e);
	}
}

function onClick (e) {
	if (eventHandlers.onClick) {
		eventHandlers.onClick(
			(e.clientX - canvas.offsetLeft) / scaleFactor,
			(e.clientY - canvas.offsetTop) / scaleFactor, e);
	}
}

function play (remaining, data, callback) {
	var level, fadeCallback;

	function startFadeout (time, cb) {
		canvas.className = '';
		fadeCallback = cb;
		fadeTime = time;
		rAF(fadeOut);
	}

	function fadeOut (time) {
		var t = time - fadeTime;
		if (t > FADE_DURATION) {
			fadeCallback();
		} else {
			audio();
			data.draw(ctx);
			ctx.fillStyle = 'rgba(0,0,0,' + (t / FADE_DURATION) + ')';
			ctx.fillRect(0, 0, data.w, data.h);
			rAF(fadeOut);
		}
	}

	function update (time) {
		var done, t;
		if (!startTime) {
			startTime = time;
		}
		if (prevTime) {
			done = data.update((time - prevTime) / 1000);
		}
		t = remaining - (time - startTime) / 1000;
		if (t < 0) {
			startFadeout(time, function () {
				callback(-1);
			});
			return;
		}
		audio(7 - Math.ceil(t / 61));
		showTime(Math.ceil(t));
		if (!done) {
			data.draw(ctx);
			prevTime = time;
			rAF(update);
		} else if (level && level < data.level.length) {
			startFadeout(time, function () {
				canvas.className = data.cursor || '';
				data.level[level]();
				level++;
				levelElement.textContent = level + '/' + data.level.length;
				prevTime = false;
				rAF(update);
			});
		} else {
			eventHandlers = {};
			startFadeout(time, function () {
				callback(t);
			});
		}
	}

	startTime = false;
	prevTime = false;
	fadeTime = false;
	canvas.width = data.w;
	canvas.height = data.h;
	canvas.className = data.cursor || '';
	scale();
	if (data.level) {
		data.level[0]();
		level = 1;
	}
	titleElement.textContent = data.title;
	levelElement.textContent = level ? level + '/' + data.level.length : '';
	if (data.init) {
		data.init(ctx);
	}
	eventHandlers = data;
	rAF(update);
}

init();

return play;
})();/*global air: true*/
air =
(function () {
"use strict";

var HEIGHT = 320, //height of canvas
	WIDTH = 640, //width of canvas
	TOTAL = 10000, //total width
	BG_HEIGHT = 32, //height of background
	PLANE_SIZE = 10, //radius of plane
	PLANE_X = 45,
	PLANE_Y = 20,
	MAX_V = 200, //max velocity (pixel/second)
	VERTICAL = 0.5, //vertical speed (rel. to horizontal)
	ACCL = 40, //accelleration
	MAX_ADVANCE = 60, //how far to advance the plane in max. speed
	CLOUD_TIME = 0.1, //wait time when you hit a cloud
	INDICATOR = 100, //length of progress indicator

	bgGradient, bgSprite, planeSprite,
	posX, posY, v,
	cloud,
	clouds,
	dirKey;

function testD (x0, y0, x1, y1, r) {
	return (x0 - x1) * (x0 - x1) + (y0 - y1) * (y0 - y1) <= r * r;
}

function fillCircle (ctx, x, y, r) {
	ctx.beginPath();
	ctx.arc(x, y, r, 0, 2 * Math.PI);
	ctx.fill();
}

function addTinyCloud (x, y) {
	var d = Math.floor(2 * Math.random());
	clouds.push([{x: x, y: y, r: 7 - d}, {x: x + 6 + d, y: y - 5, r: 3}, {x: x + 10, y: y + 1, r: 6 + d}]);
}

function addCloud (x, y) {
	var d = Math.floor(2 * Math.random());
	clouds.push([{x: x, y: y, r: 14 - d}, {x: x + 12 + d, y: y - 10, r: 6}, {x: x + 20, y: y + 2, r: 12 + d}]);
}

function addLargeCloud (x, y) {
	var d = Math.floor(2 * Math.random());
	clouds.push([{x: x, y: y, r: 12 - d}, {x: x + 14 + d, y: y - 8, r: 8 + d},
		{x: x + 20, y: y + 4, r: 10 - d}, {x: x + 30, y: y, r: 8 + d}]);
}

function addCloudLine (x0, y, dx, dy) {
	var x = x0;
	while (x < x0 + dx) {
		addCloud(x, y + Math.floor(21 * Math.random()) - 10 + Math.round((x - x0) / dx * dy));
		x += 55 + Math.floor(10 * Math.random());
	}
}

/*function addCloudBank (x0, y0, w, h) {
	var x = x0, y = y0;
	while (x < x0 + w) {
		while (y < y0 + h) {
			addTinyCloud(x + Math.floor(51 * Math.random()) - 25, y + Math.floor(31 * Math.random()) - 15);
			y += 60 + Math.floor(20 * Math.random());
		}
		y = y0;
		x += 100 + Math.floor(20 * Math.random());
	}
}*/

function addCloudCluster (x0, w) {
	var i;
	for (i = 0; i < (HEIGHT - BG_HEIGHT) / 30; i++) {
		addCloud(x0 + Math.round(Math.random() * w), i * 30 + 10 + Math.floor(5 * Math.random()));
	}
}

function init (canvas) {
	var ctx, x, y;

	bgGradient = canvas.createLinearGradient(0, 0, 0, HEIGHT);
	bgGradient.addColorStop(0, '#55f');
	bgGradient.addColorStop(1, '#aaf');

	bgSprite = document.createElement('canvas');
	bgSprite.height = BG_HEIGHT;
	bgSprite.width = WIDTH + 1;
	ctx = bgSprite.getContext('2d');
	ctx.beginPath();
	ctx.moveTo(0, BG_HEIGHT / 2);
	y = BG_HEIGHT / 2;
	for (x = 1; x <= WIDTH + 1; x++) {
		y += Math.round(Math.random() * 2 - 1 - (y - BG_HEIGHT / 2) / (BG_HEIGHT / 2));
		y = Math.min(BG_HEIGHT, Math.max(0, y));
		if (Math.abs(y - (BG_HEIGHT / 2)) >= WIDTH + 1 - x) {
			y += Math.round(((BG_HEIGHT / 2) - y) / 3);
		}
		ctx.lineTo(x, y);
	}
	ctx.lineTo(x, BG_HEIGHT);
	ctx.lineTo(0, BG_HEIGHT);
	ctx.closePath();
	ctx.fill();

	planeSprite = document.createElement('canvas');
	planeSprite.height = 30;
	planeSprite.width = 65;
	ctx = planeSprite.getContext('2d');
	ctx.fillStyle = '#aaf';
	fillCircle(ctx, 45, 20, 10); //= PLANE_X, PLANE_Y, PLANE_SIZE
	ctx.beginPath();
	ctx.moveTo(55, 20);
	ctx.quadraticCurveTo(60, 20, 65, 30);
	ctx.lineTo(25, 30);
	ctx.lineTo(5, 20);
	ctx.lineTo(0, 0);
	ctx.lineTo(5, 0);
	ctx.lineTo(12, 10);
	ctx.lineTo(45, 10);
	ctx.quadraticCurveTo(45, 20, 55, 20);
	ctx.fillStyle = '#fff';
	ctx.fill();
	ctx.moveTo(7, 18);
	ctx.bezierCurveTo(2, 20, 22, 20, 12, 18);
	ctx.moveTo(30, 25);
	ctx.bezierCurveTo(20, 30, 50, 30, 40, 25);
	ctx.stroke();
	ctx.fillStyle = '#f00';
	ctx.fillText('404', 25, 22);

	posX = 0;
	posY = HEIGHT / 2;
	v = 0;
	cloud = 0;
	dirKey = 0;

	clouds = [];
	addTinyCloud(320, 100);
	addCloud(350, 200);
	addCloud(500, 160);
	addCloud(600, 180);
	addCloud(700, 160);
	addCloud(750, 200);
	addCloud(800, 290);
	addCloud(820, 100);
	addCloud(850, 150);
	addLargeCloud(870, 180);
	addCloud(900, 150);
	addCloud(950, 120);

	addCloudCluster(1000, 800);
	addCloudCluster(1800, 700);

	addCloudCluster(2500, 800);

	addCloudLine(3500, 10, 250, 130);
	addCloudLine(3800, 140, 1000, -130);
	addCloudLine(3600, 280, 1200, -150);
	addCloudLine(4850, 10, 800, 220);
	addCloudLine(5700, 230, 100, 0);
	addCloudLine(4850, 150, 750, 150);

	addTinyCloud(6150, 160);
	addTinyCloud(6205, 180);

	addCloudLine(6500, 160, 2200, 0);
	addCloud(6600, 70);
	addCloud(6650, 100);
	addCloud(6690, 30);
	addCloud(7000, 80);
	addTinyCloud(7500, 30);
	addLargeCloud(7700, 40);
	addCloud(8000, 80);
	addTinyCloud(8100, 90);

	addCloud(8480, 250);
	addCloud(8500, 200);
	addCloud(8505, 290);
	addCloud(8570, 230);
	addCloud(8600, 200);
	addCloud(8680, 245);
	addCloud(8700, 205);
	addCloud(8705, 285);
	addCloud(8770, 235);
	addCloud(8800, 205);
	addCloud(8810, 292);

	addCloudCluster(8850, 1000);

	addCloud(9900, 180);
}

function update (dt) {
	return move(dt, dirKey);
}

function move (dt, upDown) {
	var i, j;
	if (cloud > 0) {
		cloud -= dt;
		if (cloud >= 0) {
			return;
		}
		dt = -cloud;
		cloud = 0;
	}

	posX += v * dt;
	posY += v * dt * VERTICAL * upDown;
	if (posY < 2 * PLANE_SIZE) {
		posY = 2 * PLANE_SIZE;
	} else if (posY > HEIGHT - PLANE_SIZE - BG_HEIGHT) {
		posY = HEIGHT - PLANE_SIZE - BG_HEIGHT;
	}
	if (posX >= TOTAL) {
		return true;
	}

	v += ACCL * dt;
	if (v > MAX_V) {
		v = MAX_V;
	}

	for (i = 0; i < clouds.length; i++) {
		for (j = 0; j < clouds[i].length; j++) {
			if (testD(clouds[i][j].x, clouds[i][j].y, posX, posY, clouds[i][j].r + PLANE_SIZE)) {
				for (j = 0; j < clouds[i].length; j++) {
					cloud += clouds[i][j].r;
				}
				cloud *= CLOUD_TIME;
				v = 0;
				clouds.splice(i, 1);
				return;
			}
		}
	}
}

function draw (canvas) {
	var start, i, j;
	canvas.fillStyle = cloud > 0 ? '#eef' : bgGradient;
	canvas.fillRect(0, 0, WIDTH, HEIGHT);
	if (cloud > 0) {
		canvas.save();
		canvas.translate(
			WIDTH / 2 - PLANE_X * 3 * Math.sin(cloud * Math.PI * 1.1),
			HEIGHT / 2 - PLANE_Y * 3 * Math.cos(cloud * Math.PI * 0.9)
		);
		canvas.scale(1.5, 1.5);
		canvas.rotate(cloud * Math.PI);
		canvas.drawImage(planeSprite, 0, 0);
		canvas.restore();
		return;
	}
	start = posX - MAX_ADVANCE * v / MAX_V - PLANE_X;
	canvas.drawImage(bgSprite, -(start + WIDTH) % WIDTH, HEIGHT - BG_HEIGHT);
	canvas.drawImage(bgSprite, WIDTH + (-(start + WIDTH) % WIDTH), HEIGHT - BG_HEIGHT);
	canvas.save();
	canvas.translate(posX - start, posY);
	canvas.rotate(dirKey * 0.2);
	canvas.drawImage(planeSprite, -PLANE_X, -PLANE_Y);
	canvas.restore();
	canvas.fillStyle = '#eef';
	for (i = 0; i < clouds.length; i++) {
		for (j = 0; j < clouds[i].length; j++) {
			fillCircle(canvas, clouds[i][j].x - start, clouds[i][j].y, clouds[i][j].r);
		}
	}
	canvas.lineWidth = 1;
	canvas.strokeStyle = 'black';
	canvas.beginPath();
	canvas.moveTo(5, 5);
	canvas.lineTo(5, 15);
	canvas.moveTo(INDICATOR + 5, 5);
	canvas.lineTo(INDICATOR + 5, 15);
	canvas.moveTo(5, 10);
	canvas.lineTo(INDICATOR + 5, 10);
	canvas.stroke();
	canvas.fillStyle = 'red';
	fillCircle(canvas, 5 + posX / TOTAL * INDICATOR, 10, 2);

	if (TOTAL - start < WIDTH) {
		canvas.beginPath();
		canvas.moveTo(TOTAL - start, HEIGHT - 3 * BG_HEIGHT);
		canvas.lineTo(TOTAL - start, HEIGHT);
		canvas.stroke();
	}
}

function onKeydown (e) {
	if (e.key === 'ArrowUp' || e.keyCode === 38) {
		dirKey = -1;
	} else if (e.key === 'ArrowDown' || e.keyCode === 40) {
		dirKey = 1;
	} else {
		dirKey = 0;
	}
}

function onKeyup () {
	dirKey = 0;
}

function onMousedown (ex, ey) {
	if (ey >= posY) {
		dirKey = 1;
	} else {
		dirKey = -1;
	}
}

function onMouseup () {
	dirKey = 0;
}

return {
	title: 'Air',
	w: WIDTH,
	h: HEIGHT,
	init: init,
	update: update,
	draw: draw,
	onKeydown: onKeydown,
	onKeyup: onKeyup,
	onMousedown: onMousedown,
	onMouseup: onMouseup
};

})();/*global earth: true*/
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

})();/*global fire: true*/
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

})();/*global water: true*/
water =
(function () {
"use strict";

var HEIGHT = 280,
	WIDTH = 680,
	BUCKET = 170,
	POUR = 5,
	buckets, //total, current, desired
	selected = -1, pouring = false;

function isSolved () {
	var i;
	for (i = 0; i < buckets.length; i++) {
		if (buckets[i][1] !== buckets[i][2] && buckets[i][2] >= 0) {
			return false;
		}
	}
	return true;
}

function pour (from, to) {
	var d = Math.min(buckets[from][1], buckets[to][0] - buckets[to][1]);
	pouring = {from: from, to: to, d: d};
}

function select (b) {
	if (b === selected) {
		selected = -1;
	} else if (selected === -1) {
		selected = b;
	} else {
		pour(selected, b);
		selected = -1;
	}
}

function animate (dt) {
	var d;
	if (pouring) {
		d = Math.min(dt * POUR, pouring.d);
		buckets[pouring.from][1] -= d;
		buckets[pouring.to][1] += d;
		pouring.d -= d;
		if (pouring.d === 0) {
			buckets[pouring.from][1] = Math.round(buckets[pouring.from][1]);
			buckets[pouring.to][1] = Math.round(buckets[pouring.to][1]);
			pouring = false;
			return isSolved();
		}
	}
}

function bucketPos (i) {
	return (WIDTH - buckets.length * BUCKET) / 2 + (i + 0.5) * BUCKET;
}

function drawBucket (ctx, x, y, size, water, backFront) {
	var f = Math.pow(size, 1 / 3), w = water / size;
	ctx.save();
	ctx.translate(x, y);
	ctx.scale(f, f);
	ctx.lineWidth = 4 / f;

	if (backFront) {
		ctx.strokeStyle = '#bbb';
		ctx.beginPath();
		ctx.moveTo(-30, -60);
		ctx.bezierCurveTo(-70, -40, 70, -40, 30, -60);
		ctx.stroke();

		ctx.strokeStyle = '#fa0';
		ctx.beginPath();
		ctx.moveTo(-20, 0);
		ctx.lineTo(-30, -60);
		ctx.quadraticCurveTo(0, -70, 30, -60);
		ctx.lineTo(20, 0);
		ctx.closePath();
		ctx.fillStyle = '#ff0';
		ctx.fill();
		ctx.stroke();
	} else {
		if (water) {
			ctx.beginPath();
			ctx.moveTo(-20, 0);
			ctx.lineTo(-20 - 10 * w, -60 * w);
			ctx.quadraticCurveTo(0, -70 * w, 20 + 10 * w, -60 * w);
			ctx.lineTo(20, 0);
			ctx.closePath();
			ctx.fillStyle = '#00f';
			ctx.fill();
		}

		ctx.strokeStyle = '#fa0';
		ctx.beginPath();
		ctx.moveTo(-20, 0);
		ctx.lineTo(-30, -56);
		ctx.quadraticCurveTo(0, -46, 30, -56);
		ctx.lineTo(20, 0);
		ctx.closePath();
		ctx.fillStyle = 'rgba(256,256,0,0.7)';
		ctx.fill();
		ctx.stroke();

		ctx.fillStyle = '#f00';
		ctx.fillText(size, 0, -20);
	}

	ctx.restore();
}

function draw (canvas) {
	var a, b, i, pos;
	canvas.textAlign = 'center';
	canvas.font = '20px sans-serif';
	canvas.fillStyle = '#fff';
	canvas.fillRect(0, 0, WIDTH, HEIGHT);
	for (i = 0; i < buckets.length; i++) {
		pos = bucketPos(i);
		drawBucket(canvas, pos, 200, buckets[i][0], buckets[i][1], true);
	}
	if (pouring) {
		canvas.lineWidth = 8;
		canvas.strokeStyle = '#00f';
		a = bucketPos(Math.min(pouring.from, pouring.to));
		b = bucketPos(Math.max(pouring.from, pouring.to));
		canvas.beginPath();
		canvas.moveTo(a, 200);
		canvas.bezierCurveTo(a, (BUCKET - Math.abs(a - b)) / 3, b, (BUCKET - Math.abs(a - b)) / 3, b, 200);
		canvas.stroke();
	} else {
		canvas.fillStyle = '#000';
		canvas.fillText(selected === -1 ? 'Select first bucket' : 'Select second bucket', WIDTH / 2, 40);
	}
	for (i = 0; i < buckets.length; i++) {
		pos = bucketPos(i);
		drawBucket(canvas, pos, 200, buckets[i][0], buckets[i][1], false);
		canvas.fillStyle = '#00f';
		canvas.fillText(Math.round(10 * buckets[i][1]) / 10, pos, 230);
		canvas.fillStyle = '#000';
		if (buckets[i][2] >= 0) {
			canvas.fillText(buckets[i][2], pos, 255);
		}
		if (i === selected) {
			canvas.fillStyle = '#080';
			canvas.fillRect(pos - 70, 205, 140, 5);
		}
	}
}

function getBucketFromPoint (x, y) {
	var i;
	if (y < 40 || y > 200) {
		return -1;
	}
	i = Math.floor((x - (WIDTH - buckets.length * BUCKET) / 2) / BUCKET);
	if (i >= 0 && i < buckets.length) {
		return i;
	}
	return -1;
}

function onMousemove (x, y, e) {
	e.target.className = getBucketFromPoint(x, y) >= 0 ? 'pointer' : '';
}

function onClick (x, y) {
	var i;
	if (pouring) {
		return;
	}
	i = getBucketFromPoint(x, y);
	if (i >= 0) {
		select(i);
	}
}

function l1 () {
	//Albert von Stade: Annales Stadenses
	buckets = [[8, 8, 4], [3, 0, 0], [5, 0, 4]];
}

function l2 () {
	buckets = [[2, 0, 1], [4, 4, 1], [3, 0, 1], [1, 0, 1]];
}

function l3 () {
	buckets = [[3, 0, 3], [5, 0, 1], [6, 6, 2]];
}

function l4 () {
	//Henry Ernest Dudeney: Amusements in Mathematics, 365
	buckets = [[10, 10, -1], [10, 10, -1], [5, 0, 3], [4, 0, 3]];
/*
10-quart.  10-quart.  5-quart.  4-quart.
	10  ..  10  ..  0  ..  0
	5  ..  10  ..  5  ..  0
	5  ..  10  ..  1  ..  4
	9  ..  10  ..  1  ..  0
	9  ..  6  ..  1  ..  4
	9  ..  7  ..  0  ..  4
	9  ..  7  ..  4  ..  0
	9  ..  3  ..  4  ..  4
	9  ..  3  ..  5  ..  3
	9  ..  8  ..  0  ..  3
	4  ..  8  ..  5  ..  3
	4  ..  10  ..  3  ..  3
*/
}

return {
	title: 'Water',
	w: WIDTH,
	h: HEIGHT,
	update: animate,
	draw: draw,
	onMousemove: onMousemove,
	onClick: onClick,
	level: [l1, l2, l3, l4]
};

})();/*global play, air, earth, fire, water*/
(function () {
"use strict";

var remainingTime = 4 * 60 + 4,
	playedGames = 0,
	didRetry = false,
	prevTime, prevGame,
	visibleSection = document.getElementById('intro'),
	gameSection = document.getElementById('game'),
	introSections = [
		document.getElementById('intro-air'),
		document.getElementById('intro-earth'),
		document.getElementById('intro-water'),
		document.getElementById('intro-fire')
	],
	outroSections = [
		document.getElementById('outro-fail'),
		document.getElementById('outro-fail-retry'),
		document.getElementById('outro-win'),
		document.getElementById('outro-next'),
		document.getElementById('outro-next-retry')
	];

function init () {
	var buttons = document.getElementsByTagName('button'), i;
	for (i = 0; i < buttons.length; i++) {
		buttons[i].addEventListener('click', onButtonClick);
	}
}

function makeEasy () {
	outroSections[2] = document.getElementById('outro-win-easy');
	earth.level.length = 3;
	water.level.length = 3;
}

function enterFullscreen () {
	var el = document.documentElement;
	if (el.requestFullscreen) {
		el.requestFullscreen();
	} else if (el.webkitRequestFullscreen) {
		el.webkitRequestFullscreen();
	} else if (el.mozRequestFullScreen) {
		el.mozRequestFullScreen();
	} else if (el.msRequestFullscreen) {
		el.msRequestFullscreen();
	}
}

function onButtonClick (e) {
	var action = e.target.dataset.action;
	if (!action) {
		return;
	}
	switch (action) {
	case 'skip':
		document.documentElement.className = 'skip';
		break;
	case 'easy':
		makeEasy();
		/*falls through*/
	case 'intro':
		showGameIntro();
		return;
	case 'retry':
		retryGame();
		return;
	case 'reload':
		location.reload();
		return;
	case 'air':
		playGame(air);
		return;
	case 'earth':
		playGame(earth);
		return;
	case 'water':
		playGame(water);
		return;
	case 'fire':
		playGame(fire);
		return;
	}
}

function formatTime (time) {
	var min = Math.floor(time / 60), sec = time - 60 * min;
	return min + ':' + (sec < 10 ? '0' : '') + sec;
}

function showSection (section) {
	visibleSection.hidden = true;
	section.hidden = false;
	visibleSection = section;
	window.scrollTo(0, 0);
}

function showGameIntro () {
	if (playedGames === 0 && Math.min(document.documentElement.clientWidth, document.documentElement.clientHeight) < 512) {
		enterFullscreen();
	}
	showSection(introSections[playedGames]);
}

function showFail () {
	showSection(outroSections[0]);
}

function showFailRetry () {
	showSection(outroSections[1]);
}

function showWin (time) {
	outroSections[2].getElementsByClassName('time')[0].innerHTML = formatTime(time);
	showSection(outroSections[2]);
}

function showNext (time) {
	outroSections[3].getElementsByClassName('time')[0].innerHTML = formatTime(time);
	outroSections[3].getElementsByClassName('remaining')[0].innerHTML = formatTime(Math.floor(remainingTime));
	showSection(outroSections[3]);
}

function showNextRetry (time) {
	outroSections[4].getElementsByClassName('time')[0].innerHTML = formatTime(time);
	outroSections[4].getElementsByClassName('remaining')[0].innerHTML = formatTime(Math.floor(remainingTime));
	showSection(outroSections[4]);
}

function canRetry () {
	return !didRetry && (
		(document.monetization && document.monetization.state === 'started') ||
		location.search === '?monetization-cheater'
	);
}

function playGame (game) {
	prevTime = remainingTime;
	prevGame = game;
	showSection(gameSection);
	document.documentElement.style.backgroundColor = '#000';
	play(remainingTime, game, onGameEnd);
}

function retryGame () {
	didRetry = true;
	playedGames--;
	remainingTime = prevTime;
	playGame(prevGame);
}

function onGameEnd (time) {
	var dur;
	document.documentElement.style.backgroundColor = '';
	remainingTime = time;
	playedGames++;
	if (time < 0) {
		if (canRetry()) {
			showFailRetry();
		} else {
			showFail();
		}
	} else {
		dur = Math.floor(prevTime) - Math.floor(remainingTime);
		if (playedGames === 4) {
			showWin(4 * 60 + 4 - Math.floor(remainingTime));
		} else if (canRetry()) {
			showNextRetry(dur);
		} else {
			showNext(dur);
		}
	}
}

init();

})();})()
