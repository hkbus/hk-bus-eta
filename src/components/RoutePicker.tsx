import React, { useContext, useMemo } from "react";
import AppContext from "../AppContext";
import TextField from "@mui/material/TextField";
import { Autocomplete } from "@mui/material";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useTheme } from "@mui/material/styles";
import { VariableSizeList, ListChildComponentProps } from "react-window";
import Typography from "@mui/material/Typography";

const RoutePicker = () => {
  const { routeId, setRouteId, db } = useContext(AppContext);
  const options = useMemo(
    () => (db === null ? [] : Object.keys(db.routeList)),
    [db],
  );

  const displayValue = useMemo(() => {
    if (db === null) return "";
    const { routeList } = db;
    if (routeId !== "") {
      const { route, orig, dest } = routeList[routeId];
      return `${route} ${orig.zh} --> ${dest.zh}`;
    }
    return "";
  }, [db, routeId]);

  if (db === null) return null;

  return (
    <Autocomplete
      disableListWrap
      ListboxComponent={ListboxComponent}
      options={options}
      renderInput={(params) => (
        <TextField
          {...params}
          value={displayValue}
          label="Route"
          size="small"
        />
      )}
      renderOption={(props, option, state) =>
        [props, option, state.index] as React.ReactNode
      }
      value={routeId}
      onChange={(_, value) => setRouteId(value || "")}
    />
  );
};

const LISTBOX_PADDING = 8; // px

function renderRow(props: ListChildComponentProps) {
  const { db, language } = useContext(AppContext);
  const { data, index, style } = props;
  const dataSet = data[index];
  const inlineStyle = {
    ...style,
    top: (style.top as number) + LISTBOX_PADDING,
  };

  if (db === null) return <></>;

  const { routeList } = db;

  const { route, orig, dest } = routeList[dataSet[1]];

  return (
    <Typography component="li" {...dataSet[0]} noWrap style={inlineStyle}>
      {route} {orig[language]} --&gt; {dest[language]}
    </Typography>
  );
}

const OuterElementContext = React.createContext({});

const OuterElementType = React.forwardRef<HTMLDivElement>((props, ref) => {
  const outerProps = React.useContext(OuterElementContext);
  return <div ref={ref} {...props} {...outerProps} />;
});

function useResetCache(data: any) {
  const ref = React.useRef<VariableSizeList>(null);
  React.useEffect(() => {
    if (ref.current != null) {
      ref.current.resetAfterIndex(0, true);
    }
  }, [data]);
  return ref;
}

const ListboxComponent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLElement>
>(function ListboxComponent(props, ref) {
  const { children, ...other } = props;
  const itemData: React.ReactChild[] = [];
  (children as React.ReactChild[]).forEach(
    (item: React.ReactChild & { children?: React.ReactChild[] }) => {
      itemData.push(item);
      itemData.push(...(item.children || []));
    },
  );

  const theme = useTheme();
  const smUp = useMediaQuery(theme.breakpoints.up("sm"), {
    noSsr: true,
  });
  const itemCount = itemData.length;
  const itemSize = smUp ? 36 : 48;

  const getChildSize = (child: React.ReactChild) => {
    if (child.hasOwnProperty("group")) {
      return 48;
    }

    return itemSize;
  };

  const getHeight = () => {
    if (itemCount > 8) {
      return 8 * itemSize;
    }
    return itemData.map(getChildSize).reduce((a, b) => a + b, 0);
  };

  const gridRef = useResetCache(itemCount);

  return (
    <div ref={ref}>
      <OuterElementContext.Provider value={other}>
        <VariableSizeList
          itemData={itemData}
          height={getHeight() + 2 * LISTBOX_PADDING}
          width="100%"
          ref={gridRef}
          outerElementType={OuterElementType}
          innerElementType="ul"
          itemSize={(index) => getChildSize(itemData[index])}
          overscanCount={5}
          itemCount={itemCount}
        >
          {renderRow}
        </VariableSizeList>
      </OuterElementContext.Provider>
    </div>
  );
});

export default RoutePicker;
