const utils = require('./utils');

module.exports = {
  co: 'mtr',
  fetchEtas: ({stopId, route, bound }) => (
    fetch(`https://rt.data.gov.hk/v1/transport/mtr/getSchedule.php?line=${route}&sta=${stopId}`, {
      cache: utils.isSafari ? 'default' : 'no-store',
    }).then( response => response.json() )
    .then(({data, status}) => (
      status === 0 
        ? [] 
        : data[`${route}-${stopId}`][bound.slice(-2,1) === 'U' ? 'UP' : 'DOWN']  
            .reduce((acc, {time, plat, dest}) => [
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
  ),
  fetchStopEtas: ( stopId ) => []
}
