import React, { useMemo, useState } from "react";
import { Outlet } from "react-router-dom";
import { UserProvider } from "./providers/userContext";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { trpc } from "./client";
import { createWSClient, httpBatchLink, splitLink, wsLink } from "@trpc/client";
import { TokenProvider, useToken } from "./providers/useToken";

const PORT = 4000;

const Home = () => {
  const { token } = useToken();
  const [queryClient] = useState(() => new QueryClient());
  const trpcClient = useMemo(() => {
    const wsClient = createWSClient({
      url: `ws://localhost:${PORT}/api/trpc?token=${token}`,
    });
    return trpc.createClient({
      links: [
        splitLink({
          condition(op) {
            return op.type === "subscription";
          },
          true: wsLink({
            client: wsClient,
          }),
          false: httpBatchLink({
            url: import.meta.env.NODE_ENV === "production" ? `/api/trpc` : `http://localhost:${PORT}/api/trpc`,
            headers: {
              Authorization: `Bearer ${token || localStorage.getItem("token")}`,
            },
          }),
        }),
      ],
    });
  }, [token]);

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
