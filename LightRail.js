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
              let waitTime = 0
              switch ( time_en.toLowerCase() ) {
                case 'arriving':
                case 'departing':
                case '-':
                  waitTime = 0;
                  break;
                default:
                  waitTime = parseInt(time_en, 10)
                  break;
              }
              const etaDate = new Date(Date.now() + waitTime * 60 * 1000 + 8 * 3600000);
              return {
                eta: `${etaDate.getUTCFullYear()}-${`0${etaDate.getUTCMonth() + 1}`.slice(-2)}-${`0${etaDate.getUTCDate()}`.slice(-2)}`
                  +`T${`0${etaDate.getUTCHours()}`.slice(-2)}:${`0${etaDate.getMinutes()}`.slice(-2)}:${`0${etaDate.getSeconds()}`.slice(-2)}+08:00`,
                remark: {
                  zh: `${platform_id}號月台`,
                  en: `Platform ${platform_id}`
                },
                co: 'lightRail'
              }
            }, [])
        ], [])
    ))
    .catch(e => {
      console.error(e);
      return [];
    })
  ),
  fetchStopEtas: ( stopId ) => []
}
