/** True in the /dev/ preview build (`vite build --mode dev`). */
export const IS_DEV_BUILD = import.meta.env.MODE === 'dev';

// The dev preview shares the real site's origin, so it needs its own localStorage keys.
export const STORAGE_PREFIX = IS_DEV_BUILD ? 'nihongo-aidoru-dev' : 'nihongo-aidoru';
