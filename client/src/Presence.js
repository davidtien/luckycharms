import {
    useUsers,
    initUsers,
    addUser,
    removeUser
} from "./state";

import { User } from "./User";

import React, { useContext, useEffect, useRef } from "react";

import { SocketContext } from "./context"


export function Presence() {

    // our users state data
    const users = useUsers().users
    const socket_manager = useContext(SocketContext);

    // react state scoping fun ... yaay
    const refUsers = useRef(users)
    useEffect(() => {
        refUsers.current = users;
    });

    // to ensure these are only bound once
    useEffect(() => {
        socket_manager.get_raw_socket().on("initConnectedUsers", userData => {
            console.log(userData);
            initUsers(userData);
        });
        socket_manager.get_raw_socket().on("userJoined", userData => {
            handleUserEnter(userData);
        });
        socket_manager.get_raw_socket().on("userExited", userData => {
            handleUserExit(userData);
        });

        return function cleanup() {
            socket_manager.get_raw_socket().off("initConnectedUsers");
            socket_manager.get_raw_socket().off("userJoined");
            socket_manager.get_raw_socket().off("userExited");
        };

    }, []);

    const handleUserEnter = (data) => {
        var user_data = data
        const user_id = user_data;
        var user_exists = false;
        refUsers.current.some(function (item) {
            if (item['id'] == user_id) {
                user_exists = true;
                return;
            }
        });
        if (!user_exists) {
            // create it
            addUser(user_id);
        }
    }

    const handleUserExit = (data) => {
        var user_data = data
        const user_id = user_data;
        var user_exists = false;
        refUsers.current.some(function (item) {
            if (item['id'] == user_id) {
                user_exists = true;
                return;
            }
        });
        if (user_exists) {
            // remove it
            removeUser(user_id);
            console.log("REMOVE USER: " + user_id)
        }
    }

    return (
        <aside className="panel">
            <h2>People</h2>
            <div className="people">

                {users.map(block => User(block))}

            </div>
        </aside>
    );
}
