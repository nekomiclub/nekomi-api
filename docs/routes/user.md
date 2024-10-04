# USER ENDPOINTS

[HOME](../../README.md)

------------------------------------------------------------------

## GET /user/logout
| VERSION |    CSRF     | ACCESS |
| :-----: | :---------: | :----: |
|  1.3.1  | animee.club |  ---   |

Delete authorization cookie

**RESPONSES**

**200 - Success** <br>
Cookie deleted

```ts
{
  message: 'OK'
}
```

------------------------------------------------------------------

## GET /user/validate
| VERSION |    CSRF     | ACCESS |
| :-----: | :---------: | :----: |
|  1.3.1  | animee.club |  ---   |

Refresh current session & fetch actual data from ```fk-usapi```

**PARAMETERS**

| NAME              | TYPE   | DESCRIPTION          | NOTES |
| ----------------- | ------ | -------------------- | ----- |
| (coookie) SEC_31N | string | Authorization cookie | ---   |

**RESPONSES**

**200 - Success** <br>
Session continued

```ts
{
  message: 'OK'
}
```

**202 - Reject** <br>
Session is not provided

**401 - Session expired** <br>
Session refresh errored. Deletes authorization cookie

------------------------------------------------------------------

## GET /user/:query
| VERSION |  CSRF   | ACCESS  |
| :-----: | :-----: | :-----: |
|  1.3.1  | partial | partial |

Get user. Can parse lib or roles. Can return user by session with "*" as query



**PARAMETERS**

| NAME                 | TYPE    | DESCRIPTION                 | NOTES                          |
| -------------------- | ------- | --------------------------- | ------------------------------ |
| (header) ?CSRF-Token | string  | CSRF Token                  | ---                            |
| (query) ?detailed    | boolean | Return sensetive info       | Require valid animee.club CSRF |
| (query) ?parseRoles  | boolean | Return capabilities         | ---                            |
| (query) ?parseLib    | string  | User lib ID                 | ---                            |
| (query) query        | string  | User query (id or username) | ---                            |

**RESPONSES**

**200 - Private mode** <br>
Return only public data

```ts
{
  message: 'OK',
  user: IUser, // Sensetive data hidden
}
```

**200 - Detailed mode** <br>
Return rich data

```ts
{
  message: 'OK',
  user: IUser, // Sensetive data returned
}
```

**200 - Parse lib** <br>
Parse user library

```ts
{
  message: 'OK',
  user: IUser,
  parsedLib: ITitle[]
}
```

**200 - Parse roles** <br>
Parse user library (till 1.3.2 will be true by default)

```ts
{
  message: 'OK',
  user: IUser,
  parsedCapabilities: TRoleCapability[]
}
```

**401 - Cookie not provided** <br>
User not provide cookie to get by session

**404 - User not found** <br>

------------------------------------------------------------------

## POST /user/signin
| VERSION |    CSRF     | ACCESS |
| :-----: | :---------: | :----: |
|  1.3.1  | animee.club |  ---   |

Authorize user by session & fetch actual user data. Create new user if not found


**PARAMETERS**

| NAME    | TYPE   | DESCRIPTION            | NOTES |
| ------- | ------ | ---------------------- | ----- |
| session | string | fk-usapi session token | ---   |

**RESPONSES**

**200 - Authorized** <br>
Cookie assigned

```ts
{
  message: 'OK',
  id: string,
  username: string,
  avatar: string
}
```

**400 - Payload invalid** <br>
Some payload is not provided

------------------------------------------------------------------

## PATCH /user
| VERSION |    CSRF     | ACCESS |
| :-----: | :---------: | :----: |
|  1.2.3  | animee.club | basic  |

Patch own user instance.



**PARAMETERS**

| NAME          | TYPE             | DESCRIPTION              | NOTES                                       |
| ------------- | ---------------- | ------------------------ | ------------------------------------------- |
| method        | TPatchUserMethod | Patch method             | ---                                         |
| ?titleId      | string           | ---                      | Method - editFolderItem, patchWatchProgress |
| ?folderId     | string           | ---                      | Method - editFolderItem                     |
| ?dubberID     | string           | ---                      | Method - patchWatchProgress                 |
| ?episodeOrder | number           | ---                      | Method - patchWatchProgress                 |
| ?viewtime     | number           | User session viewtime    | Method - patchWatchProgress                 |
| ?progress     | number           | User video progress in s | Method - patchWatchProgress                 |

**editFolderItem** - Add/remove title from specified lib. Will add/remove **new_episode** subscribe on changes in **watching** lib
**patchWatchProgress** - Add new/edit watchProgress record. Syncs player on different devices

**RESPONSES**

**200 - Success** <br>
User patched

```ts
{
  msg: 'OK',
  stack: string
}
```

**400 - Payload invalid** <br>

**404 - Not found** <br>

------------------------------------------------------------------

## POST /user/linkTelegram
| VERSION |      CSRF       | ACCESS |
| :-----: | :-------------: | :----: |
|  1.3.1  | bot.animee.club |  ---   |

Link telegram to animee account.



**PARAMETERS**

| NAME       | TYPE             | DESCRIPTION  | NOTES |
| ---------- | ---------------- | ------------ | ----- |
| method     | TPatchUserMethod | Patch method | ---   |
| animeeID   | string           | ---          | ---   |
| telegramID | number           | ---          | ---   |

**RESPONSES**

**200 - Success** <br>
Linked

```ts
{
  msg: 'OK',
  username: string
}
```

**400 - Account already linked** <br>
Animee account / this telegram account already linked

**404 - Not found** <br>

------------------------------------------------------------------

[HOME](../../README.md)