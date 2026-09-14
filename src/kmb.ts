import type { Eta, RouteListEntry } from "./type";
import { isSafari } from "./utils";

interface fetchEtasProps {
  route: RouteListEntry["route"];
  co: RouteListEntry["co"];
  serviceType: RouteListEntry["serviceType"];
  bound: RouteListEntry["bound"]["kmb"];
  stops: RouteListEntry["stops"]["kmb"];
  stopId: string;
  seq: number;
}

// parameter seq is 0-indexed here
export default function fetchEtas({
  stopId,
  route,
  seq,
  serviceType,
  stops,
  co,
  bound,
}: fetchEtasProps): Promise<Eta[]> {
  return fetch(
    `https://data.etabus.gov.hk/v1/transport/kmb/eta/${stopId}/${route}/${serviceType}`,
    {
      cache: isSafari ? "default" : "no-store",
    },
  )
    .then((response) => {
      if (!response.ok) {
        throw Object.assign(new Error(`HTTP ${response.status}`), {
          isHttpError: true,
        });
      }
      return response.json().catch(() => {
        throw Object.assign(new Error("Invalid JSON response"), {
          isParseError: true,
        });
      });
    })
    .then(({ data }) =>
      data
        .filter((e: any) => e.dir === bound)
        .sort((a: any, b: any) =>
          Math.abs(a.seq - seq) < Math.abs(b.seq - seq) ? -1 : 1,
        )
        .filter((eta: any, _: number, self: any[]) => eta.seq === self[0].seq)
        // if KMB is the only service provider and the service type is matched,
        // then sequence number should be exact matched, noted that eta.seq is 1-indexed
        .filter(
          (eta: any) =>
            co.length > 1 ||
            serviceType !== eta.service_type ||
            eta.seq === seq + 1,
        )
        .filter((eta: any) => {
          if (stops[stops.length - 1] === stops[0]) {
            // handle circular route
            if (stopId === stops[0]) {
              return eta.seq === seq + 1;
            }
          }
          return true;
        })
        .map((e: any) => ({
          eta: e.eta,
          remark: {
            zh: e.rmk_tc,
            en: e.rmk_en,
          },
          dest: {
            zh: e.dest_tc,
            en: e.dest_en,
          },
          co: "kmb" as const,
        })),
    )
    .catch((err) => {
      console.error("KMB ETA fetch error:", err);
      // a network-level failure is what an adblocker looks like; HTTP and parse
      // errors are not
      const isBlocked = !err?.isHttpError && !err?.isParseError;
      return [
        {
          eta: "",
          remark: {
            zh: isBlocked
              ? "ETA 請求被封鎖 — 請檢查廣告封鎖器"
              : "無法載入 ETA 資料",
            en: isBlocked
              ? "ETA request blocked — check your ad blocker"
              : "Unable to load ETA data",
          },
          dest: { zh: "", en: "" },
          co: "kmb" as const,
          fetchError: true,
        },
      ];
    });
}
