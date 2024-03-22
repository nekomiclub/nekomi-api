## ENDPOINTS
### [Return](../README.md)

## Title Controller

--------------------------------------------------------------

### GET /v1/title/:query
[Back to tree](./tree.md)
| DEPRECATED | CSRF  | CORS  | CAPS  | VERSION | TEST COVERED |
| :--------: | :---: | :---: | :---: | :-----: | :----------: |
|   false    | false |   *   |   -   |  1.0.3  |     true     |

Get title with query (code or id)

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
|  DEPRECATED  | CSRF  | CORS  | CAPS  | VERSION | TEST COVERED |
| :----------: | :---: | :---: | :---: | :-----: | :----------: |
| true (1.1.2) | false |   *   |   -   |  1.0.3  |     true     |

Get titles in range.

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
|  DEPRECATED  | CSRF  | CORS  | CAPS  | VERSION | TEST COVERED |
| :----------: | :---: | :---: | :---: | :-----: | :----------: |
| true (1.1.2) | false |   *   |   -   |  1.0.3  |     true     |

Search titles with query

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
| DEPRECATED | CSRF  | CORS  | CAPS  | VERSION | TEST COVERED |
| :--------: | :---: | :---: | :---: | :-----: | :----------: |
|   false    | false |   *   |   -   |  1.0.3  |     true     |

Get total titles

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
|    DEPRECATED    | CSRF  |     CORS      |                     CAPS                     | VERSION | TEST COVERED |
| :--------------: | :---: | :-----------: | :------------------------------------------: | :-----: | :----------: |
| true (due 1.1.0) | true  | *.animee.club | titleEdit, titleEditEpsMeta, titleEditLinked |  1.0.3  |    false     |

Update title. Replaces EVERY FIELD PROVIDED.

**MUST BE REFACTORED in 1.1.0 due to dangerous impact**

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
| DEPRECATED | CSRF  |     CORS      |   CAPS   | VERSION | TEST COVERED |
| :--------: | :---: | :-----------: | :------: | :-----: | :----------: |
|   false    | true  | *.animee.club | titleAdd |  1.0.3  |    false     |

Create a title

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
| DEPRECATED | CSRF  |     CORS      |    CAPS     | VERSION | TEST COVERED |
| :--------: | :---: | :-----------: | :---------: | :-----: | :----------: |
|   false    | true  | *.animee.club | titleDelete |  1.0.3  |    false     |

Delete title

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

## User Controller

--------------------------------------------------------------

### GET /user/:query
[Back to tree](./tree.md)
| DEPRECATED | CSRF  |     CORS      | CAPS  | VERSION | TEST COVERED |
| :--------: | :---: | :-----------: | :---: | :-----: | :----------: |
|   false    | false | *.animee.club |   -   |  1.1.0  |    false     |

Get user with query (username or id)

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

### POST /user
[Back to tree](./tree.md)
| DEPRECATED | CSRF  |     CORS      | CAPS  | VERSION | TEST COVERED |
| :--------: | :---: | :-----------: | :---: | :-----: | :----------: |
|   false    | true  | *.animee.club |   -   |  1.1.0  |    false     |

Create a new user via fullkekw account

#### Params
| NAME  | TYPE   | DESCRIPTION  |
| ----- | ------ | ------------ |
| id    | string | User id      |
| token | string | Access token |

#### Success response
- Code: 201
- Body:
```ts
{
  msg: "Account created",
  id: string,
  token: string
}
```

#### Error response
- Code: 400
- Body: Validation failed / Registration denied

--------------------------------------------------------------

### PATCH /user/:id
[Back to tree](./tree.md)
| DEPRECATED | CSRF  |     CORS      | CAPS  | VERSION | TEST COVERED |
| :--------: | :---: | :-----------: | :---: | :-----: | :----------: |
|   false    | true  | *.animee.club | basic |  1.1.0  |    false     |

Update user. 

#### Methods (Describes TMethod)
| NAME           | DESCRIPTION                      |
| -------------- | -------------------------------- |
| editFolder     | Adds / removes title from folder |
| editBio        | Edits bio (username, avatar)     |
| editBackground | Set new background               |
| editPassword   | Edit password                    |

#### Params
| NAME       | TYPE                      | METHOD         |
| ---------- | ------------------------- | -------------- |
| id         | string                    | None / User id |
| method     | TMethod                   | None           |
| titleId    | string / undefined        | editFolder     |
| folderId   | string / undefined        | editFolder     |
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
| DEPRECATED | CSRF  |     CORS      | CAPS  | VERSION | TEST COVERED |
| :--------: | :---: | :-----------: | :---: | :-----: | :----------: |
|   false    | true  | *.animee.club | basic |  1.1.0  |    false     |

Delete user

#### Params
| NAME | TYPE   | DESCRIPTION |
| ---- | ------ | ----------- |
| id   | string | User id     |

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

## Authorization Controller (1.1.0)

--------------------------------------------------------------

### GET /auth/refresh
[Back to tree](./tree.md)
| DEPRECATED | CSRF  |     CORS      | CAPS  | VERSION | TEST COVERED |
| :--------: | :---: | :-----------: | :---: | :-----: | :----------: |
|   false    | true  | *.animee.club |   -   |  1.1.0  |    false     |

Refresh access

#### Params
| NAME         | TYPE          | DESCRIPTION                              |
| ------------ | ------------- | ---------------------------------------- |
| refreshToken | cookie/string | Refresh token issued from fullkekw-usapi |

#### Success response
- Code: 200
- Body:
```ts
{
  token: string
}
```

#### Error response
- Code: 400
- Body: Token is invalid

<br>

- Code: 401
- Body: Token is not provided

<br>

- Code: 403
- Body: Refresh forbidden (pwd has changed for eg)

<br>

- Code: 404
- Body: Account is no longer available

--------------------------------------------------------------

## Dubber Controller

--------------------------------------------------------------



--------------------------------------------------------------

### GET /v1/dubber/:query
[Back to tree](./tree.md)
| DEPRECATED | CSRF  | CORS  | CAPS  | VERSION | TEST COVERED |
| :--------: | :---: | :---: | :---: | :-----: | :----------: |
|   false    | false |   *   |   -   |  1.0.3  |    false     |

Get dubber by query (name/code/id)

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
| DEPRECATED | CSRF  | CORS  | CAPS  | VERSION | TEST COVERED |
| :--------: | :---: | :---: | :---: | :-----: | :----------: |
|   false    | false |   *   |   -   |  1.0.3  |    false     |

Get dubbers with array of queries

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