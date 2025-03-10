import type { Eta, RouteListEntry } from "./type";
import { isSafari } from "./utils";

interface fetchEtasProps {
  route: RouteListEntry["route"];
  dest: RouteListEntry["dest"];
  stopId: string;
}

export default function fetchEtas({
  stopId,
  route,
  dest,
}: fetchEtasProps): Promise<Eta[]> {
  return fetch(
    `https://rt.data.gov.hk/v1/transport/mtr/lrt/getSchedule?station_id=${stopId.slice(
      2,
    )}`,
    {
      cache: isSafari ? "default" : "no-store",
    },
  )
    .then((response) => response.json())
    .then(({ status, platform_list }) => {
      if (status === 0) return [];
      return platform_list.reduce(
        (acc: Eta[], { route_list, platform_id }: any) => [
          ...acc,
          ...route_list
            .filter(
              ({ route_no, dest_ch, dest_en, stop }: any) =>
                route === route_no &&
                (dest_ch === dest.zh || dest_en.includes("Circular")) &&
                stop === 0,
            )
            .map(({ time_en, train_length }: any) => {
              let waitTime = 0;
              switch (time_en.toLowerCase()) {
                case "arriving":
                case "departing":
                case "-":
                  waitTime = 0;
                  break;
                default:
                  waitTime = parseInt(time_en, 10);
                  break;
              }
              const etaDate = new Date(
                Date.now() + waitTime * 60 * 1000 + 8 * 3600000,
              );
              return {
                eta:
                  `${etaDate.getUTCFullYear()}-${`0${
                    etaDate.getUTCMonth() + 1
                  }`.slice(-2)}-${`0${etaDate.getUTCDate()}`.slice(-2)}` +
                  `T${`0${etaDate.getUTCHours()}`.slice(
                    -2,
                  )}:${`0${etaDate.getMinutes()}`.slice(
                    -2,
                  )}:${`0${etaDate.getSeconds()}`.slice(-2)}+08:00`,
                remark: {
                  zh: `${platform_id}號月台 - ${Array(train_length)
                    .fill("▭")
                    .join("")}`,
                  en: `Platform ${platform_id} - ${Array(train_length)
                    .fill("▭")
                    .join("")}`,
                },
                dest: {
                  zh: "",
                  en: "",
                },
                co: "lightRail",
              };
            }, []),
        ],
        [],
      )
    })
    .catch((e) => {
      console.error(e);
      return [];
    });
}
