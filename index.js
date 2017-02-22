var builder = require('botbuilder');
var calling = require('botbuilder-calling');
var restify = require('restify');
var speechService = require('./bingspeech.js');
var botclient = require('./botclient.js');
var synchronize = require('synchronize');

//=========================================================
// Bot Setup
//=========================================================

// Setup Restify Server
var server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function () {
   console.log('%s listening to %s', server.name, server.url);
});

// Create chat bot
var chatConnector = new builder.ChatConnector({
    appId: process.env.MICROSOFT_APP_ID,
    appPassword: process.env.MICROSOFT_APP_PASSWORD
});
var callConnector = new calling.CallConnector({
    callbackUrl: process.env.CALLBACK_URL,
    appId: process.env.MICROSOFT_APP_ID,
    appPassword: process.env.MICROSOFT_APP_PASSWORD
});

var callingBot = new calling.UniversalCallBot(callConnector);
var chatBot = new builder.UniversalBot(chatConnector);
server.post('/api/messages', chatConnector.listen());
server.post('/api/calls', callConnector.listen());

//=========================================================
// Chat Dialogs
//=========================================================

chatBot.dialog('/', function (session) {
  console.log("sending chat message");
  session.send('Chat...');
});

//=========================================================
// Calling Dialogs
//=========================================================

// dirty hack (we are not stateless anymore! we need to save the conversationId
// in the session - but this doesn't work right now...)
var conversationIdGlobal = null
var question = null
var watermark = null

// Add root dialog
callingBot.dialog('/', [
  function (session) {
    question = "Hello, please tell us your name and id."
    botclient.startConversation((conversationId) => {
      console.log("started converstion " + conversationId)
      conversationIdGlobal = conversationId
    });
    session.beginDialog("mainLoop")
  }
]);

callingBot.dialog("mainLoop", [
  function (session) {
    console.log("prompting user: " + question);
    calling.Prompts.record(session, question, {
      recordingFormat: 'wav',
      playBeep: false,
      maxSilenceTimeoutInSeconds: 1
    });
  },
  function (session, result) {
    //console.log(result.response);
    //called...{ recordedAudio: <Buffer 52 ... >, lengthOfRecordingInSecs: 7.2459999999999996 }

    console.log("conversationId read: " + conversationIdGlobal);
    conversationId = conversationIdGlobal

    console.log("received user response (audio)");

    // FIXME: convert buffer to stream in a sane way
    var fs = require('fs');
    fs.writeFile("/tmp/braindead.wav", result.response.recordedAudio, function(err) {
      if(err) {
        return console.log(err);
      }
    });
    var stream = fs.createReadStream("/tmp/braindead.wav")

    speechService.getTextFromAudioStream(stream).then(text => {
      console.log("received text: " + text);

      botclient.sendActivity(conversationId, text);
      console.log("text was sent to chat bot - waiting for reply");

      setTimeout(() => {
        console.log("polling activities");

        botclient.pollActivities(conversationId, (activity) => {
          console.log("got activity: " + activity.text);
          question = activity.text
        }, watermark)
      }, 5000);
    }).catch(error => {
      console.log(error);
    })
  },
  function (session) {
    session.replaceDialog("mainLoop")
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
