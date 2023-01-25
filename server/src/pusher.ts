import Pusher from "pusher"
import { getEnv } from "./utils"

const PUSHER_APP_ID = getEnv(process.env.PUSHER_APP_ID, "PUSHER_APP_ID")
const PUSHER_KEY = getEnv(process.env.PUSHER_KEY, "PUSHER_KEY")
const PUSHER_SECERT = getEnv(process.env.PUSHER_SECRET, "PUSHER_SECRET")
const PUSHER_CLUSTER = getEnv(process.env.PUSHER_CLUSTER, "PUSHER_CLUSTER")
 

export const pusher = new Pusher({
    appId: PUSHER_APP_ID,
    key: PUSHER_KEY,
    secret: PUSHER_SECERT,
    cluster: PUSHER_CLUSTER,
    useTLS: true
})