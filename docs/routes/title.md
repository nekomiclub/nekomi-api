# TITLE ENDPOINTS

[HOME](../README.md)

------------------------------------------------------------------

## GET /title/:query
| VERSION | CSRF  | ACCESS |
| :-----: | :---: | :----: |
|  1.3.1  |  ---  |  ---   |

Get title by query (id or code)



**PARAMETERS**

| NAME                  | TYPE     | DESCRIPTION              | NOTES                     |
| --------------------- | -------- | ------------------------ | ------------------------- |
| (param) :query        | string   | Query (id or code)       | ---                       |
| (query) detailed      | ?boolean | Get detailed information | nekomi.club CSRF required |
| (query) parseDubbers  | ?boolean | Parse episodes dubbers   | nekomi.club CSRF required |
| (header) X-CSRF-Token | ?string  | ---                      | ---                       |

**RESPONSES**

**200 - Success** <br>

```ts
{
  message: 'OK',
  title: Anime,
  parsedDubbers?: IDubber[]
}
```

**404 - Not Found** <br>

------------------------------------------------------------------

## GET /title/total
| VERSION | CSRF  | ACCESS |
| :-----: | :---: | :----: |
|  1.3.1  |  ---  |  ---   |

Get total & renewed titles count



**RESPONSES**

**200 - Success** <br>

```ts
{
  message: 'OK'
  total: number, // Total titles instances count
  renewed: number // Total renewed titles where (country defined)
}
```

------------------------------------------------------------------

## POST /title
| VERSION |    CSRF     |  ACCESS  |
| :-----: | :---------: | :------: |
|  1.3.1  | nekomi.club | titleAdd |

Create new title instance



**RESPONSES**

**201 - Created** <br>

```ts
{
  message: 'OK',
  id: string,
  title: Anime
}
```

------------------------------------------------------------------

## PATCH /title/:id
| VERSION |    CSRF     |  ACCESS   |
| :-----: | :---------: | :-------: |
|  1.3.1  | nekomi.club | see notes |

Patch title fields



**PARAMETERS**
| NAME                  | TYPE            | DESCRIPTION                  | NOTES                                                                        |
| --------------------- | --------------- | ---------------------------- | ---------------------------------------------------------------------------- |
| names.eng             | ?string         | ---                          | titleEdit, minmax - `(min/max)NameLength`, Will change title code            |
| names.ukr             | ?string         | ---                          | titleEdit, minmax - `(min/max)NameLength`                                    |
| names.alt             | ?string[]       | ---                          | titleEdit, minmax - `(min/max)NameLength`, max arr size - `maxAltNamesCount` |
| ageRate               | ?TAgeRate       | ---                          | titleEdit                                                                    |
| country               | ?TTitleCountry  | ---                          | titleEdit                                                                    |
| season                | ?TAnimeSeason   | ---                          | titleEdit                                                                    |
| status                | ?TAnimeStatus   | ---                          | titleEdit                                                                    |
| type                  | ?TTitleType     | ---                          | titleEdit                                                                    |
| description           | ?string         | ---                          | titleEdit, max - `maxDescriptionLength`                                      |
| details               | ?string / null  | ---                          | titleEdit, max- `maxDetailsLength`, Will set null if length equal 0          |
| genres                | ?TAnimeGenre[]  | ---                          | titleEdit, max arr size - `maxGenresCount`                                   |
| studios               | ?string[]       | ---                          | titleEdit, minmax - `(min/max)StudioLength`, max arr size `maxStudiosCount`  |
| year                  | ?number         | ---                          | titleEdit, minmax - `(min/max)Year`                                          |
| episodesCount         | ?number         | ---                          | titleEdit, minmax - `(min/max)Episode`                                       |
| IMDBRating            | ?number         | ---                          | titleEdit, minmax - `(min/max)Rating`                                        |
| AnimeeRating          | ?number         | ---                          | titleEdit, minmax - `(min/max)Rating`                                        |
| editEpMeta            | ?IChangeEpMeta  | Add/Edit/Remove episode meta | titleEditEpsMeta                                                             |
| parseIMDBEpisodesMeta | ?string         | imdb.com episodes meta URL   | titleEditEpsMeta                                                             |
| deleteEpisode         | ?IDeleteEpisode | ---                          | seriesDelete                                                                 |
| ------- FORM DATA     | ---             | ---                          | ---                                                                          |
| uploadEpisode         | ?IUploadEpisode | ---                          | seriesAdd                                                                    |
| uploadPoster          | ?IUploadPoster  | ---                          | titleEdit                                                                    |


**RESPONSES**

**200 - Success** <br>

```ts
{
  msg: 'OK',
  changes: string[]
}
```

**400 - Invalid payload** <br>

**404 - Not Found** <br>

------------------------------------------------------------------

## DELETE /title/:id
| VERSION |    CSRF     |   ACCESS    |
| :-----: | :---------: | :---------: |
|  1.3.1  | nekomi.club | titleDelete |

Delete title



**PARAMETERS**

| NAME        | TYPE    | DESCRIPTION  | NOTES                                     |
| ----------- | ------- | ------------ | ----------------------------------------- |
| (query) key | ?string | Deletion key | Will be issued in console if not provided |

**RESPONSES**

**200 - Success** <br>

**403 - Forbidden** <br>
Deletion key not provided or invalid

**404 - Not Found** <br>

------------------------------------------------------------------

## GET /title/home_wrapped
| VERSION |    CSRF     | ACCESS |
| :-----: | :---------: | :----: |
|  1.3.1  | nekomi.club |  ---   |

Get home wrapped titles. Return user watch progress on featured titles if session provided

**PARAMETERS**

| NAME             | TYPE    | DESCRIPTION    |
| ---------------- | ------- | -------------- |
| (cookie) session | ?string | Session cookie |



**RESPONSES**

**200 - Success** <br>
```ts
{
  msg: 'OK',
  featured: ITitleWithMediaMeta[],
  popular: Anime[],
  updatedRecently: Anime[],
  hightRating: Anime[],
}
```

**200 - Success** <br>
Return user watch progress on featured titles if session provided
```ts
{
  ...rest
  watchProgress: IUserWatchProgress[]
}
```

**500 - Titles not formed** <br>

------------------------------------------------------------------

[HOME](../README.md)