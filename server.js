// 引入必需模块
var express = require('express'),
    app = express(),
    server = require('http').createServer(app);

// 指定静态文件路径
app.use(express.static(__dirname + '/public'));
app.get('/', (req, res) => {
    res.sendfile('views/chatroom.html');
});

// 监听本地3000端口
server.listen(3000, () => {
    console.log('Server listening at port %d', 3000);
});
