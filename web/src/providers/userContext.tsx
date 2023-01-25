import React, {
  PropsWithChildren,
  useContext,
  useEffect,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";
import { trpc, User } from "../client";
import { getHTTPStatusCodeFromError } from "@trpc/server/http";
import { TRPCError } from "@trpc/server";
import { useToken } from "./useToken";

type UserState = User | undefined;
type SetUser = (user: User) => void;

type IToken = string | undefined;
type SetToken = (token: IToken) => void;

const UserContext = React.createContext<
  | { user: UserState; setUser: SetUser; token: IToken; setToken: SetToken }
  | undefined
>(undefined);

const UserProvider = ({
  children,
}: PropsWithChildren<Record<string, unknown>>) => {
  const navigate = useNavigate();
  const { token, setToken } = useToken();
  const [user, setUser] = useState<UserState>();

  const { refetch } = trpc.user.getUser.useQuery(undefined, {
    retry: 0,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    enabled: !!token,
    onError(error) {
      if (error instanceof TRPCError) {
        const httpCode = getHTTPStatusCodeFromError(error);
        if (httpCode === 401) {
          navigate("/");
        }
      }
    },
  });

  useEffect(() => {
    if (!token) {
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
        navigate("/game");
      } else if (user.room.id) {
        navigate("/room");
      } else {
        navigate("/home");
      }
    }
  }, [user, token]);

  return (
    <UserContext.Provider value={{ user, setUser, token, setToken }}>
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
