import { UIManager } from './UIManager';

export class PromptBoxObserver {
    map: Map<Element, UIManager>;
    mo: MutationObserver;

    constructor(){
        this.map     = new Map();
        this.mo      = new MutationObserver(m => this.handle(m));
        this.start();
    }
    start(): void {
        this.mo.observe(document.documentElement,{childList:true,subtree:true});
    }
    attach(root: Element): void {
        const prev = this.map.get(root);
        if (prev && !prev.panel?.isConnected) {
            prev.destroy();
            this.map.delete(root);
        }
        else if (!this.map.has(root)) {
            const ui = new UIManager(root);
            this.map.set(root, ui);
            //console.log('[NovelAI Prompt Preset Manager] UI attached.', root);
        }
    }
    detach(root: Element): void {
        const ui = this.map.get(root);
        if (!ui) return;
        ui.destroy();
        this.map.delete(root);
        //console.log('[NovelAI Prompt Preset Manager] UI detached.', root);
    }
    handle(muts: MutationRecord[]): void {
        muts.forEach(m => {
            m.addedNodes.forEach((n: Node) => {
                if (n.nodeType !== 1) return;
                (n as Element).querySelectorAll?.('.prompt-input-box-prompt,.prompt-input-box-プロンプト,.prompt-input-box-ベースプロンプト,.prompt-input-box-base-prompt'
                    ).forEach(el => { this.attach(el); });
            });
            m.removedNodes.forEach((n: Node) => {
                if (n.nodeType !== 1) return;
                (n as Element).querySelectorAll?.('.prompt-input-box-prompt,.prompt-input-box-プロンプト,.prompt-input-box-ベースプロンプト,.prompt-input-box-base-prompt'
                    ).forEach(el => { this.detach(el); });
            });
        });
    }
}