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
export function User(props) {
    var style_string = createStyle(props.id)
    return (
        <div className="user tooltip" id={"user-" + props.id} style={style_string}>
            <span class="tooltiptext">{props.id}</span>
            <div classs="icon" style={style_string}></div>
        </div>
    )
}