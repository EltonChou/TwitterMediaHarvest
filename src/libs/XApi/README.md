# XApi

## Login workflow

1. Get guest token from `https://api.twitter.com/1.1/guest/activate.json`.
2. Initialize flow `task.json/flow_name=login` with guest token. Get `flow_token` from response body.
3. Complete task `LoginJsInstrumentaionSubtask` with flow-token payload. (flow: 0)
4. Complete task `LoginEnterUserIdentifierSSO`. (flow: 1)
5. Complete task `LoginEnterPassword`. (flow: 7)
6. Complete task `AccountDuplicationCheck`. (flow: 8)
