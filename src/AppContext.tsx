import React, { ReactNode, useCallback, useState } from "react";
import {
  fetchEtaDb as _fetchEtaDb,
  fetchEtaDbMd5 as _fetchEtaDbMd5,
  fetchEtas as _fetchEtas,
  EtaDb,
  Eta,
} from "hk-bus-eta";

interface AppContextState {
  db: EtaDb | null;
  md5: string;
  data: Eta[] | null;

  routeId: string;
  stopSeq: number;
  language: "zh" | "en";
}

interface AppContextValue extends AppContextState {
  fetchEtaDb: () => void;
  fetchEtaDbMd5: () => void;
  fetchEtas: (routeId: string, stopSeq: number, language: "zh" | "en") => void;
  setRouteId: (routeId: string) => void;
  setStopSeq: (stopSeq: number) => void;
  setLanguage: (language: "zh" | "en") => void;
}

const AppContext = React.createContext({} as AppContextValue);

interface AppContextProviderProps {
  children: ReactNode;
}

export type AppParams = {
  routeId: string;
  stopSeq?: string;
};

export const AppContextProvider = ({ children }: AppContextProviderProps) => {
  const [state, setState] = useState<AppContextState>(DEFAULT_STATE);

  const setRouteId = useCallback((routeId: string) => {
    setState((prev) => ({
      ...prev,
      routeId,
      stopSeq: 0,
      data: null,
    }));
  }, []);

  const setStopSeq = useCallback(
    (stopSeq: number) => {
      setState((prev) => ({
        ...prev,
        stopSeq,
        data: null,
      }));
    },
    [state.routeId],
  );

  const setLanguage = useCallback((language: "zh" | "en") => {
    setState((prev) => ({
      ...prev,
      language,
      data: null,
    }));
  }, []);

  const fetchEtaDb = useCallback(() => {
    _fetchEtaDb().then((db) => {
      setState((prev) => ({
        ...prev,
        db,
        routeId: Object.keys(db.routeList)[0],
      }));
    });
  }, []);

  const fetchEtaDbMd5 = useCallback(() => {
    _fetchEtaDbMd5().then((md5) => {
      setState((prev) => ({
        ...prev,
        md5,
      }));
    });
  }, []);

  const fetchEtas = useCallback(
    (routeId: string, stopSeq: number, language: "zh" | "en") => {
      if (state.db === null) return;
      _fetchEtas({
        ...state.db.routeList[routeId],
        seq: stopSeq,
        language,
      }).then((etas) => {
        setState((prev) => ({
          ...prev,
          data: etas,
        }));
      });
    },
    [state.db],
  );

  return (
    <AppContext.Provider
      value={{
        ...state,
        fetchEtaDb,
        fetchEtaDbMd5,
        fetchEtas,
        setRouteId,
        setStopSeq,
        setLanguage,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export default AppContext;

const DEFAULT_STATE: AppContextState = {
  db: null,
  md5: "",
  data: [],
  routeId: "",
  stopSeq: 0,
  language: "en",
};
