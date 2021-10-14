module.exports = {
  co: 'lrtfeeder',
  fetchEtas: ({stopId, route, language}) => (
    fetch(`https://rt.data.gov.hk/v1/transport/mtr/bus/getSchedule`, {
      method: "POST",
      cache: "reload",
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
        const etaDate = new Date(Date.now() + parseInt(bus.arrivalTimeInSecond, 10) * 1000)
        if ( bus.arrivalTimeInSecond === "108000" ) return [...etas];
        return [
          ...etas,
          {
            eta: etaDate.toISOString(),
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
