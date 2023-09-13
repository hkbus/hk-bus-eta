import {
  Box,
  IconButton,
  SxProps,
  Theme,
  Typography,
} from "@mui/material";
import { GitHub as GitHubIcon } from "@mui/icons-material";
import pypiLogo from "../assets/pypi.svg";
import npmLogo from "../assets/npm.svg";

const Header = () => {

  return (
    <Box sx={rootSx}>
      <Typography variant="h6">
        HK-BUS-ETA Demo
      </Typography>
      <Box>
        <IconButton
          onClick={() => {
            window.open(
              "https://github.com/hkbus/hk-bus-eta",
              "_blank",
            );
          }}
          size="small"
        >
          <GitHubIcon />
        </IconButton>
        <IconButton
          onClick={() => {
            window.open(
              "https://www.npmjs.com/package/hk-bus-eta",
              "_blank",
            );
          }}
          size="small"
        >
          <img src={npmLogo} width={24} height={24} alt="NPM logo" />
        </IconButton>
        <IconButton
          onClick={() => {
            window.open(
              "https://pypi.org/project/hk-bus-eta/",
              "_blank",
            );
          }}
          size="small"
        >
          <img src={pypiLogo} width={24} height={24} alt="Pypi logo" />
        </IconButton>
      </Box>
    </Box>
  );
};

export default Header;

const rootSx: SxProps<Theme> = {
  display: "flex",
  justifyContent: "space-between",
  gap: 1,
  width: "100%",
};
