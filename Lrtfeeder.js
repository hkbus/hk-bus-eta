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
        const etaDate = new Date(Date.now() + parseInt(bus.arrivalTimeInSecond === "108000" ? bus.departureTimeInSecond : bus.arrivalTimeInSecond, 10) * 1000);
        return [
          ...etas,
          {
            eta: `${etaDate.getFullYear()}-${`0${etaDate.getMonth() + 1}`.slice(-2)}-${`0${etaDate.getDate()}`.slice(-2)}`
                +`T${`0${etaDate.getHours()}`.slice(-2)}:${`0${etaDate.getMinutes()}`.slice(-2)}:${`0${etaDate.getSeconds()}`.slice(-2)}+08:00`,
            remark: {
              [language]: bus.busRemark
            },
            co: 'lrtfeeder'
          }
        ]
      }, [])]), [])
    )
  ),
  fetchStopEtas: ( stopId ) => []
}
