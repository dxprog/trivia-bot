var redwrap = require('redwrap');
var ent = require('ent');
var fs = require('fs');
var soundex = require('soundex');

module.exports = function (client, channelName) {

	var trivia = [],
		scores = {},
		currentQuestion = null,
		tries = 0,
		MAX_TRIES = 5,
		MAX_TIME = 30000,
		SCOREBOARD_WIDTH = 25,
		timer = null,
		currentTriviaSet = null,
		questionsLeft = 0;

	function resetAll() {
		trivia = [];
		scores = {};
		currentQuestion = null;
		tries = 0;
		clearTimeout(timer);
		timer = null;
		currentTriviaSet = null;
		questionsLeft = 0;
		fs.readFile(__dirname + '/.trivia', { encoding: 'utf8' }, function (err, data) {
			if (err) {
				console.error('Trivia plugin config file missing...');
				return;
			}

			trivia = JSON.parse(data);
			init();
		});
	}

	function cleanse(text) {
		var regex = /\b(and|the|at|in|to|is|an|but|nor|or|of)\b/i,
			chars = [ '&', '!', '@', '#', '$', '%', '^', '&', '*', '(', ')', '-', '+', '=', '_', '\'', '"', '~', ',', '?', ':', ';', '<', '>' ];
		each(chars, function(item) {
			text = text.replace(item, '');
		});
		return text.replace(regex, '');
	}

	function each(arr, callback) {
		for (var i in arr) {
			if (arr.hasOwnProperty(i)) {
				if (callback(arr[i], i)) {
					break;
				}
			}
		}
	}

	function findTriviaSet(type) {
		var index = null;
		each(trivia, function(item, idx) {
			if (item.name.toLowerCase() === type) {
				index = idx;
				return true;
			}
		});
		return index;
	}

	function selectQuestion(type) {

		var triviaSet = null,
			chunks = null,
			words = typeof type === 'string' ? type.split(' ') : null,
			lastWord = null;

		
		if (words) {
			lastWord = words[words.length - 1];
			if (lastWord - 0 == lastWord) {
				questionsLeft = parseInt(lastWord);
				words.pop();
				type = words.join(' ');
			}
		} else {
			questionsLeft = questionsLeft > 0 ? questionsLeft : 1;
		}

		triviaSet = type === 'random' ? Math.floor(Math.random() * trivia.length) : findTriviaSet(type);

		if (null !== triviaSet) {

			// If the last parameter is a number, use that as the number of questions to ask

			currentTriviaSet = type;
			currentQuestion = Math.floor(Math.random() * trivia[triviaSet].questions.length);
			currentQuestion = trivia[triviaSet].questions[currentQuestion];
			chunks = currentQuestion.split('*');
			if (chunks && chunks.length === 2) {
				if (type === 'random') {
					client.say(channelName, 'A question from the book of ' + trivia[triviaSet].name);
				}
				client.say(channelName, chunks[0]);
				timer = setTimeout(timeout, MAX_TIME);
			} else {
				//client.say(channelName, 'My master didn\'t add user friendly error checking and something blew up...');
				selectQuestion(type);
			}
		}
	}

	function closeQuestion() {
		tries = 0;
		currentQuestion = null;
		clearTimeout(timer);
	}

	function sayAnswer() {
		if (null !== currentQuestion) {
			var chunks = currentQuestion.split('*');
			if (chunks.length === 2) {
				client.say(channelName, 'The answer was ' + chunks[1].trim() + '.');
			}
		}
	}

	function timeout() {
		if (null !== currentQuestion) {
			client.say(channelName, 'Time\'s up!');
			skip();
		}
	}

	function listTrivia() {
		client.say(channelName, 'Loaded trivia sets:');
		each(trivia, function(item) {
			client.say(channelName, '- ' + item.name);
		});
	}

	function changeScore(user, score) {
		if (!scores.hasOwnProperty(user)) {
			scores[user] = 0;
		}
		scores[user] += score;
	}

	function answer(message) {
		var retVal = false;
		if (null != currentQuestion) {
			var chunks = currentQuestion.split('*');
			if (chunks.length === 2) {
				if (soundex(cleanse(message.toLowerCase().trim())) == soundex(cleanse(chunks[1].toLowerCase().trim()))) {
					retVal = true;
				}
			}
		}
		return retVal;
	}

	function skip() {
		if (currentQuestion) {
			sayAnswer();
			closeQuestion();
			selectQuestion(currentTriviaSet);
		}
	}

	function displayScore() {
		each(scores, function(score, name) {
			var spacer = (new Array(SCOREBOARD_WIDTH - name.length - ('' + score).length)).join(' ');
			client.say(channelName, name + spacer + score);
		});
	}

	function trigger(from, message) {
		message = message.toLowerCase().trim();
		message = message.length > 0 ? message : 'random';
		
		switch (message) {
			case 'list':
				listTrivia();
				break;
			case 'score':
				displayScore();
				break;
			case 'reset':
				resetAll();
				break;
			default:
				if (null == currentQuestion) {
					selectQuestion(message);
				} else {
					client.say(channelName, 'You still have an unanswered question >_>');
				}
				break;
		}

	}

	function init() {

		each(trivia, function(item) {
			fs.readFile(__dirname + '/trivia/' + item.file + '.txt', { encoding: 'utf8' }, function(err, data) {
				if (typeof data === 'string') {
					item.questions = data.split('\n');
				}
			});
		});

	}

	function messageHandler(from, message) {
		if (currentQuestion) {
			if (answer(message)) {
				changeScore(from, 1);
				client.say(channelName, 'Correct! ' + from + '\'s score is now ' + scores[from]);
				closeQuestion();
				questionsLeft--;
				if (questionsLeft > 0) {
					selectQuestion(currentTriviaSet);
				} else {
					client.say(channelName, 'That\'s all for this round, folks! Here\'s the scoreboard:');
					displayScore();
				}
			}
		}
	}

	resetAll();

	return {
		commands: {
			trivia: trigger,
			skip: skip
		},

		messageHandler: messageHandler,

	};
}
