/*global play: true, showTime, audio*/
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
})();