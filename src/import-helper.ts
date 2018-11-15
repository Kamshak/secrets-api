import * as bluebird from "bluebird";
import * as changeCase from "change-case";
import * as request from "request-promise-native";

function changeKeysToParamCase(obj: { [name: string]: string }) {
  return Object.entries(obj).reduce((result, [k, v]) => {
    console.log(result, k, v);
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
