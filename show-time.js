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

})();