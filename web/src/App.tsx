import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import { UserProvider } from "./providers/userContext";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { trpc } from "./utils/trpc";
import { createWSClient, httpBatchLink, splitLink, wsLink } from "@trpc/client";
import { TokenProvider, useToken } from "./providers/tokenContext";
import { getEnv, isProd } from "./utils";
import { PusherProvidier } from "./providers/pusherContext";

const Home = () => {
  const { token } = useToken();
  const [queryClient] = useState(() => new QueryClient());
  const [trpcClient] = useState(() => {
    const SERVER_PORT = getEnv(import.meta.env.VITE_DEV_SERVER_PORT, 'VITE_DEV_SERVER_PORT')
    return trpc.createClient({
      links: !isProd() ? [
        splitLink({
          condition(op) {
            return op.type === "subscription";
          },
          true: wsLink({
            client: createWSClient({
              url: `ws://localhost:${SERVER_PORT}/api/trpc?token=${token}`,
            }),
          }),
          false: httpBatchLink({
            url: `http://${getEnv(import.meta.env.VITE_DEV_SERVER_HOST, 'VITE_DEV_SERVER_HOST')}:${SERVER_PORT}/api/trpc`,
            headers: () => {
              return {
                Authorization: `Bearer ${token || localStorage.getItem("token")}`,
              }
            },
          }),
        }),
      ] : [
        httpBatchLink({
          url: `/api/trpc`,
          headers: () => {
            return {
              Authorization: `Bearer ${token || localStorage.getItem("token")}`,
            }
          },
        })
      ],
    });
  });

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <div className="flex w-screen h-screen">
          <div className="flex flex-1">
            <UserProvider>
              <PusherProvidier>
                <Outlet />
              </PusherProvidier>
            </UserProvider>
          </div>
        </div>
      </QueryClientProvider>
    </trpc.Provider>
  );
};

const App = () => {
  return (
    <TokenProvider>
      <Home />
    </TokenProvider>
  );
};

export default App;
