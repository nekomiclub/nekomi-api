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
| (param) :query | string | Dubber query (ID or slug) | ---   |

**RESPONSES**

**200 - Success** <br>

```ts
{
  message: 'OK',
  dubber: IDubber
}
```

**404 - Not found** <br>

------------------------------------------------------------------

## GET /dubber/invite/:dubber_id
| VERSION | CSRF  | ACCESS |
| :-----: | :---: | :----: |
|  1.3.2  |  ---  | basic  |

Verify if request user has invitation



**PARAMETERS**

| NAME               | TYPE   | DESCRIPTION | NOTES |
| ------------------ | ------ | ----------- | ----- |
| (param) :dubber_id | string | Dubber ID   | ---   |

**RESPONSES**

**200 - Success** <br>

```ts
{
  message: 'OK',
  verified: boolean
}
```

**404 - Not found** <br>

------------------------------------------------------------------

## GET /dubber/all
| VERSION | CSRF  | ACCESS |
| :-----: | :---: | :----: |
|  1.2.2  |  ---  |  ---   |

Get list of all dubbers



**RESPONSES**

**200 - Success** <br>

```ts
{
  message: 'OK',
  dubbers: IDubber[]
}
```

------------------------------------------------------------------

## GET /dubber/invite/send
| VERSION |    CSRF     |      ACCESS       |
| :-----: | :---------: | :---------------: |
|  1.3.2  | nekomi.club | dubberEditMembers |

**Invited user must has connected telegram**
Invite user in dubber team. Will add to user subscription ```dubber_invite_pending/${dubber_id}``` and notify user in telegram 



**PARAMETERS**

| NAME      | TYPE   | DESCRIPTION            | NOTES |
| --------- | ------ | ---------------------- | ----- |
| user_id   | string | User id to invite      | ---   |
| dubber_id | string | Dubber id to invite to | ---   |

**RESPONSES**

**200 - Success** <br>

```ts
{
  message: 'OK',
}
```

**404 - E404** <br>
**400 - ERR_TELEGRAM_MISS** <br>
**400 - ERR_OTHER_TEAM_MEMBER** <br>
**400 - ERR_MEMBER_ALREADY** <br>
**400 - ERR_INVITED_ALREADY** <br>

------------------------------------------------------------------

## GET /dubber/invite/accept | /dubber/invite/decline
| VERSION |    CSRF     | ACCESS |
| :-----: | :---------: | :----: |
|  1.3.2  | nekomi.club | basic  |

Client-side answear to dubber invite, accept or decline in accordance. User id will be taken from session. If dubber do not has user id in ```members_invited```, request will be rejected.

On accept will add dubber id in user's ```statistics.dubber_team_member```



**PARAMETERS**

| NAME      | TYPE   | DESCRIPTION    | NOTES |
| --------- | ------ | -------------- | ----- |
| dubber_id | string | Dubber team ID | ---   |

**RESPONSES**

**200 - Success** <br>

```ts
{
  message: 'OK',
}
```

**404 - E404** <br>
**ERR_NOT_INVITED** <br>

Accept errors <br>
**400 - ERR_OTHER_TEAM_MEMBER** <br>
**400 - ERR_MEMBER_ALREADY** <br>

------------------------------------------------------------------

## GET /dubber/settings/member/exclude
| VERSION |    CSRF     |      ACCESS      |
| :-----: | :---------: | :--------------: |
|  1.3.2  | nekomi.club | dubberMemberEdit |

Exclude member from the team. User will be notified in telegram about it. Will remove user's ```statistics.dubber_team_member```



**PARAMETERS**

| NAME      | TYPE   | DESCRIPTION               | NOTES |
| --------- | ------ | ------------------------- | ----- |
| dubber_id | string | Dubber ID to exclude from | ---   |
| user_id   | string | User ID to exclude        | ---   |

**RESPONSES**

**200 - Success** <br>

```ts
{
  message: 'OK',
}
```

**404 - E404** <br>
**400 - ERR_NOT_MEMBER** <br>

------------------------------------------------------------------

[HOME](../README.md)