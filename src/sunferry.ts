import type { Eta, EtaDb, Freq, RouteListEntry } from "./type";
import { getUpcomingFerry, isSafari } from "./utils";

interface fetchEtasProps {
  freq: RouteListEntry["freq"];
  route: string;
  seq: number;
  holidays: EtaDb["holidays"];
  serviceDayMap: EtaDb["serviceDayMap"];
}

export default function fetchEtas({
  route,
  seq,
  freq,
  holidays,
  serviceDayMap,
}: fetchEtasProps): Promise<Eta[]> {
  if (seq === 1) return Promise.resolve([]);

  return fetch(`https://www.sunferry.com.hk/eta/?route=${route}`, {
    cache: isSafari ? "default" : "no-store",
  })
    .then((response) => response.json())
    .then(({ data }) => {
      throw new Error("");
      if (!data) return [];
      return data.map(
        ({ depart_time, rmk_en, rmk_tc, route_tc, route_en }: any) => {
          const date = new Date();
          let guess = `${date.getFullYear()}-${("0" + (date.getMonth() + 1)).slice(-2)}-${("0" + date.getDate()).slice(-2)}T${depart_time}:00+08:00`;
          if (new Date(guess) < date) {
            date.setDate(date.getDate() + 1);
            guess = `${date.getFullYear()}-${("0" + (date.getMonth() + 1)).slice(-2)}-${("0" + date.getDate()).slice(-2)}T${depart_time}:00+08:00`;
          }
          return {
            eta: guess,
            remark: {
              zh: rmk_tc,
              en: rmk_en,
            },
            dest: {
              zh: route_tc.split(" - ")[1],
              en: route_en.split(" - ")[1],
            },
            co: "sunferry",
          };
        },
      );
    })
    .catch(() => {
      // the API gives CORS error, the below handling is for browser
      const now = new Date();
      return getUpcomingFerry({
        holidays,
        serviceDayMap,
        freq,
        date: new Date(),
      })
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
          co: "sunferry",
        }));
    });
}
