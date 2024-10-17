/** Episode processing qualities */
export const EpisodeQualities = [240, 480, 720, 1080, 2160] as const;

/** Type implementation of EpisodeQualities */
export type TEpisodeQuality = typeof EpisodeQualities[number];