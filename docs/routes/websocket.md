### WebSocket

[HOME](../README.md)

- [Requests](#requests)
  - [ping](#ping)
  - [site\_connected](#site_connected)
  - [site\_disconnected](#site_disconnected)
  - [online\_poll](#online_poll)
- [Responses](#responses)
  - [pong](#pong)
  - [ok](#ok)
  - [error](#error)
  - [online\_changed](#online_changed)

------------------------------------------------------------------

See ```Request/Response``` interfaces in ```interfaces/WebSocket.ts```. 

## Requests

### ping
- Ping/Pong request
- Payload: none
- Return: **pong**

### site_connected
- Site new client connected
- Payload: SID:string (site session ID)
- Return: ```broadcast``` **online_changed**

### site_disconnected
- Site client disconnected (remove SID)
- Payload: SID:string (see site_connected)
- Return: ```broadcast``` **online_changed**

### online_poll
- (Server-side) Poll clients about their connection. Client must send back **site_connected** event *Will reset current OnlineClients*
- Payload: none
- Return: none

## Responses

### pong
- Result of **ping** event

### ok
- Something processed successfully

### error
- Something processed with error. Response will be same as ```HandleRoute```

### online_changed
- (Server-side) Site online changed. Client must update own state with current
- Payload: online:number

------------------------------------------------------------------

[HOME](../README.md)