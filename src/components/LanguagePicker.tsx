import { MenuItem, TextField } from "@mui/material";
import { useContext } from "react";
import AppContext from "../AppContext";

const LanguagePicker = () => {
  const { language, setLanguage } = useContext(AppContext);

  return (
    <TextField
      select
      value={language}
      onChange={({ target: { value } }) => setLanguage(value as "zh" | "en")}
      sx={{ flex: 1 }}
      size="small"
      fullWidth
    >
      <MenuItem value="en">English</MenuItem>
      <MenuItem value="zh">中文</MenuItem>
    </TextField>
  );
};

export default LanguagePicker;
