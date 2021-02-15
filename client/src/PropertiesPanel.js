import React, { useCallback } from "react";

import { useShapes, updateAttribute } from "./state";

const shapeSelector = (state) => state.shapes[state.selected];

export function PropertiesPanel() {
    const selectedShape = useShapes(shapeSelector);

    const updateAttr = useCallback((event) => {
        const attr = event.target.name;

        updateAttribute(attr, event.target.value);
    }, []);

    const isVisible = selectedShape ? 'visible' : 'hide'; 
    return (

        <div className={"panel properties " + isVisible}>
            {selectedShape ? (
                <>

                    <div className="key">
                        Stroke{" "}
                        <input
                            className="value"
                            name="stroke"
                            type="color"
                            value={selectedShape.stroke}
                            onChange={updateAttr}
                        />
                    </div>

                    <div className="key">
                        Fill{" "}
                        <input
                            className="value"
                            name="fill"
                            type="color"
                            value={selectedShape.fill}
                            onChange={updateAttr}
                        />
                    </div>
                </>
            ) : (
                    <div className="no-data">Nothing is selected</div>
                )}
        </div>
    );
}
