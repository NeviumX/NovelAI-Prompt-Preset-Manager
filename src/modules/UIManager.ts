import { jsonManagerSingleton } from './JsonManager';
import { JsonManager } from './JsonManager';
import * as CONST from '../constants';
import { messageTranslations, uiMessageTranslations } from './translations';

/*
    * イベント
    * naiRemainUpdate → トークンをメタデータに残すかどうかのトグル
    * naiPresetUpdate → プリセット辞書を更新する
    * naiDebugUpdate  → デバッグモードのトグル
    *
*/

export class UIManager {
    langCode: keyof typeof messageTranslations;
    panel: HTMLDivElement | null;
    jsonMgr: JsonManager;
    _onDocClick?: (e: MouseEvent) => void;

    constructor(root: Element) {
        this.langCode = this.getLangCode();
        this.panel   = this.injectUI(root);
        this.jsonMgr = jsonManagerSingleton;
    }
    getLangCode(): keyof typeof messageTranslations {
        if (window.__userLang){ return window.__userLang.startsWith('ja') ? 'ja' : 'en'; }
        else return 'en';
    }
    injectUI(root: Element) {
        // TODO: モバイルとPCのUIに重複してインジェクトするよりwindow.innerwidthで条件分岐して付け替えたりした方がいいのかもしれない
        const panelID = 'nai-preset-panel-injected';
        if(root) {
            const panel = this.createPresetManagerUI();
            panel.id = panelID;
            root.insertAdjacentElement('afterend', panel);
            return panel;
        }
        return null;
    }
    destroy(){
        if (!this.panel) return;
        if (this._onDocClick){
            document.removeEventListener('click', this._onDocClick, false);
            this._onDocClick = undefined;
        }
        if (this.panel.isConnected) this.panel.remove();
        this.panel = null;
    }
    createPresetManagerUI(): HTMLDivElement {
        /* container */
        const panel = document.createElement('div');
        panel.className = 'nai-preset-panel';
        panel.style.position = 'relative';

        /* title */
        panel.innerHTML = `
            <div class="nai-preset-title">Prompt Preset / Wildcards Manager</div>
            <div class="nai-gear-wrap">
                <button class="nai-gear-btn" title="Settings">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                    <path d="M19.14 12.94a7.93 7.93 0 0 0 .05-.94 7.93 7.93 0 0 0-.05-.94l2.11-1.65a.5.5 0 0 0 .12-.65l-2-3.46a.5.5 0 0 0-.6-.22l-2.49 1a7.2 7.2 0 0 0-1.63-.94l-.38-2.65A.5.5 0 0 0 13.7 3h-3.4a.5.5 0 0 0-.49.41l-.38 2.65a7.2 7.2 0 0 0-1.63.94l-2.49-1a.5.5 0 0 0-.6.22l-2 3.46a.5.5 0 0 0 .12.65l2.11 1.65c-.04.31-.05.63-.05.94s.01.63.05.94l-2.11 1.65a.5.5 0 0 0-.12.65l2 3.46c.13.23.39.32.6.22l2.49-1c.5.4 1.05.72 1.63.94l.38 2.65c.05.24.25.41.49.41h3.4c.24 0 .44-.17.49-.41l.38-2.65c.58-.22 1.13-.54 1.63-.94l2.49 1a.5.5 0 0 0 .6-.22l2-3.46a.5.5 0 0 0-.12-.65l-2.11-1.65ZM12 15.5A3.5 3.5 0 1 1 12 8.5a3.5 3.5 0 0 1 0 7Z"/>
                </svg>
            </button>
            </div>
            <div class="nai-popup">
                <div class="nai-popup-header">
                    <h3 style="margin:0;font-size:16px">Settings</h3>
                    <a href="https://github.com/NeviumX/NovelAI-Prompt-Preset-Manager?tab=readme-ov-file#features" title="About this script" target="_blank" class="nai-info-btn">
                        <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                            <path d="M11 7h2v2h-2zm0 4h2v6h-2zm1-9C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
                        </svg>
                    </a>
                </div>
                <button class="nai-btn nai-set-import" style="width:100%;margin-bottom:8px">Import Preset</button>
                <button class="nai-btn nai-set-export" style="width:100%;margin-bottom:8px">Export Preset</button>
                <button class="nai-btn nai-set-clear"  style="width:100%;color:red">Clear All Preset</button>
                <label class="nai-remain-row" data-tooltip="${uiMessageTranslations[this.langCode].tooltipRemainToken}">
                    <input type="checkbox" id="nai-remain-check">
                    <span>Remain Preset Token</span>
                </label>
                <label class="nai-remain-row" data-tooltip="${uiMessageTranslations[this.langCode].tooltipEnableDebugLog}">
                    <input type="checkbox" id="nai-debug-mode-check">
                    <span>Enable Debug Logging</span>
                </label>
                <input type="file" accept=".json,.txt" class="nai-file-input" style="display:none">
            </div>

            <div class="nai-textarea-wrapper">
                <textarea class="nai-preset-textarea" placeholder="masterpiece, best quality, oil painting (medium)" spellcheck="false"></textarea>
                <div class="nai-textarea-overlay"></div>
            </div>

            <div class="nai-preset-controls">
                <input  class="nai-preset-input" placeholder="Preset name">
                <button class="nai-btn nai-btn-add">ADD</button>
                <button class="nai-btn nai-btn-clear">CLEAR</button>
                <button class="nai-btn nai-btn-toggle">▴</button>
            </div>

            <div class="nai-preset-list"></div>

            <div class="nai-preset-search">
                <input class="nai-preset-search-box" placeholder="Filter presets...">
                <button class="nai-btn nai-preset-search-button">
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                        <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
                    </svg>
                </button>
                <button class="nai-btn nai-btn-list-toggle">▴</button>
            </div>
        `;

        const textarea = panel.querySelector('.nai-preset-textarea') as HTMLTextAreaElement;
        const overlay = panel.querySelector('.nai-textarea-overlay') as HTMLDivElement;
        const presetInput = panel.querySelector('.nai-preset-input') as HTMLInputElement;

        const updateOverlay = () => {
            const text = textarea.value;
            overlay.innerHTML = '';
            const fragment = document.createDocumentFragment();
            const lines = text.split('\n');
            lines.forEach((line, index) => {
                fragment.appendChild(document.createTextNode(line));
                if (index < lines.length - 1) {
                    const newlineSpan = document.createElement('span');
                    newlineSpan.className = 'newline-char';
                    newlineSpan.textContent = '\\n';
                    fragment.appendChild(newlineSpan);
                    fragment.appendChild(document.createElement('br'));
                }
            });
            overlay.appendChild(fragment);
        };

        const syncScroll = () => {
            overlay.scrollTop = textarea.scrollTop;
            overlay.scrollLeft = textarea.scrollLeft;
        };

        const autoResizeTextarea = (ta: HTMLTextAreaElement) => {
            ta.style.height = 'auto';
            const newHeight = (ta.scrollHeight + 2) + 'px';
            ta.style.height = newHeight;
            overlay.style.height = newHeight;
            syncScroll();
        };

        textarea.addEventListener('input', () => {
            autoResizeTextarea(textarea);
            updateOverlay();
        });
        textarea.addEventListener('scroll', syncScroll);
        updateOverlay();

        /* preset data list */
        const list = panel.querySelector('.nai-preset-list') as HTMLDivElement;
        GM_listValues()
            .filter(k => k.startsWith(CONST.PREFIX))
            .forEach(k => {
                const presetName = k.slice(CONST.PREFIX.length);
                list.appendChild(this.makeListItem(presetName));
            });

        /* ADD button */
        const addBtn = panel.querySelector('.nai-btn-add') as HTMLButtonElement;
        addBtn.onclick = () => {
            const btnFlashErr = () => {
                addBtn.style.animation = 'Flash-Err 0.4s';
                setTimeout(() => addBtn.style.animation = '', 400);
            }
            const name = presetInput.value.trim();
            if (!name) { btnFlashErr(); return; }

            const validationRe = /^[A-Za-z0-9_.-]+$/;
            if (!validationRe.test(name)) { btnFlashErr(); return; }

            const presetText = textarea.value;
            if (!presetText) { btnFlashErr(); return; }

            if (name.includes('__')) {
                alert(
                    messageTranslations[this.langCode].doubleUnderscoreError
                );
                return;
            }
            const key = CONST.PREFIX + name;
            const alreadyExists = GM_getValue(key, null) !== null;
            GM_setValue(key, presetText);
            if(alreadyExists) {
                const item = [...list.children]
                    .find(el => (el.querySelector('span') as HTMLSpanElement)?.textContent === name);
                if(item) {
                    (item as HTMLElement).style.animation = 'Flash 0.4s';
                    setTimeout(() => (item as HTMLElement).style.animation = '', 400);
                }
            } else {
                list.appendChild(this.makeListItem(name));
                addBtn.style.animation = 'Flash 0.4s';
                setTimeout(() => addBtn.style.animation = '', 400);
            }
            this.jsonMgr.updateDict();
            presetInput.value = '';
        };

        /* CLEAR button (clears textarea and preset name) */
        (panel.querySelector('.nai-btn-clear') as HTMLButtonElement).onclick = () => {
            textarea.value = '';
            presetInput.value = '';
            autoResizeTextarea(textarea);
            updateOverlay();
        };

        /* toggle textarea visibility */
        (panel.querySelector('.nai-btn-toggle') as HTMLButtonElement).onclick = (e) => {
            const wrapper = panel.querySelector('.nai-textarea-wrapper') as HTMLDivElement;
            const hidden = wrapper.style.display === 'none';
            wrapper.style.display = hidden ? '' : 'none';
            (e.target as HTMLElement).textContent = hidden ? '▴' : '▾';
        };

        /* checkbox handler – show / hide × button */
        list.addEventListener('change', (e) => {
            const target = e.target as HTMLInputElement;
            if (target.matches('input[type="checkbox"]')) {
                const item = target.closest('.nai-preset-item') as HTMLLabelElement;
                const btn  = item.querySelector('.nai-btn-remove') as HTMLButtonElement;
                btn.style.display = target.checked ? 'inline' : 'none';
                if(target.checked) {
                    const name = (item.querySelector('span') as HTMLSpanElement).textContent as string;
                    const presetText = GM_getValue(CONST.PREFIX + name, '');
                    textarea.value = presetText;
                    autoResizeTextarea(textarea);
                    updateOverlay();
                    presetInput.value = name;
                    const allCheckboxes = document.querySelectorAll('.nai-preset-item input[type="checkbox"]');
                    const allBtns = document.querySelectorAll('.nai-btn-remove');
                    allCheckboxes.forEach((el) => {
                        if (el !== target) {
                            (el as HTMLInputElement).checked = false;
                        }
                    });
                    allBtns.forEach((el) => {
                        if (el !== btn) {
                            (el as HTMLButtonElement).style.display = 'none';
                        }
                    });
                }
            }
        });

        /* remove handler */
        list.addEventListener('click', (e) => {
            const target = e.target as HTMLElement;
            if (!target.matches('.nai-btn-remove')) return;
            e.stopPropagation();
            e.preventDefault();
            const item = target.closest('.nai-preset-item') as HTMLLabelElement;
            const name = (item.querySelector('span') as HTMLSpanElement).textContent as string;
            if (!confirm(messageTranslations[this.langCode].confirmDeletePreset + name)) return;
            GM_deleteValue(CONST.PREFIX + name);
            item.remove();
            this.jsonMgr.updateDict();
        });

        /* preset search handler */
        const searchBox = panel.querySelector('.nai-preset-search-box') as HTMLInputElement;
        const searchBtn = panel.querySelector('.nai-preset-search-button') as HTMLButtonElement;

        const filterPresets = () => {
            const searchTerm = searchBox.value.toLowerCase().trim();
            const presetItems = list.querySelectorAll('.nai-preset-item');
            presetItems.forEach(item => {
                const presetName = (item.querySelector('span') as HTMLSpanElement).textContent!.toLowerCase();
                if (presetName.includes(searchTerm)) {
                    (item as HTMLElement).style.display = 'inline-flex';
                } else {
                    (item as HTMLElement).style.display = 'none';
                }
            });
        };
        searchBox.addEventListener('input', filterPresets);
        searchBtn.addEventListener('click', filterPresets);

        /* toggle preset list visibility */
        (panel.querySelector('.nai-btn-list-toggle') as HTMLButtonElement).onclick = (e) => {
            const presetList = panel.querySelector('.nai-preset-list') as HTMLDivElement;
            const hidden = presetList.style.display === 'none';
            presetList.style.display = hidden ? '' : 'none';
            (e.target as HTMLElement).textContent = hidden ? '▴' : '▾';
        };

        /* settings popup */
        const gearBtn = panel.querySelector('.nai-gear-btn') as HTMLButtonElement;
        const popup   = panel.querySelector('.nai-popup') as HTMLDivElement;
        gearBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const isActive = popup.style.display === 'block';
            popup.style.display = isActive ? 'none' : 'block';
            gearBtn.classList.toggle('active', !isActive);
        });

        const importBtn = panel.querySelector('.nai-set-import') as HTMLButtonElement;
        const exportBtn = panel.querySelector('.nai-set-export') as HTMLButtonElement;
        const clearBtn  = panel.querySelector('.nai-set-clear') as HTMLButtonElement;
        const fileInput = panel.querySelector('.nai-file-input') as HTMLInputElement;

        importBtn.addEventListener('click', () => fileInput.click());
        fileInput.addEventListener('change', () => {
            if (!fileInput.files || !fileInput.files[0]) return;
            const reader = new FileReader();
            let importCount = 0;
            reader.onload = () => {
                try {
                    importCount = 0;
                    const obj = JSON.parse(reader.result as string);
                    Object.entries(obj).forEach(([name, prompt]) => {
                        if (typeof prompt !== 'string') return;
                        const key = CONST.PREFIX + name;
                        if(GM_getValue(key, null) === null) {
                            GM_setValue(key, prompt);
                            list.appendChild(this.makeListItem(name));
                            importCount++;
                        }
                    });
                } catch(err: any) {
                    alert(messageTranslations[this.langCode].importFailure + err.message);
                    return;
                }
                if (importCount > 0) {
                    console.log(`[NovelAI Prompt Preset Manager]\nImported ${importCount} new preset(s)!`);
                    this.jsonMgr.updateDict();
                }
                fileInput.value = '';
            };
            reader.readAsText(fileInput.files[0]);
        });

        exportBtn.addEventListener('click', () => {
            const data: Record<string, string> = {};
            GM_listValues()
                .filter(k => k.startsWith(CONST.PREFIX))
                .forEach(k => {
                    const presetName = k.slice(CONST.PREFIX.length);
                    data[presetName] = GM_getValue(k, '');
                });
            const blob = new Blob([JSON.stringify(data, null, 2)], {type:'application/json'});
            const url  = URL.createObjectURL(blob);
            const a    = document.createElement('a');
            a.href = url;
            a.download = 'nai-prompt-presets_' +
                new Date()
                .toLocaleString('sv-SE', { hour12: false })
                .replace(' ', '_')
                .replaceAll(':', '-')
                + '.json';
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(url);
        });

        clearBtn.addEventListener('click', () => {
            if (!confirm(messageTranslations[this.langCode].confirmDeleteAllPresets)) return;
            GM_listValues()
                .filter(k => k.startsWith(CONST.PREFIX))
                .forEach(k => GM_deleteValue(k));
            list.innerHTML = '';
            alert(messageTranslations[this.langCode].allPresetsDeleted);
            this.jsonMgr.updateDict();
        });

        this._onDocClick = (e: MouseEvent)=>{
            if (!panel.contains(e.target as Node)) {
                popup.style.display = 'none';
                gearBtn.classList.remove('active');
            }
        };
        document.addEventListener('click', this._onDocClick, false);

        const remainChk = panel.querySelector('#nai-remain-check') as HTMLInputElement;
        remainChk.checked = GM_getValue(CONST.TOKEN_REMAIN_TRG, false);
        remainChk.addEventListener('change', () =>{
            GM_setValue(CONST.TOKEN_REMAIN_TRG, remainChk.checked);
            window.dispatchEvent(new CustomEvent('naiRemainUpdate',{detail: remainChk.checked}));
        });

        const debugChk = panel.querySelector('#nai-debug-mode-check') as HTMLInputElement;
        debugChk.checked = GM_getValue(CONST.DEBUG_MODE_TRG, false);
        debugChk.addEventListener('change', () => {
            GM_setValue(CONST.DEBUG_MODE_TRG, debugChk.checked);
            window.dispatchEvent(new CustomEvent('naiDebugUpdate', {detail: debugChk.checked}))
        });

        /* focus-visible handling */
        const focusableSelector = '.nai-btn, .nai-preset-search-button, .nai-gear-btn, .nai-preset-panel input[type="checkbox"], .nai-btn-remove';

        panel.addEventListener('mousedown', (e) => {
            const target = (e.target as HTMLElement).closest(focusableSelector);
            if (target) {
                target.setAttribute('data-mouse-clicked', 'true');
            }
        }, true);

        panel.addEventListener('blur', (e) => {
            const target = (e.target as HTMLElement).closest(focusableSelector);
            if (target) {
                target.removeAttribute('data-mouse-clicked');
            }
        }, true);

        return panel;
    }

    /* helper to create a preset list entry */
    makeListItem(name: string): HTMLLabelElement {
        const wrapper = document.createElement('label');
        wrapper.className = 'nai-preset-item';
        wrapper.innerHTML = `
            <input type="checkbox">
            <span>${name}</span>
            <button class="nai-btn-remove">×</button>
            `;
        return wrapper;
    }
}