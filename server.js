// 引入必需模块
var express = require('express'),
    app = express(),
    server = require('http').createServer(app),
    io = require('socket.io')(server),
    db = require('./database.js');

// 指定静态文件路径
app.use(express.static(__dirname + '/public'));
app.get('/', (req, res) => {
    res.sendfile('views/chatroom.html');
});

// 监听本地3000端口
server.listen(3000, () => {
    console.log('Server listening at port %d', 3000);
});

/* 服务器handler */
var userList = [];

io.on('connection', (socket) => {
    // 用户连接服务器
    console.log('New user joined.');

    // 用户登录，更新在线名单；响应欢迎信息；广播新用户上线
    socket.on('login', (data) => {
        if (!data.email) return;
        if (userList.indexOf(data.email) > -1) {
            socket.emit('userExist');
            return;
        }
        userList.push(data.email);
        console.log(data.email);

        // 设置该用户端的socket属性，在数组中的位置+该用户的邮箱
        socket.userIndex = userList.length - 1;
        socket.email = data.email;
        socket.emit('welcome');
        io.sockets.emit('system', socket.email, userList, 'login');
    });

    // 用户聊天信息，广播到其他用户
    socket.on('newMsg', (msg) => {
        socket.broadcast.emit('newMsg', socket.email, msg);
    });

    // 用户聊天图片
    socket.on('newImg', (img) => {
        socket.broadcast.emit('newImg', socket.email, img);
    });

    // 用户断开服务器，广播给其他在线用户
  	socket.on('disconnect', () => {
	  	console.log('A user left.');
        userList.splice(socket.userIndex, 1);
        socket.broadcast.emit('system', socket.email, userList, 'logout');
  	});
});
