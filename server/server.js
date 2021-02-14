const app = require('express')();
const http = require('http').Server(app);
const _ = require('lodash')
var io = require('socket.io')(http, {path: '/ws/socket.io'});


var dateFormat = require('dateformat');
http.listen(3001,()=> {console.log("Express Server listening on port 3001")})




// ----------------------
// Redis 
// ----------------------
const redis = require('redis');
const redisClient = redis.createClient(6379,'redis');
const publisher = redis.createClient(6379,'redis');
const subscriber = redis.createClient(6379,'redis');


redisClient.set("chatRoomList",[],function(err,reply){});
subscriber.on('message', function(channel, object) {
	io.emit(channel, JSON.parse(object));
});
subscriber.subscribe('message','user','chatroom');

function get_redis_doc_key(doc_id){
    return "DOC:"+doc_id;
}


// ----------------------
// Websocket API 
// ----------------------

io.on('connection', function (socket) {

    socket.on("openDoc", (docObj)=>{
        var doc_id = docObj.doc_id;
        
        console.log("SOCKET_IO_DATA: - JOIN ROOM: " + doc_id + " " + socket.id)
        socket.join(doc_id)

        var doc_key = get_redis_doc_key(doc_id);

        // return persisted doc to user
        redisClient.get(doc_key, function(err, data){

            console.log("GET REDIS: " + doc_key);
            console.log("GET REDIS DATA: " + data);
            console.log("GET REDIS ERR " + err)
            if ( !err && data ){
                socket.emit("initDoc", data); 
            }
        })

        // return list of other users already inside 'room'(workspace)
        const connected_clients = io.sockets.adapter.rooms.get(doc_id);
        const num_clients = connected_clients ? connected_clients.size : 0;
        console.log("GET SOCKETS IN ROOM:" + doc_id + "---" + num_clients + " " + connected_clients);
        
        var user_data = {}
        var client_list = []
        connected_clients.forEach(function(item){
            //console.log("FOREACH clieNt: " + item)
            var _user = {
                id: item
            }
            client_list.push(_user)
        });
       
        user_data['users'] = client_list
        socket.emit("initConnectedUsers", user_data);

        socket.to(doc_id).emit("userJoined", socket.id)
    });

	socket.on('closeDoc', (docObj)=>{
        console.log("SOCKET_IO_DATA: - DISCONNECTING: " + socket.id + docObj.doc_id )
        socket.leave(docObj.doc_id)

        socket.to(docObj.doc_id).emit("userExited", socket.id)

		if(socket.user){
			redisClient.lrem("chatRoomList",-1, socket.user);
		}
    });

    // NOTE:  VERY SIMPLISTIC PERSISTENCE SCHEME, NOT FOR PRODUCTION!!!
    socket.on('updateDoc', (docItemObj)=>{
        var doc_id = docItemObj.doc_id; 
        var doc_key = get_redis_doc_key(doc_id);

        item_to_update_key = docItemObj.key 
        key_paths = item_to_update_key.split('/')

        item_value = docItemObj.value

        redisClient.get(doc_key, function(err, data){
            if ( err || !data ){
                doc_data = {}
            } else {
                doc_data = JSON.parse(data);
            }
            // lodash for some nested setting sugar

            console.log("BEFORE SET: " + doc_data)
            console.log("TYPE: " + typeof key_paths + " " + key_paths.length)

            _.set(doc_data, key_paths, item_value)

            console.log("SET REDIS: " + doc_key + " " + key_paths);
            console.log(item_value)
            console.log("SET REDIS DATA: " + doc_data);
            redisClient.set(doc_key, JSON.stringify(doc_data), function(err, res){
                if ( !err ){
                    socket.to(doc_id).emit("docUpdateEvent", docItemObj);
                }
            });
            //doc_data[item_to_update_key] = item_value

        });
    });
    socket.on('delItemFromDoc', (docItemObj)=>{
        var doc_id = docObj.doc_id; 
        var doc_key = get_redis_doc_key(doc_id);

        item_to_delete_key = docItemObj.key 

        redisClient.get(doc_key, function(err, data){
            if ( err ){
                doc_data = {}
            } else {
                doc_data = data;
                delete doc_data[item_to_delete_key]
            }

            socket.to(doc_id).emit("docItemDeleteEvent", item_to_delete_key);
        });        
    });

    socket.on('mouseMove',(moveData)=>{
        moveData.id = socket.id; 
        //console.log("SOCKET_IO_DATA: - MOUSEMOVE: " +JSON.stringify(moveData) )
        doc_id = moveData.doc_id;
        socket.to(doc_id).emit("userMouseMove", moveData);
    });


	//While Joining The user gets All UsersList which Includes All Users and Chat Rooms
	socket.on('newUser',(userObj)=>{
    console.log("NEW USER :"+JSON.stringify(userObj));
		const userId = userObj.name;//uuidV4();
		const user = {'id': userId, 'name':''+userObj.name, 'time':dateFormat(new Date(), "ddd h:MM:ss"), 'type':'USER', 'newMessage':false, 'show':true};
		socket.emit('myDetails',user);
		let userObjStr = JSON.stringify(user);
		//socket.emit('chatRoomList',chatRoomList);
		redisClient.lrange("chatRoomList", 0, -1, function(err, list){
			list = list.map(user=>JSON.parse(user));
			socket.user = userObjStr;
			console.log("Sending Chat Room List :"+JSON.stringify(list));
			socket.emit('userList',list);
			redisClient.rpush("chatRoomList",userObjStr);
		});
		//console.log("Publish user :"+JSON.stringify(userObjStr));
		publisher.publish('user', userObjStr);
	});

	socket.on('newChatRoom',(roomName)=>{
		const chatRoomId = roomName;//uuidV4();
		const chatRoom = {'id': chatRoomId, 'name':''+roomName, 'time':dateFormat(new Date(), "ddd h:MM:ss"), 'type':'CHAT_ROOM', 'newMessage':false, 'show':true};
		let chatRoomObj = JSON.stringify(chatRoom);
		redisClient.rpush("chatRoomList",chatRoomObj);
		publisher.publish('chatroom', chatRoomObj);
	});
	//Whenevr any message receives It publish to all, it wil be filtered in the client side.
	socket.on('message',(message)=>{
		//console.log("Message : "+JSON.stringify(message))
		message.time = dateFormat(new Date(), "ddd h:MM:ss");
		publisher.publish('message', JSON.stringify(message));
    });
    
});
