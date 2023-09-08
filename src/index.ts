import kmb from './kmb'
import ctb from './ctb'
import nlb from './nlb'
import lrtfeeder from './lrtfeeder'
import gmb from './gmb'
import lightrail from './lightRail'
import mtr from './mtr'
import { RouteListEntry, EtaDb, Eta } from './type'

interface fetchEtasProps extends RouteListEntry {
  language: "zh" | "en",
  seq: number;
}

export async function fetchEtas ( {route, stops, bound, dest, seq, serviceType, co, nlbId, gtfsId, language }: fetchEtasProps): Promise<Eta[]> {
  try {
    let _etas: Eta[] = []
    for ( const company_id of co ) {
      if (company_id === 'kmb' && stops.kmb ){
        _etas = _etas.concat( await kmb({
          route,
          stopId: stops.kmb[seq], 
          seq,
          serviceType, bound: bound[company_id]
        }))
      } else if ( company_id === 'ctb' && stops.ctb ) {
        _etas = _etas.concat( await ctb({stopId: stops.ctb[seq], route, bound: bound[company_id], seq }))
      } else if ( company_id === 'nlb' && stops.nlb ) {
        _etas = _etas.concat( await nlb({stopId: stops.nlb[seq], nlbId}) )
      } else if ( company_id === 'lrtfeeder' && stops.lrtfeeder ) {
        _etas = _etas.concat( await lrtfeeder({stopId: stops.lrtfeeder[seq], route, language}))
      } else if ( company_id === 'gmb' && stops.gmb ) {
        _etas = _etas.concat( await gmb({stopId: stops.gmb[seq], gtfsId, seq, bound: bound[company_id]}) )
      } else if ( company_id === 'lightRail' && stops.lightRail ) {
        _etas = _etas.concat( await lightrail({ stopId: stops.lightRail[seq], route, dest }) )
      } else if ( company_id === 'mtr' && stops.mtr ) {
        _etas = _etas.concat( await mtr({ stopId: stops.mtr[seq], route, bound: bound.mtr }) )
      }
    }

    return _etas.sort((a,b) => { 
      if ( a.eta === '' ) return 1
      else if ( b.eta === '' ) return -1
      return a.eta < b.eta ? -1 : 1
    })
  } catch (err) {
    console.error(err)
    return []
  }
}

export async function fetchEtaDb (): Promise<EtaDb> {
  return fetch("https://hkbus.github.io/hk-bus-crawling/routeFareList.min.json").then(r => r.json())
}

export async function fetchEtaDbMd5 (): Promise<string> {
  return fetch('https://hkbus.github.io/hk-bus-crawling/routeFareList.md5').then(r => r.text())
}

export type * from "./type";