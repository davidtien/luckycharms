import { createStore } from "@halka/state";
import produce from "immer";
import clamp from "clamp";
import { nanoid } from "nanoid";
import { set } from "lodash";

import { SHAPE_TYPES, DEFAULTS, LIMITS } from "./constants";
import { socket_manager } from "./context"

// ---------------- SHAPE STATE -------------------//
const baseShapesState = {
    selected: null,
    shapes: {},
    locked: []
};
export const useShapes = createStore(() => {
    const initialState = {};

    return { ...baseShapesState, shapes: initialState ?? {} };
});
export const initDoc = (data) => {
    //console.log("INITDOC: " + data)
    useShapes.set(JSON.parse(data));
}
const setShapeState = (fn) => useShapes.set(produce(fn));

export const resetDoc = () => {
    useShapes.set(baseShapesState);

    commit_data("shapes", baseShapesState.shapes);
    commit_data("selected", baseShapesState.selected);
    commit_data("locked", baseShapesState.locked);
};


// ---------------- USER STATE -------------------//
const baseUserState = {
    users: []
};
export const useUsers = createStore(() => {
    return { ...baseUserState }
});
const setUserState = (fn) => useUsers.set(produce(fn));
export const initUsers = (data) => {
    useUsers.set(data);
}
export const addUser = (user_id) => {
    setUserState((state) =>
        void (state.users.push({ id: user_id }))
    );
};

export const removeUser = (user_id) => {
    setUserState((state) =>
        void (state.users.splice(state.users.findIndex(item => item.id == user_id), 1))
    );
};

const commit_data = (key, value) => {
    var _update_obj = {
        key: key,
        value: value
    }
    socket_manager.emit_wrapper("updateDoc", _update_obj);
};
socket_manager.get_raw_socket().on("docUpdateEvent", updateData => {
    var key_path = updateData.key.split('/');
    setShapeState((state) => {
        set(state, key_path, updateData.value);
    });
});
socket_manager.get_raw_socket().on("initDoc", docData => {
    initDoc(docData);
});



export const createRectangle = ({ x, y }) => {
    setShapeState((state) => {
        var _nanoid = nanoid();
        state.shapes[_nanoid] = {
            type: SHAPE_TYPES.RECT,
            width: DEFAULTS.RECT.WIDTH,
            height: DEFAULTS.RECT.HEIGHT,
            fill: DEFAULTS.RECT.FILL,
            stroke: DEFAULTS.RECT.STROKE,
            rotation: DEFAULTS.RECT.ROTATION,
            x,
            y,
        };
        commit_data("shapes/" + _nanoid, state.shapes[_nanoid]);
    });
};

export const createCircle = ({ x, y }) => {
    setShapeState((state) => {
        var _nanoid = nanoid();
        state.shapes[_nanoid] = {
            type: SHAPE_TYPES.CIRCLE,
            radius: DEFAULTS.CIRCLE.RADIUS,
            fill: DEFAULTS.CIRCLE.FILL,
            stroke: DEFAULTS.CIRCLE.STROKE,
            x,
            y,
        };
        commit_data("shapes/" + _nanoid, state.shapes[_nanoid]);
    });
};

export const selectShape = (id) => {
    setShapeState((state) => {
        state.selected = id;
        commit_data("selected", id);
    });
};
export const clearSelection = () => {
    setShapeState((state) => {
        state.selected = null;
        commit_data("selected", null);
    });
};
export const lockShape = (shape_id) => {
    setShapeState((state) => 
        {
            if ( !state.locked ){
                state.locked = new Array()
            }
            var self_id = socket_manager.get_self_id();
            var locked_items = state.locked.length;

            // remove any previously locked items
            while (locked_items--){
                if ( state.locked[locked_items].id == shape_id || 
                     state.locked[locked_items].owner == self_id ){
                         state.locked.splice(locked_items, 1);
                     }
            }
            state.locked.push({ id: shape_id, owner: socket_manager.get_self_id() })

            //console.log("LOCK SHAPE: " + shape_id);
            //console.log(state.locked);
            commit_data("locked", state.locked);
        }
    )
};
export const unlockShape = (shape_id) => {
    setShapeState((state) =>
        {  state.locked.splice(
            state.locked.findIndex(item => ( item.id == shape_id && item.owner == socket_manager.get_self_id()), 1))
        
            //console.log("UNLOCK SHAPE: " + shape_id);
            //console.log(state.locked);
            commit_data("locked", state.locked);
        }
        
    );    
};


export const moveShape = (id, event) => {
    setShapeState((state) => {
        const shape = state.shapes[id];

        if (shape) {
            shape.x = event.target.x();
            shape.y = event.target.y();
        }
        commit_data("shapes/" + id, shape);
    });
};

export const updateAttribute = (attr, value) => {
    setShapeState((state) => {
        const shape = state.shapes[state.selected];

        if (shape) {
            shape[attr] = value;
        }
        commit_data("shapes/" + state.selected, shape);
    });
};

export const transformRectangleShape = (node, id, event) => {
    // transformer is changing scale of the node
    // and NOT its width or height
    // but in the store we have only width and height
    // to match the data better we will reset scale on transform end
    const scaleX = node.scaleX();
    const scaleY = node.scaleY();

    // we will reset the scale back
    node.scaleX(1);
    node.scaleY(1);

    setShapeState((state) => {
        const shape = state.shapes[id];

        if (shape) {
            shape.x = node.x();
            shape.y = node.y();

            shape.rotation = node.rotation();

            shape.width = clamp(
                // increase the width in order of the scale
                node.width() * scaleX,
                // should not be less than the minimum width
                LIMITS.RECT.MIN,
                // should not be more than the maximum width
                LIMITS.RECT.MAX
            );
            shape.height = clamp(
                node.height() * scaleY,
                LIMITS.RECT.MIN,
                LIMITS.RECT.MAX
            );
        }
        commit_data("shapes/" + id, shape);
    });
};

export const transformCircleShape = (node, id, event) => {
    // transformer is changing scale of the node
    // and NOT its width or height
    // but in the store we have only width and height
    // to match the data better we will reset scale on transform end
    const scaleX = node.scaleX();

    // we will reset the scale back
    node.scaleX(1);
    node.scaleY(1);

    setShapeState((state) => {
        const shape = state.shapes[id];

        if (shape) {
            shape.x = node.x();
            shape.y = node.y();

            shape.radius = clamp(
                (node.width() * scaleX) / 2,
                LIMITS.CIRCLE.MIN,
                LIMITS.CIRCLE.MAX
            );
        }

        commit_data("shapes/" + id, shape);

    });
};
