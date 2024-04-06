import type { Eta } from "./type";
import { isSafari } from "./utils";

interface fetchEtasProps {
  route: string;
  seq: number;
}

export default function fetchEtas({
  route, seq
}: fetchEtasProps): Promise<Eta[]> {
  if ( seq === 1 ) return Promise.resolve([])
  return fetch(
    `https://www.sunferry.com.hk/eta/?route=${route}`,
    {
      cache: isSafari ? "default" : "no-store",
    },
  )
    .then((response) => response.json())
    .then(({ data }) => {
      if (!data) return [];
      
      return data
        .map(({depart_time, rmk_en, rmk_tc, route_tc, route_en}: any) => {
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
              zh: route_tc.split(" - ")[1],
              en: route_en.split(" - ")[1],
            },
            co: "sunferry",
          }
        });
    });
}
