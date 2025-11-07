import type { Eta, EtaDb, RouteListEntry } from "./type";
import { getUpcomingFerry, isSafari } from "./utils";

interface fetchEtasProps {
  route: RouteListEntry["route"];
  bound: RouteListEntry["bound"]["hkkf"];
  freq: RouteListEntry["freq"];
  seq: number;
  holidays: EtaDb["holidays"];
  serviceDayMap: EtaDb["serviceDayMap"];
}

export default function fetchEtas({
  route,
  bound,
  freq,
  seq,
  holidays,
  serviceDayMap,
}: fetchEtasProps): Promise<Eta[]> {
  if (seq === 0) {
    const now = new Date();
    return Promise.resolve(
      getUpcomingFerry({ holidays, serviceDayMap, freq, date: new Date() })
        .filter((v) => new Date(v).getTime() - now.getTime() < 180 * 60 * 1000)
        .map((eta) => ({
          eta: eta,
          remark: {
            zh: "預定班次",
            en: "Scheduled",
          },
          dest: {
            zh: "",
            en: "",
          },
          co: "hkkf",
        }))
    );
  } else if (seq === 1) {
    return fetch(
      `https://www.hkkfeta.com/opendata/eta/${route.slice(2)}/${bound === "I" ? "inbound" : "outbound"}`,
      {
        cache: isSafari ? "default" : "no-store",
      }
    )
      .then((response) => response.json())
      .then(({ data }) => {
        if (!data) return [];

        return data.map(({ ETA }: any) => {
          return {
            eta: ETA,
            remark: {
              zh: "",
              en: "",
            },
            dest: {
              zh: "",
              en: "",
            },
            co: "hkkf",
          }
        });
      });
  } else {
    return Promise.resolve([]);
  }
}
