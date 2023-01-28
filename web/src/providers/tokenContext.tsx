import React, {
  PropsWithChildren,
  useContext,
  useEffect,
  useState,
} from "react";

type IToken = string | undefined;
type SetToken = (token: IToken) => void;

const TokenContext = React.createContext<
  { token: IToken; setToken: SetToken } | undefined
>(undefined);

const TokenProvider = ({
  children,
}: PropsWithChildren<Record<string, unknown>>) => {
  const [token, setToken] = useState<string>();

  useEffect(() => {
    const tokenFromStorage = localStorage.getItem("token");
    if (tokenFromStorage) {
      setToken(tokenFromStorage);
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      localStorage.setItem("token", token);
    }
  }, [token]);

  return (
    <TokenContext.Provider value={{ token, setToken }}>
      {children}
    </TokenContext.Provider>
  );
};

const useToken = () => {
  const context = useContext(TokenContext);
  if (context === undefined) {
    throw new Error("useToken must be used within a TokenProvider");
  }

  return context;
};

export { TokenProvider, useToken };
