import z from 'zod';



export interface IPagination {
  limit: number
  page: number
}

export const PaginationSchema = z.object({
  limit: z.number(),
  page: z.number()
});