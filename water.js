/*global water: true*/
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

})();