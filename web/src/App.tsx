import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import { UserProvider } from "./providers/userContext";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { trpc } from "./utils/trpc";
import { createWSClient, httpBatchLink as createHttpBatchLink, splitLink, wsLink } from "@trpc/client";
import { TokenProvider, useToken } from "./providers/useToken";
import { getEnv, isProduction } from "./utils";

const Home = () => {
  const { token } = useToken();
  const [queryClient] = useState(() => new QueryClient());
  const [trpcClient] = useState(() => {
    const SERVER_PORT = getEnv(import.meta.env.VITE_DEV_SERVER_PORT, 'VITE_DEV_SERVER_PORT')
      const httpBatchLink = createHttpBatchLink({
        url: isProduction() ? `/api/trpc` : `http://${getEnv(import.meta.env.VITE_DEV_SERVER_HOST, 'VITE_DEV_SERVER_HOST')}:${SERVER_PORT}/api/trpc`,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      return trpc.createClient({
        links: !isProduction() ? [
          splitLink({
            condition(op) {
              return op.type === "subscription";
            },
            true: !isProduction() ? wsLink({
              client: createWSClient({
                url: `ws://localhost:${SERVER_PORT}/api/trpc?token=${token}`,
              }),
            }) : [],
            false: httpBatchLink,
          }),
        ] : [
          httpBatchLink
        ],
      });
  });

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <div className="flex w-screen h-screen">
          <div className="flex flex-1">
            <UserProvider>
              <Outlet />
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
