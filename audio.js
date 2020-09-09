/*global audio: true*/
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
})();