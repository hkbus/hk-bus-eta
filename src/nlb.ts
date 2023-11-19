import type { Eta, RouteListEntry } from "./type";
import { isSafari } from "./utils";

interface fetchEtasProps {
  stopId: string;
  nlbId: RouteListEntry["nlbId"];
}

export default function fetchEtas({
  stopId,
  nlbId,
}: fetchEtasProps): Promise<Eta[]> {
  return fetch(
    `https://rt.data.gov.hk/v1/transport/nlb/stop.php?action=estimatedArrivals`,
    {
      body: JSON.stringify({
        routeId: nlbId,
        stopId,
        language: "zh",
      }),
      headers: {
        "Content-Type": "text/plain",
      },
      method: "POST",
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
            zh: "",
            en: "",
          },
          co: "nlb",
        }));
    });
}
