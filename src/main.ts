import cssString from './style.css?raw';

import { jsonManagerSingleton } from './modules/JsonManager';
import { ProseMirrorObserver } from './modules/ProseMirrorObserver';
import { PromptBoxObserver } from './modules/PromptBoxObserver';

(function () {
    'use strict';

    GM_addStyle(cssString);

    if (typeof JSZip !== 'undefined') {
        unsafeWindow.JSZip = JSZip;
        console.log('[PresetMgr] JSZip successfully attached to page context (unsafeWindow).');
    } else {
        console.error('[PresetMgr] JSZip was not attached to page context (unsafeWindow)!');
    }

    if (typeof MessagePack !== 'undefined') {
        unsafeWindow.MessagePack = MessagePack;
        console.log('[PresetMgr] MessagePack successfully attached to page context (unsafeWindow).');
    } else {
        console.error('[PresetMgr] MessagePack was not attached to page context (unsafeWindow)!');
    }

    const userLang = (navigator.languages && navigator.languages[0]) || navigator.language || 'en';
    window.__userLang = userLang.startsWith('ja') ? 'ja' : 'en';

    window.__naiPmObserver ??
        (window.__naiPmObserver = new ProseMirrorObserver(jsonManagerSingleton));
    window.__naiPromptObserver ??
        (window.__naiPromptObserver = new PromptBoxObserver());

})();