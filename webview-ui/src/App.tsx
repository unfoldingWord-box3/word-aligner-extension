import { vscode } from "./utilities/vscode";
import { VSCodeButton } from "@vscode/webview-ui-toolkit/react";
import "./App.css";
import { WordAlignerDialog } from "./components/WordAlignerDialog";

console.log("starting app")

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
      {/* <VSCodeButton onClick={handleHowdyClick}>Howdy!</VSCodeButton> */}
    </main>
  );
}

export default App;
