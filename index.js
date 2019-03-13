// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

const dotenv = require('dotenv');
const path = require('path');
const restify = require('restify');
var rp = require('request-promise');
// Import required bot services.
// See https://aka.ms/bot-services to learn more about the different parts of a bot.
const { BotFrameworkAdapter, TurnContext } = require('botbuilder');

// Import required bot configuration.
const { BotConfiguration } = require('botframework-config');

// This bot's main dialog.
const { MyBot } = require('./bot');

// Read botFilePath and botFileSecret from .env file
// Note: Ensure you have a .env file and include botFilePath and botFileSecret.
const ENV_FILE = path.join(__dirname, '.env');
dotenv.config({ path: ENV_FILE });

// bot endpoint name as defined in .bot file
// See https://aka.ms/about-bot-file to learn more about .bot file its use and bot configuration.
const DEV_ENVIRONMENT = 'development';

// bot name as defined in .bot file
// See https://aka.ms/about-bot-file to learn more about .bot file its use and bot configuration.
const BOT_CONFIGURATION = (process.env.NODE_ENV || DEV_ENVIRONMENT);

// Create HTTP server
const server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, () => {
    console.log(`\n${ server.name } listening to ${ server.url }`);
    console.log(`\nGet Bot Framework Emulator: https://aka.ms/botframework-emulator`);
    console.log(`\nTo talk to your bot, open HKUSTHCIBot1.bot file in the Emulator`);
});

// .bot file path
const BOT_FILE = path.join(__dirname, (process.env.botFilePath || ''));

// Read bot configuration from .bot file.
let botConfig;
try {
    botConfig = BotConfiguration.loadSync(BOT_FILE, process.env.botFileSecret);
} catch (err) {
    console.error(`\nError reading bot file. Please ensure you have valid botFilePath and botFileSecret set for your environment.`);
    console.error(`\n - The botFileSecret is available under appsettings for your Azure Bot Service bot.`);
    console.error(`\n - If you are running this bot locally, consider adding a .env file with botFilePath and botFileSecret.`);
    console.error(`\n - See https://aka.ms/about-bot-file to learn more about .bot file its use and bot configuration.\n\n`);
    process.exit();
}

// Get bot endpoint configuration by service name
const endpointConfig = botConfig.findServiceByNameOrId(BOT_CONFIGURATION);

// Create adapter.
// See https://aka.ms/about-bot-adapter to learn more about .bot file its use and bot configuration.
const adapter = new BotFrameworkAdapter({
    appId: endpointConfig.appId || process.env.microsoftAppID,
    appPassword: endpointConfig.appPassword || process.env.microsoftAppPassword
});

// Catch-all for errors.
adapter.onTurnError = async (context, error) => {
    // This check writes out errors to console log .vs. app insights.
    console.error(`\n [onTurnError]: ${ error }`);
    // Send a message to the user
    await context.sendActivity(`Oops. Something went wrong!`);
};


var listenFlag = true;
var timeout = null;
var onTurn_return;
var timeout_interval = 5000;
var reference;
function listen5min(timeout_interval, current_emotion){
    return setTimeout(async function(){
        if(listenFlag){
            //send message
            console.log('1111')
            adapter.continueConversation(reference, async (proactiveTurnContext) => {
                // Notify the user that the job is complete.
                let image_rp_params = {
                    method : 'POST',
                    uri : "http://47.75.124.98:80/api/getimage",
                    body: current_emotion,
                    json: true
                };
    
                var png_base64;
                function get_image() {
                    return rp(image_rp_params)
                    .then(function (parsedBody){
                    // console.log(parsedBody);
                        png_base64 = parsedBody;
                    })
                    .catch(function (err) {
                        throw err;
                    });
                }
                await get_image();
                var GremoBot_dialogue = 'Seems like the chat is inactive for a while, here is the summary of recent group emotion.';
                var vis_emotion = {
                    "type": "message",
                    "text": GremoBot_dialogue,
                    "attachments": [
                        {
                            "contentType": "image/png",
                            "contentUrl": png_base64, //"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAASwAAADICAYAAABS39xVAAAABmJLR0QA/wD/AP+gvaeTAAACy0lEQVR4nO3cMQ7DMAwEQSrIvw2/3ClSpE0nLTDzgqsWrLhmZmaeazjEuncvgFO9dg8A+JdgARmCBWQIFpAhWECGYAEZggVkCBaQIVhAhmABGYIFZAgWkCFYQIZgARmCBWQIFpAhWECGYAEZggVkCBaQIVhAhmABGYIFZAgWkCFYQIZgARmCBWQIFpAhWECGYAEZggVkCBaQIVhAhmABGYIFZAgWkCFYQIZgARmCBWQIFpAhWECGYAEZggVkCBaQIVhAhmABGYIFZAgWkCFYQIZgARmCBWQIFpAhWECGYAEZggVkCBaQIVhAhmABGYIFZAgWkCFYQIZgARmCBWQIFpAhWECGYAEZggVkCBaQIVhAhmABGYIFZAgWkCFYQIZgARmCBWQIFpAhWECGYAEZggVkCBaQIVhAhmABGYIFZAgWkCFYQIZgARmCBWQIFpAhWECGYAEZggVkCBaQIVhAhmABGYIFZAgWkCFYQIZgARmCBWQIFpAhWECGYAEZggVkCBaQIVhAhmABGYIFZAgWkCFYQIZgARmCBWQIFpAhWECGYAEZggVkCBaQIVhAhmABGYIFZAgWkCFYQIZgARmCBWQIFpAhWECGYAEZggVkCBaQIVhAhmABGYIFZAgWkCFYQIZgARmCBWQIFpAhWECGYAEZggVkvHcPgNM9M9fuDXy5sIAMwQIyBAvIECwgQ7CADMECMgQLyBAsIEOwgAzBAjIEC8gQLCBDsIAMwQIyBAvIECwgQ7CADMECMgQLyPDT/USPH+LHWHPvnsCPCwvIECwgQ7CADMECMgQLyBAsIEOwgAzBAjIEC8gQLCBDsIAMwQIyBAvIECwgQ7CADMECMgQLyBAsIEOwgAzBAjIEC8gQLCBDsIAMwQIyBAvIECwgQ7CADMECMgQLyBAsIEOwgAzBAjIEC8gQLCBDsIAMwQIyBAvIECwgQ7CAjA+JWgcS+58wIAAAAABJRU5ErkJggg==",//optimizedSVGDataURI, // canvas.toDataURL(),//"https://studyabroad.ust.hk/files/1VV_8833.jpg", //optimizedSVGDataURI, //
                            "name": "Group emotion summary"
                        }
                    ]
                }
                await proactiveTurnContext.sendActivity(vis_emotion);
            });
        }
    }, timeout_interval)
}



// Create the main dialog.
const myBot = new MyBot();

// Listen for incoming requests.
server.post('/api/messages', (req, res) => {
    adapter.processActivity(req, res, async (context) => {
        // Route to main dialog.
        onTurn_return = await myBot.onTurn(context);
        var taskFlag = onTurn_return[0];
        timeout_interval = onTurn_return[1]  * 1000;
        var current_emotion = onTurn_return[2];
        listenFlag = true;
        try{
            clearTimeout(timeout)
        }catch(e){
        }
        if (taskFlag == true) {
            reference = TurnContext.getConversationReference(context.activity);
            timeout = listen5min(timeout_interval, current_emotion);
        }
    });
});
