import * as rcloadenv from "@google-cloud/rcloadenv";
import shellEscape = require("shell-escape");

// Transforms the settings so that they can be used as arguments for the export shell builtin
export function transformForExport(settings: { [name: string]: string }) {
  return Object.entries(settings)
    .map(([name, value]) => {
      const escapedValue = shellEscape([value])[0];
      return `${name}=${escapedValue}`;
    })
    .join(" ");
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
    .then((variables: { [name: string]: string }) => {
      const transformed: { [name: string]: string } = rcloadenv.transform(
        variables
      );

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
