import express from 'express';

import AuthGetLogoutRoute from './AuthGetLogout.route.js';
import AuthPostRoute from './AuthPost.route.js';



const AuthRouter = express.Router();



AuthRouter.get(['/logout', '/logout/:sessionId'], AuthGetLogoutRoute);

AuthRouter.post('/', AuthPostRoute);



export default AuthRouter;