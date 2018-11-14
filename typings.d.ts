declare module 'shell-escape' {
  declare function shellEscape(args: string[]) : string[];
  export = shellEscape;
}


declare module '@google-cloud/rcloadenv' {
  type Variables = { [name: string]: string };
  declare export function getVariables(configName: string, opts?: any): Promise<Variables>;
  declare export function transform(variables: Variables, oldEnv?: object, opts?: any): Variables;
}

declare module 'google-auto-auth' {
  declare function autoAuth(otps?: any): any;
  export = autoAuth;
}