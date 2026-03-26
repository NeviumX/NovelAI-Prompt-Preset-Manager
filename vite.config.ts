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
            'zh':'NovelAI Prompt Preset / Wildcards Manager',
            'es':'NovelAI Prompt Preset / Wildcards Manager',
            'id':'NovelAI Prompt Preset / Wildcards Manager',
            'pt':'NovelAI Prompt Preset / Wildcards Manager',
        },
        namespace: 'https://github.com/NeviumX/NovelAI-Prompt-Preset-Manager',
        version: '1.4.6',
        description: {
            '':'Script to replace __TOKEN__ with any prompt you want before making a request to the NovelAI API. Also adds a UI to manage presets and wildcards on the image generation page.',
            'ja': 'NovelAI の API にリクエストを行う前に、__TOKEN__ を任意のプロンプトに置き換えるスクリプト。プリセットやワイルドカードを管理するためのUIも画像生成ページに追加します。',
            'zh': 'NovelAI 的 API 在請求之前，將 __TOKEN__ 替換為您想要的任何提示詞。還會在圖片生成頁面添加一個 UI 來管理預設和通配詞。',
            'es': 'Script para reemplazar __TOKEN__ con cualquier prompt que desees antes de hacer una solicitud a la API de NovelAI. También agrega una UI para gestionar los presets y wildcards en la página de generación de imágenes.',
            'id': 'Script untuk mengganti __TOKEN__ dengan prompt yang Anda inginkan sebelum membuat permintaan ke API NovelAI. Juga menambahkan UI untuk mengelola presets dan wildcards di halaman generasi gambar.',
            'pt': 'Script para substituir __TOKEN__ com qualquer prompt que você desejar antes de fazer uma requisição à API da NovelAI. Também adiciona uma UI para gerenciar presets e wildcards na página de geração de imagens.',
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