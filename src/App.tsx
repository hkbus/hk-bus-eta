import "./App.css";
import Content from "./layouts/Content";
import { Container, SxProps, Theme } from "@mui/material";
import Header from "./layouts/Header";
import Footer from "./layouts/Footer";

function App() {
  return (
    <Container maxWidth="lg" fixed sx={rootSx}>
      <Header />
      <Content />
      <Footer />
    </Container>
  );
}

export default App;

const rootSx: SxProps<Theme> = {
  display: "flex",
  height: "100vh",
  overflow: "scroll",
  alignItems: "center",
  flexDirection: "column",
  justifyContent: "center",
  gap: 1,
  py: 2,
};
