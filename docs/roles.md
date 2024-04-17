## ROLES
### [Return](../README.md)

<!-- |--------------------------------------------------------------| --------------------------------------------------------------|--------------------------------------------------------------| -->

## CAPABILITIES 1.1.0
| NAME              | DESCRIPTION                                  | IMPACT       |
| ----------------- | -------------------------------------------- | ------------ |
| root              | Dangerous absolute access to everything      | *            |
| admin             | Admin flag, has all staff & title caps       | Staff        |
| mod               | Moderator flag                               | Staff        |
| editor            | Editor flag, has all title & series caps     | Title        |
| dubber            | Dubber flag                                  | Dubbber      |
| basic             | Basic user capabilities (edit own)           | Basic        |
| titleAdd          | Can add new titles                           | Title        |
| titleEdit         | Can edit titles                              | Title        |
| titleDelete       | Can delete titles                            | Title        |
| titleEditEpsMeta  | Can edit episodes meta                       | Title        |
| titleEditLinked   | Can edit linked titles                       | Title        |
| seriesAdd         | Can add new series                           | Title/Series |
| seriesDelete      | Can delete series                            | Title/Series |
| dubberEditMembers | Can edit members                             | Dubber       |
| dubberEditEditors | Can edit editors                             | Dubber       |
| dubberEditProfile | Can edit dub profile                         | Dubber       |
| staffEditUserInfo | Can staff edit ANY (except admins) user info | Staff/User   |
| staffDeleteUser   | Can staff delete ANY (except admin) account  | Staff/User   |
| staffRestrictUser | Can staff restrict ANY (except admin) user   | Staff/User   |
| staffEditDubbers  | Can staff edit dubbers info (members, bio)   | Staff/Dubber |
| staffCreateDubber | Can staff create dubbers                     | Staff/Dubber |
| staffDeleteDubber | Cat staff delete dubbers                     | Staff/Dubber |

--------------------------------------------------------------

## ROLES 1.1.0

| NAME       | DESCRIPTION                                                            | CAPABILITIES                                                       |
| ---------- | ---------------------------------------------------------------------- | ------------------------------------------------------------------ |
| ROOT (usr) | Root role. Can bypass everything, can impact anything                  | root                                                               |
| Admin      | Administrator has CRUD access to titles, series, dubbers & UD to users | basic, ...Moderator, admin, ...Editor, staff*                      |
| Moderator  | Moderator can restrict users, edit their info & edit dubbers bio       | basic, mod, staffEditUserInfo, staffRestrictUser, staffEditDubbers |
| Editor     | Editor has CRUD access to titles & series                              | basic, editor, title*, series*                                     |
| User       | User can only modify own profile if not restricted                     | basic                                                              |

### Dubbers 1.1.0
| NAME          | DESCRIPTION                                                                        | CAPABILITIES                                                  |
| ------------- | ---------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| Dubber/Leader | Leader can edit dub profile, assing editors & members, upload/delete OWN TITLE EPS | dubberEditEditors, ...Dubber/Editor                           |
| Dubber/Editor | Editor can assing members, upload/delete OWN TITLE EPS                             | seriesAdd, seriesDelete, dubberEditProfile, dubberEditMembers |
| Dubber/Member | No authority provided                                                              | None                                                          |

--------------------------------------------------------------

### [Return](../README.md)