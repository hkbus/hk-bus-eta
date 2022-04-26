const utils = require('./utils');

module.exports = {
  co: 'ctb',
  fetchEtas: ({stopId, route, bound, seq }) => (
    fetch(`https://rt.data.gov.hk//v1/transport/citybus-nwfb/eta/CTB/${stopId}/${route}`, {
      cache: utils.isSafari ? 'default' : 'no-store'
    }).then(
      response => response.json()
    ).then(({data}) => (
      data
        .filter(eta => eta.eta && eta.dir === bound)
        // filter the eta by the stop sequence information 
        // as the route data may not 100% match
        // use the nearest seq
        .sort((a,b) => Math.abs(a.seq - seq) < Math.abs(b.seq - seq) ? -1 : 1 )
        .filter((eta, idx, self) => eta.seq === self[0].seq)
        .map(e => ({
          eta: e.eta,
          remark: {
            zh: e.rmk_tc,
            en: e.rmk_en
          },
          co: 'ctb'
        }))
    ))
  ),
  fetchStopEtas: ( stopId ) => (
    fetch(`https://rt.data.gov.hk/v1/transport/batch/stop-eta/CTB/${stopId}`, { 
      cache: utils.isSafari ? 'default' : 'no-store'
    }).then(
      response => response.json()
    ).then(({data}) => data.map( e => ({
      route: e.route,
      bound: e.dir,
      seq: e.seq,
      eta: e.eta,
      dest: {
        en: e.dest.replace('/','／')
      },
      remark: {
        en: e.rmk
      },
      serviceType: 1,
      co: 'ctb'
    })))
  )
}
