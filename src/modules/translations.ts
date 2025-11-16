export const messageTranslations = {
    'en': {
        doubleUnderscoreError: '[NovelAI Prompt Preset Manager]\nERROR: Do not use double-underscore (__) to the preset name.\n\nThis symbol should only be used to enclose actual preset tokens.',
        importFailure: '[NovelAI Prompt Preset Manager]\nFailed to import: ',
        confirmDeletePreset: '[NovelAI Prompt Preset Manager]\nDelete preset?: ',
        confirmDeleteAllPresets: '[NovelAI Prompt Preset Manager]\nDelete ALL saved presets?',
        allPresetsDeleted: '[NovelAI Prompt Preset Manager]\nAll presets deleted.',
    },
    'ja': {
        doubleUnderscoreError: '[NovelAI Prompt Preset Manager]\nエラー: プリセット名にダブルアンダースコア (__) を使用しないでください。\n\nこの記号は、実際のプリセットトークンを囲むときだけに使用する必要があります。',
        importFailure: '[NovelAI Prompt Preset Manager]\nインポートに失敗しました: ',
        confirmDeletePreset: '[NovelAI Prompt Preset Manager]\nプリセットを削除しますか？: ',
        confirmDeleteAllPresets: '[NovelAI Prompt Preset Manager]\n保存されているすべてのプリセットを削除しますか？',
        allPresetsDeleted: '[NovelAI Prompt Preset Manager]\nすべてのプリセットが削除されました。',
    },
}

export const uiMessageTranslations = {
    'en': {
        presetNameError: 'The preset name contains invalid characters.',
        presetLengthError: 'The preset name is too long.',
        tooltipEnableDebugLog: 'Outputs debug logs to the console. Can be checked from devtools.',
        tooltipRemainToken: 'Sets whether to leave the preset token in the metadata.',
        popupPresetAdded: 'Preset added.⇒ ',
        popupPresetUpdated: 'Preset updated.⇒ ',
    },
    'ja': {
        presetNameError: 'プリセット名に使用できない文字が含まれています。',
        presetLengthError: 'プリセット名が長すぎます。',
        tooltipEnableDebugLog: 'コンソールにデバッグログを出力します。devtoolsから確認できます。',
        tooltipRemainToken: 'メタデータにプリセットトークンを残すかどうかを設定します。',
        popupPresetAdded: 'プリセットが追加されました。⇒ ',
        popupPresetUpdated: 'プリセットが更新されました。⇒ ',
    },
}