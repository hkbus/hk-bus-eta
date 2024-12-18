import kmb from "./kmb";
import ctb from "./ctb";
import nlb from "./nlb";
import lrtfeeder from "./lrtfeeder";
import gmb from "./gmb";
import lightrail from "./lightRail";
import mtr from "./mtr";
import sunferry from "./sunferry";
import fortuneferry from "./fortuneferry";
import hkkf from "./hkkf";
import { RouteListEntry, EtaDb, Eta, StopList } from "./type";

interface fetchEtasProps extends RouteListEntry {
  stopList: StopList;
  holidays: EtaDb["holidays"];
  serviceDayMap: EtaDb["serviceDayMap"];
  language: "zh" | "en";
  seq: number;
}

export async function fetchEtas({
  route,
  stops,
  bound,
  dest,
  freq,
  seq,
  serviceType,
  co,
  nlbId,
  gtfsId,
  stopList,
  language,
  holidays,
  serviceDayMap,
}: fetchEtasProps): Promise<Eta[]> {
  try {
    let _etas: Eta[] = [];
    for (const company_id of co) {
      if (company_id === "kmb" && stops.kmb) {
        _etas = _etas.concat(
          await kmb({
            route,
            stops: stops.kmb,
            stopId: stops.kmb[seq],
            seq,
            co,
            serviceType,
            bound: bound.kmb,
          }),
        );
      } else if (company_id === "ctb" && stops.ctb) {
        _etas = _etas.concat(
          await ctb({ stopId: stops.ctb[seq], route, bound: bound.ctb, seq }),
        );
      } else if (company_id === "nlb" && stops.nlb) {
        _etas = _etas.concat(await nlb({ stopId: stops.nlb[seq], nlbId }));
      } else if (company_id === "lrtfeeder" && stops.lrtfeeder) {
        _etas = _etas.concat(
          await lrtfeeder({ stopId: stops.lrtfeeder[seq], route, language }),
        );
      } else if (company_id === "gmb" && stops.gmb) {
        _etas = _etas.concat(
          await gmb({ stopId: stops.gmb[seq], gtfsId, seq, bound: bound.gmb }),
        );
      } else if (company_id === "lightRail" && stops.lightRail) {
        _etas = _etas.concat(
          await lightrail({ stopId: stops.lightRail[seq], route, dest }),
        );
      } else if (company_id === "mtr" && stops.mtr) {
        _etas = _etas.concat(
          await mtr({
            stopId: stops.mtr[seq],
            route,
            stopList,
            bound: bound.mtr,
          }),
        );
      } else if (company_id === "fortuneferry" && stops.fortuneferry) {
        _etas = _etas.concat(
          await fortuneferry({
            stops,
            seq,
            stopList,
            freq,
            serviceDayMap,
            holidays,
          }),
        );
      } else if (company_id === "sunferry" && stops.sunferry) {
        _etas = _etas.concat(
          await sunferry({ route, seq, holidays, serviceDayMap, freq }),
        );
      } else if (company_id === "hkkf" && stops.hkkf) {
        _etas = _etas.concat(
          await hkkf({ freq, seq, holidays, serviceDayMap }),
        );
      }
    }

    if (_etas.some((e) => e.eta)) {
      _etas = _etas.filter((e) => e.eta);
    }
    return _etas.sort((a, b) => {
      if (!a.eta || a.eta === "") return 1;
      else if (!b.eta || b.eta === "") return -1;
      return a.eta < b.eta ? -1 : 1;
    });
  } catch (err) {
    console.error(err);
    return [];
  }
}

export async function fetchEtaDb(): Promise<EtaDb> {
  return fetch("https://data.hkbus.app/routeFareList.min.json", {
    cache: "no-store",
  })
    .then((r) => r.json())
    .catch(() =>
      fetch("https://hkbus.github.io/hk-bus-crawling/routeFareList.min.json", {
        cache: "no-store",
      }).then((r) => r.json()),
    );
}

export async function fetchEtaDbMd5(): Promise<string> {
  return fetch("https://data.hkbus.app/routeFareList.md5", {
    cache: "no-store",
  })
    .then((r) => r.text())
    .catch(() =>
      fetch("https://hkbus.github.io/hk-bus-crawling/routeFareList.md5", {
        cache: "no-store",
      }).then((r) => r.text()),
    );
}

export async function fetchRouteUpdatedAt(
  route: RouteListEntry,
): Promise<number> {
  const filename =
    `${route.route}+${route.serviceType}+${route.orig.en}+${route.dest.en}`.toUpperCase();
  return fetch(
    `https://data.hkbus.app/route-ts/${filename.replace(/[\\\/\:\*\?\"\<\>\|\]\']/g, "")}`,
  )
    .then((r) => {
      if (r.ok) {
        return r.text();
      }
      throw Error("no update");
    })
    .then((r) => parseInt(r, 10) * 1000)
    .catch((e) => {
      return 0;
    });
}

export * from "./journeyTime";

export type * from "./type";
