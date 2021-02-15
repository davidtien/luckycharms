import {
    useShapes,
    useUsers,
    clearSelection,
    createCircle,
    createRectangle,
    initDoc,
    resetDoc,
} from "./state";
import { DRAG_DATA_KEY, SHAPE_TYPES, MOUSE_MOVE_UPDATE_THROTTLE } from "./constants";
import { Shape } from "./Shape";
import { Cursor } from "./Cursor";
import { SocketContext } from "./context"

import React, { useRef, useCallback, useContext, useState, useEffect } from "react";
import { Layer, Stage } from "react-konva";
import { debounce, throttle } from "lodash";
import { createStore } from "@halka/state";

const handleDragOver = (event) => event.preventDefault();

function useDebouncedCallback(callback, delay) {
    const d = callback;
    const callbackfunc = useCallback(debounce(d, delay), []);
    return [callbackfunc]
}
function useThrottledCallback(callback, delay) {
    const d = callback;
    const callbackfunc = useCallback(throttle(d, delay), []);
    return [callbackfunc]
}




export function Canvas() {
    const shapes = useShapes((state) => Object.entries(state.shapes));

    const users = useUsers().users

    // react state scoping fun ... yaay
    const refShapes = useRef(shapes)
    useEffect(() => {
        refShapes.current = shapes;
    });
    //const [phantomcursors, setPhantoms] = useState([]);
    const socket_manager = useContext(SocketContext);


    useEffect(()=> {

        socket_manager.get_raw_socket().on("userMouseMove", moveData => {
            animatePhantomCursors(moveData);
        });

        return function cleanup(){
            socket_manager.get_raw_socket().off("userMouseMove");
        };

    }, []);


    const animatePhantomCursors = (data) => {
        var mouse_data = data;
        const cursor_id = 'pcur-' + mouse_data.id;

        // we got to move it move it
        const cursor = document.getElementById(cursor_id);
        if (cursor) {
            cursor.style.left = mouse_data.x + 'px'
            cursor.style.top = mouse_data.y + 'px'
        }
    }

    const stageRef = useRef();

    const mousemovefunc = (e) => {
        if (stageRef.current) {

            // stageRef is actually the konvasjs-content element
            // should be fine since nothing else really exists in the #mainCanvas div
            var canvasEl = stageRef.current.content;
            var canvasRect = canvasEl.getBoundingClientRect();
            var x = e.evt.clientX - canvasRect.left;
            var y = e.evt.clientY - canvasRect.top;
            //console.log("MOUSE POS: " + x + " " + y)

            var moveData = {
                x: x,
                y: y
            }
            socket_manager.emit_wrapper("mouseMove", moveData)
        }
    }
    const [throttledMouseMove] = useThrottledCallback(mousemovefunc, MOUSE_MOVE_UPDATE_THROTTLE);

    const handleOnMouseMove = (e) => {
        throttledMouseMove(e);
    }

    const handleDrop = useCallback((event) => {
        const draggedData = event.nativeEvent.dataTransfer.getData(DRAG_DATA_KEY);

        if (draggedData) {
            const { offsetX, offsetY, type, clientHeight, clientWidth } = JSON.parse(
                draggedData
            );

            stageRef.current.setPointersPositions(event);

            const coords = stageRef.current.getPointerPosition();

            if (type === SHAPE_TYPES.RECT) {
                // rectangle x, y is at the top,left corner
                createRectangle({
                    x: coords.x - offsetX,
                    y: coords.y - offsetY,
                });
            } else if (type === SHAPE_TYPES.CIRCLE) {
                // circle x, y is at the center of the circle
                createCircle({
                    x: coords.x - (offsetX - clientWidth / 2),
                    y: coords.y - (offsetY - clientHeight / 2),
                });
            }
        }
    }, []);

    return (
        <main className="canvas" id="mainCanvas" onDrop={handleDrop} onDragOver={handleDragOver}>
            <div className="buttons">
                   <button onClick={resetDoc}>Reset</button>
            </div>

            {users && users.map(block => Cursor(block))}
            <Stage
                ref={stageRef}
                width={window.innerWidth}
                height={window.innerHeight}
                onClick={clearSelection}
                onMouseMove={handleOnMouseMove}
            >
                <Layer>
                    {shapes.map(([key, shape]) => (
                        <Shape key={key} shape={{ ...shape, id: key }} />
                    ))}
                </Layer>
            </Stage>
            
        </main>
    );
}
