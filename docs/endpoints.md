## ENDPOINTS
### [Return](../README.md)

## Title Controller

--------------------------------------------------------------

### GET /title/:query
[Back to tree](./tree.md)

Get title with code or id


| DEPRECATED | CSRF  | CAPS  | TEST COVERED |
| :--------: | :---: | :---: | :----------: |
|   false    |   -   |   -   |     true     |

#### Params
| NAME  | TYPE   | DESCRIPTION |
| ----- | ------ | ----------- |
| query | string | Code or id  |

#### Success response
- Code: 200
- Body: 
```ts
{
  msg: 'ok',
  title: ITitle
}
```

#### Error response
- Code: 404
- Body: Title is not found

--------------------------------------------------------------

### GET /v1/titles
[Back to tree](./tree.md)

Get titles in range.


| DEPRECATED | CSRF  | CAPS  | TEST COVERED |
| :--------: | :---: | :---: | :----------: |
| true (1.2) |   -   |   -   |    false     |

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

**Will be refactored in 1.2**


|    DEPRECATED    | CSRF  | CAPS  | TEST COVERED |
| :--------------: | :---: | :---: | :----------: |
| true (since 1.2) |   -   |   -   |    false     |

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

### GET /title/total
[Back to tree](./tree.md)

Get total count of titles & renewed (where country != 'null')

| DEPRECATED | CSRF  | CAPS  | TEST COVERED |
| :--------: | :---: | :---: | :----------: |
|   false    |   -   |   -   |      -       |

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

### PATCH /title/:id
[Back to tree](./tree.md)

Update title info

| DEPRECATED |               CSRF               |    CAPS    | TEST COVERED |
| :--------: | :------------------------------: | :--------: | :----------: |
|   false    | animee.club, updater.animee.club | See params |     true     |

## Interfaces
```ts
// Change names interface
// Changing eng title will change title code
interface IChangeNames {
  ukr?: string
  eng?: string
  alt?: string[]
} 

type TPatchTitleFormDataType = 'change_poster' | 'upload_episode'
type TPatchTitleFormDataQualities = 1440 | 1080 | 720 | 480 | 240

// multipart/form-data
interface IChangePoster {
  file: File,
  type: TPatchTitleFormDataType // 'change_poster'
}

// multipart/form-data
interface IUploadEpisode {
  file: File,
  episodeOrder: number,
  dubID: string,
  type: TPatchTitleFormDataType, // 'upload_episode'
  qualities: TPatchTitleFormDataQualities[]
}

// application/json
interface IDeleteEpisode {
  episodeOrder: number,
  dubID: string,
}

interface IEditEpMeta extends ITitleEpisodeMeta {
  action: 'edit' | 'delete'
}
```

#### Params
| NAME            | TYPE                                 | DESCRIPTION                                                                       | CAP REQUIRED     |
| --------------- | ------------------------------------ | --------------------------------------------------------------------------------- | ---------------- |
| (query) id      | string                               | Title ID                                                                          | -                |
| ?changeNames    | IChangeName                          | Change title names                                                                | titleEdit        |
| ?changePoster   | IChangePoster                        | Upload file that replace exist poster                                             | titleEdit        |
| ?setRating      | number                               | Set new title rating                                                              | titleEdit        |
| ?setDescription | string                               | Set new title description                                                         | titleEdit        |
| ?setStatus      | string                               | Set new title status                                                              | titleEdit        |
| ?setEps         | number                               | Set new title eps                                                                 | titleEdit        |
| ?setGenres      | string[]                             | Genres will be parsed into TAnimeGenre[], not equal genres will be skipped        | titleEdit        |
| ?setAgeRate     | TAnimeAgeRate                        | If string will not equal to TAnimeAgeRate, it will throw 400                      | titleEdit        |
| ?setSeason      | TAnimeSeason                         | If string will not equal to TAnimeSeason, it will throw 400                       | titleEdit        |
| ?setType        | TTitleType                           | If string will not equal to TTitleType, it will throw 400                         | titleEdit        |
| ?setYear        | number                               | Set new title aired year                                                          | titleEdit        |
| ?setStudios     | string[]                             | Set new title studios                                                             | titleEdit        |
| ?setCountry     | string                               | Will reject if county not equal "japan", "south corea" or "china"                 | titleEdit        |
| ?setDetails     | string                               | Set title details (poster translators, etc)                                       | titleEdit        |
| ---             | ---                                  | ---                                                                               | ---              |
| ?editEpMeta     | IEditEpMeta                          | Change episode meta by it's order, will create new one if not exist               | titleEditEpsMeta |
| ---             | ---                                  | ---                                                                               | ---              |
| ?uploadEpisode  | IUploadEpisode (multipart/form-data) | Upload new episode. Dubber can only add eps in own dub, editor can add for anyone | seriesAdd        |
| ?deleteEpisode  | IDeleteEpisode                       | Delete exist episode. Same behaviour  as uploadEpisode                            | seriesDelete     |

#### Success response
- Code: 200
- Body: 
```ts
{
  msg: 'ok',
  changes: string[],
  id?: string // appears only when changing poster
}
```

#### Error response
- Code: 400 / 404
- Body: Validation failed / Title not found

--------------------------------------------------------------

### POST /title
[Back to tree](./tree.md)

Create a new title

| DEPRECATED |               CSRF               |   CAPS   | TEST COVERED |
| :--------: | :------------------------------: | :------: | :----------: |
|   false    | animee.club, updater.animee.club | titleAdd |     true     |

#### Success response
- Code: 200
- Body: ITitle

#### Error response
- Code: 400
- Body: Validation failed / Title is not found

