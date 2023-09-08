import { fetchEtaDb } from "../src"

test("fetch DB", () => {
  return fetchEtaDb().then(db => {
    expect(db).toEqual(expect.objectContaining({
      holidays: expect.anything(),
      routeList: expect.anything(),
      stopList: expect.anything(),
      stopMap: expect.anything(),
    }))
  })
});