const utils = require('./utils');

module.exports = {
  co: 'kmb',
  fetchEtas: ({stopId, route, seq, serviceType, bound}) => (
    fetch(`https://data.etabus.gov.hk/v1/transport/kmb/eta/${stopId}/${route}/${serviceType}`,{ 
      cache: utils.isSafari ? 'default' : 'no-store'
    })
    .then( response => response.json() )
    .then(({data}) => (
      data.filter(e => 
        e.eta !== null
        && e.dir === bound 
      )
      .sort((a,b) => Math.abs(a.seq - seq) < Math.abs(b.seq - seq) ? -1 : 1 )
      .filter((eta, idx, self) => eta.seq === self[0].seq)
      .map(e => ({
        eta: e.eta,
        remark: {
          zh: e.rmk_tc,
          en: e.rmk_en
        },
        co: 'kmb'
      }))
    ))
  ),
  fetchStopEtas: ( stopId ) => (
    fetch(`https://data.etabus.gov.hk/v1/transport/kmb/stop-eta/${stopId}`, { 
      cache: utils.isSafari ? 'default' : 'no-store'
    })
    .then(response => response.json())
    .then(({data}) => data.map( e => ({
      route: e.route,
      bound: e.dir,
      seq: e.seq,
      eta: e.eta,
      dest: {
        zh: e.dest_tc,
        en: e.dest_en
      },
      remark: {
        zh: e.rmk,
        en: e.rmk
      },
      serviceType: e.service_type,
      co: 'kmb'
    })))
  )
}
