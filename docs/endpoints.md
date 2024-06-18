## ENDPOINTS
### [Return](../README.md)

## Title Controller

--------------------------------------------------------------

### GET /title/:query
[Back to tree](./tree.md)

Get title with code or id


| DEPRECATED | CSRF  | CORS  | CAPS  | VERSION | TEST COVERED |
| :--------: | :---: | :---: | :---: | :-----: | :----------: |
|   false    | false |   *   |   -   |  1.1.0  |    false     |

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

### GET /title/total
[Back to tree](./tree.md)

Get total count of titles & renewed (where country != 'null')


| DEPRECATED | CSRF  | CORS  | CAPS  | VERSION | TEST COVERED |
| :--------: | :---: | :---: | :---: | :-----: | :----------: |
|   false    | false |   *   |   -   |  1.1.0  |    false     |

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

| DEPRECATED | CSRF  | CORS  |    CAPS    | VERSION | TEST COVERED |
| :--------: | :---: | :---: | :--------: | :-----: | :----------: |
|   false    | true  | CSRF  | See params |  1.1.0  |    false     |

CSRF: animee.club, updater.animee.club

## Interfaces
```ts
// Change names interface
// Set null to prevent field from changing, otherwise it will rewrite it
// Changing eng title will change title code
interface IChangeNames {
  ukr: string | null
  eng: string | null
  alt: string[] | null
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

| DEPRECATED | CSRF  | CORS  |   CAPS   | VERSION | TEST COVERED |
| :--------: | :---: | :---: | :------: | :-----: | :----------: |
|   false    | true  | CSRF  | titleAdd |  1.1.0  |    false     |

CSRF: animee.club, updater.animee.club

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

| DEPRECATED | CSRF  | CORS  |    CAPS     | VERSION | TEST COVERED |
| :--------: | :---: | :---: | :---------: | :-----: | :----------: |
|   false    | true  | CSRF  | titleDelete |  1.1.0  |    false     |

CSRF: animee.club, updater.animee.club

#### Params
| NAME       | TYPE   | DESCRIPTION |
| ---------- | ------ | ----------- |
| (query) id | string | Title id    |

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

Authorize user & get session cookie, if user is not found, will try to find exist by username (email splitted by @), if not will create a new one

| DEPRECATED | CSRF  | CORS  | CAPS  | VERSION | TEST COVERED |
| :--------: | :---: | :---: | :---: | :-----: | :----------: |
|   false    | true  | CSRF  |   -   |  1.1.0  |     true     |

CSRF: animee.club, updater.animee.club

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

| DEPRECATED | CSRF  | CORS  | CAPS  | VERSION | TEST COVERED |
| :--------: | :---: | :---: | :---: | :-----: | :----------: |
|   false    | false |   *   |   -   |  1.1.0  |  Not needed  |

#### Success response
- Code: 200
- Body: Ok

### Notes
In dev mode session verifying will be skipped, user id will be taken from session

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
- Code: 401
- Body: Authorization not provided

- Code: 404
- Body: User is not found

### Notes
If query equals to *, will take user ID from session cookie

--------------------------------------------------------------

### PATCH /user
[Back to tree](./tree.md)

Update user. User can update only own info, staff can edit any user info (indev)

| DEPRECATED | CSRF  |     CORS      |           CAPS           | VERSION |          TEST COVERED           |
| :--------: | :---: | :-----------: | :----------------------: | :-----: | :-----------------------------: |
|   false    | true  | *.animee.club | basic, staffEditUserInfo |  1.1.0  | partially (see Methods section) |


#### Methods (Describes TMethod)
| NAME           | DESCRIPTION                      | IS TESTED |
| -------------- | -------------------------------- | --------- |
| editFolderItem | Adds / removes title from folder | true      |

#### Params
| NAME     | TYPE               | METHOD         |
| -------- | ------------------ | -------------- |
| method   | TMethod            | None           |
| titleId  | string / undefined | editFolderItem |
| folderId | string / undefined | editFolderItem |


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



## Dev Controller

Service router. Available only in development mode

--------------------------------------------------------------

### GET /dev/AccessControl

Check user authorization via security cookie or Authorization header.

### Require
fk-usapi

[Back to tree](./tree.md)
| DEPRECATED | CSRF  | CORS  |  CAPS  | VERSION | TEST COVERED |
| :--------: | :---: | :---: | :----: | :-----: | :----------: |
|   false    |   -   |   -   | dubber |  1.1.1  |     true     |

--------------------------------------------------------------

### GET /dev/CSRFCheck

Check request CSRF token. Pass if it valid & has allowed origin

### Require
fk-authority

[Back to tree](./tree.md)
| DEPRECATED |      CSRF       | CORS  | CAPS  | VERSION | TEST COVERED |
| :--------: | :-------------: | :---: | :---: | :-----: | :----------: |
|   false    | api.animee.club |   -   |   -   |  1.1.1  |     true     |

--------------------------------------------------------------








### [Return](../README.md)