//var builder = require('botbuilder');
var calling = require('botbuilder-calling');
var restify = require('restify');
var speechService = require('./bingspeech.js');
var streamify = require('streamify');

//=========================================================
// Bot Setup
//=========================================================

// Setup Restify Server
var server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function () {
   console.log('%s listening to %s', server.name, server.url);
});

// Create chat bot
//var chatConnector = new builder.ChatConnector({
//    appId: process.env.MICROSOFT_APP_ID,
//    appPassword: process.env.MICROSOFT_APP_PASSWORD
//});
var callConnector = new calling.CallConnector({
    callbackUrl: 'https://da0b3a6e.ngrok.io/api/calls',
    appId: process.env.MICROSOFT_APP_ID,
    appPassword: process.env.MICROSOFT_APP_PASSWORD
});

var callingBot = new calling.UniversalCallBot(callConnector);
//var chatBot = new builder.UniversalBot(chatConnector);
//server.post('/api/messages', chatConnector.listen());
server.post('/api/calls', callConnector.listen());

//=========================================================
// Chat Dialogs
//=========================================================

//chatBot.dialog('/', function (session) {
//   session.send('Chat...');
//});

//=========================================================
// Calling Dialogs
//=========================================================

// Add root dialog
callingBot.dialog('/', [
  function (session) {
    calling.Prompts.record(session, "Please leave a message after the beep.", {
      recordingFormat: 'wav',
      playBeep: false,
      maxSilenceTimeoutInSeconds: 3
    });
  },
  function (session, result) {
    //console.log(result.response);
    //called...{ recordedAudio: <Buffer 52 ... >, lengthOfRecordingInSecs: 7.2459999999999996 }

    console.log("got result");

    // FIXME: convert buffer to stream in a sane way
    var fs = require('fs');
    fs.writeFile("/tmp/braindead.wav", result.response.recordedAudio, function(err) {
      if(err) {
        return console.log(err);
      }
    });
    var stream = fs.createReadStream("/tmp/braindead.wav")

    speechService.getTextFromAudioStream(stream).then(text => {
      console.log(text);
    }).catch(error => {
      console.log(error);
    })
  }
]);

/*
var intents = new builder.IntentDialog();
bot.dialog('/', intents);

intents.matches(/^change name/i, [
    function (session) {
        session.beginDialog('/profile');
    },
    function (session, results) {
        session.send('Ok... Changed your name to %s', session.userData.name);
    }
]);

intents.onDefault([
    function (session, args, next) {
        if (!session.userData.name) {
            session.beginDialog('/profile');
        } else {
            next();
        }
    },
    function (session, results) {
        session.send('Hello %s!', session.userData.name);
    }
]);

bot.dialog('/profile', [
    function (session) {
        builder.Prompts.text(session, 'Hi! What is your name?');
    },
    function (session, results) {
        session.userData.name = results.response;
        session.endDialog();
    }
])
*/;
