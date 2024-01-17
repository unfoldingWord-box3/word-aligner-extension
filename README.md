# Word Aligner Demo
This is a stand-along Word Alignment App that is packaged as a webview within a VsCode extension.  Makes use of the word-aligner-rcl (a react component).  Also demonstrates using messaging between webview and extension to access file system and persist preferences.  Uses vscode components in place of material UI components.

## Documentation
This is a mono repo.  The extension is defined in the base folder, and the Word Aligner webview is devined in `webview-ui`

**Key files:**
- src/panels/WordAlignerPanel.ts
  - launches the webview and listens for messages from the webview
- webview-ui/src/App.tsx
  - the Word aligner webview app

## Run The Sample

```bash
# Install dependencies for both the extension and webview UI source code
npm run install:all

# Build webview UI source code
npm run build:webview

# Open sample in VS Code
code .
```

Once the sample is open inside VS Code you can run the extension by doing the following:

1. Press `F5` to open a new Extension Development Host window
2. Inside the host window, open the command palette (`Ctrl+Shift+P` or `Cmd+Shift+P` on Mac) and type `Word Aligner Demo: Show`
