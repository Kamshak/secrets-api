/// <reference path="typings.d.ts">
import { Command, flags as cmdFlags } from "@oclif/command";
import * as dotenv from "dotenv";
import { readFileSync } from "fs";
import googleAuth = require("google-auto-auth");
import { promisify } from "util";
import { importVars } from "./import-helper";

const auth = googleAuth();
class ImportVarsFromFile extends Command {
  public static args = [
    {
      description: "A file with one variable per line in format VAR_NAME=value",
      name: "fileName"
    }
  ];
  public static id = "";
  public static description =
    "Imports variables from a file in .env format into Google Cloud Runtime Config";

  public async run() {
    const { flags, args } = this.parse(ImportVarsFromFile);
    const authToken = await promisify(auth.getToken).bind(auth)();
    const contents = readFileSync(args.fileName, "utf-8");
    await importVars(
      authToken,
      flags.projectId,
      flags.configName,
      dotenv.parse(contents)
    );
  }
}

export async function run() {
  const projectId = await promisify(auth.getProjectId).bind(auth)();

  ImportVarsFromFile.flags = {
    configName: cmdFlags.string({
      char: "c",
      description:
        "The config name of the Runtime Config configuration where the values should be written to",
      required: true
    }),
    help: cmdFlags.help(),
    projectId: cmdFlags.string({
      char: "p",
      default: projectId,
      required: true
    }),
    version: cmdFlags.version()
  };

  await ImportVarsFromFile.run();
}
