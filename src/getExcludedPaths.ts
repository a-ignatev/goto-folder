import vscode from "vscode";

export function getExcludedPaths() {
  const excludeSettings = vscode.workspace
    .getConfiguration("search")
    .get<Record<string, boolean>>("exclude");

  return excludeSettings
    ? Object.entries(excludeSettings)
        .map(([path, excluded]) => (excluded ? path : undefined))
        .filter((path): path is string => Boolean(path))
        .map((path) => path + "/**")
    : [];
}
