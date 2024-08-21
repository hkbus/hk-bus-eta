import { RouteListEntry, StopList } from "./type";

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
  
  let ret = 0
  let payloads = []
  for ( let i = startSeq; i < endSeq; ++i ) {
    payloads.push(
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
    )
    if ( payloads.length < batchSize && i !== endSeq - 1 ) {
      // skip fetching until whole batch filled
      continue
    }
    const minutes = await Promise.all(payloads.map(payload => 
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
        .then(({eta}) => {
          const [hh, mm] = eta.split(":").map((v: string) => parseInt(v, 10))
          return hh * 60 + mm;
        })
        .catch(() => {
          //  for any error, assume 4 minutes journey time blindly
          return 4;
        })
        .then(m => {
          // margin for car accelerating, decelerating, and passenger picking up and dropping off
          return m + 1
        })
    ))
    minutes.forEach(m => {
      ret += m
    })
    payloads.length = 0
  }
  return ret
}