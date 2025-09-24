import type { Eta, RouteListEntry } from "./type";
import { isSafari } from "./utils";

interface fetchEtasProps {
  stopId: string;
  nlbId: RouteListEntry["nlbId"];
  language: "zh" | "en";
}

export default function fetchEtas({
  stopId,
  nlbId,
  language,
}: fetchEtasProps): Promise<Eta[]> {
  return fetch(
    `https://rt.data.gov.hk/v2/transport/nlb/stop.php?action=estimatedArrivals&routeId=${nlbId}&stopId=${stopId}&language=${language}`,
    {
      cache: isSafari ? "default" : "no-store",
    },
  )
    .then((response) => response.json())
    .then(({ estimatedArrivals }) => {
      if (!estimatedArrivals) return [];

      return estimatedArrivals
        .filter((eta: any) => eta.estimatedArrivalTime)
        .map((e: any) => ({
          eta: e.estimatedArrivalTime.replace(" ", "T") + ".000+08:00",
          remark: {
            zh: "",
            en: "",
          },
          dest: {
            // e.g. 經: 梅窩舊墟
            // e.g. Via: Mui Wo Old Town
            [language]: e.routeVariantName,
          },
          co: "nlb",
        }));
    });
}