--------------------------------------------------------------

### DELETE /title/:id
[Back to tree](./tree.md)

Delete title

| DEPRECATED |               CSRF               |    CAPS     | TEST COVERED |
| :--------: | :------------------------------: | :---------: | :----------: |
|   false    | animee.club, updater.animee.club | titleDelete |     true     |

#### Params
| NAME       | TYPE   | DESCRIPTION |
| ---------- | ------ | ----------- |
| (query) id | string | Title id    |

#### Success response
- Code: 200
- Body: ok

#### Error response
- Code: 404
- Body: Title is not found

--------------------------------------------------------------

## User Controller

--------------------------------------------------------------

### POST /user/signin
[Back to tree](./tree.md)

Authorize user & get session cookie. Will create new one if user not founded

| DEPRECATED |    CSRF     | CAPS  | TEST COVERED |
| :--------: | :---------: | :---: | :----------: |
|   false    | animee.club |   -   |     true     |

#### Params
| NAME    | TYPE   | DESCRIPTION                  |
| ------- | ------ | ---------------------------- |
| session | string | Fullkekw usapi session token |

#### Success response
- Code: 200
- Body:
```ts
msg: 'User logged in',
id: string,
username: string,
avatar: string
```

#### Error response
- Code: 400
- Body: Payload invalid

--------------------------------------------------------------

### GET /user/logout
[Back to tree](./tree.md)

Remove session cookie

| DEPRECATED |    CSRF     | CAPS  | TEST COVERED |
| :--------: | :---------: | :---: | :----------: |
|   false    | animee.club |   -   |     true     |

#### Success response
- Code: 200
- Body: User logged out

<br>

- Code: 400
- Body: Nothing to log out (cookie not provided)

--------------------------------------------------------------

### GET /user/validate

Validate & continue session, otherwise delete cookie

[Back to tree](./tree.md)
| DEPRECATED | CSRF  | CAPS  | TEST COVERED |
| :--------: | :---: | :---: | :----------: |
|   false    |   -   |   -   |    false     |

#### Success response
- Code: 200
- Body: Session continued

#### Error response
- Code: 202 / 401
- Body: Session not provided / Session expired

--------------------------------------------------------------

### GET /user/:query
[Back to tree](./tree.md)

Get user with query (username or id). By default sensitive fields (like roles, statistics & libs) will be hidden.
To get sensitive details, you should provide animee.club CSRF token & detailed query

| DEPRECATED |  CSRF   | CAPS  | TEST COVERED |
| :--------: | :-----: | :---: | :----------: |
|   false    | partial |   -   |     true     |

#### Params
| NAME              | TYPE    | DESCRIPTION                                              |
| ----------------- | ------- | -------------------------------------------------------- |
| query             | string  | Username or id. Can be "*" to get user by session cookie |
| (query) ?detailed | boolean | Detailed mode                                            |

#### Success response
- Code: 200
- Body: 
```ts
msg: string,
user: IUser
```

#### Error response
- Code: 400
- Body: Invalid payload

- Code: 404
- Body: User is not found

### Notes
If query equals to *, will take user ID from session cookie

--------------------------------------------------------------

### PATCH /user
[Back to tree](./tree.md)

Update user. User can update only own info, staff can edit any user info (indev)

| DEPRECATED |               CSRF               |           CAPS           | TEST COVERED |
| :--------: | :------------------------------: | :----------------------: | :----------: |
|   false    | updater.animee.club, animee.club | basic, staffEditUserInfo |     true     |


#### Methods (Describes TMethod)
| NAME             | DESCRIPTION                      |
| ---------------- | -------------------------------- |
| editFolderItem   | Adds / removes title from folder |
| increaseViewtime | Increase viewtime by seconds     |

#### Params
| NAME     | TYPE               | METHOD           |
| -------- | ------------------ | ---------------- |
| method   | TMethod            | None             |
| titleId  | string / undefined | editFolderItem   |
| folderId | string / undefined | editFolderItem   |
| viewtime | number / undefined | increaseViewtime |


#### Success response
- Code: 205
- Body: 
```ts
{
  msg: 'User modified',
  stack: '' // Modify stack
}
```

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
  
## Notes
User ID will taken from decoding session cookie or from session cookie in test mode

--------------------------------------------------------------

## Dubber Controller

--------------------------------------------------------------

### GET /v1/dubber/:query
[Back to tree](./tree.md)

Get dubber by name, code or id

| DEPRECATED | CSRF  | CAPS  | TEST COVERED |
| :--------: | :---: | :---: | :----------: |
|   false    |   -   |   -   |    false     |

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

| DEPRECATED | CSRF  | CAPS  | TEST COVERED |
| :--------: | :---: | :---: | :----------: |
|   false    |   -   |   -   |    false     |

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



## Dev Controller

Service router. Available only in development mode

--------------------------------------------------------------

### GET /dev/AccessControl

Check user authorization via security cookie or Authorization header.

### Require
fk-usapi

[Back to tree](./tree.md)
| DEPRECATED | CSRF  |  CAPS  | TEST COVERED |
| :--------: | :---: | :----: | :----------: |
|   false    |   -   | dubber |     true     |

--------------------------------------------------------------

### GET /dev/CSRFCheck

Check request CSRF token. Pass if it valid & has allowed origin

### Require
fk-authority

[Back to tree](./tree.md)
| DEPRECATED |      CSRF       | CAPS  | TEST COVERED |
| :--------: | :-------------: | :---: | :----------: |
|   false    | api.animee.club |   -   |     true     |

--------------------------------------------------------------








### [Return](../README.md)