import { defineConfig } from 'vite';
import monkey from 'vite-plugin-monkey';

export default defineConfig({
  plugins: [
    monkey({
      entry: 'src/main.ts',
      userscript: {
        name: {
            '':'NovelAI Prompt Preset / Wildcards Manager',
            'ja':'NovelAI Prompt Preset / Wildcards Manager',
        },
        namespace: 'https://github.com/NeviumX/NovelAI-Prompt-Preset-Manager',
        version: '1.3.9',
        description: {
            '':'Script to replace __TOKEN__ with any prompt you want before making a request to the NovelAI API. Also adds a UI to manage presets and wildcards on the image generation page.',
            'ja': 'NovelAI の API にリクエストを行う前に、__TOKEN__ を任意のプロンプトに置き換えるスクリプト。プリセットやワイルドカードを管理するためのUIも画像生成ページに追加します。',
        },
        author: 'Nevium7, Gemini 2.5 Pro',
        copyright: 'Nevium7',
        icon: 'https://novelai.net/icons/novelai-round.png',
        license: 'MIT',
        match: 'https://novelai.net/*',
        grant: [
          'GM_getValue',
          'GM_setValue',
          'GM_addStyle',
          'GM_listValues',
          'GM_deleteValue',
          'unsafeWindow',
        ],
        require: [
          'https://update.greasyfork.org/scripts/473358/1237031/JSZip.js',
          'https://cdn.jsdelivr.net/npm/@msgpack/msgpack@3.1.2/dist.umd/msgpack.min.js'
        ],
      },
      build: {
        externalGlobals: {
          'jszip': 'JSZip',
          '@msgpack/msgpack': 'MessagePack',
        },
      },
      align: 4,
    }),
  ],
});