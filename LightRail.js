const utils = require('./utils');

module.exports = {
  co: 'lightRail',
  fetchEtas: ({stopId, route, dest }) => (
    fetch(`https://rt.data.gov.hk/v1/transport/mtr/lrt/getSchedule?station_id=${stopId.slice(2)}`, {
      cache: utils.isSafari ? 'default' : 'no-store',

    }).then( response => response.json() )
    .then(({platform_list}) => (
      platform_list
        .reduce((acc, {route_list, platform_id}) => [
          ...acc,
          ...route_list
            .filter(({route_no, dest_ch, stop}) => route === route_no && dest_ch === dest.zh && stop === 0)
            .map( ({time_en}) => {
              const etaDate = new Date(Date.now() + parseInt(time_en, 10) * 60 * 1000).toISOString();
              return {
                eta: etaDate,
                remark: {
                  zh: `${platform_id}號平台`,
                  en: `Platform ${platform_id}`
                },
                co: 'lightRail'
              }
            }, [])
        ], [])
    ))
  ),
  fetchStopEtas: ( stopId ) => []
}
