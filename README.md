# Easy HTTP Interface to get Runtime Configuration for CI.

To create a new config (needs access to the secrets project in gcloud):
```
gcloud beta runtime-config configs create 'projectname-production'
gcloud beta runtime-config configs create 'projectname-staging'
```

To set variables (Variable names will be transformed from lowercase to uppercase, separated by underscores):
```
gcloud beta runtime-config configs variables set \
    my-variable-name my-value \
    --is-text --config-name projectname-staging
```
Will make MY_VARIABLE_NAME=my-value available.

Meant to be consumed like this:
```
export `curl -H "Accept: text/x-shell-export" https://secrets-service/${PROJECT}/staging -H "Authorization: ${GCP_SERVICE_ACC}"`
```

### Endpoints


#### Reading Configuration in ENV compatible format

**/projects/\<projectname\>**

Authorization: \<JSON Service Account\>

**Returns:**
All stored variables. Pass Accept: text/x-shell-export header to get the variables as shell escaped, space separated variables

