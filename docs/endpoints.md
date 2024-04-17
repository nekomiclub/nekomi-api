## ENDPOINTS
### [Return](../README.md)

## Title Controller

--------------------------------------------------------------

### GET /v1/title/:query
[Back to tree](./tree.md)

Get title with code or id


| DEPRECATED | CSRF  | CORS  | CAPS  | VERSION | TEST COVERED |
| :--------: | :---: | :---: | :---: | :-----: | :----------: |
|   false    | false |   *   |   -   |  1.0.3  |    false     |

#### Params
| NAME  | TYPE   | DESCRIPTION |
| ----- | ------ | ----------- |
| query | string | Code or id  |

#### Success response
- Code: 200
- Body: ITitle

#### Error response
- Code: 404
- Body: Title is not found

--------------------------------------------------------------

### GET /v1/titles
[Back to tree](./tree.md)

Get titles in range.


|  DEPRECATED  | CSRF  | CORS  | CAPS  | VERSION | TEST COVERED |
| :----------: | :---: | :---: | :---: | :-----: | :----------: |
| true (1.1.2) | false |   *   |   -   |  1.0.3  |    false     |

#### Params
| NAME  | TYPE               | DESCRIPTION                |
| ----- | ------------------ | -------------------------- |
| limit | number / undefined | Set results limit (max 30) |
| page  | number / undefined | Set results page           |

#### Success response
- Code: 200
- Body:
```ts
{
  results: ITitle,
  total: number // Total titles count in DB
}
```

#### Error response
- Code: 400
- Body: Page can not be NaN / Limit can not be NaN

--------------------------------------------------------------

### GET /v1/titles/search
[Back to tree](./tree.md)

Search titles with name, code or id.

**Will be refactored in 1.1.2**


|     DEPRECATED     | CSRF  | CORS  | CAPS  | VERSION | TEST COVERED |
| :----------------: | :---: | :---: | :---: | :-----: | :----------: |
| true (since 1.1.2) | false |   *   |   -   |  1.0.3  |    false     |

#### Params
| NAME  | TYPE               | DESCRIPTION                      |
| ----- | ------------------ | -------------------------------- |
| query | string             | Title names, code or id          |
| props | string / undefined | Title props (year, country, etc) |
| page  | number / undefined | May not take affect              |
| limit | number / undefined | May not take affect              |

#### Success response
- Code: 200
- Body:
```ts
{
  results: ITitle
}
```

#### Error response
- Code: 500
- Body: Search is not ready. Try again in few minutes

--------------------------------------------------------------

### GET /v1/titles/total
[Back to tree](./tree.md)

Get total count of titles & renewed (where country != 'null')


| DEPRECATED | CSRF  | CORS  | CAPS  | VERSION | TEST COVERED |
| :--------: | :---: | :---: | :---: | :-----: | :----------: |
|   false    | false |   *   |   -   |  1.0.3  |    false     |

#### Params
| NAME | TYPE | DESCRIPTION |
| ---- | ---- | ----------- |
| -    | -    | -           |

#### Success response
- Code: 200
- Body:
```ts
{
  total: number, // Total titles in DB
  renewed: number // Titles where country != 'null'
}
```

#### Error response

--------------------------------------------------------------

### PATCH /v1/title
[Back to tree](./tree.md)

Update title. Replaces EVERY FIELD PROVIDED.

**MUST BE REFACTORED in 1.1.0 due to dangerous impact (all provided keys will replace present data)**

|    DEPRECATED     | CSRF  |     CORS      |                     CAPS                     | VERSION | TEST COVERED |
| :---------------: | :---: | :-----------: | :------------------------------------------: | :-----: | :----------: |
| true (till 1.1.0) | true  | *.animee.club | titleEdit, titleEditEpsMeta, titleEditLinked |  1.0.3  |    false     |

#### Params
| NAME     | TYPE   | DESCRIPTION                         |
| -------- | ------ | ----------------------------------- |
| ...props | ITitle | All of ITitle props must be present |

#### Success response
- Code: 200
- Body: ITitle

#### Error response
- Code: 400
- Body: Validation failed / Title not found

--------------------------------------------------------------

### POST /v1/title
[Back to tree](./tree.md)

Create a new title


| DEPRECATED | CSRF  |     CORS      |   CAPS   | VERSION | TEST COVERED |
| :--------: | :---: | :-----------: | :------: | :-----: | :----------: |
|   false    | true  | *.animee.club | titleAdd |  1.0.3  |    false     |


#### Params
| NAME  | TYPE   | DESCRIPTION                                   |
| ----- | ------ | --------------------------------------------- |
| title | ITitle | Title object (id will generated automaticaly) |

#### Success response
- Code: 200
- Body: ITitle

#### Error response
- Code: 400
- Body: Validation failed / Title is not found

--------------------------------------------------------------

### DELETE /v1/title
[Back to tree](./tree.md)

Delete title


| DEPRECATED | CSRF  |     CORS      |    CAPS     | VERSION | TEST COVERED |
| :--------: | :---: | :-----------: | :---------: | :-----: | :----------: |
|   false    | true  | *.animee.club | titleDelete |  1.0.3  |    false     |

#### Params
| NAME | TYPE   | DESCRIPTION |
| ---- | ------ | ----------- |
| id   | string | Title id    |

#### Success response
- Code: 200
- Body: 'ok'

#### Error response
- Code: 404
- Body: Title is not found

--------------------------------------------------------------

## User Controller (1.1.0)

--------------------------------------------------------------

### POST /user/signin
[Back to tree](./tree.md)

Authorize user & get session cookie

