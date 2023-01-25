import Pusher from 'pusher-js';
import { getEnv } from '.';

const PUSHER_APP_KEY = getEnv(import.meta.env.VITE_PUSHER_APP_KEY, "VITE_PUSHER_APP_KEY")
const PUSHER_APP_CLUSTER = getEnv(import.meta.env.VITE_PUSHER_CLUSTER, "VITE_PUSHER_CLUSTER")

export const pusher = new Pusher(PUSHER_APP_KEY, {
    cluster: PUSHER_APP_CLUSTER,
});

pusher.connection.bind('error', (error: any) => {
    if (error.error.data.code === 4004) {
      console.log('Over limit!');
    }
});