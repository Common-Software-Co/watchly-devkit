import { z } from "zod";

export const watchlyFrameSchema = z.object({
  frameSequence: z.number(),
  isSport: z.boolean(),
  nonSportFrameCount: z.number(),
  imageRoute: z.string(),
  isCommercial: z.boolean(),
  currentSport: z.string().nullable(),
  currentEventParticipants: z.array(z.string()).nullable(),
});

export const watchlyContextSchema = z.object({
  frame: watchlyFrameSchema,
});

export type WatchlyContext = z.infer<typeof watchlyContextSchema>;

export const defaultWatchlyContext: WatchlyContext = {
  frame: {
    frameSequence: 0,
    isSport: false,
    nonSportFrameCount: 0,
    imageRoute: "",
    isCommercial: false,
    currentSport: null,
    currentEventParticipants: null,
  },
};
