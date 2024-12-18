import type { Eta, EtaDb, RouteListEntry, StopList } from "./type";
import { getUpcomingFerry, isSafari } from "./utils";

interface fetchEtasProps {
  stops: {
    fortuneferry: string[];
  };
  seq: number;
  stopList: StopList;
  freq: RouteListEntry["freq"];
  holidays: EtaDb["holidays"];
  serviceDayMap: EtaDb["serviceDayMap"];
}

const getCode = (zhName: string) => {
  if (zhName.includes("中環")) {
    return "CL";
  } else if (zhName.includes("紅磡")) {
    return "HH";
  } else if (zhName.includes("北角")) {
    return "NP";
  } else if (zhName.includes("觀塘")) {
    return "KT";
  } else if (zhName.includes("啟德")) {
    return "KTK";
  } else if (zhName.includes("屯門")) {
    return "TM";
  } else if (zhName.includes("東涌")) {
    return "TC";
  } else if (zhName.includes("沙螺灣")) {
    return "SLW";
  } else if (zhName.includes("大澳")) {
    return "TO";
  }
  return "CL";
};

export default function fetchEtas({
  stops: { fortuneferry: stops },
  seq,
  holidays,
  freq,
  serviceDayMap,
}: fetchEtasProps): Promise<Eta[]> {
  if (seq >= 1) return Promise.resolve([]);
  const now = new Date();
  return Promise.resolve(
    getUpcomingFerry({ holidays, serviceDayMap, freq, date: new Date() })
      .filter((v) => new Date(v).getTime() - now.getTime() < 180 * 60 * 1000)
      .map((eta) => ({
        eta: eta,
        remark: {
          zh: "預定班次",
          en: "Scheduled",
        },
        dest: {
          zh: "",
          en: "",
        },
        co: "fortuneferry",
      })),
  );

  /*
   * the official API is broken most of the time, keep it for reference

  const v = getCode(stopList[stops[seq+1]].name.zh)
  const u = getCode(stopList[stops[seq]].name.zh)
  return fetch(
    `https://www.hongkongwatertaxi.com.hk/eta/?route=${u}${v}`,
    {
      cache: isSafari ? "default" : "no-store",
    },
  )
    .then((response) => response.json())
    .then(({ data }) => {
      if (!data) return [];
      
      return data
        .map(({ depart_time, rmk_tc, rmk_en }: any) => {
          const date = new Date();
          let guess = `${date.getFullYear()}-${('0'+(date.getMonth()+1)).slice(-2)}-${('0'+date.getDate()).slice(-2)}T${depart_time}:00+08:00`
          if ( (new Date(guess)) < date ) {
            date.setDate(date.getDate() + 1)
            guess = `${date.getFullYear()}-${('0'+(date.getMonth()+1)).slice(-2)}-${('0'+date.getDate()).slice(-2)}T${depart_time}:00+08:00`
          }
          return {
            eta: guess,
            remark: {
              zh: rmk_tc,
              en: rmk_en,
            },
            dest: {
              zh: "",
              en: "",
            },
            co: "fortuneferry",
          }
        });
    });
  */
}
