import conf from '~/conf';
import z from 'zod';
import { HandleRequest } from '~/utils/http-utils';
import { Middleware } from '~/service/MiddlewareService';
import { NekoError } from '~/service/ExceptionService';
import { ROLE_PERMISSION } from '~/intf/IRole';
import { UserRepositoryClass } from '~/repo/UserRepository';
import { asAnimeId } from '~/intf/IAnime';
import { asTeamId } from '~/intf/ITeam';
import { asUserId, asUserLibId } from '~/intf/IUser';



interface IResponse {
  message: string

  /** Changes diff */
  diff: string[]
}



const editLibAnimeSchema = z.object({
  lib_id: z.string().nonempty().transform(asUserLibId),
  anime_id: z.string().nonempty().transform(asAnimeId),
});

const ParamsSchema = z.object({
  id: z.string().nonempty().optional()
});

const BodySchema = z.object({
  add_lib_anime: editLibAnimeSchema.optional(),
  remove_lib_anime: editLibAnimeSchema.optional(),

  edit_view_progress: z.object({
    anime_id: z.string().nonempty().transform(asAnimeId),
    dubber_id: z.string().nonempty().transform(asTeamId),
    episode: z.number(),
    progress: z.number(),
    viewtime: z.number(),
  }).optional(),

  remove_view_progress: z.object({
    anime_id: z.string().nonempty(),
  }).optional(),

  set_username: z.object({
    username: z.string()
  }).optional(),
});



/**
 * Patch user settings
 */
const endpoint = HandleRequest(async (req, res) => {
  const { id: userId, permissions } = req._nekomi.user!;
  const params = ParamsSchema.parse(req.params);
  const targetId = asUserId(params.id ?? userId);

  const { add_lib_anime, edit_view_progress, remove_lib_anime, remove_view_progress, set_username } = BodySchema.parse(req.body);
  if (!Object.keys(req.body).length) return res.status(200).json({ message: `Nothing to patch...` });

  const repo = new UserRepositoryClass();

  if (userId === targetId) {
    // Patch own document

    await repo.init({ id: userId });
  } else {
    if (permissions?.includes(ROLE_PERMISSION.ABSOLUTE)) {
      // Update target user if current user is eligible to do this

      await repo.init({ id: targetId });
    } else throw new NekoError('sys:action_prevented');
  }

  const diff: string[] = [];



  if (add_lib_anime) {
    const { anime_id, lib_id } = add_lib_anime;

    await repo.appendLibAnime(lib_id, anime_id);

    diff.push(`Anime "${anime_id}" appended in lib "${lib_id}"`);
  }



  if (remove_lib_anime) {
    const { anime_id, lib_id } = remove_lib_anime;

    repo.removeLibAnime(lib_id, anime_id);

    diff.push(`Anime "${anime_id}" removed from lib "${lib_id}"`);
  }



  if (edit_view_progress) {
    const { anime_id, dubber_id, episode, progress, viewtime } = edit_view_progress;

    repo.setViewProgress({ anime_id, dubber_id, episode, progress });
    repo.increaseTotalViewtime(viewtime);

    diff.push(`View progress for "${anime_id}" updated`);
  }



  if (remove_view_progress) {
    const { anime_id } = remove_view_progress;

    repo.removeViewProgress(anime_id);

    diff.push(`View progress for "${anime_id}" removed`);
  }



  if (set_username) {
    const { username } = set_username;

    await repo.setUsername(username);

    diff.push(`Username updated to "@${username}"`);
  }



  await repo.save();

  return res.status(200).json({
    message: 'User patched!',
    diff
  } satisfies IResponse);
}, { middlewares: ['checkAccess', 'checkCSRF'] });



const UserPatchSettingsRoute = [
  Middleware.CheckAccess([ROLE_PERMISSION.BASIC]),
  Middleware.CheckCSRF([conf.domains.NEKOMI_DOMAIN]),
  endpoint
];

export default UserPatchSettingsRoute;