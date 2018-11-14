/// <reference path="typings.d.ts">

import { Command, flags as cmdFlags } from "@oclif/command";
import * as bluebird from "bluebird";
import * as changeCase from "change-case";
import * as dotenv from "dotenv";
import googleAuth = require("google-auto-auth");
import * as request from "request-promise-native";
import { promisify } from "util";

function changeKeysToParamCase(obj: { [name: string]: string }) {
  return Object.entries(obj).reduce((result, [k, v]) => {
    result[changeCase.paramCase(k)] = v;
    return result;
  }, {});
}

export async function importVars(
  authToken: string,
  projectId: string,
  configName: string,
  obj: any
) {
  const prepared = changeKeysToParamCase(obj);

  const client = request.defaults({
    baseUrl: "https://runtimeconfig.googleapis.com/v1beta1/",
    headers: {
      Authorization: `Bearer ${authToken}`
    },
    json: true
  });

  return await bluebird.map(Object.entries(prepared), async ([k, v]) => {
    const variable = {
      name: `projects/${projectId}/configs/${configName}/variables/${k}`,
      text: v
    };

    try {
      await client.post(
        `projects/${projectId}/configs/${configName}/variables`,
        {
          body: variable
        }
      );
    } catch (e) {
      if (e.response.statusCode === 409) {
        await client.put(
          `projects/${projectId}/configs/${configName}/variables/${k}`,
          {
            body: variable
          }
        );
      } else {
        throw e;
      }
    }

    return k;
  });
}

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

promisify(auth.getProjectId)
  .bind(auth)()
  .then((projectId: string) => {
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

    ImportVarsFromFile.run().then(() => {
      //
    }, require("@oclif/errors/handle"));
  });
