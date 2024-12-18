import { EtaDb, Freq, RouteListEntry } from "./type";

export const isSafari = (() => {
  try {
    return Boolean(
      navigator &&
        navigator.userAgent &&
        navigator.userAgent.includes("Safari/") &&
        !(
          navigator.userAgent.includes("Chrome/") ||
          navigator.userAgent.includes("Chromium/")
        ),
    );
  } catch {
    return false;
  }
})();

// fancy handling for timezone, not recommend to use it unless you know what's going on
// i.e, calling isHoliday(holidays, new Date()) is checking if it was being a holiday at the moment of 8 hours ago
const isHoliday = (holidays: string[], utcDate: Date): boolean => {
  if (utcDate.getDay() === 0) return true;
  return holidays.includes(
    String(utcDate.getUTCFullYear()) +
      String(utcDate.getUTCMonth() + 1).padStart(2, "0") +
      String(utcDate.getUTCDate()).padStart(2, "0"),
  );
};

export const getUpcomingFerry = ({
  holidays,
  serviceDayMap,
  date,
  freq,
}: {
  holidays: string[];
  serviceDayMap: EtaDb["serviceDayMap"];
  freq: RouteListEntry["freq"];
  date: Date;
}): string[] => {
  if (freq === null) {
    return [];
  }

  const getEta = (serviceFreq: Record<string, any>, date: Date): string[] =>
    Object.keys(serviceFreq)
      .sort((a, b) => (a < b ? -1 : 1))
      .reduce((acc, tp) => {
        const ferryTime = new Date(date.getTime());
        ferryTime.setUTCHours(parseInt(tp.slice(0, 2), 10));
        ferryTime.setUTCMinutes(parseInt(tp.slice(2), 10));
        if (ferryTime >= date) {
          acc.push(
            String(ferryTime.getUTCFullYear()) +
              "-" +
              String(ferryTime.getUTCMonth() + 1).padStart(2, "0") +
              "-" +
              String(ferryTime.getUTCDate()).padStart(2, "0") +
              "T" +
              String(ferryTime.getUTCHours()).padStart(2, "0") +
              ":" +
              String(ferryTime.getUTCMinutes()).padStart(2, "0") +
              ":00" +
              ".000+08:00",
          );
        }
        return acc;
      }, [] as string[]);

  // obtain all ETAs sampling for next 24 hours, fancy handling for timezone
  const ret = Array(24)
    .fill(0)
    .reduce((acc, _, idx) => {
      const refDate = new Date(date.getTime());
      refDate.setUTCHours(refDate.getUTCHours() + 8 + idx);
      for (let serviceKey in freq) {
        if (isHoliday(holidays, refDate)) {
          if (serviceDayMap[serviceKey][0] === "1") {
            return acc.concat(getEta(freq[serviceKey], refDate));
          }
        } else if (serviceDayMap[serviceKey][refDate.getDay()]) {
          return acc.concat(getEta(freq[serviceKey], refDate)).sort();
        }
      }
      return acc;
    }, [] as string[]);
  return ([...new Set(ret)] as string[]).sort((a, b) => (a < b ? -1 : 1));
};
