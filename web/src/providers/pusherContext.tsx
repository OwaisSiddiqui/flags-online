import {
  useEffect,
  useState,
  createContext,
  PropsWithChildren,
  useMemo,
  useContext,
} from "react";
import Pusher from "pusher-js";
import { getEnv, isProd } from "../utils";
import { useUser } from "./userContext";
import { trpc } from "../utils/trpc";

const PUSHER_APP_KEY = getEnv(
  import.meta.env.VITE_PUSHER_APP_KEY,
  "VITE_PUSHER_APP_KEY"
);
const PUSHER_APP_CLUSTER = getEnv(
  import.meta.env.VITE_PUSHER_CLUSTER,
  "VITE_PUSHER_CLUSTER"
);

const PusherContext = createContext<
  | {
      pusherId: Pusher["connection"]["socket_id"] | undefined;
      pusher: Pusher | undefined;
    }
  | undefined
>(undefined);

const PusherProvidier = ({ children }: PropsWithChildren<{}>) => {
  const { user } = useUser();
  const [pusher, setPusher] = useState<Pusher>();
  const pusherId = useMemo(() => {
    if (pusher) {
      return pusher.connection.socket_id;
    }
  }, [pusher]);

  const pusherUserAuth = trpc.user.pusherUserAuth.useMutation();

  useEffect(() => {
    setPusher(
      new Pusher(PUSHER_APP_KEY, {
        cluster: PUSHER_APP_CLUSTER,
        channelAuthorization: {
          endpoint: isProd()
            ? `/api/trpc/user.pusherUserAuth`
            : `http://${getEnv(
                import.meta.env.VITE_DEV_SERVER_HOST,
                "VITE_DEV_SERVER_HOST"
              )}:${getEnv(
                import.meta.env.VITE_DEV_SERVER_PORT,
                "VITE_DEV_SERVER_PORT"
              )}/api/trpc/user.pusherUserAuth`,
          transport: "ajax",
          customHandler: (params, callback) => {
            const { socketId, channelName } = params;
            pusherUserAuth
              .mutateAsync({
                socketId,
                channelName,
              })
              .then((value) => {
                callback(null, value);
              })
              .catch((error) => {
                callback(error, null);
              });
          },
        },
      })
    );
  }, []);

  useEffect(() => {
    if (pusher) {
      pusher.connection.bind("error", (error: any) => {
        if (error.error.data.code === 4004) {
          console.log("Over limit!");
        }
      });
    }
  }, [pusher]);

  // useEffect(() => {
  //     if (user && pusher) {
  //         pusher.signin()
  //     }
  // }, [user, pusher])

  return (
    <PusherContext.Provider value={{ pusherId, pusher }}>
      {children}
    </PusherContext.Provider>
  );
};

const usePusher = () => {
  const context = useContext(PusherContext);
  if (!context) {
    throw new Error("usePusher must be used within a PusherProvidier");
  }
  return context;
};

export { PusherProvidier, usePusher };
