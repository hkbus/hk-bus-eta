# HK Bus ETA

Bus ETAs in Hong Kong is now available as open data in Hong Kong, while there is no format normalization across different transport provider.  This package is a js package (typescript supported) for querying normalized public traffic ETA (Estimated Time of Arrival) in Hong Kong. The ETA data structure is based on [hkbus/hk-bus-crawling](https://github.com/hkbus/hk-bus-crawling) and a well-established open-source project is known as [hkbus.app](https://hkbus.app/).

A Python version package is available [here](https://pypi.org/project/hk-bus-eta/) and the source code is available [here](https://github.com/hkbus/hk-bus-crawling).

## Demo

Live demo is available [here](https://hk-bus-eta.chunlaw.io/).

## Install

`npm install hk-bus-eta`
or 
`yarn add hk-bus-eta`


## Usage

__Crawling traffic database:__
```ts
import { fetchEtaDb } from "hk-bus-eta";
import type { EtaDb } from "hk-bus-eta";

(async function () {
  const etaDb: EtaDb = await fetchEtaDb();
  console.log(db)
})();
```

__Crawling ETA__
```ts
import { fetchEtas } from "hk-bus-eta";
import type { Eta } from "hk-bus-eta";

(async function () {
  // etaDb is the EtaDb object fetched by fetchEtaObj
  const etas: Eta[] = await fetchEtas({
    ...etaDb.routeList["1+1+CHUK YUEN ESTATE+STAR FERRY"],
    seq: 0,
    language: "en",
  });
  console.log(etas);
})();
```

## Data Structure
The data structure of _EtaDb_ is as follows:
```ts
{
    holidays: string[];
    routeList: {
        [routeId: string]: {
            route: string,
            co: Company[],
            orig: {
                en: string,
                zh: string
            },
            dest: {
                en: string,
                zh: string
            },
            fares: string[] | null,
            faresHoliday: string[] | null,
            freq: {
                [type: string]: {
                    [startTime: string]: [string, string] | null
                }
            } | null,
            jt: string | null,
            seq: number,
            serviceType: string,
            stops: {
                [company: string]: string[]
            },
            bound: {
                [company: string]: "O" | "I" | "OI" | "IO"
            },
            gtfsId: string,
            nlbId: string
        }
    }
    stopList: {
        [stopId: string]: {
            location: {
                lat: number,
                lng: number,
            },
            name: {
                en: string,
                zh: string
            }
        }
    }
    stopMap: {
        [stopId: string]: Array<{
          [company: string]: string  
        }>
    }
}
```

The data structure of _Eta_ is as follows:
```ts
{
  eta: string,
  remark: {
    zh: string,
    en: string
  },
  co: string
}
```

## Contribute
Project owner [chunlaw](https://github.com/chunlaw) is the initiator of the whole project. Everyone is welcome to contribute. 

## License

GPL-3.0 license
