import type { Eta, RouteListEntry } from "./type";
import { isSafari } from "./utils";

interface fetchEtasProps {
  route: RouteListEntry['route'], 
  co: RouteListEntry['co'],
  serviceType: RouteListEntry['serviceType'], 
  bound: RouteListEntry['bound']['kmb'],
  stopId: string, 
  seq: number,
}

// parameter seq is 0-indexed here
export default function fetchEtas ({stopId, route, seq, serviceType, co, bound}: fetchEtasProps): Promise<Eta[]> {
  return (
    fetch(`https://data.etabus.gov.hk/v1/transport/kmb/eta/${stopId}/${route}/${serviceType}`,{ 
      cache: isSafari ? 'default' : 'no-store'
    })
    .then( response => response.json() )
    .then(({data}) => (
      data.filter((e: any) => 
        e.eta !== null
        && e.dir === bound 
      )
      .sort((a: any, b: any) => Math.abs(a.seq - seq) < Math.abs(b.seq - seq) ? -1 : 1 )
      .filter((eta: any, _: number, self: any[]) => eta.seq === self[0].seq)
      // if KMB is the only service provider and the service type is matched, 
      // then sequence number should be exact matched, noted that eta.seq is 1-indexed
      .filter((eta: any) => co.length > 1 || serviceType !== eta.service_type || eta.seq === seq + 1)
      .map((e: any) => ({
        eta: e.eta,
        remark: {
          zh: e.rmk_tc,
          en: e.rmk_en
        },
        co: 'kmb'
      }))
    ))
  );
}
