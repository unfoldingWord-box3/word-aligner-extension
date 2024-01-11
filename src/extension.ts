import { commands, ExtensionContext } from "vscode";
import { WordAlignerPanel } from "./panels/WordAlignerPanel";

export function activate(context: ExtensionContext) {
  // Create the show Word Aligner command
  const showWordAlignerPanelCommand = commands.registerCommand("word-aligner.showWordAligner", () => {
    WordAlignerPanel.render(context.extensionUri);
  });

  // Add command to the extension context
  context.subscriptions.push(showWordAlignerPanelCommand);
}
