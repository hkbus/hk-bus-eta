import { RouteListEntry, StopList } from "./type";

/**
 * Fetch Journey time in minute for a route
 * @param {Object} 
 * @returns {number} journey time in minute
 */
export async function fetchEstJourneyTime({
  route, stopList, startSeq, endSeq, batchSize = 4
}: {
  route: RouteListEntry, stopList: StopList, startSeq: number, endSeq: number, batchSize?: number
}): Promise<number> {
  const stops = Object.values(route.stops)[0]
  if ( startSeq < 0 ) throw new Error("startSeq should be ≥ 0")
  if ( endSeq >= stops.length ) throw new Error("endSeq should be < number of stops")
  if ( startSeq >= endSeq ) throw new Error("startSeq should be < endSeq")
  
  let ret = 0
  let payloads = []
  for ( let i = startSeq; i < endSeq; ++i ) {
    if ( payloads.length < batchSize && i !== endSeq - 1 ) {
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
        body: payload
      })
        .then(r => r.json())
        .then(({eta}) => {
          const [hh, mm] = eta.split(":").map((v: string) => parseInt(v, 10))
          return hh * 60 + mm + 1;
        })
    ))
    minutes.forEach(m => {
      ret += m
    })
    payloads.length = 0
  }
  return ret
}