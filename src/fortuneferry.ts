import type { Eta, RouteListEntry, StopList } from "./type";
import { isSafari } from "./utils";

interface fetchEtasProps {
  route: string;
  stops: {
    fortuneferry: string[];
  }
  seq: number;
  stopList: StopList;
}

const getCode = (zhName: string) => {
  if ( zhName.includes("中環") ) {
    return "CL"
  } else if ( zhName.includes("紅磡") ) {
    return "HH"
  } else if ( zhName.includes("北角") ) {
    return "NP"
  } else if ( zhName.includes("觀塘") ) {
    return "KT"
  } else if ( zhName.includes("啟德") ) {
    return "KT"
  } else if ( zhName.includes("屯門") ) {
    return "TM"
  } else if ( zhName.includes("東涌") ) {
    return "TC"
  } else if ( zhName.includes("沙螺灣") ) {
    return "SLW"
  } else if ( zhName.includes("大澳") ) {
    return "TO"
  }
  return "CL";
}

export default function fetchEtas({
  route, stops: { fortuneferry: stops }, seq, stopList
}: fetchEtasProps): Promise<Eta[]> {
  if ( stops.length === seq - 1 ) return Promise.resolve([]);
  const u = getCode(stopList[stops[seq]].name.zh)
  const v = getCode(stopList[stops[seq+1]].name.zh)

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
          let guess = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}T${depart_time}:00+08:00}`
          if ( (new Date(guess)) < date ) {
            date.setDate(date.getDate() + 1)
            guess = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}T${depart_time}:00+08:00}`
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
}