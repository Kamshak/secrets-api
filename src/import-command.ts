/// <reference path="typings.d.ts">
import { Command, flags as cmdFlags } from "@oclif/command";
import * as dotenv from "dotenv";
import googleAuth = require("google-auto-auth");
import { promisify } from "util";
import { importVars } from "./import-helper";

const auth = googleAuth();
class ImportVarsFromFile extends Command {
  public static args = [{ name: "fileName" }];

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
      required: true
    }),
    file: cmdFlags.string({
      char: "f"
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
