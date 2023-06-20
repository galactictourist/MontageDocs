import { ethToUsd } from "./util/converter";
import React, { useEffect } from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import reportWebVitals from "./reportWebVitals";
import { BrowserRouter, useLocation } from "react-router-dom";

import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import notifyToSlackChannel from "./util/notifyToSlackChannel";
import FightingBots from "./page/parts/FightingBots";
import logo from "./img/logo.svg";
import getIP from "./util/getIP";

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

const root = ReactDOM.createRoot(document.getElementById("root"));
if (process.env.REACT_APP_SITE_DISABLED === '1') {
  root.render((
    <div className="dark-mode flex-column jc-c ai-c pt-1" style={{ minHeight: '100vh' }}>
      <img src={logo} alt="" style={{ width: 128 }} />
      <FightingBots padTop5={false} minHeight={null} padTop={true} />
    </div>));
} else {
  root.render(
    // https://reactjs.org/blog/2022/03/08/react-18-upgrade-guide.html#updates-to-strict-mode
    // <React.StrictMode>
    <BrowserRouter>
      <ScrollToTop />
      <App />
      <ToastContainer />
    </BrowserRouter>
    // </React.StrictMode>
  );
}
// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();

//https://fkhadra.github.io/react-toastify/introduction/
const errorToastConfig = {
  type: "error",
  position: "bottom-left",
  autoClose: 5000,
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
  progress: undefined,
};

window.addEventListener("error", (e) => {
  if (ignoreError(e)) return;
  console.log("onerror e:", e);
  toast(getMessage(e), errorToastConfig);

  notifyToSlackChannel(
    process.env.REACT_APP_MONTAGE_TECH_ERROR,
    document.location.href + "\nerror:\n" + serializeError(e)
  );
});
window.addEventListener("unhandledrejection", (e) => {
  if (ignoreError(e)) return;
  console.log("unhandledrejection e:", e);
  toast(getMessage(e), errorToastConfig);

  notifyToSlackChannel(
    process.env.REACT_APP_MONTAGE_TECH_ERROR,
    document.location.href + "\nunhandledrejection:\n" + serializeError(e)
  );
});

function ignoreError(e) {
  const message = getMessage(e);
  if (message?.includes("Script error")) {
    return true;
  }
  if (message?.includes("Load failed")) {
    return true;
  }
  if (message?.includes("Failed to fetch")) {
    return true;
  }
  if (message?.includes("MetaMask Tx Signature: User denied transaction signature")) {
    return true;
  }
  if (message?.includes("Failed to execute 'transaction' on 'IDBDatabase': The database connection is closing")) {
    return true;
  }

  const reason = JSON.stringify(e?.reason);
  if (reason?.includes("/static/media")) {
    return true;
  }

  return false;
}

let ip = null;
(async () => {
  ip = await getIP();
})();

function serializeError(e) {
  const message = getMessage(e);
  const reason = JSON.stringify(e.reason);
  const stack = JSON.stringify(e.reason?.stack);
  let r = [];
  if (ip) r.push(`IP: ${ip}`);
  if (window.authToken) r.push(`authToken: ${window.authToken}`);
  if (message) r.push(`message: ${message}`);
  if (reason) r.push(`reason: ${reason}`);
  if (stack) r.push(`stack: ${stack}`);
  return r.join("\n");
}
function getMessage(e) {
  return e?.message?.toString() || e?.reason?.message?.toString();
}

ethToUsd(1); // preload eth rate
