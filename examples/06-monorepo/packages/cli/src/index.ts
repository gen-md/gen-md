#!/usr/bin/env node
import { Command } from "commander";
import { createConfig, type Config } from "@acme/core";

const program = new Command();

program
  .name("acme")
  .description("Acme Platform CLI")
  .version("1.0.0");

program
  .command("init")
  .description("Initialize a new project")
  .action(() => {
    console.log("Initializing project...");
  });

program
  .command("config")
  .description("Manage configuration")
  .option("-g, --get <key>", "Get config value")
  .option("-s, --set <key=value>", "Set config value")
  .action((options) => {
    const config = createConfig({});
    console.log("Config:", config);
  });

program.parse();
