import React, {
  PropsWithChildren,
  useContext,
  useEffect,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";
import { trpc, User } from "../utils/trpc";
import { getHTTPStatusCodeFromError } from "@trpc/server/http";
import { TRPCError } from "@trpc/server";
import { useToken } from "./tokenContext";

type UserState = User | undefined;

type IToken = string | undefined;
type SetToken = (token: IToken) => void;

const UserContext = React.createContext<
  | { user: UserState; token: IToken; setToken: SetToken }
  | undefined
>(undefined);

const UserProvider = ({
  children,
}: PropsWithChildren<Record<string, unknown>>) => {
  const navigate = useNavigate();
  const { token, setToken } = useToken();
  const [user, setUser] = useState<UserState>();
  const utils = trpc.useContext()

  const { refetch } = trpc.user.getUser.useQuery(undefined, {
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    enabled: !!token,
    onError(error) {
      if (error.data?.code === "UNAUTHORIZED") {
        navigate("/")
      }
    },
  });

  useEffect(() => {
    if (!token) {
      utils.invalidate()
      navigate("/");
    } else {
      refetch().then(({ data }) => {
        setUser(data);
      });
    }
  }, [token]);

  useEffect(() => {
    if (user) {
      if (user.room.game.id) {
        navigate(`/game`);
      } else if (user.room.id) {
        navigate("/room");
      } else {
        navigate("/home");
      }
    } else {
      utils.invalidate()
    }
  }, [user]);

  return (
    <UserContext.Provider value={{ user, token, setToken }}>
      {children}
    </UserContext.Provider>
  );
};

const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }

  return context;
};

export { UserProvider, useUser };
