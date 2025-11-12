import { PREFIX, TOKEN_REMAIN_TRG, DEBUG_MODE_TRG } from '../constants';

export class JsonManager {
    TARGET_PATH: string;
    _dictCache: Record<string, string>;
    _patchInstalled?: boolean; // 

    constructor() {
        this.TARGET_PATH = '/ai/generate-image';
        this._dictCache  = this.buildDict();
        this.installPatch();
    }
    /* GM_storage → {TOKEN: "value"} */
    buildDict(): Record<string, string> {
        const dict: Record<string, string> = {};
        GM_listValues()
          .filter(k => k.startsWith(PREFIX))
          .forEach(k => dict[k.slice(PREFIX.length)] = GM_getValue(k, ''));
        console.log('[NovelAI Prompt Preset Manager] Preset dict built.');
        return dict;
    }
    /* ページ側へ JS を注入 */
    installPatch(): void {
        if (this._patchInstalled) return;
        this._patchInstalled = true;

        const TARGET = this.TARGET_PATH;
        const naiRemainValue = GM_getValue(TOKEN_REMAIN_TRG, false);
        const debugModeValue = GM_getValue(DEBUG_MODE_TRG, false);
        const initialDict = JSON.stringify(this._dictCache)
                            .replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$\{/g,'\\${');

        const patchCode = `
            (function(){
            window.__naiPresetDict = JSON.parse(\`${initialDict}\`);
            window.__naiRemain = ${naiRemainValue};
            window.__naiDebugMode = ${debugModeValue};
            const debugLog = (...args) => { if (window.__naiDebugMode) console.log(...args); };
            const errorLog = (...args) => console.error(...args);

            window.addEventListener('naiRemainUpdate', e => { window.__naiRemain = e.detail; });
            window.addEventListener('naiPresetUpdate', e => { window.__naiPresetDict = e.detail; });
            window.addEventListener('naiDebugUpdate', e => {window.__naiDebugMode = e.detail; });

            const tokenRe = /__([A-Za-z0-9_.-]+?)__/g;
            const replace = s => {
                return s.replace(tokenRe, (match, tokenName) => {
                    if (Object.prototype.hasOwnProperty.call(window.__naiPresetDict, tokenName)) {
                        let presetValue = window.__naiPresetDict[tokenName];
                        if (typeof presetValue === 'string') {
                            const newlineRegex = new RegExp('\\\\r?\\\\n', 'g');
                            const newlineTestRegex = new RegExp('\\\\r?\\\\n');
                            if (newlineTestRegex.test(presetValue)){
                                return '||' + presetValue.replace(newlineRegex, '|') + '||';
                            }
                            else return presetValue;
                        }
                        return presetValue;
                    }
                    return match;
                });
            };
            const deep    = o => (typeof o==='string') ? replace(o)
                                : Array.isArray(o)      ? o.map(deep)
                                : o && typeof o==='object'
                                ? Object.fromEntries(Object.entries(o).map(([k,v])=>[k,deep(v)]))
                                : o;

            const origFetch = window.fetch;
            window.fetch = async function(input, init) {
                const url = typeof input === 'string' ? input : input.url;
                const method = init?.method || (input instanceof Request ? input.method : 'GET').toUpperCase();

                if (method === 'POST' && url.includes('${TARGET}')) {
                    const body = init?.body || (input instanceof Request ? input.body : null);
                    if (!body) return origFetch.call(this, input, init);

                    console.log('[NovelAI Prompt Preset Manager] Intercepting POST to ${TARGET}');
                    const bodyText = typeof body === 'string' ? body : await new Response(body).text();

                    if (window.__naiRemain) {
                        try {
                            const jsonData = JSON.parse(bodyText);
                            const params = jsonData.parameters || {};
                            const safeCopy = (obj) => obj ? JSON.parse(JSON.stringify(obj)) : null;
                            window.__naiLastPromptData = {
                                inputPrompt : jsonData.input ?? '',
                                caption     : safeCopy(params.v4_prompt?.caption),
                                negCaption  : safeCopy(params.v4_negative_prompt?.caption),
                                negative    : jsonData.negative_prompt ?? ''
                            };
                            debugLog('[PresetMgr] Stored raw prompt data for patching.');
                        } catch(e) { console.error('[PresetMgr] Error parsing prompt data:', e); }
                    }

                    const modifiedBody = JSON.stringify(deep(JSON.parse(bodyText)));

                    if( modifiedBody === bodyText ) {
                        debugLog('[PresetMgr] No changes in body, skipping patching.'); 
                        return origFetch.call(this, input, init);
                    }
                    let finalInput, finalInit;
                    if (typeof input === 'string') {
                        finalInput = input;
                        finalInit = {...init, body: modifiedBody};
                    } else {
                        finalInput = new Request(input, { body: modifiedBody });
                        finalInit = undefined;
                    }

                    const res = await origFetch.call(this, finalInput, finalInit);

                    if (window.__naiRemain && res.ok && res.headers.get('Content-Type')?.includes('binary/octet-stream')) {
                        debugLog('[PresetMgr] binary/octet-stream response. Trying to process as ZIP.');
                        try {
                            const zipBuffer = await res.clone().arrayBuffer();
                            debugLog('[PresetMgr] Got zipBuffer, length:', zipBuffer.byteLength);
                            if (typeof window.JSZip === 'undefined') {
                                console.error('[PresetMgr] window.JSZip is undefined. Cannot process ZIP.');
                                return res;
                            }
                            debugLog('[PresetMgr] JSZip found in window. Loading ZIP...');
                            const zip = await window.JSZip.loadAsync(zipBuffer);
                            debugLog('[PresetMgr] ZIP loaded. Searching for PNG file...');
                            const pngFile = zip.file(/image_\\d+\\.png/)[0];
                            if (pngFile) {
                                debugLog('[PresetMgr] Found PNG in ZIP:', pngFile.name);
                                try {
                                    debugLog('[PresetMgr] Attempting pngFile.async("arraybuffer")...');
                                    // Promiseを一度変数に受けてからawaitする
                                    const arrayBufferPromise = pngFile.async('arraybuffer');
                                    const pngFileBuffer = await arrayBufferPromise;
                                    debugLog('[PresetMgr] Successfully got pngFileBuffer, length:', pngFileBuffer.byteLength);
                                    
                                    const patchedBuffer = patchPng(pngFileBuffer);

                                    if (patchedBuffer) {
                                        zip.file(pngFile.name, patchedBuffer); 
                                        debugLog('[PresetMgr] PNG patched. Generating new ZIP...');
                                        const newZipBuffer = await zip.generateAsync({type: 'arraybuffer', compression: "DEFLATE", compressionOptions: {level: 1}});
                                        
                                        debugLog('[PresetMgr] Repacked zip with patched PNG. Returning new response.');
                                        const newHeaders = new Headers(res.headers); 
                                        return new Response(newZipBuffer, { status: res.status, statusText: res.statusText, headers: newHeaders });
                                    } else {
                                        errorLog('[PresetMgr] patchPng returned null or undefined. Returning original response (from cloned zipBuffer).');
                                        const originalResponseCloneForFallback = new Response(zipBuffer, { status: res.status, statusText: res.statusText, headers: res.headers });
                                        return originalResponseCloneForFallback;
                                    }
                                } catch (e_png_processing) {
                                    console.error('[PresetMgr] Error during pngFile.async or subsequent patching/zipping:', e_png_processing);
                                    // エラーが発生した場合、元のZIPデータからレスポンスを再生成して返す
                                    const errorFallbackResponse = new Response(zipBuffer, { status: res.status, statusText: res.statusText, headers: res.headers });
                                    return errorFallbackResponse;
                                }
                            } else {
                                errorLog('[PresetMgr] No PNG file found in the ZIP. Returning original response.');
                            }
                        } catch (e_zip_load) {
                            console.error('[PresetMgr] Failed to load/process ZIP from binary/octet-stream:', e_zip_load);
                        }
                    }
                    // generate-image-stream
                    else if (window.__naiRemain && res.ok && res.headers.get('Content-Type')?.includes('application/msgpack')){
                        debugLog('[PresetMgr] SSE stream response detected. Starting transform stream for patching...');
                        try{
                            if (typeof window.MessagePack === 'undefined') {
                                console.error('[PresetMgr] window.MessagePack is undefined. Cannot decode.');
                                return res;
                            } else if (!res.body) {
                                console.error('[PresetMgr] Response body is null. Cannot decode stream.');
                                return res;
                            }
                            const transformStream = new ReadableStream({
                                async start(controller) {
                                    const reader = res.body.getReader();
                                    let buffer = new Uint8Array(0);
                                    try {
                                        while (true) {
                                            const { value, done } = await reader.read();
                                            if (done) break;

                                            const newBuffer = new Uint8Array(buffer.length + value.length);
                                            newBuffer.set(buffer);
                                            newBuffer.set(value, buffer.length);
                                            buffer = newBuffer;

                                            while (buffer.length > 4) {
                                                const messageLength = (buffer[0] << 24) | (buffer[1] << 16) | (buffer[2] << 8) | buffer[3];
                                                
                                                if (buffer.length >= 4 + messageLength) {
                                                    const messageChunk = buffer.subarray(0, 4 + messageLength); // 
                                                    const messageData = buffer.subarray(4, 4 + messageLength);  // 
                                                    
                                                    try {
                                                        const item = window.MessagePack.decode(messageData);
                                                        
                                                        // TARGET: final
                                                        if (item && item.event_type === 'final' && item.image && item.image instanceof Uint8Array) {
                                                            let patched = false;
                                                            const imageData = item.image;
                                                            
                                                            if (imageData.length > 4 && imageData[0] === 137 && imageData[1] === 80 && imageData[2] === 78 && imageData[3] === 71) {
                                                                debugLog('[PresetMgr] Final image is detected. Attempting to patch...');
                                                                const arrayBuffer = imageData.slice().buffer;
                                                                const patchedBuffer = patchPng(arrayBuffer);

                                                                if (patchedBuffer) {
                                                                    debugLog('[PresetMgr] PNG data patched successfully. Patched buffer length:', patchedBuffer.byteLength);
                                                                    item.image = new Uint8Array(patchedBuffer);
                                                                    const newPayload = window.MessagePack.encode(item);
                                                                    const newMessageChunk = new Uint8Array(4 + newPayload.length);
                                                                    writeUint32(newMessageChunk, 0, newPayload.length);
                                                                    newMessageChunk.set(newPayload, 4);
                                                                    
                                                                    controller.enqueue(newMessageChunk);
                                                                    patched = true;
                                                                } else {
                                                                    console.warn('[PresetMgr] patchPng returned null. No patch applied.');
                                                                }
                                                            } else {
                                                                debugLog('[PresetMgr] Final image is not a PNG, skipping patch.');
                                                            }
                                                            if (!patched) {
                                                                debugLog('[PresetMgr] Something went wrong, skipping patch.');
                                                                controller.enqueue(messageChunk);
                                                            }
                                                        } else {
                                                            controller.enqueue(messageChunk);
                                                        }
                                                    } catch (e) {
                                                        console.error('[PresetMgr] Failed to decode a message chunk, passing through. Error:', e);
                                                        controller.enqueue(messageChunk);
                                                    }
                                                    buffer = buffer.subarray(4 + messageLength);
                                                } else {
                                                    break;
                                                }
                                            }
                                        }
                                        controller.close();
                                    } catch (e) {
                                        console.error('[PresetMgr] Error during stream parsing:', e);
                                        controller.error(e);
                                    }
                                }
                            });
                            return new Response(transformStream, {
                                status: res.status,
                                statusText: res.statusText,
                                headers: new Headers(res.headers),
                            });
                            
                        } catch(e_stream){
                            console.error('[PresetMgr] Error processing SSE stream:', e_stream);
                            return res;
                        }
                    }
                    return res;
                } else {
                    return origFetch.call(this, input, init);
                }
            };
            /*── PNG書き換えとバイナリヘルパー関数 ──*/
            function patchPng(arrayBuf) {
                debugLog('[PresetMgr] Patching PNG metadata...');
                let data = new Uint8Array(arrayBuf);
                const raw = window.__naiLastPromptData;
                if (!raw) { return null; }

                let p = 8;
                let modified = false;

                while (p < data.length) {
                    const originalLen = readUint32(data, p);
                    const type = String.fromCharCode(...data.subarray(p + 4, p + 8));

                    if (type === 'tEXt') {
                        let q = p + 8;
                        let key = '';
                        while (data[q] && q < p + 8 + originalLen) {
                            key += String.fromCharCode(data[q++]);
                        }
                        
                        if (key === 'Description' && raw.inputPrompt) {
                            debugLog('[PresetMgr] Found "tEXt" chunk with "Description" key.');
                            q++;
                            const textOff = q;
                            const oldLen = originalLen - (key.length + 1);

                            const newTxt = new TextEncoder().encode(raw.inputPrompt);
                            const delta = newTxt.length - oldLen;
                            const out = new Uint8Array(data.length + delta);
                            const head = p + 8 + key.length + 1;

                            out.set(data.subarray(0, head), 0);
                            out.set(newTxt, head);
                            out.set(data.subarray(head + oldLen), head + newTxt.length);

                            const newChunkLen = newTxt.length + key.length + 1;
                            writeUint32(out, p, newChunkLen);
                            const crc = crc32(out, p + 4, 4 + newChunkLen);
                            writeUint32(out, p + 8 + newChunkLen, crc);

                            debugLog('[PresetMgr] PNG description patched.');
                            data = out;
                            modified = true;
                        }
                        
                        else if (key === 'Comment') {
                            debugLog('[PresetMgr] Found "tEXt" chunk with "Comment" key.');
                            q++;
                            const textOff = q;
                            const oldLen = originalLen - (key.length + 1);
                            const oldTxt = new TextDecoder().decode(data.subarray(textOff, textOff + oldLen));
                            const meta = JSON.parse(oldTxt);

                            // meta
                            if (raw.inputPrompt) { meta.prompt = raw.inputPrompt; }
                            if (raw.caption && meta.v4_prompt?.caption) {
                                meta.v4_prompt.caption.base_caption = raw.caption.base_caption ?? meta.v4_prompt.caption.base_caption;
                                meta.v4_prompt.caption.char_captions = raw.caption.char_captions ?? meta.v4_prompt.caption.char_captions;
                            }
                            if (raw.negCaption && meta.v4_negative_prompt?.caption) {
                                meta.v4_negative_prompt.caption.base_caption = raw.negCaption.base_caption ?? meta.v4_negative_prompt.caption.base_caption;
                                meta.v4_negative_prompt.caption.char_captions = raw.negCaption.char_captions ?? meta.v4_negative_prompt.caption.char_captions;
                            }
                            if (raw.negative) { meta.uc = raw.negative }

                            const newTxt = new TextEncoder().encode(JSON.stringify(meta));
                            const delta = newTxt.length - oldLen;
                            const out = new Uint8Array(data.length + delta);
                            const head = p + 8 + key.length + 1;

                            out.set(data.subarray(0, head), 0);
                            out.set(newTxt, head);
                            out.set(data.subarray(head + oldLen), head + newTxt.length);

                            const newChunkLen = newTxt.length + key.length + 1;
                            writeUint32(out, p, newChunkLen);
                            const crc = crc32(out, p + 4, 4 + newChunkLen);
                            writeUint32(out, p + 8 + newChunkLen, crc);

                            debugLog('[PresetMgr] PNG metadata patched.');
                            data = out;
                            modified = true;
                        }
                    }
                    p += 12 + readUint32(data, p);
                }
                if (modified) {
                    console.log('[NovelAI Prompt Preset Manager] PNG metadata patching finished.');
                    window.__naiLastPromptData = null;
                    return data.buffer;
                }
                debugLog('[PresetMgr] Target chunk (tEXt with Comment or Description) not found.');
                return null;
            }

            function readUint32(u8, idx) { return (u8[idx] << 24) | (u8[idx+1] << 16) | (u8[idx+2] << 8) | u8[idx+3]; }
            function writeUint32(u8, idx, v) { u8[idx] = v >>> 24; u8[idx+1] = v >>> 16; u8[idx+2] = v >>> 8; u8[idx+3] = v & 0xFF; }
            function crc32(u8, off, len) {
                let c = ~0 >>> 0;
                for (let i = 0; i < len; i++) {
                    c ^= u8[off + i];
                    for (let k = 0; k < 8; k++) c = (c & 1) ? (c >>> 1) ^ 0xEDB88320 : (c >>> 1);
                }
                return (~c) >>> 0;
            }
            })();`;

        const scr = document.createElement('script');
        scr.textContent = patchCode;
        document.documentElement.appendChild(scr);
        scr.remove();
        console.log('[NovelAI Prompt Preset Manager] Patches installed to handle JSON/PNG.');
    }
    updateDict(): void {
        this._dictCache = this.buildDict();
        unsafeWindow.dispatchEvent(
            new CustomEvent('naiPresetUpdate', { detail: this._dictCache })
        );
    }
    getDict(): Record<string, string> {
        return this._dictCache;
    }
}
export const jsonManagerSingleton = new JsonManager();