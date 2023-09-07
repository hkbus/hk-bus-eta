import { MenuItem, TextField } from "@mui/material";
import { useContext, useMemo } from "react";
import AppContext from "../AppContext";

const StopPicker = () => {
  const { routeId, stopSeq, language, setStopSeq, db } = useContext(AppContext);

  const stops = useMemo(() => {
    if (db === null) return [];
    const { routeList } = db;
    if (routeId === "") return [];
    const route = routeList[routeId];
    return route.stops[route.co[0]];
  }, [routeId, db]);

  if (db === null) return null;

  const { stopList } = db;

  return (
    <TextField
      select
      value={stopSeq ?? ""}
      onChange={({ target: { value } }) =>
        setStopSeq(value !== "" ? parseInt(value) : 0)
      }
      disabled={routeId === ""}
      sx={{ flex: 1 }}
      size="small"
      fullWidth
    >
      {stops.map((stop, idx) => (
        <MenuItem key={`${stop}-${idx}`} value={idx}>
          #{idx + 1}&emsp;{stopList[stop].name[language]}
        </MenuItem>
      ))}
    </TextField>
  );
};

export default StopPicker;
