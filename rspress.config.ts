import * as path from "path";
import { defineConfig } from "@rspress/core";
import { pluginObsidianCanvas } from "./src";

export default defineConfig({
  root: path.join(__dirname, "docs"),
  title: "Rspress X Obsidian Canvas",
  plugins: [pluginObsidianCanvas()],
});
