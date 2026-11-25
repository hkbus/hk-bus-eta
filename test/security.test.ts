import kmb from "../src/kmb";
import { fetchEtaDb } from "../src";

const json = (body: unknown, ok = true) =>
  Promise.resolve({ ok, json: () => Promise.resolve(body) });

describe("untrusted input hardening", () => {
  it("encodes DB-sourced values in request URLs", async () => {
    const fetchMock = jest.fn(() => json({ data: [] }));
    global.fetch = fetchMock as unknown as typeof fetch;
    await kmb({
      route: "1&x=../",
      stopId: "A/B?c",
      serviceType: "1",
      seq: 0,
      co: ["kmb"],
      bound: "O",
      stops: [],
    } as any);
    const url = (fetchMock.mock.calls[0] as unknown as [string])[0];
    expect(url).toBe(
      "https://data.etabus.gov.hk/v1/transport/kmb/eta/A%2FB%3Fc/1%26x%3D..%2F/1",
    );
  });

  it("falls back to the mirror when the primary DB payload is malformed", async () => {
    const good = { routeList: {}, stopList: {} };
    global.fetch = jest
      .fn()
      .mockReturnValueOnce(json({ unexpected: true }))
      .mockReturnValueOnce(json(good)) as unknown as typeof fetch;
    await expect(fetchEtaDb()).resolves.toEqual(good);
  });
});
