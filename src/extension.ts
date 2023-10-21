import { globStream } from "glob";
import * as vscode from "vscode";
import * as debounce from "debounce";
import { getExcludedPaths } from "./getExcludedPaths";
import { getWorkspaceRoot } from "./getWorkspaceRoot";

interface FolderQuickPickItem extends vscode.QuickPickItem {
  path: string;
}

export function activate(context: vscode.ExtensionContext) {
  const workspaceRoot = getWorkspaceRoot();
  if (!workspaceRoot) {
    return;
  }

  const excludedPaths = getExcludedPaths();

  let controller = new AbortController();

  const updateQuickOptions = (
    quickPick: vscode.QuickPick<FolderQuickPickItem>,
    value: string
  ) => {
    quickPick.title = "";
    quickPick.items = [];

    if (!value) {
      return;
    }

    quickPick.busy = true;
    controller = new AbortController();

    const searchStream = globStream("/**/*" + value + "*/", {
      ignore: excludedPaths,
      nocase: true,
      root: workspaceRoot,
      signal: controller.signal,
    });

    searchStream.on("data", (path) => {
      quickPick.items = [
        ...quickPick.items,
        {
          label: path.substring(workspaceRoot.length),
          path,
        },
      ];

      if (quickPick.items.length >= 10) {
        quickPick.busy = false;
        controller.abort();
      }
    });

    searchStream.on("end", () => {
      if (quickPick.items.length === 0) {
        quickPick.title = "No matching results";
      }
      quickPick.busy = false;
    });
  };

  const updateQuickOptionsDebounced = debounce(updateQuickOptions, 500);

  let disposable = vscode.commands.registerCommand(
    "goto-folder.go-to-folder",
    () => {
      const quickPick = vscode.window.createQuickPick<FolderQuickPickItem>();
      quickPick.placeholder = "Search folders by name";

      quickPick.onDidAccept(() => {
        controller.abort();
        const selectedItem = quickPick.activeItems[0];

        vscode.commands.executeCommand(
          "revealInExplorer",
          vscode.Uri.file(selectedItem.path)
        );

        quickPick.hide();
      });

      quickPick.onDidChangeValue((value) => {
        controller.abort();
        updateQuickOptionsDebounced.clear();
        updateQuickOptionsDebounced(quickPick, value);
      });

      quickPick.show();
    }
  );

  context.subscriptions.push(disposable);
}

export function deactivate() {}
