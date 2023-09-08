import type { Eta, RouteListEntry } from "./type";
import { isSafari } from "./utils";

interface fetchEtasProps {
  route: RouteListEntry['route'], 
  bound: RouteListEntry['bound']['mtr'],
  stopId: string, 
}

export default function fetchEtas ({stopId, route, bound }: fetchEtasProps): Promise<Eta[]> {
  return (
    fetch(`https://rt.data.gov.hk/v1/transport/mtr/getSchedule.php?line=${route}&sta=${stopId}`, {
      cache: isSafari ? 'default' : 'no-store',
    }).then( response => response.json() )
    .then(({data, status}) => (
      status === 0 
        ? [] 
        : data[`${route}-${stopId}`][bound.slice(-2,1) === 'U' ? 'UP' : 'DOWN']  
            .reduce((acc: Eta[], {time, plat}: any) => [
              ...acc,
              {
                eta: time.replace(' ', 'T')+'+08:00',
                remark: {
                  zh: `${plat}號月台`,
                  en: `Platform ${plat}`
                },
                co: 'mtr'
              }
            ], [])
    ))
  );
}