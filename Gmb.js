const utils = require('./utils');

module.exports = {
  co: 'gmb',
  fetchEtas: ({gtfsId, stopId, bound,seq}) => (
    fetch(`https://data.etagmb.gov.hk/eta/route-stop/${gtfsId}/${stopId}`, {
      cache: utils.isSafari ? 'default' : 'no-store'
    }).then( response => response.json() )
    .then(({data}) => (
      data
        .filter(({route_seq}) => ( bound === 'O' && route_seq === 1 ) || ( bound === 'I' && route_seq === 2 ) )
        .filter(({stop_seq}) => stop_seq === seq + 1)
        .reduce( (acc, {eta}) => [
          ...acc, 
          ...eta.map( data => ({
            eta: data.timestamp,
            remark: {
              zh: data.remarks_tc,
              en: data.remarks_en
            },
            co: 'gmb'
          }))
        ], [] )
    ))
  ),
  fetchStopEtas: ( stopId ) => []
}
