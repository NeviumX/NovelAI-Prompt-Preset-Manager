import { JsonManager } from './JsonManager';

export class SuggestionManager {
    jsonMgr: JsonManager;
    editor: HTMLElement;
    box: HTMLDivElement;
    selIdx: number = -1;

    _updateHandler: () => void;
    _navHandler: (e: KeyboardEvent) => void;
    _hideHandler: () => void;
    _mousedownHandler: (e: MouseEvent) => void;
    _mouseoverHandler: (e: MouseEvent) => void;
    _escapeKeyHandler: (e: KeyboardEvent) => void;

    constructor(editor: HTMLElement, jsonMgr: JsonManager) {
        this.jsonMgr = jsonMgr;
        this.editor  = editor;
        this.box     = this.createBox();
        this.bind();
    }
    createBox(): HTMLDivElement {
        const div = document.createElement('div');
        div.className = 'nai-suggest-box';
        div.style.display = 'none';
        document.body.appendChild(div);
        return div;
    }
    bind(): void {
        this._updateHandler = () => this.update();
        this._navHandler = (e: KeyboardEvent) => this.nav(e);
        this._hideHandler = () => this.hide();
        this._mousedownHandler = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            if (target.classList.contains('nai-suggest-item')) {
                e.preventDefault();
                this.choose(target, e.shiftKey);
            }
        };
        this._mouseoverHandler = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            if (target.classList.contains('nai-suggest-item')) {
                e.preventDefault();
                this.selIdx = [...this.box.children].indexOf(target);
                this.highlight();
            }
        };
        this._escapeKeyHandler = (e: KeyboardEvent) => { if (e.key === 'Escape') this.hide(); };

        this.editor.addEventListener('input', this._updateHandler);
        this.editor.addEventListener('keydown', this._navHandler as EventListener);
        this.editor.addEventListener('click', this._hideHandler);
        this.box.addEventListener('mousedown', this._mousedownHandler as EventListener);
        this.box.addEventListener('mouseover', this._mouseoverHandler as EventListener);
        document.addEventListener('keydown', this._escapeKeyHandler as EventListener);
    }
    textBeforeCaret(): string {
        const sel = window.getSelection();
        if (!sel || !sel.anchorNode || !this.editor.contains(sel.anchorNode)) return '';
        const rng = sel.getRangeAt(0).cloneRange();
        rng.collapse(true);
        rng.setStart(this.editor, 0);
        return rng.toString();
    }
    update(): void {
        const txt  = this.textBeforeCaret();
        const dict = this.jsonMgr.getDict();

        const mVal = txt.match(/__([A-Za-z0-9_-]+)__(\w*)$/);
        if (mVal && dict[mVal[1]]) {
        const [ , key, part ] = mVal;
        const list = dict[key]
            .split(/\r?\n/)
            .filter(Boolean)
            .filter(l => l.toLowerCase().includes(part.toLowerCase()))
            .slice(0, 100);
        if (list.length) return this.render(list.map(t => ({type:'value', text:t, originalKey: key })));
        }

        const mTok = txt.match(/__([A-Za-z0-9_-]*)$/);
        if (mTok) {
            const prefix = mTok[1].toLowerCase();
            let keys = Object.keys(dict);
            keys = prefix ? keys.filter(k => k.toLowerCase().startsWith(prefix)) : keys;
            keys.sort(); keys = keys.slice(0, 100);
            if (keys.length) return this.render(keys.map(k => ({type:'token', text:`__${k}__`})));
        }
        this.hide();
    }
    render(items: { type: string, text: string, originalKey?: string }[]): void {
        this.box.innerHTML = '';
        items.forEach((itemData) => {
            const div = document.createElement('div');
            div.className    = 'nai-suggest-item';
            div.textContent  = itemData.text;
            div.dataset.type = itemData.type;
            if (itemData.type === 'value' && itemData.originalKey) {
                div.dataset.originalKey = itemData.originalKey;
            }
            this.box.appendChild(div);
        });
        this.selIdx = 0;
        this.highlight();

        const sel = window.getSelection();
        if (sel && sel.rangeCount > 0) {
            const rect = sel.getRangeAt(0).getBoundingClientRect();
            this.box.style.left = `${rect.left + window.scrollX}px`;
            this.box.style.top  = `${rect.bottom + window.scrollY + 4}px`;
            this.box.style.display = 'block';
        } else {
            this.hide();
        }
    }
    nav(e: KeyboardEvent): void {
        if (this.box.style.display === 'none') return;
        const items = [...this.box.children] as HTMLElement[];
        if (!items.length) return;

        if (e.key === 'ArrowDown') { e.preventDefault(); this.selIdx = (this.selIdx + 1) % items.length; }
        if (e.key === 'ArrowUp') { e.preventDefault(); this.selIdx = (this.selIdx - 1 + items.length) % items.length; }
        if (e.key === 'Tab' || e.key === ' ') {
            e.preventDefault();
            this.choose(items[this.selIdx], e.shiftKey);
        }
        this.highlight();
    }
    choose(itemElement: HTMLElement, shiftPressed: boolean = false): void {
        const sel = window.getSelection();
        if (!sel || !sel.rangeCount) return this.hide();

        const fullTextBeforeCaret = this.textBeforeCaret();
        const itemType = itemElement.dataset.type;
        const suggestionText = itemElement.textContent;

        let textToInsert = "";
        let charactersToDelete = 0;

        const newlineReplaceRegex = /\r?\n/g;
        const newlineTestRegex = /\r?\n/;

        if (itemType === 'value') {
            const valueTriggerRegex = /__([A-Za-z0-9_.-]+)__(\w*)$/;
            const currentTriggerMatch = fullTextBeforeCaret.match(valueTriggerRegex);

            if (currentTriggerMatch) {
                charactersToDelete = currentTriggerMatch[0].length;
            } else {
                charactersToDelete = 0;
            }
            if (shiftPressed) {
                const presetName = itemElement.dataset.originalKey!;
                const presetContent = this.jsonMgr.getDict()[presetName];
                if (typeof presetContent === 'string') {
                    if (newlineTestRegex.test(presetContent)) {
                        textToInsert = '||' + presetContent.replace(newlineReplaceRegex, '|') + '||';
                    } else {
                        textToInsert = presetContent + ', ';
                    }
                } else {
                    textToInsert = suggestionText! + ', ';
                }
            } else {
                textToInsert = suggestionText! + ', ';
            }
        } else if (itemType === 'token') {
            const tokenTriggerRegex = /__([A-Za-z0-9_.-]*)$/;
            const fullTokenTriggerRegex = /__([A-Za-z0-9_.-]+)__$/;

            let currentTriggerMatch = fullTextBeforeCaret.match(fullTokenTriggerRegex);
            if (currentTriggerMatch) {
                charactersToDelete = currentTriggerMatch[0].length;
            } else {
                currentTriggerMatch = fullTextBeforeCaret.match(tokenTriggerRegex);
                if (currentTriggerMatch) {
                    charactersToDelete = currentTriggerMatch[0].length;
                } else {
                    charactersToDelete = 0;
                }
            }
            if (shiftPressed) {
                const presetName = suggestionText!.slice(2, -2);
                const presetContent = this.jsonMgr.getDict()[presetName];
                if (typeof presetContent === 'string') {
                    if (newlineTestRegex.test(presetContent)) {
                        textToInsert = '||' + presetContent.replace(newlineReplaceRegex, '|') + '||';
                    } else {
                        textToInsert = presetContent + ', ';
                    }
                } else {
                    textToInsert = suggestionText! + ', ';
                }
            } else {
                textToInsert = suggestionText! + ', ';
            }
        }
        if (charactersToDelete > 0 || textToInsert) {
            for (let i = 0; i < charactersToDelete; i++) sel.modify('extend', 'backward', 'character');
            document.execCommand('insertText', false, textToInsert);
        }
        this.hide();
    }
    highlight(): void {
        const items = [...this.box.children] as HTMLElement[];
        items.forEach((d,i)=> {
            d.classList.toggle('active', i===this.selIdx);
        });
        if (items.length > 0 && this.selIdx >= 0 && this.selIdx < items.length) {
            const selectedItem = items[this.selIdx];
            const box = this.box;

            const itemTop = selectedItem.offsetTop;
            const itemBottom = itemTop + selectedItem.offsetHeight;
            const boxScrollTop = box.scrollTop;
            const boxVisibleHeight = box.clientHeight;

            if (itemTop < boxScrollTop) {
                box.scrollTop = itemTop;
            } else if (itemBottom > boxScrollTop + boxVisibleHeight) {
                box.scrollTop = itemBottom - boxVisibleHeight;
            }
        }
    }
    hide(): void { this.box.style.display = 'none'; this.selIdx = -1; }
    destroy(): void {
        this.editor.removeEventListener('input', this._updateHandler);
        this.editor.removeEventListener('keydown', this._navHandler as EventListener);
        this.editor.removeEventListener('click', this._hideHandler);
        this.box.removeEventListener('mousedown', this._mousedownHandler as EventListener);
        this.box.removeEventListener('mouseover', this._mouseoverHandler as EventListener);
        document.removeEventListener('keydown', this._escapeKeyHandler as EventListener);
        this.box.remove();
    }
}