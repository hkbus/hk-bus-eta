import { fetchEstJourneyTime } from "../src/journeyTime";
import { RouteListEntry, StopList } from "../src/type";

const HOURLY = "/times_hourly/";
const AVG = "/times/";

const makeRoute = (stops: string[]) =>
  ({ stops: { kmb: stops } }) as unknown as RouteListEntry;

const makeStopList = (stops: string[]) =>
  Object.fromEntries(
    stops.map((s) => [s, { location: { lat: 22.3, lng: 114.1 } }]),
  ) as unknown as StopList;

const mockFiles = (files: Record<string, unknown>) => {
  const fetchMock = jest.fn((url: string) => {
    const path = Object.keys(files).find((k) => url.endsWith(k));
    if (path === undefined) {
      return Promise.resolve({ json: () => Promise.reject(new Error("404")) });
    }
    return Promise.resolve({ json: () => Promise.resolve(files[path]) });
  });
  global.fetch = fetchMock as unknown as typeof fetch;
  return fetchMock;
};

const hourlyUrls = (fetchMock: jest.Mock) =>
  fetchMock.mock.calls
    .map(([url]) => url as string)
    .filter((url) => url.includes(HOURLY));

afterEach(() => {
  jest.useRealTimers();
});

describe("fetchEstJourneyTime", () => {
  it("sums seconds across segments before converting to minutes", async () => {
    const stops = ["AA01", "AA02", "AA03", "AA04"];
    mockFiles({
      [`${AVG}AA.json`]: {
        AA01: { AA02: 20 },
        AA02: { AA03: 42 },
        AA03: { AA04: 474 },
      },
    });

    const jt = await fetchEstJourneyTime({
      route: makeRoute(stops),
      stopList: makeStopList(stops),
      startSeq: 0,
      endSeq: 3,
    });

    // per-segment ceil would give 1 + 1 + 8 = 10
    expect(jt).toBeCloseTo((20 + 42 + 474) / 60);
  });

  it("prefers hourly data and falls back to the average per segment", async () => {
    jest.useFakeTimers({ doNotFake: ["nextTick", "setImmediate"] });
    // Friday 12:30 HKT
    jest.setSystemTime(new Date("2026-09-11T04:30:00Z"));
    const stops = ["BB01", "BB02", "BB03"];
    mockFiles({
      [`/times_hourly/5/12/BB.json`]: { BB01: { BB02: 60 } },
      [`${AVG}BB.json`]: { BB01: { BB02: 999 }, BB02: { BB03: 120 } },
    });

    const jt = await fetchEstJourneyTime({
      route: makeRoute(stops),
      stopList: makeStopList(stops),
      startSeq: 0,
      endSeq: 2,
    });

    expect(jt).toBeCloseTo(3);
  });

  it.each([
    ["on a Friday", "2026-09-11T04:30:00Z", [], "/times_hourly/5/12/"],
    ["on a Sunday", "2026-09-13T04:30:00Z", [], "/times_hourly/0/12/"],
    ["on a Monday", "2026-09-14T04:30:00Z", [], "/times_hourly/1/12/"],
    ["on a Saturday", "2026-09-12T04:30:00Z", [], "/times_hourly/6/12/"],
    // 2026-10-01 is a Thursday
    [
      "on a public holiday",
      "2026-10-01T04:30:00Z",
      ["20261001"],
      "/times_hourly/0/12/",
    ],
    // 23:30 UTC on Thursday is already Friday 07:30 in Hong Kong
    [
      "by Hong Kong's date, not UTC's",
      "2026-09-10T23:30:00Z",
      [],
      "/times_hourly/5/07/",
    ],
  ])("picks the hourly folder %s", async (_, now, holidays, expectedPath) => {
    jest.useFakeTimers({ doNotFake: ["nextTick", "setImmediate"] });
    jest.setSystemTime(new Date(now));
    const stops = ["CC01", "CC02"];
    const fetchMock = mockFiles({
      [`${AVG}CC.json`]: { CC01: { CC02: 60 } },
    });

    await fetchEstJourneyTime({
      route: makeRoute(stops),
      stopList: makeStopList(stops),
      startSeq: 0,
      endSeq: 1,
      holidays,
    });

    expect(hourlyUrls(fetchMock)).toEqual([
      expect.stringContaining(`${expectedPath}CC.json`),
    ]);
  });

  it("rejects when aborted instead of caching a blind 4-minute guess", async () => {
    const stops = ["EE01", "EE02"];
    const controller = new AbortController();
    controller.abort();
    global.fetch = jest.fn((_url: string, init?: RequestInit) =>
      init?.signal?.aborted
        ? Promise.reject(new Error("aborted"))
        : Promise.resolve({
            json: () => Promise.resolve({ distM: 1000, jSpeed: "60公里/小時" }),
          }),
    ) as unknown as typeof fetch;

    await expect(
      fetchEstJourneyTime({
        route: makeRoute(stops),
        stopList: makeStopList(stops),
        startSeq: 0,
        endSeq: 1,
        signal: controller.signal,
      }),
    ).rejects.toThrow("aborted");

    const jt = await fetchEstJourneyTime({
      route: makeRoute(stops),
      stopList: makeStopList(stops),
      startSeq: 0,
      endSeq: 1,
    });
    // 1 km at 60 km/h, plus the 10% margin, not 4 * 1.1
    expect(jt).toBeCloseTo(1.1);
  });
});
