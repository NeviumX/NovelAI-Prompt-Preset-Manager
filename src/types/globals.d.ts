import JZ from 'jszip';
import * as MP from '@msgpack/msgpack';
import { ProseMirrorObserver } from '../modules/ProseMirrorObserver';
import { PromptBoxObserver } from '../modules/PromptBoxObserver';

declare global {
  const JSZip: typeof JZ;
  const MessagePack: typeof MP;

  interface Window {
    JSZip: typeof JZ;
    MessagePack: typeof MP;
    __userLang: String;
    __naiPmObserver?: ProseMirrorObserver;
    __naiPromptObserver?: PromptBoxObserver;
    
    __naiPresetDict: Record<string, string>;
    __naiRemain: boolean;
    __naiDebugMode: boolean;
    __naiLastPromptData?: object;
  }
}
export {};