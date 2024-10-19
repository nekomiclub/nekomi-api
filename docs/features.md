# FEATURES

[HOME](../README.md)

------------------------------------------------------------------

[Inner data](#inner-data) <br>
[Tests & mocks](#testing-and-mocking-data) <br>

------------------------------------------------------------------

## Inner data
Inner data - stores at ```req.animee```. Contains some useful data from middlewares to other requests. You can view full interface at ```src/interfaces/globals.d.ts```

------------------------------------------------------------------

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

------------------------------------------------------------------

[HOME](../README.md)