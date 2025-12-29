import ms from 'ms';
import z from 'zod';



const l = {
  MAX_INCREASE_VIEWTIME_S: ms('2hour') / 1000,

  MIN_USERNAME_LENGTH: 4,
  MAX_USERNAME_LENGTH: 24,
};



const username = z.string().regex(/^[a-z0-9_.]+$/, `Value must be a valid username`);

const UserValidators = {
  limits: l,



  username,
  usernameFull: username.min(l.MIN_USERNAME_LENGTH).max(l.MAX_USERNAME_LENGTH),

  email: z.string().email(),
};



export default UserValidators;