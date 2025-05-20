// ==UserScript==
//
// @name            HideOddsDisplay
// @namespace       roman.is-a.dev
//
// @match           https://g.wildwest.gg/g/69ea5b13-c66a-4cfa-9714-f120ae6810b9
//
// @version         1.0
// @author          GameRoMan
// @description     Hides Current Rarities in RNGame
//
// @downloadURL     https://roman.is-a.dev/userscripts/wild-west/users/hypoor/rngame/HideOddsDisplay/index.user.js
// @updateURL       https://roman.is-a.dev/userscripts/wild-west/users/hypoor/rngame/HideOddsDisplay/index.user.js
//
// @supportURL      https://roman.is-a.dev/discord
// @homepageURL     https://roman.is-a.dev/discord
//
// @license         MIT
//
// ==/UserScript==


(function() {
	document.getElementById('odds-display').style.display = 'none';
})();
