
import { io } from "socket.io-client"

import React from "react";

const API_HOST = process.env.REACT_APP_API_HOST
const SOCKET_PATH = process.env.REACT_APP_SOCKET_PATH


class SocketManager {
    constructor() {

        var pathArray = window.location.pathname.split('/');
        if (pathArray.length > 0) {
            this.doc_id = pathArray[1];
        }

        this.socketio_client = null;
        this.socket_id = null;
        this._connect();
    }
    _connect() {
        this.socketio = io(API_HOST, { path: SOCKET_PATH });

        this.emit_wrapper("openDoc", {});

        this.socketio.on('connect', () => {
            this.socket_id = this.socketio.id;
        });
    }
    is_self(id){
        return this.socket_id == id; 
    }
    get_self_id(){
        return this.socket_id;
    }
    close_doc() {
        this.emit_wrapper("closeDoc", {});
    }

    get_raw_socket() {
        return this.socketio;
    }

    // appends general info onto message_data before sending 
    emit_wrapper(message, message_data) {
        message_data.doc_id = this.doc_id;
        //message_data.user
        this.socketio.emit(message, message_data)
    }
}
export const socket_manager = new SocketManager()
export const SocketContext = React.createContext();

