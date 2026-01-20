#!/usr/bin/env node

import { Command } from "commander";
import { compactCommand, cascadeCommand } from "../src/index.js";

const program = new Command();

program
  .name("gen-md")
  .description("gen-md - Generative markdown framework CLI")
  .version("0.1.0");

// Register commands
program.addCommand(compactCommand);
program.addCommand(cascadeCommand);

// Parse arguments
program.parse();
