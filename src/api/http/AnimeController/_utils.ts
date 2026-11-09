import IAnime, { AnimeEpisodeSchema, AnimePlayerSchema } from '~/domain/anime.schema.js';
import TeamRepository from '~/repositories/TeamRepository.js';
import z from 'zod';
import { ITeamMinified, TeamMinifiedSchema } from '~/domain/team.schema.js';
import { TeamId } from '~/interfaces/BrandedIds.js';



export const AnimeGetEpisodesSchema = z.object({
  player: AnimePlayerSchema,
  player_teams: TeamMinifiedSchema.array(),
  episodes_meta: AnimeEpisodeSchema.array(),
});



export async function AnimeGetEpisodes(anime: IAnime): Promise<z.infer<typeof AnimeGetEpisodesSchema>> {
  const playerTeamsId = new Set<TeamId>();

  anime.player.dubbed.forEach(team => team.dubber_ids.forEach(id => playerTeamsId.add(id)));
  anime.player.subbed.forEach(team => team.dubber_ids.forEach(id => playerTeamsId.add(id)));

  const playerTeamsResults = await TeamRepository.getMany({ id: { $in: Array.from(playerTeamsId) } });
  const playerTeams: ITeamMinified[] = playerTeamsResults.map(el => TeamMinifiedSchema.parse(el));

  return AnimeGetEpisodesSchema.parse({
    player: anime.player,
    player_teams: playerTeams,
    episodes_meta: anime.episodes_meta,
  } satisfies z.infer<typeof AnimeGetEpisodesSchema>);
}