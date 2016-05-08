// 引入必需模块
var express = require('express'),
    app = express(),
    server = require('http').createServer(app),
    io = require('socket.io')(server);
    mongoose = require('mongoose'),
	Schema = mongoose.Schema;

// 数据库连接
var dbname = 'test',
	db = mongoose.createConnection('localhost', dbname);
db.on('error', console.error.bind(console, '连接错误：'));

// 表结构等设置
var userSchema = new Schema({
	nickname: String,
	password: String,
	email: String,
	isAdmin: Boolean
});
var conSchema = new Schema({
	user_a: String,
	user_b: String,
	cons: String
});

// 数据库
var User = db.model('User', userSchema);
var Conversation = db.model('Conversation', conSchema);

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

    // 用户注册，检查是否存在于数据库，是则返回错误，否则添加用户、更新在线名单、响应欢迎、广播新用户上线
    socket.on('register', (data) => {
        if (!data.email || !data.password || !data.nickname) {
            console.log('not complete');
            return;
        }
        console.log(data);
        User.findOne({
            email: data.email
        }, (err, user) => {
            if (err) console.error(err);
            if (user) {
                console.error(err);
                console.log('用户已存在');
                socket.emit('userExist');
            } else {
                console.log('用户未注册');
                var newUser = new User({
                    nickname: data.nickname,
                    password: data.password,
                    email: data.email,
                    isAdmin: false
                });
                newUser.save((err) => {
                    if (err) throw err;

                    // 注册成功，进入聊天界面
                    userList.push(data.email);
                    console.log(data.email + ' joined.');
                    socket.userIndex = userList.length - 1;
                    socket.email = data.email;
                    socket.emit('welcome');
                    io.sockets.emit('system', socket.email, userList, 'login');
                });
            }
        });
    });

    // 用户登录，更新在线名单；响应欢迎信息；广播新用户上线
    socket.on('login', (data) => {
        if (!data.email || !data.password) return;
        User.findOne({
            email: data.email,
            password: data.password
        }, (err, user) => {
            if (!user || userList.indexOf(data.email) > -1) {
                console.log('用户登录失败');
                socket.emit('loginFail');
            } else {
                userList.push(data.email);
                console.log(data.email + ' joined.');

                // 设置该用户端的socket属性，在数组中的位置+该用户的邮箱
                socket.userIndex = userList.length - 1;
                socket.email = data.email;
                socket.emit('welcome');
                io.sockets.emit('system', socket.email, userList, 'login');
            }
        });
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
