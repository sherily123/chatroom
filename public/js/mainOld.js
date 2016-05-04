$(() => {
	var $saying = $('form.input-field'),
		$input = $('.input-content'),
		$chatting = $('.contents'),
		$userList = $('.list'),

		$loginForm = $('.login-form'),
		$regForm = $('.register-form');

	var currentUser = '--',
		isLogin = false;

	var socket = io();

	/* Functions */

	function updateChattingPanel(msg) {
		$chatting.append($('<li>').text(msg));
	}

	function updateUserList(list, num) {
		$userList.empty();
		var $num = $('.user-num');
		$num.html(num);
		$userList.empty();
		$.each(list, (key, value) => {
			$userList.append($('<li>').text(value));
		});
	}

	/* Send */

	// 登录
	$loginForm.submit(() => {
		var $form = $('.login-form'),
			data = {},
			errFlag = false;
		$form.serializeArray().forEach((item) => {
			data[item.name] = item.value;
		});
		currentUser = data.email;
		$.each(data, (key, value) => {
			console.log(key + '  ' + value);
			if (!value) {
				errFlag = true;
			}
		});
		if (!errFlag) {
			socket.emit('login', data);
		} else {
			alert('login fail(client)');
		}
		return false;
	});

	// 注册
	$regForm.submit(() => {
		var email = $regEmail.val(),
			username = $regName.val(),
			password = $regPwd1.val(),
			pwd = $regPwd2.val();
		if (!email || !username || !password || !pwd) {
			alert('register fail(client)');
			return;
		}
		if (password !== pwd) {
			alert('2 passwords not same');
			return;
		}
		socket.emit('register', {
			email: email,
			nickname: username,
			password: password,
			isAdmin: false
		});
		return false;
	})

	// 发送聊天信息
	$saying.submit(() => {
		var msg = $input.val();
		if (msg) {
			socket.emit('new message', {
				username: currentUser,
				msg: msg
			});
			updateChattingPanel(msg);
			$input.val('');
		}
		return false;
	});

	/* Receive */

	// 欢迎当前用户
	socket.on('welcome', (data) => {
		updateChattingPanel(data.msg + ' ' + currentUser);
		updateUserList(data.userList, data.numUsers);
	});

	// 收到新信息
	socket.on('new message', (data) => {
		updateChattingPanel(data.msg);
	});

	// 显示新用户加入
	socket.on('new user', (data) => {
		updateChattingPanel(data.msg);
		updateUserList(data.userList, data.numUsers);
	});

	// 错误信息处理
	socket.on('error', (data) => {
		if (data.type === 'login') {
			alert(data.msg);
		} else if (data.type === 'register') {
			alert(data.msg);
		}
	})
});
