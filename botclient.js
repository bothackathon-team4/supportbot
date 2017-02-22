var Swagger = require('swagger-client');
var open = require('open');
var rp = require('request-promise');

const DIRECTLINE_SECRET = process.env.MICROSOFT_DIRECTLINE_SECRET;
const DIRECTLINE_CLIENT = process.env.MICROSOFT_DIRECTLINE_CLIENT;
const DIRECTLINE_SPEC_URL = 'https://docs.botframework.com/en-us/restapi/directline3/swagger.json';

var directLineClient = rp(DIRECTLINE_SPEC_URL)
    .then((spec) =>
        // client
        new Swagger(
            {
                spec: JSON.parse(spec.trim()),
                usePromise: true
            }))
    .then((client) => {
        // add authorization header to client
        client.clientAuthorizations.add('AuthorizationBotConnector', new Swagger.ApiKeyAuthorization('Authorization', 'Bearer ' + DIRECTLINE_SECRET, 'header'));
        return client;
    })
    .catch((err) =>
        console.error('Error initializing DirectLine client', err));

exports.startConversation = (dialogFunc) => {
  // once the client is ready, create a new conversation
  directLineClient.then((client) => {
      client.Conversations.Conversations_StartConversation()                          // create conversation
          .then((response) => response.obj.conversationId)                            // obtain id
          .then(dialogFunc);
  });
}

exports.sendActivity = (conversationId, input) => {
  directLineClient.then((client) => {
    client.Conversations.Conversations_PostActivity({
        conversationId: conversationId,
        activity: {
            textFormat: 'plain',
            text: input,
            type: 'message',
            from: {
                id: DIRECTLINE_CLIENT,
                name: DIRECTLINE_CLIENT
            }
        }
      }).catch((err) => console.error('Error sending message:', err));
    });
}

var watermark = null

exports.pollActivities = (conversationId, action) => {
  directLineClient.then((client) => {
    //console.log("using watermark: " + watermark);
    client.Conversations.Conversations_GetActivities({ conversationId: conversationId, watermark: watermark })
              .then((response) => {
                  watermark = response.obj.watermark;                                 // use watermark so subsequent requests skip old messages
                  //console.log("got new watermark: " + watermark);
                  return response.obj.activities;
              })
              .then((activities) => {
                if (activities && activities.length) {
                    // ignore own messages
                    activities = activities.filter((m) => m.from.id !== DIRECTLINE_CLIENT);

                    console.log(activities);
                    if (activities.length) {
                        // call action on last activity
                        action(activities[activities.length - 1]);
                    }
                }
              });
            });
}

exports.printMessage = (activity) => {
    console.log("printMessage")
    if (activity.text) {
        console.log(activity.text);
    }
}
