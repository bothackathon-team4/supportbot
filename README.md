Support Calling Bot
===================

A simple bot using Microsoft's Calling Bot API for Skype. It translates human speech to text and sends the text to a chat bot. The response of the chat bot is read to the user.

Preparation
-----------

1. Create a bot on https://dev.botframework.com and get the API ID and secret.
2. Add a "direct line" channel to the chat bot that should be used
3. Create a Speech API key and secret at https://www.microsoft.com/cognitive-services/en-us/speech-api

Installation
------------

    git clone https://github.com/hojerst/supportbot
    cd supportbot
    npm install

Configuration
--------------

    export MICROSOFT_APP_SECRET=<api secret>
    export MICROSOFT_APP_ID=<app id>
    export MICROSOFT_SPEECH_API_key=<speech api key>
    export MICROSOFT_DIRECTLINE_CLIENT=<directline client name>
    export MICROSOFT_DIRECTLINE_SECRET=<directline secret>

Running
-------

    npm start
