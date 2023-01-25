import { Channel } from "pusher-js"
import Pusher from "pusher-js/types/src/core/pusher"
import { useEffect, useState } from "react"
import { pusher } from "./utils/pusher"

export const useChannel = (...args: Parameters<Pusher["subscribe"]>)  => {
    const [channelName] = args
    const [channel, setChannel] = useState<Channel>()

    useEffect(() => {
        setChannel(pusher.subscribe(channelName))
    }, [])
    
    return channel
}
