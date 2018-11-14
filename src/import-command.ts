/// <reference path="typings.d.ts">
import { Command, flags as cmdFlags } from "@oclif/command";
import * as dotenv from "dotenv";
import googleAuth = require("google-auto-auth");
import { promisify } from "util";
import { importVars } from "./import-helper";

const auth = googleAuth();
class ImportVarsFromFile extends Command {
  public static args = [{ name: "fileName" }];
  public static id = "";
  public static description =
    "Imports variables from a file in .env format into Google Cloud Runtime Config";

  public async run() {
    const { flags, args } = this.parse(ImportVarsFromFile);
    const authToken = await promisify(auth.getToken).bind(auth)();
    await importVars(
      authToken,
      flags.projectId,
      flags.configName,
      dotenv.parse(args.fileName)
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
    file: cmdFlags.string({
      char: "f",
      description: "A file with one variable per line in format VAR_NAME=value",
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
