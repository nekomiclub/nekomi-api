import AuthGetLogoutRoute from './AuthGetLogout.route';
import AuthGetRefreshRoute from './AuthGetRefresh.route';
import AuthPostRoute from './AuthPost.route';
import express from 'express';



const AuthRouter = express.Router();



AuthRouter.get('/', AuthGetRefreshRoute);
AuthRouter.get('/logout', AuthGetLogoutRoute);

AuthRouter.post('/', AuthPostRoute);



export default AuthRouter;