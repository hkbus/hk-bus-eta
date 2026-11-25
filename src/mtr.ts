import type { Eta, RouteListEntry, StopList } from "./type";
import { isSafari, safeFetch, enc } from "./utils";

interface fetchEtasProps {
  route: RouteListEntry["route"];
  bound: RouteListEntry["bound"]["mtr"];
  stopId: string;
  stopList: StopList;
}

export default function fetchEtas({
  stopId,
  route,
  bound,
  stopList,
}: fetchEtasProps): Promise<Eta[]> {
  return safeFetch(
    `https://rt.data.gov.hk/v1/transport/mtr/getSchedule.php?line=${enc(route)}&sta=${enc(stopId)}`,
    {
      cache: isSafari ? "default" : "no-store",
    },
  )
    .catch(() => (
      safeFetch(
        `https://mtr.hkbus.app/?line=${enc(route)}&sta=${enc(stopId)}`,
        {
          cache: isSafari ? "default" : "no-store",
        },  
      )
    ))
    .then((response) => response.json())
    .then(({ data, message, status, url }): Eta[] => {
      if (status === 0) {
        if (message && typeof message === "string") {
          const message2 = message
            .replace("Please click here for more information.", "")
            .trim();
          return [
            {
              eta: "",
              remark: {
                zh: message2,
                en: message2,
              },
              dest: {
                zh: "",
                en: "",
              },
              co: "mtr",
            },
          ];
        }
        return [];
      }
      return data[`${route}-${stopId}`][
        bound.endsWith("UT") ? "UP" : "DOWN"
      ].reduce(
        (acc: Eta[], { time, plat, dest }: any) => [
          ...acc,
          {
            eta: time.replace(" ", "T") + "+08:00",
            remark: {
              zh: `${plat}號月台`,
              en: `Platform ${plat}`,
            },
            dest: {
              zh: stopList[dest].name.zh,
              en: stopList[dest].name.en,
            },
            co: "mtr",
          },
        ],
        []
      );
    });
}
