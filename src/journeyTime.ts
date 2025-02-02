import { RouteListEntry, StopList } from "./type";
import { formatInTimeZone } from "date-fns-tz";

type JT_CACHE = Record<
  string,
  {
    s: number;
    ts: number;
  }
>;

const __HK_BUS_ETA_JT_CACHE__: JT_CACHE = {};

async function fetchEstJourneyTimeBasedOnHistoricalData({
  route,
  startSeq,
  endSeq,
}: {
  route: RouteListEntry;
  startSeq: number;
  endSeq: number;
}): Promise<number> {
  const requests = [];
  for (let i = startSeq; i < endSeq; ++i) {
    const start = Object.values(route.stops)[0][startSeq];
    const end = Object.values(route.stops)[0][endSeq];
    const day =
      parseInt(formatInTimeZone(new Date(), "Asia/Hong_Kong", "i"), 10) - 1;
    const hour = formatInTimeZone(new Date(), "Asia/Hong_Kong", "HH");
    requests.push(
      fetch(
        `https://raw.githubusercontent.com/HK-Bus-ETA/hk-bus-time-between-stops/refs/heads/pages/times_hourly/${day}/${hour}/${start.slice(0, 2)}.json`,
      )
        .then((r) => r.json())
        .then((r) => {
          if (r[start][end]) {
            return r[start][end];
          }
          throw new Error("not found");
        }),
    );
  }
  return Promise.all(requests).then((seconds) =>
    Math.ceil(seconds.reduce((acc, cur) => acc + cur, 0) / 60),
  );
}

async function fetchEstJourneyTimeBasedOnHistoricalAvgData({
  route,
  startSeq,
  endSeq,
}: {
  route: RouteListEntry;
  startSeq: number;
  endSeq: number;
}): Promise<number> {
  const requests = [];
  for (let i = startSeq; i < endSeq; ++i) {
    const start = Object.values(route.stops)[0][startSeq];
    const end = Object.values(route.stops)[0][endSeq];
    requests.push(
      fetch(
        `https://raw.githubusercontent.com/HK-Bus-ETA/hk-bus-time-between-stops/refs/heads/pages/times/${start.slice(0, 2)}.json`,
      )
        .then((r) => r.json())
        .then((r) => {
          if (r[start][end]) {
            return r[start][end];
          }
          throw new Error("not found");
        }),
    );
  }
  return Promise.all(requests).then((seconds) =>
    Math.ceil(seconds.reduce((acc, cur) => acc + cur, 0) / 60),
  );
}

/**
 * Fetch Journey time in minute for a route
 * @param {Object}
 * @returns {number} journey time in minute
 */
export async function fetchEstJourneyTime({
  route,
  stopList,
  startSeq,
  endSeq,
  batchSize = 4,
  signal,
}: {
  route: RouteListEntry;
  stopList: StopList;
  startSeq: number;
  endSeq: number;
  batchSize?: number;
  signal?: AbortSignal | null;
}): Promise<number> {
  const stops = Object.values(route.stops)[0];
  if (
    !["kmb", "nlb", "ctb", "lrtfeeder", "gmb"].includes(
      Object.keys(route.stops)[0],
    )
  )
    throw new Error("Support vehicle transport only");
  if (startSeq < 0) throw new Error("startSeq should be ≥ 0");
  if (endSeq >= stops.length)
    throw new Error("endSeq should be < number of stops");
  if (startSeq >= endSeq) throw new Error("startSeq should be < endSeq");

  let ts = Date.now();
  let ret = 0;
  let payloads: Array<[string, string, Record<string, number>]> = [];
  for (let i = startSeq; i < endSeq; ++i) {
    payloads.push([
      `${stops[i]}-${stops[i + 1]}`,
      JSON.stringify({
        start: {
          lat: stopList[stops[i]].location.lat,
          long: stopList[stops[i]].location.lng,
        },
        end: {
          lat: stopList[stops[i + 1]].location.lat,
          long: stopList[stops[i + 1]].location.lng,
        },
        departIn: Math.round(ret / 15) * 15,
      }),
      {
        startSeq: i,
        endSeq: i + 1,
      },
    ]);
    if (payloads.length < batchSize && i !== endSeq - 1) {
      // skip fetching until whole batch filled
      continue;
    }
    const seconds = await Promise.all(
      payloads.map(([key, payload, { startSeq, endSeq }]) => {
        // load from cache if it is query within 15 minutes
        if (
          key in __HK_BUS_ETA_JT_CACHE__ &&
          __HK_BUS_ETA_JT_CACHE__[key].ts + 15 * 60 * 1000 >= ts
        ) {
          return Promise.resolve(__HK_BUS_ETA_JT_CACHE__[key].s);
        }

        return fetchEstJourneyTimeBasedOnHistoricalData({
          route,
          startSeq,
          endSeq,
        })
          .catch(() =>
            fetchEstJourneyTimeBasedOnHistoricalAvgData({
              route,
              startSeq,
              endSeq,
            }),
          )
          .catch(() =>
            fetch("https://tdas-api.hkemobility.gov.hk/tdas/api/route", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: payload,
              signal,
            })
              .then((r) => r.json())
              .then(({ eta, distM, jSpeed }) => {
                const speedStr = /(\d+)公里\/小時/g.exec(jSpeed)?.[1];
                if (
                  speedStr !== null &&
                  speedStr !== undefined &&
                  !isNaN(parseInt(speedStr, 10))
                ) {
                  // Set the speed limit as 70 km/h
                  return (
                    (distM / Math.min(parseInt(speedStr, 10), 70) / 1000) * 60
                  );
                }
                console.warn(
                  "Unable to parse TDAS response for more precise journey time. Falling back.",
                );
                const [hh, mm] = eta
                  .split(":")
                  .map((v: string) => parseInt(v, 10));
                return hh * 60 + mm;
              })
              .catch(() => {
                //  for any error, assume 4 minutes journey time blindly
                return 4;
              })
              .then((s) => {
                __HK_BUS_ETA_JT_CACHE__[key] = { s: s * 1.1, ts };
                // margin for car accelerating, decelerating, and passenger picking up and dropping off
                return s * 1.1;
              }),
          );
      }),
    );
    seconds.forEach((s) => {
      ret += s;
    });
    payloads.length = 0;
  }
  for (const k in __HK_BUS_ETA_JT_CACHE__) {
    // clean up cache
    if (__HK_BUS_ETA_JT_CACHE__[k].ts + 15 * 60 * 1000 < ts) {
      delete __HK_BUS_ETA_JT_CACHE__[k];
    }
  }
  return ret;
}
