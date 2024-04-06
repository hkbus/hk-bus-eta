import type { Eta, RouteListEntry } from "./type";
import { isSafari } from "./utils";

interface fetchEtasProps {
  route: string;
  bound: RouteListEntry["bound"]["hkkf"];
  seq: number;
}

export default function fetchEtas({
  route, bound, seq
}: fetchEtasProps): Promise<Eta[]> {
  if ( seq === 0 ) return Promise.resolve([])
  return fetch(
    `https://www.hkkfeta.com/opendata/eta/${route.slice(2)}/${bound === "I" ? "inbound" : "outbound"}`,
    {
      cache: isSafari ? "default" : "no-store",
    },
  )
    .then((response) => response.json())
    .then(({ data }) => {
      if (!data) return [];
      
      return data
        .map(({ETA}: any) => {
          return {
            eta: ETA,
            remark: {
              zh: "",
              en: "",
            },
            dest: {
              zh: "",
              en: "",
            },
            co: "hkkf",
          }
        });
    });
}
