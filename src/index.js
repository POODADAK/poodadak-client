import axios from "axios";
import React from "react";
import ReactDOM from "react-dom";
import { Provider } from "react-redux";
import { BrowserRouter, Route, Routes } from "react-router-dom";

import store from "./app/store";
import GlobalStyle from "./common/components/GlobalStyle";
import Process from "./features/sidebar/Process";
import Sidebar from "./features/sidebar/Sidebar";

axios.defaults.baseURL = process.env.REACT_APP_AXIOS_BASE_URL;

ReactDOM.render(
  <React.StrictMode>
    <GlobalStyle />
    <Provider store={store}>
      <BrowserRouter>
        <Routes>
          <Route path="/" />
          <Route path="/signin" element={<Sidebar />}>
            <Route path="naver" element={<Process />} />
          </Route>
          <Route path="/toilets" />
          <Route path="/toilets/:id" />
          <Route path="/chats" />
          <Route path="/chats/:id" />
          <Route path="/reviews/edit" />
          <Route path="/users/:id" />
        </Routes>
      </BrowserRouter>
    </Provider>
  </React.StrictMode>,
  document.getElementById("root")
);