| DEPRECATED | CSRF  |    CORS     | CAPS  | VERSION | TEST COVERED |
| :--------: | :---: | :---------: | :---: | :-----: | :----------: |
|   false    | false | animee.club |   -   |  1.1.0  |     true     |

#### Params
| NAME    | TYPE   | DESCRIPTION                  |
| ------- | ------ | ---------------------------- |
| session | string | Fullkekw usapi session token |

#### Success response
- Code: 200
- Body: Ok

#### Error response
- Code: 400
- Body: Payload invalid

--------------------------------------------------------------

### GET /user/logout
[Back to tree](./tree.md)

Remove session cookie

| DEPRECATED | CSRF  |    CORS     | CAPS  | VERSION | TEST COVERED |
| :--------: | :---: | :---------: | :---: | :-----: | :----------: |
|   false    | false | animee.club |   -   |  1.1.0  |  Not needed  |

#### Success response
- Code: 200
- Body: Ok

### Notes
In dev mode session verifying will be skipped

--------------------------------------------------------------

### GET /user/:query
[Back to tree](./tree.md)

Get user with query (username or id)

| DEPRECATED | CSRF  |     CORS      | CAPS  | VERSION | TEST COVERED |
| :--------: | :---: | :-----------: | :---: | :-----: | :----------: |
|   false    | false | *.animee.club |   -   |  1.1.0  |    false     |

#### Params
| NAME  | TYPE   | DESCRIPTION    |
| ----- | ------ | -------------- |
| query | string | username or id |

#### Success response
- Code: 200
- Body: IUser (after DTO)

#### Error response
- Code: 404
- Body: User is not found

--------------------------------------------------------------

### PATCH /user/:id
[Back to tree](./tree.md)

Update user. User can update only own info, staff can edit any user info

| DEPRECATED | CSRF  |     CORS      |           CAPS           | VERSION | TEST COVERED |
| :--------: | :---: | :-----------: | :----------------------: | :-----: | :----------: |
|   false    | true  | *.animee.club | basic, staffEditUserInfo |  1.1.0  |    false     |


#### Methods (Describes TMethod)
| NAME           | DESCRIPTION                      |
| -------------- | -------------------------------- |
| editFolderItem | Adds / removes title from folder |
| editBio        | Edits bio (username, avatar)     |
| editBackground | Set new background               |
| editPassword   | Edit password                    |

#### Params
| NAME       | TYPE                      | METHOD         |
| ---------- | ------------------------- | -------------- |
| id         | string                    | None / User id |
| method     | TMethod                   | None           |
| titleId    | string / undefined        | editFolderItem |
| folderId   | string / undefined        | editFolderItem |
| username   | string / null / undefined | editBio        |
| bio        | string / null / undefined | editBio        |
| avatar     | string / null / undefined | editBio        |
| background | string / undefined        | editBackground |
| oldPwd     | string / undefined        | editPassword   |
| newPwd     | string / undefined        | editPassword   |


#### Success response
- Code: 205
- Body: 'ok'

#### Error response
- Code: 400
- Body: Update payload invalid

<br>

- Code: 401
- Body: You are not authorized

<br>

- Code: 403
- Body: You are not permitted

<br>

- Code: 404
- Body: User is not found
--------------------------------------------------------------

### DELETE /user/:id
[Back to tree](./tree.md)

Delete user. User can delete only own account, staff can delete any account

| DEPRECATED | CSRF  |     CORS      |          CAPS          | VERSION | TEST COVERED |
| :--------: | :---: | :-----------: | :--------------------: | :-----: | :----------: |
|   false    | true  | *.animee.club | basic, staffDeleteUser |  1.1.0  |    false     |

#### Params
| NAME   | TYPE   | DESCRIPTION |
| ------ | ------ | ----------- |
| id     | string | User id     |
| reason | string | Reason      |

#### Success response
- Code: 205
- Body: 'ok'

#### Error response
- Code: 401
- Body: You are not authorized

<br>

- Code: 403
- Body: You are not permitted to do that

<br>

- Code: 404
- Body: User is not found

--------------------------------------------------------------

--------------------------------------------------------------

## Dubber Controller

--------------------------------------------------------------



--------------------------------------------------------------

### GET /v1/dubber/:query
[Back to tree](./tree.md)

Get dubber by name, code or id

| DEPRECATED | CSRF  | CORS  | CAPS  | VERSION | TEST COVERED |
| :--------: | :---: | :---: | :---: | :-----: | :----------: |
|   false    | false |   *   |   -   |  1.0.3  |    false     |

#### Params
| NAME   | TYPE   | DESCRIPTION      |
| ------ | ------ | ---------------- |
| :query | string | Name, code or id |

#### Success response
- Code: 200
- Body: IDubber

#### Error response
- Code: 404

--------------------------------------------------------------

### POST /v1/dubber/parse
[Back to tree](./tree.md)

Get dubbers with array of queries

| DEPRECATED | CSRF  | CORS  | CAPS  | VERSION | TEST COVERED |
| :--------: | :---: | :---: | :---: | :-----: | :----------: |
|   false    | false |   *   |   -   |  1.0.3  |    false     |

#### Params
| NAME    | TYPE     | DESCRIPTION                       |
| ------- | -------- | --------------------------------- |
| queries | string[] | Array of dubbers name, code or id |

#### Success response
- Code: 200
- Body: 
```ts
{
  results: IDubber[]
}
```

#### Error response
Not found dubber will not be included to results array

--------------------------------------------------------------



## Proxy Controller

--------------------------------------------------------------



--------------------------------------------------------------

## Service Controller

--------------------------------------------------------------



--------------------------------------------------------------








### [Return](../README.md)