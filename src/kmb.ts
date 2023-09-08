import type { Eta, RouteListEntry } from "./type";
import { isSafari } from "./utils";

interface fetchEtasProps {
  route: RouteListEntry['route'], 
  serviceType: RouteListEntry['serviceType'], 
  bound: RouteListEntry['bound']['kmb'],
  stopId: string, 
  seq: number, 
}

export default function fetchEtas ({stopId, route, seq, serviceType, bound}: fetchEtasProps): Promise<Eta[]> {
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
