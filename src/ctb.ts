import { isSafari } from "./utils";
import type { Eta, RouteListEntry } from "./type";

interface fetchEtasProps {
  route: RouteListEntry["route"];
  bound: RouteListEntry["bound"]["ctb"];
  stopId: string;
  seq: number;
}

export default function fetchEtas({
  stopId,
  route,
  bound,
  seq,
}: fetchEtasProps): Promise<Eta[]> {
  return fetch(
    `https://rt.data.gov.hk//v2/transport/citybus/eta/CTB/${stopId}/${route}`,
    {
      cache: isSafari ? "default" : "no-store",
    },
  )
    .then((response) => response.json())
    .then(({ data }) =>
      data
        .filter((eta: any) => eta.eta && bound.includes(eta.dir))
        // filter the eta by the stop sequence information
        // as the route data may not 100% match
        // use the nearest seq
        .sort((a: any, b: any) =>
          Math.abs(a.seq - seq) < Math.abs(b.seq - seq) ? -1 : 1,
        )
        .filter(
          (eta: any, _: number, self: Array<any>) => eta.seq === self[0].seq,
        )
        .map((e: any) => ({
          eta: e.eta,
          remark: {
            zh: `往${e.dest_tc} ${e.rmk_tc}`,
            en: `to ${e.dest_en} ${e.rmk_en}`,
          },
          co: "ctb",
        })),
    );
}
