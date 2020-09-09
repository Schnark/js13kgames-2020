/*global play, air, earth, fire, water*/
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

})();