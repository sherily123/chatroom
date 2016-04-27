/* 设置Express等变量 */
var express = require('express'),
	app = express(),
	server = require('http').createServer(app),
	io = require('socket.io')(server),
	port = process.env.PORT || 3000;

/*
// 连接本地数据库MongoDB，并且设置两张表头，方便插入数据
var mongoose = require('mongoose'),
	db = mongoose.createConnection('localhost', 'chatroom');
var Schema = mongoose.Schema;
// 用户表
var userSchema = new Schema({
	nickname: String,
	password: String,
	email: String,
	isAdmin: Boolean
});
var userModel = db.model('user', userSchema);
// 私聊对话表
var conSchema = new Schema({
	user_a: String,
	user_b: String,
	cons: String
});
var conModel = db.model('conversation', conSchema);
// 连接失败时显示错误
db.on('error', (err) => {
	console.error(err);
});*/

// 监听聊天室端口
server.listen(port, function () {
	console.log('Server listening at port %d', port);
});

// 设置静态文件路径
app.use(express.static(__dirname + '/public'));

// 设置路由
app.get('/', (req, res) => {
	res.sendfile('views/chatroom.html');
});

/* Chatroom */
/* 监听Websocket内容 */

var numUsers = 0,
	userList = {},
	anonymous = [];

io.on('connection', (socket) => {
	var addedUser = false;

	// 新建立一个客户端链接
	console.log('a user connected.');

	// 用户上线
	/*socket.on('login', (data) => {
		if (anonymous.indexOf(data.username) > -1) {
			socket.emit('error', {
				type: 'login',
				msg: 'Username existed'
			});
		} else {
			socket.userIndex = anonymous.length;
			socket.username = data.username;
			anonymous.push(data.username);
			socket.emit('welcome', {
				numUsers: anonymous.length;
				userList: anonymous,
				msg: 'Welcome to Chatroom! '
			});
			io.sockets.emit('system', {
				username: data.username;
			});
		}
	})*/

  	// 用户登录
  	// 检查是否存在该用户: 存在   -> 返回welcome信息
  	// 					不存在 -> 返回false，广播新用户上线
  	socket.on('login', (data) => {
		if (!data.email || !data.password)
		 	return false;
		numUsers++;
		userList[numUsers] = data.email;
		console.log(userList);
	  	socket.emit('welcome', {
			numUsers: numUsers,
			userList: userList,
			msg: 'Welcome to Chatroom! '
	  	});
	  	socket.broadcast.emit('new user', {
			userList: userList,
		  	msg: 'A new user joins'
	  	});*
		/*userModel.findOne({
			email: data.email,
			password: data.password
		}, (err, user) => {
			if (!user) {
				console.error(err);
				socket.emit('error', {
					type: 'login',
					msg: 'User not existed.'
				});
			} else {
				socket.emit('welcome', {
					username: data.email,
					msg: 'Welcome to Chatroom!'
				});
			  	socket.broadcast.emit('new user', {
				  	msg: 'A new user joins'
			  	});
			}
		});*/
  	});

  	// 用户注册
  	socket.on('register', (data) => {
		console.log(data);
		/*
		userModel.findOne(data, (err, user) => {
			if (user) {
				socket.emit('error', {
					type: 'register',
					msg: 'User existed'
				});
			} else {
				var user = new userModel();
				user.nickname = data.nickname;
				user.email = data.email;
				user.password = data.password;
				user.isAdmin = data.isAdmin;
				user.save((err) => {
					if (err) throw err;
					//updateChatInfo(data.nickname);
					socket.emit('welcome', {
						username: data.email,
						msg: 'Welcome to Chatroom!'
					});
				  	socket.broadcast.emit('new user', {
					  	msg: 'A new user joins'
				  	});
				});
			}
		});*/
  	});

  	// 用户传来聊天信息，将该信息广播到其他客户端
  	socket.on('new message', (data) => {
		socket.broadcast.emit('new message', data);
  	});

  	// when the client emits 'typing', we broadcast it to others
  	socket.on('typing', () => {
    	socket.broadcast.emit('typing', {
      		username: socket.username
    	});
  	});

  	// when the client emits 'stop typing', we broadcast it to others
  	socket.on('stop typing', () => {
    	socket.broadcast.emit('stop typing', {
      		username: socket.username
    	});
  	});

  	// 用户下线，广播给其他在线用户
  	socket.on('disconnect', () => {
	  	console.log('a user disconnected.');
    	if (addedUser) {
      		--numUsers;

      		// echo globally that this client has left
      		socket.broadcast.emit('user left', {
        		username: socket.username,
        		numUsers: numUsers
      		});
    	}
  	});
});
