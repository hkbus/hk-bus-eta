export type Company =
  | "kmb"
  | "nlb"
  | "ctb"
  | "lrtfeeder"
  | "gmb"
  | "lightRail"
  | "mtr"
  | "sunferry"
  | "hkkf"
  | "fortuneferry";

export type Terminal = {
  en: string;
  zh: string;
};

export type Freq = {
  [key in string]: {
    [startTime: string]: [string, string] | null;
  };
};

export type RouteListEntry = {
  readonly route: string;
  readonly co: Company[];
  readonly orig: Terminal;
  readonly dest: Terminal;
  readonly fares: string[] | null;
  readonly faresHoliday: string[] | null;
  readonly freq: Freq | null;
  readonly jt: string | null;
  readonly seq: number;
  readonly serviceType: string;
  readonly stops: {
    [co in Company]: string[];
  };
  readonly bound: {
    [co in Company]: "O" | "I" | "OI" | "IO";
  };
  readonly gtfsId: string;
  readonly nlbId: string;
};

export type Location = {
  lat: number;
  lng: number;
};

export type StopListEntry = {
  readonly location: Location;
  readonly name: {
    en: string;
    zh: string;
  };
};

export type StopTuple = [Company, string];

export type RouteList = Record<string, RouteListEntry>;

export type StopList = Record<string, StopListEntry>;

export type StopMap = Record<string, StopTuple[]>;

export type EtaDb = {
  holidays: string[];
  routeList: RouteList;
  stopList: StopList;
  stopMap: StopMap;
  serviceDayMap: Record<
    string,
    [
      "0" | "1",
      "0" | "1",
      "0" | "1",
      "0" | "1",
      "0" | "1",
      "0" | "1",
      "0" | "1",
    ]
  >;
};

export type Eta = {
  eta: string;
  remark: {
    zh: string;
    en: string;
  };
  dest: {
    zh: string;
    en: string;
  };
  co: Company;
  lat?: number;
  lng?: number;
};
