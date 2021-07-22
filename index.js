const KmbApi = require('./Kmb')
const NwfbApi = require('./Nwfb')
const CtbApi = require('./Ctb')
const NlbApi = require('./Nlb')

module.exports = {
  // seq is 0-based here
  fetchEtas: async ( {route, stops, bound, seq, serviceType, co, nlbId }) => {
    let _etas = []
    for ( const company_id of co ) {
    if (company_id === 'kmb' && stops.kmb ){
      _etas = _etas.concat( await KmbApi.fetchEtas({
      route,
      stopId: stops.kmb[seq], 
      seq: (seq + 1 === stops.kmb.length ? 1000 : seq), 
      serviceType, bound: bound[company_id]}) 
      )
    }
    else if ( company_id === 'ctb' && stops.ctb ) {
      _etas = _etas.concat( await CtbApi.fetchEtas({stopId: stops.ctb[seq], route, bound: bound[company_id] }))
    }
    else if ( company_id === 'nwfb' && stops.nwfb ) {
      _etas = _etas.concat( await NwfbApi.fetchEtas({stopId: stops.nwfb[seq], route, bound: bound[company_id] }))
    }
    else if ( company_id === 'nlb' && stops.nlb ) {
      _etas = _etas.concat( await NlbApi.fetchEtas({stopId: stops.nlb[seq], nlbId}) )
    }
    }

    return _etas.sort((a,b) => { 
    if ( a.eta === '' ) return 1
    else if ( b.eta === '' ) return -1
    return a.eta < b.eta ? -1 : 1
    })
  },
  fetchEtaObj: () => fetch("https://hkbus.github.io/hk-bus-crawling/routeFareList.min.json").then(r => r.json()),
  fetchEtaObjMd5: () => fetch('https://hkbus.github.io/hk-bus-crawling/routeFareList.md5').then(r => r.text())
}
