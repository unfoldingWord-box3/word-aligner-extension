import { vscode } from "./utilities/vscode";
import { VSCodeButton } from "@vscode/webview-ui-toolkit/react";
import "./App.css";
import { WordAlignerDialog } from "./components/WordAlignerDialog";
import { FileInput, LoadedFileType } from "./components/FileInput";
import React from "react";

console.log("starting app")

function onAlignedBibleLoad(data: LoadedFileType): void {
  console.log('onAlignedBibleLoad data', data?.fileData?.substring(0, 100))
}

function onOriginalBibleLoad(data: LoadedFileType): void {
  console.log('onOriginalBibleLoad data', data?.fileData?.substring(0, 100))
}

function App() {
  function handleHowdyClick() {
    vscode.postMessage({
      command: "hello",
      text: "Hey there partner! 🤠",
    });
  }

  return (
    <main>
      <h1>Word Aligner Demo</h1>
      <WordAlignerDialog />
      <div style={{"height": "40px"}}></div>
      <FileInput
        onFileLoad={onAlignedBibleLoad}
        title={"Open Aligned Bible Book USFM"}
        open={true}
      />
      <FileInput
        onFileLoad={onOriginalBibleLoad}
        title={"Open Original Bible Book USFM"}
        open={true}
      />
      {/* <VSCodeButton onClick={handleHowdyClick}>Howdy!</VSCodeButton> */}
    </main>
  );
}

export default App;
