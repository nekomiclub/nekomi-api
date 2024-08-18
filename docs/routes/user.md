# USER ENDPOINTS

[HOME](../../README.md)

------------------------------------------------------------------

## GET /user/logout
| VERSION |    CSRF     | ACCESS |
| :-----: | :---------: | :----: |
|  1.2.2  | animee.club |  ---   |

Delete authorization cookie



**RESPONSES**

**200 - Success** <br>
Cookie deleted

```ts
{
  msg: 'OK'
}
```

------------------------------------------------------------------

## GET /user/validate
| VERSION |    CSRF     | ACCESS |
| :-----: | :---------: | :----: |
|  1.2.2  | animee.club |  ---   |

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
  msg: 'OK'
}
```

**202 - Reject** <br>
Session is not provided

**401 - Session expired** <br>
Session refresh errored. Deletes authorization cookie

------------------------------------------------------------------

## GET /user/:query
| VERSION | CSRF  | ACCESS |
| :-----: | :---: | :----: |
|  1.2.2  |  ---  |  ---   |

Get user. Can parse lib or roles. Can return user by session with "*" as query



**PARAMETERS**

| NAME                 | TYPE   | DESCRIPTION                 | NOTES                          |
| -------------------- | ------ | --------------------------- | ------------------------------ |
| (header) ?CSRF-Token | string | CSRF Token                  | ---                            |
| (query) ?detailed    | string | Send detailed info          | Require valid animee.club CSRF |
| (query) ?parseLib    | string | User lib ID                 | ---                            |
| (query) query        | string | User query (id or username) | ---                            |

**RESPONSES**

**200 - Private mode** <br>
Return only public data

```ts
{
  msg: 'OK',
  user: IUser,
  parsedCapabilities: null,
  parsedLib: null
}
```

**200 - Detailed mode** <br>
Return rich data

```ts
{
  msg: 'OK',
  user: IUser,
  parsedCapabilities: TRoleCapability[],
  parsedLib: null
}
```

**200 - Parse lib** <br>
Parse user library

```ts
{
  msg: 'OK',
  user: IUser,
  parsedLib: ITitle[]
}
```

**401 - Cookie not provided** <br>
User not provide cookie to get by session

**404 - User not found** <br>

------------------------------------------------------------------

## POST /user/signin
| VERSION |    CSRF     | ACCESS |
| :-----: | :---------: | :----: |
|  1.2.2  | animee.club |  ---   |

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
  msg: 'OK',
  id: string,
  username: string,
  avatar: string
}
```

**400 - Payload invalid** <br>
Some payload is not provided

------------------------------------------------------------------

## PATCH /user
| VERSION |               CSRF               | ACCESS |
| :-----: | :------------------------------: | :----: |
|  1.2.2  | updater.animee.club, animee.club | basic  |

Patch own user instance



**PARAMETERS**

| NAME      | TYPE             | DESCRIPTION          | NOTES                     |
| --------- | ---------------- | -------------------- | ------------------------- |
| method    | TPatchUserMethod | Patch method         | ---                       |
| ?titleId  | string           | Title to patch       | Method - editFolderItem   |
| ?folderId | string           | Lib to patch         | Method - editFolderItem   |
| ?viewtime | number           | Increase viewtime by | Method - increaseViewtime |

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
User, title or lib

------------------------------------------------------------------

[HOME](../../README.md)