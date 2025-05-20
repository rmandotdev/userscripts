// ==UserScript==
//
// @name            AutoLowDetailMode
// @namespace       roman.is-a.dev
//
// @match           https://g.wildwest.gg/g/69ea5b13-c66a-4cfa-9714-f120ae6810b9
//
// @version         1.0
// @author          GameRoMan
// @description     Automatically enables Low Detail Mode in RNGame
//
// @downloadURL     https://roman.is-a.dev/userscripts/wild-west/users/hypoor/rngame/AutoLowDetailMode/index.user.js
// @updateURL       https://roman.is-a.dev/userscripts/wild-west/users/hypoor/rngame/AutoLowDetailMode/index.user.js
//
// @supportURL      https://roman.is-a.dev/discord
// @homepageURL     https://roman.is-a.dev/discord
//
// @license         MIT
//
// ==/UserScript==


(function() {
	document.getElementById('low-detail-mode-checkbox').checked = true;
	document.body.classList.add('low-detail-mode');

	function saveLowDetailMode(save_data) {
		const saveLowDetailModeEvent = {
			type: 'RESPONSE_LOAD_GAME_EVENT',
			save_data: {
				...save_data,
				lowDetailMode: true,
			}
		};

		window.postMessage(saveLowDetailModeEvent, '*');
	}

	window.addEventListener('message', (event) => {
		if (event.origin.includes('g.')) return;
		if (event.data.type !== 'RESPONSE_LOAD_GAME_EVENT') return;

		saveLowDetailMode(event.data.save_data);
	});
})();
