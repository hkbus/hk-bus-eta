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
    )}&with_special=1`,
    {
      cache: isSafari ? "default" : "no-store",
    },
  )
    .then((response) => response.json())
    .then(({ platform_list }): Eta[] => {
      if (
        platform_list.every(({ end_service_status }: any) => end_service_status)
      ) {
        return [
          {
            eta: "",
            remark: {
              zh: "此站今日服務已經終止",
              en: "This stop's service for today has ended",
            },
            dest: {
              zh: "",
              en: "",
            },
            co: "lightRail",
          },
        ];
      }

      return platform_list.reduce(
        (acc: Eta[], { route_list, platform_id }: any) => {
          return [
            ...acc,
            ...(route_list ?? [])
              .filter(
                ({
                  route_no,
                  additionalInfo1,
                  dest_ch,
                  dest_en,
                  stop,
                }: any) =>
                  // match route number OR additionalInfo1 to the requested route
                  (route === route_no || route === additionalInfo1) &&
                  (dest_ch === dest.zh || dest_en.includes("Circular")) &&
                  stop === 0,
              )
              .map(
                ({
                  time_en,
                  train_length,
                  routeRemarkEng2,
                  routeRemarkChi2,
                }: any) => {
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

                  const platformText = `${platform_id}號月台 - ${Array(
                    train_length,
                  )
                    .fill("▭")
                    .join("")}`;

                  const platformTextEn = `Platform ${platform_id} - ${Array(
                    train_length,
                  )
                    .fill("▭")
                    .join("")}`;

                  // Append routeRemarkEng2 / routeRemarkChi2 if present
                  const remarkZh = routeRemarkChi2
                    ? `${platformText} - ${routeRemarkChi2}`
                    : platformText;
                  const remarkEn = routeRemarkEng2
                    ? `${platformTextEn} - ${routeRemarkEng2}`
                    : platformTextEn;

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
                      zh: remarkZh,
                      en: remarkEn,
                    },
                    dest: {
                      zh: "",
                      en: "",
                    },
                    co: "lightRail",
                  };
                },
              ),
          ];
        },
        [],
      );
    })
    .catch((e) => {
      console.error(e);
      return [];
    });
}
