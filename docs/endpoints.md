# ANIMEE ENDPOINTS
[HOME](../README.md)

---

- /dev | *DEV MODE ONLY*
  - /AccessControl | [GET](./routes/dev.md#get-devaccesscontrol)
  - /CSRFCheck | [GET](./routes/dev.md#get-devcsrfcheck)

- /
  - /search | [GET](./routes/root.md#get-search)

- /title | [POST](./routes/title.md#post-title)
  - /total | [GET](./routes/title.md#get-titletotal)
  - /popular | [GET](./routes/title.md#get-titlepopular)
  - /:id | [PATCH](./routes/title.md#patch-titleid) | [DELETE](./routes/title.md#delete-titleid)
  - /:query | [GET](./routes/title.md#get-titlequery)

- /dubber
  - /parse | [POST](./routes/dubber.md)
  - /:query | [GET](./routes/dubber.md)

- /user | [PATCH](./routes/user.md#patch-user)
  - /logout | [GET](./routes/user.md#get-userlogout)
  - /validate | [GET](./routes/user.md#get-uservalidate)
  - /signin | [POST](./routes/user.md#post-usersignin)
  - /linkTelegram | [POST](./routes/user.md#post-userlinktelegram)
  - /:query | [GET](./routes/user.md#get-userquery)

- /proxy
  - /postSnap (DEPRECATED) | [POST](./routes/proxy.md#post-proxypostsnap)
  - /parseMetadata | [POST](./routes/proxy.md#post-proxyparsemetadata)

---

[HOME](../README.md)