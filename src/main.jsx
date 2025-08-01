import React from "react"
import ReactDOM from "react-dom/client"
import App from "./App"
import * as serviceWorker from "./serviceWorker"
import { BrowserRouter } from "react-router-dom"
import "./i18n"
import { Provider } from "react-redux"
import store  from "./store";
import ContextProvider from './context/createContext'


ReactDOM.createRoot(document.getElementById('root')).render(
  <React.Fragment>
    <Provider store={store}>
    <BrowserRouter>
    <ContextProvider>
      <App />
     </ContextProvider>
    </BrowserRouter>
  </Provider>
  </React.Fragment>
);

serviceWorker.unregister()