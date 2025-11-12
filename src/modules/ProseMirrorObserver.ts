import { JsonManager } from './JsonManager';
import { SuggestionManager } from './SuggestionManager';

export class ProseMirrorObserver {
    jsonMgr: JsonManager;
    map: Map<HTMLElement, SuggestionManager>;
    mo: MutationObserver;

    constructor(jsonMgr: JsonManager) {
        this.jsonMgr = jsonMgr;
        this.map     = new Map();
        this.mo      = new MutationObserver(m => this.handle(m));
        this.start();
    }
    start(): void {
        this.mo.observe(document.documentElement,{childList:true,subtree:true});
    }
    attach(node: HTMLElement): void {
        if (!node.isContentEditable) return;
        if (this.map.has(node)) return;
        const sm = new SuggestionManager(node, this.jsonMgr);
        this.map.set(node, sm);
        //console.log('[PresetMgr] SuggestionManager added', node);
    }
    detach(node: HTMLElement): void {
        const sm = this.map.get(node);
        if (!sm) return;
        sm.destroy();
        this.map.delete(node);
        //console.log('[PresetMgr] SuggestionManager removed', node);
    }
    handle(muts: MutationRecord[]): void {
        muts.forEach(m => {
            m.addedNodes.forEach((n: Node) => {
                if (n.nodeType !== 1) return;
                const elementsSet = new Set((n as Element).querySelectorAll?.('div.ProseMirror[contenteditable]')) as Set<HTMLElement>;
                if(elementsSet && elementsSet.size !== 0) {
                    elementsSet.forEach((el: HTMLElement) => { this.attach(el); });
                    elementsSet.clear();
                } else return;
            });
            m.removedNodes.forEach((n: Node) => {
                if (n.nodeType !== 1) return;
                if ((n as Element).classList?.contains('ProseMirror')) this.detach(n as HTMLElement);
            });
        });
    }
}