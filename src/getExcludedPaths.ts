import * as vscode from "vscode";

export function getExcludedPaths() {
  const excludeSettings = vscode.workspace
    .getConfiguration("search")
    .get<{ [k: string]: boolean }>("exclude");

  const paths = excludeSettings
    ? Object.entries(excludeSettings)
        .map(([path, excluded]) => (excluded ? path : undefined))
        .filter((x): x is string => Boolean(x))
        .map((value) => value + "/**")
    : [];

  return paths;
}
