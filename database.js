'use strict';
var mongoose = require('mongoose'),
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

// 表实例
var User = db.model('User', userSchema);
var Conversation = db.model('Conversation', conSchema);
