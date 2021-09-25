export type Company = "kmb" | "nlb" | "ctb" |  "nwfb"

export type Terminal = {
  en: string,
  zh: string
}

export type FreqId = "31" | "287" | "415" | "63" | "319" | "447" | "416" | "480" | "266" | "271" | "272" | "288" | "320" | "448" | "511"

export type RouteListEntry = {
  readonly route: string,
  readonly co: Company[],
  readonly orig: Terminal,
  readonly dest: Terminal,
  readonly fares: string[] | null,
  readonly faresHoliday: string[] | null,
  readonly freq: {
    [key in FreqId]: {
      [startTime: string]: string[]
    }
  },
  readonly seq: number,
  readonly serviceType: string,
  readonly stops: {
    [co in Company]: string[]
  },
  readonly bound: {
    [co in Company]: "O" | "I"
  },
  readonly nlbId: string
}

export type Location = {
  lat: number,
  lng: number
}

export type StopListEntry = {
  readonly location: Location,
  readonly name: {
    en: string,
    zh: string
  }
}

export type StopTuple = [Company, string]

export type RouteList = Record<string, RouteListEntry>

export type StopList = Record<string, StopListEntry>

export type StopMap = Record<string, StopTuple[]>

export type BusDb = {
  routeList: RouteList,
  stopList: StopList,
  stopMap: StopMap
}

export type Eta = {
  eta: string,
  remark: {
    zh: string,
    en: string
  },
  co: Company
}

export declare function fetchEtas(route: Route): Promise<Eta[]>

export declare function fetchEtaObj(): Promise<BusDb>

export declare function fetchEtaObjMd5(): Promise<string>
