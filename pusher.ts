import Pusher from "pusher";
import { getEnv } from "./utils";

const PUSHER_APP_ID = getEnv("PUSHER_APP_ID");
const PUSHER_KEY = getEnv("PUSHER_KEY");
const PUSHER_SECERT = getEnv("PUSHER_SECRET");
const PUSHER_CLUSTER = getEnv("PUSHER_CLUSTER");

export const pusher = new Pusher({
  appId: PUSHER_APP_ID,
  key: PUSHER_KEY,
  secret: PUSHER_SECERT,
  cluster: PUSHER_CLUSTER,
  useTLS: true,
});
