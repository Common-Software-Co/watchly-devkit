import { z } from 'zod';

/**
 * The "frame" object holds all the details about what's currently being shown on the connected TV.
 * It provides information like:
 *   - Is the connected TV showing a sporting event?
 *   - What sport is it?
 *   - Which teams are playing?
 *   - Is the connected TV currently showing a commercial break?
 *     - If it's a commercial break, which sport will we likely to return to after the break?
 */
export const watchlyFrameSchema = z.object({
    /**
     * Each video frame that's analyzed by the Watchly hardware is assigned a sequential number
     * starting at 1 (when the hardware is powered on).
     */
    frameSequence: z.number(),
    /**
     * A boolean that tells you whether the connected TV is currently showing a sport
     */
    isSport: z.boolean(),
    /**
     * The number of video frames that have been analyzed by the Watchly hardware since that last time a sport was detected.
     */
    nonSportFrameCount: z.number(),
    /**
     * The "imageRoute" is the most general category that the Watchly hardware assigns to a video frame that has
     * been analyzed. It answers the question "What's on TV?"
     */
    imageRoute: z.enum([
        'football',
        'basketball',
        'commercial',
        'sportscast',
        'talkshow',
        'episode',
        'baseball',
        'tennis',
        'hockey',
        'golf',
        'boxing',
        'unknown',
    ]),
    /**
     * A boolean that tells you whether the connected TV is currently showing a commercial.
     */
    isCommercial: z.boolean(),
    /**
     * The name of the sport that is currently being shown on the connected TV.
     * Null if the connected TV is not showing a sport.
     */
    currentSport: z.string().nullable(),
    /**
     * The names of the participants in the current event.
     * This is null if the connected TV is not showing a sport, or if
     * the participants have not been identified.
     *
     * @example ["Detroit Pistons", "Boston Celtics"]
     */
    currentEventParticipants: z.array(z.string()).nullable(),
});

/**
 * The "device" object holds all the details about the specific screen that's being monitored.
 * Details like the deviceID, name of the venue where it's installed, etc.
 * This can be used to log analytics or to provide hyper-localized content, for example.
 */
export const watchlyDeviceSchema = z.object({
    /**
     * The unique identifier of the Watchly device / screen that's displaying your app
     */
    deviceId: z.string().nullable(),
    /**
     * The name of the location / venue where the Watchly device / screen is installed.
     */
    locationName: z.string().nullable(),
});

export const watchlyContextSchema = z.object({
    frame: watchlyFrameSchema,
    device: watchlyDeviceSchema,
});

export type WatchlyContext = z.infer<typeof watchlyContextSchema>;

export const defaultWatchlyContext: WatchlyContext = {
    frame: {
        frameSequence: 0,
        isSport: false,
        nonSportFrameCount: 0,
        imageRoute: 'unknown',
        isCommercial: false,
        currentSport: null,
        currentEventParticipants: null,
    },
    device: {
        deviceId: null,
        locationName: null,
    },
};
