# DUBBER ENDPOINTS

[HOME](../README.md)

------------------------------------------------------------------

## GET /dubber/:query
| VERSION | CSRF  | ACCESS |
| :-----: | :---: | :----: |
|  1.2.2  |  ---  |  ---   |

Get specified dubber



**PARAMETERS**

| NAME           | TYPE   | DESCRIPTION               | NOTES |
| -------------- | ------ | ------------------------- | ----- |
| (param) :query | string | Dubber query (ID or code) | ---   |

**RESPONSES**

**200 - Success** <br>

```ts
{
  msg: 'OK',
  dubber: IDubber
}
```

**404 - Not found** <br>

------------------------------------------------------------------

## GET /dubber/all
| VERSION | CSRF  | ACCESS |
| :-----: | :---: | :----: |
|  1.2.2  |  ---  |  ---   |

Get all dubbers



**RESPONSES**

**200 - Success** <br>

```ts
{
  msg: 'OK',
  dubbers: IDubber[]
}
```

------------------------------------------------------------------

[HOME](../README.md)