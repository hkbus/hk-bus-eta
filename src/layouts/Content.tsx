import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Link,
  SxProps,
  Theme,
  Typography,
} from "@mui/material";
import { useContext } from "react";
import AppContext from "../AppContext";
import { JsonView, darkStyles } from "react-json-view-lite";
import "react-json-view-lite/dist/index.css";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import RoutePicker from "../components/RoutePicker";
import StopPicker from "../components/StopPicker";
import LanguagePicker from "../components/LanguagePicker";

const Content = () => {
  const {
    db,
    md5,
    data,
    routeId,
    stopSeq,
    language,
    fetchEtaDb,
    fetchEtaDbMd5,
    fetchEtas,
  } = useContext(AppContext);

  const alwaysExpanded = true;

  return (
    <Box sx={rootSx}>
      <Accordion expanded={alwaysExpanded}>
        <AccordionSummary sx={accordionSummarySx}>
          <Typography variant="h6">fetchEtaDb</Typography>
          <Typography variant="body1">
            <i>
              fetch ETA database for routes and stop data of KMB, CTB, MTR, and
              Minibus
            </i>
          </Typography>
        </AccordionSummary>
        <AccordionDetails sx={detailSx}>
          <Box sx={{ flex: 1 }}>
            <SyntaxHighlighter
              language="tsx"
              lineProps={{
                style: { wordBreak: "break-all", whiteSpace: "pre-wrap" },
              }}
              wrapLines={true}
            >
              {fetchEtaDbCode}
            </SyntaxHighlighter>
            <Button
              variant="contained"
              sx={{ textTransform: "none" }}
              onClick={fetchEtaDb}
            >
              Run
            </Button>
          </Box>
          <Box sx={{ flex: 1, my: 1 }}>
            <JsonView
              // @ts-expect-error casting issue
              data={db ?? null}
              shouldInitiallyExpand={(lv) => lv < 1}
              style={{
                ...darkStyles,
                container: `${darkStyles.container} json-container`,
              }}
            />
          </Box>
        </AccordionDetails>
      </Accordion>
      <Accordion expanded={alwaysExpanded}>
        <AccordionSummary sx={accordionSummarySx}>
          <Typography variant="h6">fetchEtas</Typography>
          <Typography variant="body1">
            <i>
              fetch ETAs from{" "}
              <Link href="https://data.gov.hk/" target="_blank">
                data.gov.hk
              </Link>
            </i>
          </Typography>
        </AccordionSummary>
        <AccordionDetails sx={detailSx}>
          <Box
            sx={{ flex: 1, display: "flex", flexDirection: "column", gap: 1 }}
          >
            {db === null && (
              <Typography variant="body1">
                Need to call <i>fetchEtaDb</i> first
              </Typography>
            )}
            {db !== null && (
              <>
                <RoutePicker />
                <StopPicker />
                <LanguagePicker />
                <SyntaxHighlighter
                  language="tsx"
                  lineProps={{
                    style: { wordBreak: "break-all", whiteSpace: "pre-wrap" },
                  }}
                  wrapLines={true}
                >
                  {getFetchEtasCode(routeId, stopSeq, language)}
                </SyntaxHighlighter>
                <Box>
                  <Button
                    variant="contained"
                    sx={{ textTransform: "none" }}
                    onClick={() => fetchEtas(routeId, stopSeq, language)}
                  >
                    Run
                  </Button>
                </Box>
              </>
            )}
          </Box>
          <Box sx={{ flex: 1, my: 1 }}>
            {db !== null && (
              <JsonView
                // @ts-ignore
                data={data || null}
                style={{
                  ...darkStyles,
                  container: `${darkStyles.container} json-container`,
                }}
              />
            )}
          </Box>
        </AccordionDetails>
      </Accordion>
      <Accordion>
        <AccordionSummary sx={accordionSummarySx}>
          <Typography variant="h6">fetchEtaDbMd5</Typography>
          <Typography variant="body1">
            <i>md5 string for BusObj verififcation</i>
          </Typography>
        </AccordionSummary>
        <AccordionDetails sx={detailSx}>
          <Box sx={{ flex: 1 }}>
            <SyntaxHighlighter
              language="tsx"
              lineProps={{
                style: { wordBreak: "break-all", whiteSpace: "pre-wrap" },
              }}
              wrapLines={true}
            >
              {fetchEtaDbMd5Code}
            </SyntaxHighlighter>
            <Button
              variant="contained"
              sx={{ textTransform: "none" }}
              onClick={fetchEtaDbMd5}
            >
              Run
            </Button>
          </Box>
          <Box sx={{ flex: 1, my: 1 }}>
            <JsonView
              // @ts-ignore
              data={md5 || null}
              shouldInitiallyExpand={(lv) => lv < 1}
              style={{
                ...darkStyles,
                container: `${darkStyles.container} json-container`,
              }}
            />
          </Box>
        </AccordionDetails>
      </Accordion>
    </Box>
  );
};

export default Content;

const rootSx: SxProps<Theme> = {
  display: "flex",
  flexDirection: "column",
  width: "100%",
  flex: 1,
  overflow: "scroll",
};

const detailSx: SxProps<Theme> = {
  display: "flex",
  justifyContent: "space-between",
  gap: 2,
  alignItems: "flex-start",
};

const fetchEtaDbCode = `import { fetchEtaDb } from "hk-bus-eta";
import type { EtaDb } from "hk-bus-eta";

fetchEtaDb().then((db: EtaDb) => {
  console.log(db)
})`;

const fetchEtaDbMd5Code = `import { fetchEtaDbMd5 } from "hk-bus-eta";

fetchEtaDbMd5().then((md5: string) => {
  console.log(md5)
})`;

const getFetchEtasCode = (routeId: string, seq: number, language: string) =>
  `import { fetchEtas } from "hk-bus-eta";
import type { Eta } from "hk-bus-eta";

// etaDb is the EtaDb object fetched by fetchEtaDb

fetchEtas({
  ...busDb.routeList["${routeId}"],
  stopList: busDb.stopList,
  seq: ${seq},
  language: "${language}",
  holidays: busDb.holidays,
  serviceDayMap: busDb.serviceDayMap,
}).then(etas => {
  console.log(etas)
})
`;

const accordionSummarySx: SxProps<Theme> = {
  "& .MuiAccordionSummary-content": {
    alignItems: "baseline",
    gap: 2,
    borderBottom: "#eee 1px solid",
  },
};
