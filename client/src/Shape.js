import React, { useCallback } from "react";

import { SHAPE_TYPES } from "./constants";
import { useShapes } from "./state";
import { Circle } from "./Circle";
import { Rectangle } from "./Rectangle";
import { socket_manager } from "./context"

export function Shape({ shape }) {
    const isSelectedSelector = useCallback(
        (state) => state.selected === shape.id,
        [shape]
    );
    const isSelected = useShapes(isSelectedSelector);

    const isLockedFromEditSelector = useCallback(
        (state) => state.locked && state.locked.some( 
            locked_item => locked_item.id == shape.id && !socket_manager.is_self(locked_item.owner) ), [shape]
    );
    const isLocked = useShapes(isLockedFromEditSelector);

    if (shape.type === SHAPE_TYPES.RECT) {
        return <Rectangle {...shape} isSelected={isSelected} isLocked={isLocked}/>;
    } else if (shape.type === SHAPE_TYPES.CIRCLE) {
        return <Circle {...shape} isSelected={isSelected} isLocked={isLocked}/>;
    }

    return null;
}
