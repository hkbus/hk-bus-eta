import { TZDate } from "@date-fns/tz";
import {
  add,
  closestTo,
  endOfMinute,
  formatISO,
  max,
  set,
  startOfMinute,
  sub,
} from "date-fns";
import type { Eta, EtaDb, Freq, RouteListEntry } from "./type";
import { getUpcomingFerry, isSafari } from "./utils";

interface fetchEtasProps {
  freq: RouteListEntry["freq"];
  route: string;
  seq: number;
  holidays: EtaDb["holidays"];
  serviceDayMap: EtaDb["serviceDayMap"];
}

export default async function fetchEtas({
  route,
  seq,
  freq,
  holidays,
  serviceDayMap,
}: fetchEtasProps): Promise<Eta[]> {
  if (seq > 1) {
    return Promise.resolve([]);
  }

  const apiEtas = await fetch(
    `https://www.sunferry.com.hk/eta/?route=${route}`,
    {
      cache: isSafari ? "default" : "no-store",
    }
  )
    .then((response) => response.json())
    .then(
      ({
        data,
        generated_timestamp,
      }: {
        data:
          | {
              routecode: string;
              route_en: string;
              route_tc: string;
              route_sc: string;
              vesselcode?: string;
              depart_time: string;
              lat: string | null;
              lng: string | null;
              eta: string | null;
              rmk_en: string | null;
              rmk_tc: string | null;
              rmk_sc: string | null;
              date_timestamp: string;
            }[]
          | null;
        generated_timestamp: string;
      }) => {
        if (!data) return [];
        return data.map(
          ({ depart_time, eta, rmk_en, rmk_tc, route_tc, route_en }) => {
            /**
             * @param timeString HH:mm
             */
            const guessDateTimeByTimeString = (timeString: string) => {
              const generated = new TZDate(
                generated_timestamp,
                "Asia/Hong_Kong"
              );
              const time = startOfMinute(
                set(generated, {
                  hours: parseInt(timeString.split(":")[0], 10),
                  minutes: parseInt(timeString.split(":")[1], 10),
                })
              );
              return closestTo(generated, [
                sub(time, { days: 1 }),
                time,
                add(time, { days: 1 }),
              ])!;
            };

            // 橫水渡 - (坪洲-梅窩)
            // 中環 - 長洲
            const [originZh, destZh] = (
              /^橫水渡 - \((.*)\)$/.exec(route_tc)?.[1] || route_tc
            )
              .split("-")
              .map((s) => s.trim());
            // Inter Islands (Peng Chau - Mui Wo)
            // Central - Cheung Chau
            const [originEn, destEn] = (
              /^Inter Islands \((.*)\)$/.exec(route_en)?.[1] || route_en
            )
              .split("-")
              .map((s) => s.trim());

            return {
              departTime: formatISO(guessDateTimeByTimeString(depart_time)),
              eta: eta ? formatISO(guessDateTimeByTimeString(eta)) : null, // No ETA: Not yet departed OR already arrived at destination
              remark: {
                zh: rmk_tc ?? "",
                en: rmk_en ?? "",
              },
              dest: {
                zh: destZh,
                en: destEn,
              },
              co: "sunferry" as const,
            };
          }
        );
      }
    )
    .catch((err) => {
      console.error("Error fetching Sun Ferry ETAs:", err);
      return [];
    });

  if (seq === 0) {
    const greatestApiEtaTime =
      apiEtas.length > 0
        ? max(apiEtas.map((e) => new Date(e.departTime)))
        : undefined;
    const now = new Date();
    return [
      ...apiEtas
        .filter(
          (eta) => endOfMinute(new Date(eta.departTime)) >= now && !eta.eta
        )
        .map((eta) => ({
          eta: eta.departTime,
          remark: {
            zh: [eta.remark.zh, "預定班次"].filter(Boolean).join("；"),
            en: [eta.remark.en, "Scheduled"].filter(Boolean).join("; "),
          },
          dest: eta.dest,
          co: eta.co,
        })),
      ...getUpcomingFerry({
        holidays,
        serviceDayMap,
        freq,
        date: max([
          ...(greatestApiEtaTime
            ? [add(greatestApiEtaTime, { minutes: 1 })]
            : []),
          now,
        ]),
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
          co: "sunferry" as const,
        })),
    ];
  } else if (seq === 1) {
    return apiEtas
      .filter((eta) => eta.eta !== null)
      .map((eta) => ({
        eta: eta.eta!,
        remark: {
          zh: eta.remark.zh,
          en: eta.remark.en,
        },
        dest: eta.dest,
        co: eta.co,
      }));
  } else {
    return [];
  }
}
