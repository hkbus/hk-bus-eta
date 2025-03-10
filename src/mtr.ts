import type { Eta, RouteListEntry, StopList } from "./type";
import { isSafari } from "./utils";

interface fetchEtasProps {
  route: RouteListEntry["route"];
  bound: RouteListEntry["bound"]["mtr"];
  stopId: string;
  stopList: StopList;
}

export default function fetchEtas({
  stopId,
  route,
  bound,
  stopList,
}: fetchEtasProps): Promise<Eta[]> {
  return fetch(
    `https://rt.data.gov.hk/v1/transport/mtr/getSchedule.php?line=${route}&sta=${stopId}`,
    {
      cache: isSafari ? "default" : "no-store",
    },
  )
    .catch(() => (
      fetch(
        `https://mtr.hkbus.app/?line=${route}&sta=${stopId}`,
        {
          cache: isSafari ? "default" : "no-store",
        },  
      )
    ))
    .then((response) => response.json())
    .then(({ data, status, isdelay }) => {
      if (status === 0) return [];
      const etas = data[`${route}-${stopId}`][
        bound.endsWith("UT") ? "UP" : "DOWN"
      ].reduce(
        (acc: Eta[], { time, plat, dest }: any) => [
          ...acc,
          {
            eta: time.replace(" ", "T") + "+08:00",
            remark: {
              zh: [
                `${plat}號月台`,
                ...(isdelay === "Y" ? ["延誤／事故／特別服務"] : []),
              ].join(" - "),
              en: [
                `Platform ${plat}`,
                ...(isdelay === "Y"
                  ? ["Delay/ Incident/ Special Service"]
                  : []),
              ].join(" - "),
            },
            dest: {
              zh: stopList[dest].name.zh,
              en: stopList[dest].name.en,
            },
            co: "mtr",
          },
        ],
        [],
      );
      if (isdelay === "Y" && etas.length === 0) {
        return [
          {
            eta: null,
            remark: {
              zh: "延誤／事故／特別服務",
              en: "Delay/ Incident/ Special Service",
            },
            dest: {
              zh: "",
              en: "",
            },
            co: "mtr",
          },
        ];
      }
      return etas;
    });
}
