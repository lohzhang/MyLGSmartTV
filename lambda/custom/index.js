'use strict';
let Alexa = require("alexa-sdk");
let http = require('http');
let crypto = require('crypto');
const mySecret = ''; // Add in your secret. This should match with the secret in the SimpleServer NodeJS project.

exports.handler = function(event, context, callback) {
    let alexa = Alexa.handler(event, context);
    alexa.registerHandlers(handlers);
    alexa.execute();
};

const options = {
  hostname: '', // Add in hostname that can be accessible by AWS.
  port: 80,
  path: '',
  method: '',
  headers: {
    'authorization': '',
    'date': '',
    'Content-Type': 'application/json'
  }
};

var generateAuth = function(timeStamp) {
    const encoding = "base64";
    const algorithm = "sha256";
    const generatedAuth = crypto.createHmac(algorithm, mySecret).update(timeStamp).digest(encoding);
    return generatedAuth;
};

var buildRequestOption = function(method, path, timeStamp) {
    options.method = method;
    options.path = path;
    options.headers.authorization = generateAuth(timeStamp);
    options.headers.date = timeStamp;
    return options;
};

var handlers = {
    'LaunchRequest': function () {
        this.emit('SayHello');
    },
    'GetAppListIntent': function () {
        let requestOptions = buildRequestOption('GET', '/getAppList', new Date().toUTCString());
        let self = this;
        http.request(requestOptions, function() {
            self.emit(':tell', 'Get Application List');
        }).end();
    },
    'TurnOffIntent': function () {
        let requestOptions = buildRequestOption('POST', '/turnOff', new Date().toUTCString());
        let self = this;
        http.request(requestOptions, function() {
            self.emit(':tell', 'Turned off');    
        }).end();
    },
    'ShowToastIntent': function() {
        let requestOptions = buildRequestOption('POST', '/ShowToast', new Date().toUTCString());
        let body = {};
        body.toastMessage = this.event.request.intent.slots.Message.value;
		console.log('Toast Message: ' + body.toastMessage);
        let self = this;
        let req = http.request(requestOptions, function() {
            self.emit(':tell', 'Toast Message Showed');
        });
        req.write(JSON.stringify(body));
        req.end();
    },
    'MuteIntent': function () {
        let requestOptions = buildRequestOption('POST', '/mute', new Date().toUTCString());
        let self = this;
        http.request(requestOptions, function() {
            self.emit(':tell', 'Muted'); 
        }).end();
    },
    'UnmuteIntent': function () {
        let requestOptions = buildRequestOption('POST', '/unMute', new Date().toUTCString());
        let self = this;
        http.request(requestOptions, function() {
            self.emit(':tell', 'Resumed Volume'); 
        }).end();
    },
    'SetVolumeIntent': function () {
        let requestOptions = buildRequestOption('POST', '/setVolume', new Date().toUTCString());
        let body = {};
        let volumeToSet = this.event.request.intent.slots.VolumeNumber.value;
        console.log('Volume: ' + volumeToSet);
        body.volume = volumeToSet;
        let self = this;
        let req = http.request(requestOptions, function() {
            self.emit(':tell', 'Volume set to ' + volumeToSet);
        });
        req.write(JSON.stringify(body));
        req.end();
    },
	'SetVolumeShortIntent': function() {
        let requestOptions = buildRequestOption('POST', '/controlVolume', new Date().toUTCString());
        let body = {};
		body.volumeControlDirection = this.event.request.intent.slots.VolumeControlDirection.value;
		body.volumeControl = this.event.request.intent.slots.VolumeControl.value;
		if (body.volumeControl === '?') {
			body.volumeControl = '4';
		}
		console.log('volume control is: ' + body.volumeControlDirection + ' ' + body.volumeControl);
		let self = this;
		let responseUtterance = '';
		if (!body.volumeControlDirection && !body.volumeControl) {
			responseUtterance = 'Please specify volume change step and direction.';
		} else if (!body.volumeControlDirection) {
			responseUtterance = 'Please specify volume change direction.';
		} else if (!body.volumeControl) {
			responseUtterance = 'Please specify volume change step.';
		} else {
			responseUtterance = 'Volume ';
			if (body.volumeControlDirection.toLowerCase() === 'up' ||
						body.volumeControlDirection.toLowerCase() === 'down') {
				responseUtterance += body.volumeControlDirection + ' by ';
				responseUtterance += body.volumeControl;
			} else {
				responseUtterance = 'Volume control direction should be up or down';
			}
		}
        let req = http.request(requestOptions, function() {
            self.emit(':tell', responseUtterance);
        });
        req.write(JSON.stringify(body));
        req.end();
	},
    'OpenAppIntent': function () {
        let appToOpen = this.event.request.intent.slots.AppName.value.toLowerCase();
        let requestOptions = {};
        if (appToOpen === 'youtube') {
            requestOptions = buildRequestOption('POST', '/launchYoutube', new Date().toUTCString());
        } else if (appToOpen === 'amazon instant video') {
            requestOptions = buildRequestOption('POST', '/launchAmazonInstantVideo', new Date().toUTCString());
        } else {
            this.emit(':tell', 'not supported');
        }
        let self = this;
        http.request(requestOptions, function() {
            self.emit(':tell', 'App opened.');
        }).end();
    },
    'PlaybackIntent': function () {
        let controlOperation = this.event.request.intent.slots.Function.value.toLowerCase();
        let requestOptions = {};
        if (controlOperation === 'play') {
            requestOptions = buildRequestOption('POST', '/play', new Date().toUTCString());
        } else if (controlOperation === 'pause') {
            requestOptions = buildRequestOption('POST', '/pause', new Date().toUTCString());
        } else if (controlOperation === 'stop') {
            requestOptions = buildRequestOption('POST', '/stop', new Date().toUTCString());
        } else {
            this.emit(':tell', 'not supported');
        }

        let self = this;
        http.request(requestOptions, function() {
            self.emit(':tell', controlOperation + ' done.');
        }).end();        
    },
    'SwitchInputIntent': function () {
        let requestOptions = buildRequestOption('POST', '/switchToHDMI_1', new Date().toUTCString());
        let self = this;
        http.request(requestOptions, function() {
            self.emit(':tell', 'Switched to HDMI');
        }).end();
    },
    'CursorIntent': function () {
        let intentValue = this.event.request.intent.slots.Direction.value;
        let direction = intentValue ? intentValue.toLowerCase() : '';
        let requestOptions = {};
        let replyMessage = '';
		console.log('Direction is ' + direction);
        if (direction === 'back') {
            requestOptions = buildRequestOption('POST', '/goBack', new Date().toUTCString());
            replyMessage = 'Gone Back';
        } else if (direction === 'up') {
            requestOptions = buildRequestOption('POST', '/moveUp', new Date().toUTCString());
            replyMessage = 'Moved Up';
        } else if (direction === 'down') {
            requestOptions = buildRequestOption('POST', '/moveDown', new Date().toUTCString());
            replyMessage = 'Moved Down';
        } else if (direction === 'left') {
            requestOptions = buildRequestOption('POST', '/moveLeft', new Date().toUTCString());
            replyMessage = 'Moved Left';
        } else if (direction === 'right') {
            requestOptions = buildRequestOption('POST', '/moveRight', new Date().toUTCString());
            replyMessage = 'Moved Right';
        } else {
            requestOptions = buildRequestOption('POST', '/select', new Date().toUTCString());
            replyMessage = 'Selected.';
        }
        let self = this;
        http.request(requestOptions, function() {
            self.emit(':tell', replyMessage);
        }).end();
    },
    'PlayNextIntent': function () {
        let requestOptions = buildRequestOption('POST', '/playNext', new Date().toUTCString());
        let self = this;
        http.request(requestOptions, function() {
            self.emit(':tell', 'Next played.');
        }).end();
    },
    'PassBeginningIntent': function () {
        let requestOptions = buildRequestOption('POST', '/passBeginning', new Date().toUTCString());
        let self = this;
        http.request(requestOptions, function() {
            self.emit(':tell', 'Beginning passed.'); 
        }).end();
    },
    'PlayProgressControlIntent': function () {
        let requestOptions = buildRequestOption('POST', '/playProgressControl', new Date().toUTCString());
		let body = {};
		body.playProgressControlDirection = this.event.request.intent.slots.playControlDirection.value;
		body.playProgressControlStep = this.event.request.intent.slots.playControlStep.value;
		// Add this hack to workaround when Alexa cannot identify number 4
		if (body.playProgressControlStep === '?') {
			body.playProgressControlStep = '4';
		}
		let self = this;
		let isForward = body.playProgressControlDirection === 'move' || body.playProgressControlDirection === 'forward';
		let respondMessage = isForward ? 'forwarded' : 'rewinded';
		respondMessage += ' by ' + body.playProgressControlStep; 
        let req = http.request(requestOptions, function() {
            self.emit(':tell', respondMessage);
        });
        req.write(JSON.stringify(body));
        req.end();
    },
    'SayHello': function () {
        this.emit(':tell', 'Hello World!');
    }
};
