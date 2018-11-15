import * as rcloadenv from "@google-cloud/rcloadenv";
import * as changeCase from "change-case";
import { parse } from "path";
import shellEscape = require("shell-escape");

// Transforms the settings so that they can be used as arguments for the export shell builtin
export function transformForExport(settings: { [name: string]: string }) {
  return Object.entries(settings)
    .map(([name, value]) => {
      const escapedValue = shellEscape([value]);
      return `export ${name}=${escapedValue}`;
    })
    .join("\n");
}

export function transformVarialbesToEnvCase(settings: rcloadenv.Variables) {
  return settings.reduce((acc, variable) => {
    const name = parse(variable.name).base.replace("-", "_");
    const key = changeCase.snakeCase(name).toUpperCase();
    let value;
    if ("text" in variable) {
      value = variable.text;
    } else {
      value = Buffer.from(variable.value, "base64").toString();
    }
    acc[key] = value;
    return acc;
  }, {});
}

export function get(
  req: import("express").Request,
  res: import("express").Response
) {
  const projectId = req.params.projectId;
  if (!projectId) {
    res.status(400).send("Missing project name");
    return;
  }

  const configName = req.params.configName;
  if (!configName) {
    res.status(400).send("Missing config name");
    return;
  }

  const authHeader = req.header("authorization");
  if (!authHeader) {
    res.status(401).send("Missing Authorization Header");
    return;
  }

  let credentials;
  try {
    credentials = JSON.parse(authHeader.replace("Bearer ", ""));
    credentials["project_id"] = projectId;
  } catch (e) {
    res
      .status(401)
      .send("Invalid Authorization Header (should be JSON service account)");
    return;
  }

  rcloadenv
    .getVariables(configName, {
      credentials,
      projectId
    })
    .then(variables => {
      const transformed: {
        [name: string]: string;
      } = transformVarialbesToEnvCase(variables);

      if (req.accepts("text/x-shell-export")) {
        res.send(transformForExport(transformed));
      } else {
        res.send(transformed);
      }
    })
    .catch((e: Error) => {
      console.error(
        `Error fetching variables for ${projectId}/${configName}`,
        e
      );
      res.status(500).send(`${e.name}: ${e.message}`);
    });
}
