import path from "node:path";
import { defineConfig } from "@rspress/core";
import { pluginObsidianCanvas } from "./src";

export default defineConfig({
  root: path.join(import.meta.dirname, "docs"),
  title: "Rspress X Obsidian Canvas",
  plugins: [pluginObsidianCanvas()],
});
