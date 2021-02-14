import React, { useRef, useEffect, useCallback } from "react";
import { Rect as KonvaRectangle, Transformer } from "react-konva";

import { LIMITS } from "./constants";
import { selectShape, lockShape, unlockShape, transformRectangleShape, moveShape } from "./state";

const boundBoxCallbackForRectangle = (oldBox, newBox) => {
    // limit resize
    if (
        newBox.width < LIMITS.RECT.MIN ||
        newBox.height < LIMITS.RECT.MIN ||
        newBox.width > LIMITS.RECT.MAX ||
        newBox.height > LIMITS.RECT.MAX
    ) {
        return oldBox;
    }
    return newBox;
};

export function Rectangle({ id, isSelected, isLocked, type, ...shapeProps }) {
    const shapeRef = useRef();
    const transformerRef = useRef();

    const isDraggable = !isLocked;

    useEffect(() => {
        if (isSelected) {
            transformerRef.current.nodes([shapeRef.current]);
            transformerRef.current.getLayer().batchDraw();
        }
    }, [isSelected]);

    const handleSelect = useCallback(
        (event) => {
            event.cancelBubble = true;

            lockShape(id);
            selectShape(id);
        },
        [id]
    );

    const handleDrag = useCallback(
        (event) => {
            moveShape(id, event);
            unlockShape(id);
        },
        [id]
    );

    const handleTransform = useCallback(
        (event) => {
            transformRectangleShape(shapeRef.current, id, event);
        },
        [id]
    );

    return (
        <>
            <KonvaRectangle
                onClick={handleSelect}
                onTap={handleSelect}
                onDragStart={handleSelect}
                ref={shapeRef}
                {...shapeProps}
                draggable={isDraggable}
                onDragEnd={handleDrag}
                onTransformEnd={handleTransform}
            />
            {isSelected && (
                <Transformer
                    anchorSize={5}
                    borderDash={[6, 2]}
                    ref={transformerRef}
                    boundBoxFunc={boundBoxCallbackForRectangle}
                />
            )}
        </>
    );
}
