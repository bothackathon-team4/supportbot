var builder = require('botbuilder');
var calling = require('botbuilder-calling');
var restify = require('restify');

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
    callbackUrl: 'https://da0b3a6e.ngrok.io/api/calls',
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
   session.send('Chat...');
});

//=========================================================
// Calling Dialogs
//=========================================================

// Add root dialog
callingBot.dialog('/', [
  function (session) {
      calling.Prompts.choice(session, "Which department? Press 1 for support, 2 for billing, 3 for claims, or star to return to previous menu.", [
          { name: 'support', dtmfVariation: '1', speechVariation: ['support', 'customer service'] },
          { name: 'billing', dtmfVariation: '2', speechVariation: ['billing'] },
          { name: 'claims', dtmfVariation: '3', speechVariation: ['claims'] },
          { name: '(back)', dtmfVariation: '*', speechVariation: ['back', 'previous'] }
      ]);
  },
  function (session, results) {
      if (results.response !== '(back)') {
          session.beginDialog('/' + results.response.entity + 'Menu');
      } else {
          session.endDialog();
      }
  },
  function (session) {
      // Loop menu
      session.replaceDialog('/');
  }
]);

callingBot.dialog('/claimsMenu', function (session) {
    session.send("You selected claims.");
})

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
