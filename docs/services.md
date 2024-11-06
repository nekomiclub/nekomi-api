### SERVICES

[HOME](../README.md)

- [Notify Service](#notify-service)
- [Logger Service](#logger-service)
- [Error Service](#error-service)
- [Token Service](#token-service)

------------------------------------------------------------------

## Notify Service
Notification service, find users by subscribe ```{event}/{data}```. Main instance is ```Notify``` in **index.ts**.
You can read about methods in it's file.

**Notify methods**
```new_episode``` - Notify users about new anime episode uploaded. *Will be delivered in Telegram*
Will sort users who have connected telegram. Event will be sent to users that have watched anime in uploaded dubbing.
Subscribe will be synced with **watching** lib (if title added, subscribe will be added also)

```airing_started``` - Notify users about anime airing started. *Will be delivered in Telegram*
Event will be sent on first uploaded episode on title that have **announcement/ongoing** status and **current year**
Subscribe will be synced with **plans** lib (if title added, subscribe will be added also).
Subscribe will be removed after first fire

------------------------------------------------------------------

## Logger Service
Log everything happened in the server. Main instance is ```Notify``` in **index.ts**.
You can read about methods in it's file.

Every log stored in **logs/.log**
**Error/Fail** logs stored in **logs/error.log**
**Suspicious** logs stored in **logs/suspicious.log**


Method ```test()``` will run once all logs methods except **suspicious**

## Error Service
Error service provides HTTP error constructor & HTTP error instances & route errors handler
Route error handler ```HandleRoute``` will catch and process every route error. 
If error is instance of ```HTTPErrorConstructor```, will return it's payload
If error is instance of ```AxiosError```, will return response data and reqURL with hidden local IP
If error is unknown, will return it's message and write this error in logs

## Token Service
Provides decoding JWT token & signing api.nekomi.club CSRF token. Will be refactored in class in next patches

------------------------------------------------------------------

[HOME](../README.md)
