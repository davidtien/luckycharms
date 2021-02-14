import React, { useRef, useEffect, useCallback } from "react";
import { Circle as KonvaCircle, Transformer } from "react-konva";

import { LIMITS } from "./constants";
import { selectShape, lockShape, unlockShape, transformCircleShape, moveShape } from "./state";

const boundBoxCallbackForCircle = (oldBox, newBox) => {
  // limit resize
  if (
    newBox.width < LIMITS.CIRCLE.MIN ||
    newBox.height < LIMITS.CIRCLE.MIN ||
    newBox.width > LIMITS.CIRCLE.MAX ||
    newBox.height > LIMITS.CIRCLE.MAX
  ) {
    return oldBox;
  }
  return newBox;
};

export function Circle({ id, isSelected, isLocked, type, ...shapeProps }) {
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
      transformCircleShape(shapeRef.current, id, event);
    },
    [id]
  );

  return (
    <>
      <KonvaCircle
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
          rotateEnabled={false}
          enabledAnchors={[
            "top-left",
            "top-right",
            "bottom-right",
            "bottom-left",
          ]}
          boundBoxFunc={boundBoxCallbackForCircle}
        />
      )}
    </>
  );
}
