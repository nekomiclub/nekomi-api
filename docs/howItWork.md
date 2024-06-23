## How something work in Animee-core
[Return](../README.md)

### Inner data
Inner data - Presented by req.animee and contains some of user data, like id and capabilities. These managed by AccessControl middleware. Capabilities will be managed only if AccessMiddleware has required capabilities.

### Testing and mocking data
Animee-core contains a lot of axios requests to other services, like fk-usapi or fk-authority. Tests must be standalone, so in test mode axios requests will be

To test animee-core, you should run one process as ```npm run dev-test```, and second as ```npm run test```. In test mode, most routes will require X-Mock header, that contain mock data. You can see all mock 

Mock example (may be changed in future, see one of tests to get real implementation of mock system)
```ts
const ACMock: IMock<IM_AccessControl> = {
  id: 'AccessControl',
  code: 200,
  data: {
    id: 'USER_ID',
  }
};

const CSRFMock: IMock<IM_CSRFCheck> = {
  id: 'CSRFCheck',
  code: 200,
  data: {
    verified: true,
    origin: 'ORIGIN'
  }
};


// Request
.set('Authorization', '_MOCKED') // Authorization will be mocked, but header must be present
.set(config.vars.csrfHeader, '_MOCKED') // CSRF will be mocked, but header must be present
.set(config.vars.mockHeader, JSON.stringify([ACMock, CSRFMock])) // Mocked data MUST be an array
```

[Return](../README.md)