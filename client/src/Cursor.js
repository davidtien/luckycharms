

import { socket_manager } from "./context"

import React from "react"


function createStyle(id) {
    // generate color based on cursor id
    var cursorStyle = {
        backgroundColor: 'black',
        borderColor: 'black'
    }
    if (!id)
        return;

    var hash = 0;
    for (var i = 0; i < id.length; i++) {
        hash = id.charCodeAt(i) + ((hash << 5) - hash);
    }
    var gen_color = (hash & 0x00FFFFFF)
        .toString(16)
        .toUpperCase();
    gen_color = "#" + "00000".substring(0, 6 - gen_color.length) + gen_color;

    //var generated_color = 
    cursorStyle.backgroundColor = gen_color;
    cursorStyle.borderColor = gen_color;

    return cursorStyle;
}
export function Cursor(props) {
    if ( !socket_manager.is_self(props.id) ){
        return <div className="phantomcursor" id={"pcur-" + props.id} style={createStyle(props.id)}></div>
    }
}