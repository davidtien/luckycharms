import React from "react";

import { Palette } from "./Palette";
import { Canvas } from "./Canvas";
import { PropertiesPanel } from "./PropertiesPanel";
import {SocketContext, socket_manager} from "./context"
import { Presence } from "./Presence";

window.onbeforeunload = function() {
    socket_manager.close_doc();
}



function App() {
  return (
    <div className="app">
      <SocketContext.Provider value={socket_manager}>
        <Presence />
        <PropertiesPanel />
        <Canvas />
        <Palette />
      </SocketContext.Provider>
    </div>
  );
}

export default App;
