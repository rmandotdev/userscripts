// ==UserScript==
//
// @name            Battle Keyboard
// @namespace       roman.is-a.dev
//
// @match           https://g.wildwest.gg/g/beccb87f-c9ae-4cd6-bdc2-156e56a82da9
//
// @version         1.1
// @author          GameRoMan
// @description     Use keyboard to fight in Emoji Arena
//
// @downloadURL     https://roman.is-a.dev/userscripts/wild-west/users/top/EmojiArena/DarkMode/index.user.js
// @updateURL       https://roman.is-a.dev/userscripts/wild-west/users/top/EmojiArena/BattleKeyboard/index.user.js
//
// @supportURL      https://roman.is-a.dev/discord
// @homepageURL     https://roman.is-a.dev/discord
//
// @license         MIT
//
// ==/UserScript==


(function() {
	window.addEventListener('keypress', function(event) {
		if (event.key >= '1' && event.key <= '7') {
			const button = document.getElementById('action-buttons')?.children[event.key - 1];
			if (button) button.click();
		}
	});
})();
