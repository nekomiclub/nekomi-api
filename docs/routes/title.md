# TITLE ENDPOINTS

[HOME](../README.md)

------------------------------------------------------------------

## GET /title/:query
| VERSION | CSRF  | ACCESS |
| :-----: | :---: | :----: |
|  1.2.2  |  ---  |  ---   |

Get title by query (id or code)



**PARAMETERS**

| NAME                  | TYPE     | DESCRIPTION              | NOTES                               |
| --------------------- | -------- | ------------------------ | ----------------------------------- |
| (param) :query        | string   | Query (id or code)       | ---                                 |
| (query) detailed      | ?boolean | Get detailed information | (updater).animee.club CSRF required |
| (query) parseDubbers  | ?boolean | Parse episodes dubbers   | (updater).animee.club CSRF required |
| (header) X-CSRF-Token | ?string  | ---                      | ---                                 |

**RESPONSES**

**200 - Success** <br>

```ts
{
  msg: 'OK',
  title: ITitle[],
  parsedDubbers: IDubber[] | null
}
```

**404 - Not Found** <br>

------------------------------------------------------------------

## GET /title/total
| VERSION | CSRF  | ACCESS |
| :-----: | :---: | :----: |
|  1.2.2  |  ---  |  ---   |

Get total & renewed titles count



**RESPONSES**

**200 - Success** <br>

```ts
{
  msg: 'OK'
  total: number, // Total titles instances count
  renewed: number // Total renewed titles where (country defined)
}
```

------------------------------------------------------------------

## POST /title
| VERSION |         CSRF          |  ACCESS  |
| :-----: | :-------------------: | :------: |
|  1.2.2  | (updater).animee.club | titleAdd |

Create new title instance



**RESPONSES**

**201 - Created** <br>

```ts
{
  msg: 'OK',
  id: string
}
```

------------------------------------------------------------------

## PATCH /title/:id
| VERSION |         CSRF          | ACCESS |
| :-----: | :-------------------: | :----: |
|  1.2.2  | (updater).animee.club | basic  |

{DESCRIPTION}



**PARAMETERS**

| NAME            | TYPE                | DESCRIPTION                  | NOTES                                                       |
| --------------- | ------------------- | ---------------------------- | ----------------------------------------------------------- |
| changeNames.ukr | ?string             | Set ukr name                 | titleEdit, @max - 320                                       |
| changeNames.eng | ?string             | Set eng name                 | titleEdit, @max - 320. Will change code                     |
| changeNames.alt | ?string[]           | Set alt names                | titleEdit, @max - 20                                        |
| setRating       | ?number             | Set IMDB rating              | titleEdit, @min - 1, @max - 10                              |
| setDescription  | ?string             | ---                          | titleEdit, @max - 2200                                      |
| setStatus       | ?TAnimeStatus       | ---                          | titleEdit                                                   |
| setEps          | ?number             | Set episodesCount            | titleEdit, @min - 0, @max - 9999. Will set null if equals 0 |
| setGenres       | ?TAnimeGenre[]      | ---                          | titleEdit, @max - 10                                        |
| setSeason       | ?TAnimeSeason       | ---                          | titleEdit                                                   |
| setType         | ?TTitleType         | ---                          | titleEdit                                                   |
| setYear         | ?number             | ---                          | titleEdit, @min - 2000, @max - 2050                         |
| setStudios      | ?string[]           | ---                          | titleEdit  @max - 5 items, 24 symbols                       |
| setCountry      | ?TTitleCountry      | ---                          | titleEdit                                                   |
| setDetails      | ?string             | ---                          | titleEdit, @max - 500                                       |
| editEpMeta      | ?IChangeEpMeta      | Add/Edit/Remove episode meta | titleEditEpsMeta                                            |
| deleteEpisode   | see IPatchTitleBody | ---                          | seriesDelete                                                |
| change_poster   | multipart/form-data | ---                          | titleEdit, Will delete prev version                         |
| upload_episode  | multipart/form-data | ---                          | seriesAdd, Will trigger new_episode notify                  |

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
| VERSION |         CSRF          |      ACCESS       |
| :-----: | :-------------------: | :---------------: |
|  1.2.2  | (updater).animee.club | titleDelete + key |

Delete title



**PARAMETERS**

| NAME | TYPE   | DESCRIPTION  | NOTES                                     |
| ---- | ------ | ------------ | ----------------------------------------- |
| key  | string | Deletion key | Will be issued in console if not provided |

**RESPONSES**

**200 - Success** <br>

**403 - Forbidden** <br>
Deletion key not provided or invalid

**404 - Not Found** <br>

------------------------------------------------------------------

## GET /title/popular
| VERSION |    CSRF     | ACCESS |
| :-----: | :---------: | :----: |
|  1.2.2  | animee.club |  ---   |

Get popular titles



**RESPONSES**

**200 - Success** <br>
{DESCRIPTION}

```ts
{
  msg: 'OK',
  headliner: ITitle | null,
  headlinerVideo: string,
  headlinerPoster: string,
  categories: {
    popular: ITitle[],
    updatedRecently: ITitle[],
    hightRating: ITitle[],
  }
}
```

**500 - Titles not formed** <br>

------------------------------------------------------------------

[HOME](../README.md)