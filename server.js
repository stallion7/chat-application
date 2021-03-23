const express = require('express');
const socketio = require('socket.io');
const http = require('http');
const path = require('path');
const formatMessage = require('./utils/message');
const { userJoin, getCurrentUser, userLeave, getRoomUsers } = require('./utils/users');

const app = express();
const server = http.createServer(app);
const io = socketio(server);

//Složka se statickými soubory
app.use(express.static(path.join(__dirname, 'public'))); 

const botName = 'ChatCord Bot';
// připojení uživatele
io.on('connection', socket =>{
    socket.on('joinRoom', ({ username, room}) => {
        const user = userJoin(socket.id, username, room);

        socket.join(user.room);

          //Přivítání uživatele
    socket.emit('message', formatMessage (botName, 'Vítej v chatu!'));

    // Broadcast když se uživatel připojí
    socket.broadcast.to(user.room).emit('message',
     formatMessage (botName, `${user.username} se připojil do chatu`));

     io.to(user.room).emit('roomUsers', {
         room: user.room,
         users: getRoomUsers(user.room)
     });
    });
    socket.on('chatMessage', msg => {
        const user = getCurrentUser(socket.id);

        io.to(user.room).emit('message', formatMessage (user.username, msg));
    });
        // odpojení uživatele
        socket.on('disconnect', () => {
            const user = userLeave(socket.id);

            if(user) {
                io.to(user.room).emit('message', formatMessage (botName, `${user.username} opustil chat`));

            io.to(user.room).emit('roomUsers', {
                room: user.room,
                users: getRoomUsers(user.room)
            });
        }
        });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server naslouchá na portu ${PORT}`));
