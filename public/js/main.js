'use strict';
$(() => {
	/* 变量 */
	var socket = io(),
		typing = false;

	var $connectPanel = $('.js-panel-connecting'),
		$connectWrapper = $('.js-connect-wrapper'),
		$entryWrapper = $('.js-entry-wrapper'),
		$loginEmail = $('.js-login-email'),
		$regEmail = $('.js-reg-email');

	var $loginDiv = $('.js-login'),
		$regDiv = $('.js-register'),
		$trigger = $('.js-trigger'),
		$loginBtn = $('.js-login-btn'),
		$registerBtn = $('.js-register-btn'),
		$resetBtn = $('.js-reset-btn');

	var $chatHistory = $('.js-contents'),
		$sendImage = $('.js-image-input'),
		$emojiCon = $('.js-emoji-wrapper'),
		$emojiBtn = $('.js-emoji'),
		$sendBtn = $('.js-send-btn');

	// 初始化判断是否支持FileReader
	if (typeof FileReader === 'undefined') {
		updateChatting('system', 'Your browser doesn\'t support FileReader');
		$sendImage.setAttribute('disabled', 'disabled');
	}
	// 初始化添加颜文字
	for (let i = 69; i > 0; i--) {
		var emojiItem = $('<img>');
		emojiItem.attr('src', '../emoji/' + i + '.gif');
		emojiItem.attr('title', i);
		$emojiCon.append(emojiItem);
	}

	/* 常用函数 */
	function updateChatting(user, msg) {
		msg = checkEmoji(msg);
		var date = new Date().toTimeString().substr(0, 8),
			totalMsg = user + '<span class="timespan">(' + date + ')</span>: ' + msg,
			ele;
		if (user === 'system') {
			ele = '<li class="system">';
		} else {
			ele = '<li>';
		}
		$chatHistory.append($(ele).html(totalMsg));
		$chatHistory.scrollTop = $chatHistory.scrollHeight;
	}
	function updateUsers(list) {
		var $userCount = $('.js-user-num'),
			$userList = $('.js-list');
		$userCount.html(list.length);
		$userList.empty();
		$.each(list, (idx, item) => {
			$userList.append($('<li>').text(item));
		});
	}
	function updateChattingImage(user, img) {
		var date = new Date().toTimeString().substr(0, 8),
			totalMsg = user + '<span class="timespan">(' + date + ')</span>: <br>' + '<a href="' + img + '" target="_blank"><img src="' + img + '"></a>';
		$chatHistory.append($('<li>').html(totalMsg));
		$chatHistory.scrollTop = $chatHistory.scrollHeight;
	}
	function checkEmoji(msg) {
		var match,
			result = msg,
			reg = /\[emoji:\d+\]/g,
			emojiIdx,
			totalEmojiNum = $emojiCon.children().length;
		while (match = reg.exec(msg)) {
			emojiIdx = match[0].slice(7, -1);
			if (emojiIdx > totalEmojiNum) {
				result = result.replace(match[0], '[X]');
			} else {
				result = result.replace(match[0], '<img class="emoji" src="../emoji/' + emojiIdx + '.gif">');
			}
		}
		return result;
	}


	/* 客户端页面交互 */

	// 登陆/注册板块切换
	$trigger.bind('click', (e) => {
		var action = e.currentTarget.getAttribute('data-action');
		$loginDiv.addClass('hidden');
		$regDiv.addClass('hidden');
		if (action === 'login') {
			$loginDiv.removeClass('hidden');
			$loginEmail.focus();
		} else {
			$regDiv.removeClass('hidden');
			$regEmail.focus();
		}
	});

	// 重置注册信息
	$resetBtn.bind('click', (e) => {
		var form = $(e.currentTarget).parent();
		form.find('.js-reg-input').val('');
		return false;
	})

	// 打开颜文字窗口
	$emojiBtn.bind('click', () => {
		$emojiCon.removeClass('hidden');
		return false;
	});

	// 关闭颜文字窗口
	$('body').bind('click', (e) => {
		if (e.target !== $emojiCon) {
			$emojiCon.addClass('hidden');
		}
	});

	// 点击某个颜文字后添加其代码到聊天信息中
	$emojiCon.delegate('img', 'click', (e) => {
		var $target = e.target,
			msgInput = $('.js-input-message'),
			newMsg = msgInput.val();
		msgInput.focus();
		newMsg += '[emoji:' + $target.title +']';
		msgInput.val(newMsg);
		return false;
	});


	/* 发送请求到服务器 */

	// 登录，发送到服务器
	$loginBtn.bind('click', () => {
		var email = $loginEmail.val().trim();
		if (!email) {
			$loginEmail.focus();
			return;
		} else {
			socket.emit('login', {
				email: email
			});
		}
		return false;
	});

	// 发送消息到服务器
	$sendBtn.bind('click', () => {
		var msgInput = $('.js-input-message'),
			msg = msgInput.val();
		msgInput.val('');
		msgInput.focus();
		if (msg.trim().length !== 0) {
			socket.emit('newMsg', msg);
			updateChatting('me', msg);
		}
		return false;
	});

	// 发送图片到服务器
	$sendImage.bind('change', (e) => {
		var file = e.target.files[0],
			reader = new FileReader(),
			ext = file.type.split('/').pop();
		// 判断文件是否图片
		if (!/(gif|jpg|jpeg|png|GIF|JPG|PNG)$/.test(file.type)) {
			updateChatting('system', 'Please choose an image');
			e.target.value = '';
			return;
		}
		// 将图片发送到服务器
		reader.onload = (e) => {
			socket.emit('newImg', e.target.result);
			updateChattingImage('me', e.target.result);
		}

		reader.readAsDataURL(file);
		e.target.value = '';

		return false;
	});


	/* 响应服务器模块 */

	// 成功连接服务器后，跳转到登录/注册模块
	socket.on('connect', () => {
		$connectWrapper.addClass('hidden');
		$entryWrapper.removeClass('hidden');
		$loginEmail.focus();
	});

	// 登录成功，进入聊天界面
	socket.on('welcome', () => {
		$connectPanel.addClass('hidden');
	});
	// 登录失败，邮箱已经存在
	socket.on('userExist', () => {
		$loginEmail.focus();
		$loginEmail.select();
	});

	// 收到其他用户的信息并显示
	socket.on('newMsg', (email, msg) => {
		updateChatting(email, msg);
	});

	// 收到其他用户的图片并显示
	socket.on('newImg', (email, img) => {
		updateChattingImage(email, img);
	});

	// 监听系统广播消息
	socket.on('system', (email, users, type) => {
		if (!email) return;
		var msg;
		if (type === 'login') {
			msg = email + ' joined.';
		} else if (type === 'logout') {
			msg = email + ' left.';
		}
		// 显示系统消息
		updateChatting('system', msg);
		// 更新用户在线人数与列表
		updateUsers(users);
	});
});
