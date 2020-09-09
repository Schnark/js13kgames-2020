/*global air: true*/
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

})();