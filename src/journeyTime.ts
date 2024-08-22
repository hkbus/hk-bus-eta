import { RouteListEntry, StopList } from "./type";

type JT_CACHE = Record<string, {
  m: number;
  ts: number;
}>

const __HK_BUS_ETA_JT_CACHE__: JT_CACHE = {}

/**
 * Fetch Journey time in minute for a route
 * @param {Object} 
 * @returns {number} journey time in minute
 */
export async function fetchEstJourneyTime({
  route, stopList, startSeq, endSeq, batchSize = 4, signal
}: {
  route: RouteListEntry, stopList: StopList, startSeq: number, endSeq: number, batchSize?: number,
  signal?: AbortSignal | null,
}): Promise<number> {
  const stops = Object.values(route.stops)[0]
  if ( !["kmb", "nlb", "ctb", "lrtfeeder", "gmb"].includes(Object.keys(route.stops)[0]) ) throw new Error("Support vehicle transport only")
  if ( startSeq < 0 ) throw new Error("startSeq should be ≥ 0")
  if ( endSeq >= stops.length ) throw new Error("endSeq should be < number of stops")
  if ( startSeq >= endSeq ) throw new Error("startSeq should be < endSeq")
  
  let ts = Date.now()
  let ret = 0
  let payloads = []
  for ( let i = startSeq; i < endSeq; ++i ) {
    payloads.push([
      `${stops[i]}-${stops[i+1]}`,
      JSON.stringify({
        start: {
          lat: stopList[stops[i]].location.lat,
          long: stopList[stops[i]].location.lng,
        }, 
        end: {
          lat: stopList[stops[i+1]].location.lat,
          long: stopList[stops[i+1]].location.lng,
        }, 
        departIn: Math.round(ret / 15) * 15
      })
    ])
    if ( payloads.length < batchSize && i !== endSeq - 1 ) {
      // skip fetching until whole batch filled
      continue
    }
    const minutes = await Promise.all(payloads.map(([key, payload]) => {
      // load from cache if it is query within 15 minutes
      if ( key in __HK_BUS_ETA_JT_CACHE__ && __HK_BUS_ETA_JT_CACHE__[key].ts + 15 * 60 * 1000 >= ts ) {
        return Promise.resolve(__HK_BUS_ETA_JT_CACHE__[key].m)
      }

      return (
        //TODO: update to use gov API
        // fetch('https://tdas.hkbus.app/tdas/api/route', {
        fetch('https://tdas.hkbus.app/tdas/api/route', {
          method: "POST",
          headers: {
            'Content-Type': "application/json",
          },
          body: payload,
          signal,
        })
          .then(r => r.json())
          .then(({eta, distM, jSpeed}) => {
            const speedStr = /(\d+)公里\/小時/g.exec(jSpeed)?.[1];
            if (
              speedStr !== null &&
              speedStr !== undefined &&
              !isNaN(parseInt(speedStr, 10))
            ) {
              // Set the speed limit as 70 km/h
              return (distM / Math.min(parseInt(speedStr, 10), 70) / 1000) * 60;
            }
            console.warn(
              "Unable to parse TDAS response for more precise journey time. Falling back."
            );
            const [hh, mm] = eta.split(":").map((v: string) => parseInt(v, 10))
            return hh * 60 + mm;
          })
          .catch(() => {
            //  for any error, assume 4 minutes journey time blindly
            return 4;
          })
          .then(m => {
            __HK_BUS_ETA_JT_CACHE__[key] = { m: m * 1.1, ts }
            // margin for car accelerating, decelerating, and passenger picking up and dropping off
            return m * 1.1
          })
        )
      }
    ))
    minutes.forEach(m => {
      ret += m
    })
    payloads.length = 0
  }
  for ( const k in __HK_BUS_ETA_JT_CACHE__ ) {
    // clean up cache
    if ( __HK_BUS_ETA_JT_CACHE__[k].ts + 15 * 60 * 1000 < ts ) {
      delete __HK_BUS_ETA_JT_CACHE__[k];
    }
  }
  return ret
}