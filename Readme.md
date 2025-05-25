# NovelAI Prompt Preset Manager

A simple userscript for NovelAI.net/image that allows you to manage and use prompt presets. Streamline your workflow by replacing simple `__tokens__` with extensive prompts and character designs.

## Features

-   **Preset Management**: Create, save, and manage reusable prompt snippets.
-   **Live Autocomplete**: Get live suggestions for your preset names directly in the prompt editor.
-   **Import & Export**: Easily back up and share your entire preset collection as a single `.json` file.
-   **PNG Metadata**: Optionally save the original prompt (with tokens) to the generated PNG's metadata.

## How to Use

### 1. Creating a Preset

A "preset" is a simple token that expands into a larger piece of text.

1.  Navigate to the NovelAI image generation page. The **Prompt Preset Manager** panel will appear below the main prompt inputs.
2.  In the large text area, enter the prompt or text you want to save (e.g., `masterpiece, best quality, cinematic lighting`).
3.  In the "Preset name" input field below it, give your preset a short, memorable name (e.g., `QUALITY-TAGS`).
4.  Click the **ADD** button. Your new preset will appear in the list below.

### 2. Using Presets

-   In any NovelAI prompt box, simply type the name of your preset enclosed in double underscores (e.g., `__my_character__`, `__QUALITY-TAGS__`).
-   When you click "Generate", the script will automatically replace the token with its saved content.

### 3. Autocomplete

-   To get suggestions for your presets, type `__` and begin typing the preset's name (e.g., `__QUAL`).
-   A suggestion box will appear. Use the `Arrow Keys` to navigate and `Tab` or `Space` to select and complete the token.

### 4. Managing Your Presets

-   **Load/Edit/Delete**: In the preset list, check the box next to a name. This will load its content into the text area for editing and also reveal a red `×` button to delete it.
-   **Settings (⚙️)**: Click the gear icon in the top-right of the manager panel to open the settings menu. From here you can:
    -   Import or Export your collection.
    -   Clear all saved presets.
    -   Toggle the **Remain Preset Token** feature. When enabled, the final generated PNG file will contain your *original* prompt (e.g., `1girl, __QUALITY-TAGS__`) in its metadata.
    -   Toggle **Enable Debug Logging** for troubleshooting.

## Credits

-   **JSZip**: This script relies on a specific version of JSZip to handle image metadata correctly. Thank you to the maintainer of the **[JSZip fork on GreasyFork](https://greasyfork.org/en/scripts/473358-jszip)** for providing a working solution where the official library had issues.