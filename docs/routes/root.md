# ROOT ENDPOINTS

[HOME](../../README.md)

------------------------------------------------------------------

## GET /search
| VERSION |        CSRF         | ACCESS |
| :-----: | :-----------------: | :----: |
|  1.2.2  | updater.nekomi.club |  ---   |

Global search in Title, User, Dubber models.



**PARAMETERS**

| NAME            | TYPE            | DESCRIPTION            | NOTES                               |
| --------------- | --------------- | ---------------------- | ----------------------------------- |
| (query) q       | string          | Search query           | ---                                 |
| (query) engines | TSearchEngine[] | Search models included | ---                                 |
| (query) ?limit  | number          | Search limit per page  | @default - 30, @min - 1, @max - 100 |
| (query) ?page   | number          | Search page            | @default - 1, @min - 0              |

**RESPONSES**

**200 - Success** <br>
Data searched

```ts
{
  msg: 'OK',
  results: ISearchExtended<IDubber | ITitle | IUser>[]  
  totalResults: number // Total matches
}
```

**400 - Payload error** <br>
JSON parse error / Query or engines are undefined

**400 - Search is not ready** <br>
Search is not ready

------------------------------------------------------------------

[HOME](../../README.md)