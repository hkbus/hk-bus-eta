import type { Eta, RouteListEntry } from "./type";
import { isSafari } from "./utils";

interface fetchEtasProps {
  gtfsId: RouteListEntry["gtfsId"];
  bound: RouteListEntry["bound"]["gmb"];
  stopId: string;
  seq: number;
}

export default function fetchEtas({
  gtfsId,
  stopId,
  bound,
  seq,
}: fetchEtasProps): Promise<Eta[]> {
  return fetch(
    `https://data.etagmb.gov.hk/eta/route-stop/${gtfsId}/${stopId}`,
    {
      cache: isSafari ? "default" : "no-store",
    },
  )
    .then((response) => response.json())
    .then(({ data }) =>
      data
        .filter(
          ({ route_seq }: any) =>
            (bound === "O" && route_seq === 1) ||
            (bound === "I" && route_seq === 2),
        )
        .filter(({ stop_seq }: any) => stop_seq === seq + 1)
        .reduce(
          (
            acc: Eta[],
            { enabled, eta, description_tc, description_en }: any,
          ) => [
            ...acc,
            ...(enabled
              ? eta.map((data: any) => {
                  return {
                    eta: data.timestamp,
                    remark: {
                      zh: data.remarks_tc ?? "",
                      en: data.remarks_en ?? "",
                    },
                    dest: {
                      zh: "",
                      en: "",
                    },
                    co: "gmb",
                  };
                })
              : [
                  {
                    eta: null,
                    remark: {
                      zh: description_tc ?? "",
                      en: description_en ?? "",
                    },
                    dest: {
                      zh: "",
                      en: "",
                    },
                    co: "gmb",
                  },
                ]),
          ],
          [],
        ),
    );
}
