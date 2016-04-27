// 引入必需模块
var express = require('express'),
    app = express(),
    server = require('http').createServer(app);

// 指定静态文件路径
app.use(express.static(__dirname + '/public'));
app.get('/', (req, res) => {
    res.sendfile('views/chatroom.html');
});

server.listen(3000);
