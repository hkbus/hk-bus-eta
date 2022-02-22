const utils = require('./utils');

module.exports = {
  co: 'lrtfeeder',
  fetchEtas: ({stopId, route, language}) => (
    fetch(`https://rt.data.gov.hk/v1/transport/mtr/bus/getSchedule`, {
      method: "POST",
      cache: utils.isSafari ? 'default' : 'no-store',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        'language': language,
        'routeName': route
      })
    }).then( response => response.json() )
    .then(({busStop}) => 
      busStop.filter(({busStopId}) => busStopId === stopId)
      .reduce((ret, {bus: buses}) => ([...ret, ...buses.reduce( (etas, bus) => {
        // hackily use +8 hours and use UTC hour to resolve timezone issue
        const etaDate = new Date(Date.now() + parseInt(bus.arrivalTimeInSecond === "108000" ? bus.departureTimeInSecond : bus.arrivalTimeInSecond, 10) * 1000 + 8 * 3600000);

        return [
          ...etas,
          {
            eta: `${etaDate.getUTCFullYear()}-${`0${etaDate.getUTCMonth() + 1}`.slice(-2)}-${`0${etaDate.getUTCDate()}`.slice(-2)}`
                +`T${`0${etaDate.getUTCHours()}`.slice(-2)}:${`0${etaDate.getMinutes()}`.slice(-2)}:${`0${etaDate.getSeconds()}`.slice(-2)}+08:00`,
            remark: {
              [language]: bus.busRemark || ( bus.isScheduled === "1" ? ( language === "en" ? "Scheduled" : "預定班次" ) : "" )
            },
            co: 'lrtfeeder'
          }
        ]
      }, [])]), [])
    )
  ),
  fetchStopEtas: ( stopId ) => []
}
