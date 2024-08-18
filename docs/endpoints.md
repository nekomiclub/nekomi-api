# ANIMEE ENDPOINTS
[HOME](../README.md)

---

- /dev | *DEV MODE ONLY*
  - /AccessControl | [GET](./routes/dev.md#get-devaccesscontrol)
  - /CSRFCheck | [GET](./routes/dev.md#get-devcsrfcheck)

- /
  - /search | [GET](./routes/root.md#get-search)

- /title | [POST](./routes/title.md)
  - /:id | [PATCH](./routes/title.md) | [DELETE](./routes/title.md)
  - /:query | [GET](./routes/title.md)
  - /total | [GET](./routes/title.md)
  - /popular | [GET](./routes/title.md)

- /v1/dubber
  - /:query | [GET](./routes/dubber.md)
  - /parse | [POST](./routes/dubber.md)

- /user | [PATCH](./routes/user.md#patch-user)
  - /:query | [GET](./routes/user.md#get-userquery)
  - /logout | [GET](./routes/user.md#get-userlogout)
  - /validate | [GET](./routes/user.md#get-uservalidate)
  - /signin | [POST](./routes/user.md#post-usersignin)

- /proxy
  - /postSnap | [POST](./routes/proxy.md#post-proxypostsnap)
  - /parseMetadata | [POST](./routes/proxy.md#post-proxyparsemetadata)

---

[HOME](../README.md)