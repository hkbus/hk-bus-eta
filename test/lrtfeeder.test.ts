import fetchEtas from "../src/lrtfeeder";
import k18Fixture from "./K18_en.fixture.json";

describe("lrtfeeder busStopRemark", () => {
  const mockFetch = (payload: unknown) => {
    global.fetch = jest.fn().mockResolvedValue({
      json: () => Promise.resolve(payload),
    }) as unknown as typeof fetch;
  };

  it("surfaces busStopRemark (suspended/relocated stop) on every eta for that stop", async () => {
    // real payload captured from rt.data.gov.hk/v1/transport/mtr/bus/getSchedule
    // for K18, attached by 一個人 in the hkbus Telegram group 2026-07-15
    mockFetch(k18Fixture);

    const etas = await fetchEtas({
      stopId: "K18-U020",
      route: "K18",
      language: "en",
    });

    expect(etas.length).toBeGreaterThan(0);
    etas.forEach((eta) => {
      expect(eta.remark.en).toContain("temporarily suspended or bus stop relocated");
      expect(eta.remark.zh).toContain("temporarily suspended or bus stop relocated");
      // the stop is still returning scheduled arrival times, which is exactly
      // the harm: a rider would see a plain ETA and go wait at a dead stop
      expect(eta.eta).not.toBe("");
    });
  });

  it("does not attach a remark to an unaffected stop on the same route", async () => {
    mockFetch(k18Fixture);

    const etas = await fetchEtas({
      stopId: "K18-D010",
      route: "K18",
      language: "en",
    });

    expect(etas.length).toBeGreaterThan(0);
    etas.forEach((eta) => {
      expect(eta.remark.en).not.toContain("suspended");
    });
  });
});
