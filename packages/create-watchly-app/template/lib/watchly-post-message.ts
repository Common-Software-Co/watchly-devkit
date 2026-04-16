import { z } from "zod";
import { watchlyContextSchema } from "./watchly-schema";

/** Parent → iframe: validated envelope before applying to WatchlyContext. */
export const watchlyContextMessageSchema = z.object({
  type: z.literal("watchly:context"),
  payload: watchlyContextSchema,
});

export type WatchlyContextMessage = z.infer<typeof watchlyContextMessageSchema>;
