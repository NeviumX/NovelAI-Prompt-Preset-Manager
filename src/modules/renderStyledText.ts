/**
 * 翻訳テキスト中のマークアップタグを解析し、スタイル付き DOM ノードを含む DocumentFragment を返す。
 *
 * 対応マークアップ:
 *   [redBold]...[/redBold]  → <span class="nai-text-red-bold">...</span>
 *   \n                      → <br>
 */
export function renderStyledText(text: string): DocumentFragment {
    const fragment = document.createDocumentFragment();
    const tagRegex = /\[redBold\](.*?)\[\/redBold\]/g;

    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = tagRegex.exec(text)) !== null) {
        // テキストノード (タグの前)
        if (match.index > lastIndex) {
            appendTextWithBreaks(fragment, text.slice(lastIndex, match.index));
        }
        // スタイル付きスパン
        const span = document.createElement('span');
        span.className = 'nai-text-red-bold';
        span.textContent = match[1];
        fragment.appendChild(span);

        lastIndex = tagRegex.lastIndex;
    }

    // 残りのテキスト
    if (lastIndex < text.length) {
        appendTextWithBreaks(fragment, text.slice(lastIndex));
    }

    return fragment;
}

function appendTextWithBreaks(parent: DocumentFragment, text: string): void {
    const parts = text.split('\n');
    parts.forEach((part, i) => {
        if (part) parent.appendChild(document.createTextNode(part));
        if (i < parts.length - 1) parent.appendChild(document.createElement('br'));
    });
}
