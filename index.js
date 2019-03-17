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
    // await context.sendActivity(`Oops. Something went wrong!`);
};


var listenFlag = true;
var timeout = null;
var onTurn_return;
var timeout_interval = 5000;
var reference;

var dialogues_reason_pool = ['Umm...seems like the chat is inactive for a while.', 'Uh...feels like it\'s been quite for a few seconds.'];
var dialogues_regulation_positive_pool = ['The group has been making nice progress in the past few minutes.', 'Seems that the group discussion has been quite smooth so far.', 'Good to see the group\'s confidence is building up.', 'Glad that the group is taking an analytical approach to the problem.', 'I find the discussions valuable and enjoyable.'];
// var dialogues_regulation_attention_pool = ['How big is the candiate pool right now? Remember that the group needs to eventually narrow it down to five items.', 'Have the group covered every item in the list so far?', 'How many items have been filtered out? Perhaps the group can make a fresh start with the remaining ones.', 'Just a reminder that the group needs to come to a final decision within 20 minutes.'];
var desert_pool = ['How big is the candiate pool right now? Remember that the group needs to eventually narrow it down to five items.', 'How big is the candiate pool right now? Remember that the group needs to eventually narrow it down to five items.', 'Just a reminder that the ranking of the selected items is also very critical.'];
var creativity_pool = ['Feel free to share any idea, however small. The group can refine it together.', 'Have no new idea? May try extending the existing ones.', 'Don\'t forget to check the budget. Efficient spending is important.', 'Just a reminder that the group needs to come up with at least eight ideas.'];
var debate_pool = ['Try to express your opinions, as silience cannot help you win the debate.', 'Be bold and cast doubt, if any, upon the previous statements.', 'Whose turn is this? Make sure that you address previous questions raised about your point, if any.', 'Try to provide a clear evidence of your point.'];
function argMax(array) {
    return array.map((x, i) => [x, i]).reduce((r, a) => (a[0] > r[0] ? a : r))[1];
  }

function listen5min(timeout_interval, current_emotion, taskMode){
    return setTimeout(async function(){
        if(listenFlag){
            //send message
            adapter.continueConversation(reference, async (proactiveTurnContext) => {
                // Notify the user that the job is complete.
                let image_rp_params = {
                    method : 'POST',
                    uri : "http://47.75.124.98:80/api/getimage",
                    body: current_emotion,
                    json: true
                };
    
                var png_url;
                function get_image() {
                    return rp(image_rp_params)
                    .then(function (parsedBody){
                    // console.log(parsedBody);
                        png_url = parsedBody;
                    })
                    .catch(function (err) {
                        throw err;
                    });
                }
                await get_image();

                if (taskMode == 1) {
                    var random_1 = Math.floor(Math.random() * dialogues_reason_pool.length);
                    var dialogues_reason = ':thinking_face: ' + dialogues_reason_pool[random_1];
                    

                    var dialogues_regulation_attention_pool = [];
                    if (current_emotion['task'] == 'desert_survival') dialogues_regulation_attention_pool = desert_pool;
                    else if (current_emotion['task'] == 'creativity') dialogues_regulation_attention_pool = creativity_pool;
                    else if (current_emotion['task'] == 'debate') dialogues_regulation_attention_pool = debate_pool;

                    var current_positive_pool = [];
                    if (current_emotion['sentiment'][current_emotion['sentiment'].length - 1] > 0.66) current_positive_pool.push(dialogues_regulation_positive_pool[0]);
                    else if (current_emotion['sentiment'][current_emotion['sentiment'].length - 1] > 0.35) current_positive_pool.push(dialogues_regulation_positive_pool[1]);

                    var tones = current_emotion['tones'];
                    var p = [tones[4], tones[5], tones[0]];
                    if (p[0] > p[1]) {
                        if (p[0] > p[2]) current_positive_pool.push(dialogues_regulation_positive_pool[2]);
                        else if (p[0] < p[2]) current_positive_pool.push(dialogues_regulation_positive_pool[4]);
                        else {current_positive_pool.push(dialogues_regulation_positive_pool[2]); current_positive_pool.push(dialogues_regulation_positive_pool[4]);}
                    }
                    else if (p[0] < p[1]){
                        if (p[1] > p[2]) current_positive_pool.push(dialogues_regulation_positive_pool[3]);
                        else if (p[1] < p[2]) current_positive_pool.push(dialogues_regulation_positive_pool[4]);
                        else {current_positive_pool.push(dialogues_regulation_positive_pool[3]); current_positive_pool.push(dialogues_regulation_positive_pool[4]);}
                    }
                    else {
                        if (p[0] > p[2]) {current_positive_pool.push(dialogues_regulation_positive_pool[2]); current_positive_pool.push(dialogues_regulation_positive_pool[3]);}
                        else if (p[0] < p[2]) current_positive_pool.push(dialogues_regulation_positive_pool[4]);
                        else {current_positive_pool.push(dialogues_regulation_positive_pool[2]); current_positive_pool.push(dialogues_regulation_positive_pool[3]); current_positive_pool.push(dialogues_regulation_positive_pool[4])}
                    }
                    var dialogues_regulation_positive = '';
                    if (current_positive_pool.length > 0) {
                        var random_2 = Math.floor(Math.random() * current_positive_pool.length);
                        dialogues_regulation_positive = current_positive_pool[random_2];
                    }

                    var random_3 = Math.floor(Math.random() * dialogues_regulation_attention_pool.length);
                    var dialogues_regulation_attention = dialogues_regulation_attention_pool[random_3];

                    var dialogues_regulation = dialogues_regulation_positive;
                    var dialogues_suggestion = 'Tip :point_right: ' + dialogues_regulation_attention;
                    // var GremoBot_dialogue = 'Seems like the chat is inactive for a while, here is the summary of recent group emotion.';
                    var vis_emotion = {
                        "type": "message",
                        "text": dialogues_reason,
                        "attachments": [
                            {
                                "contentType": "image/png",
                                "contentUrl": png_url, //"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAASwAAADICAYAAABS39xVAAAABmJLR0QA/wD/AP+gvaeTAAACy0lEQVR4nO3cMQ7DMAwEQSrIvw2/3ClSpE0nLTDzgqsWrLhmZmaeazjEuncvgFO9dg8A+JdgARmCBWQIFpAhWECGYAEZggVkCBaQIVhAhmABGYIFZAgWkCFYQIZgARmCBWQIFpAhWECGYAEZggVkCBaQIVhAhmABGYIFZAgWkCFYQIZgARmCBWQIFpAhWECGYAEZggVkCBaQIVhAhmABGYIFZAgWkCFYQIZgARmCBWQIFpAhWECGYAEZggVkCBaQIVhAhmABGYIFZAgWkCFYQIZgARmCBWQIFpAhWECGYAEZggVkCBaQIVhAhmABGYIFZAgWkCFYQIZgARmCBWQIFpAhWECGYAEZggVkCBaQIVhAhmABGYIFZAgWkCFYQIZgARmCBWQIFpAhWECGYAEZggVkCBaQIVhAhmABGYIFZAgWkCFYQIZgARmCBWQIFpAhWECGYAEZggVkCBaQIVhAhmABGYIFZAgWkCFYQIZgARmCBWQIFpAhWECGYAEZggVkCBaQIVhAhmABGYIFZAgWkCFYQIZgARmCBWQIFpAhWECGYAEZggVkCBaQIVhAhmABGYIFZAgWkCFYQIZgARmCBWQIFpAhWECGYAEZggVkCBaQIVhAhmABGYIFZAgWkCFYQIZgARmCBWQIFpAhWECGYAEZggVkvHcPgNM9M9fuDXy5sIAMwQIyBAvIECwgQ7CADMECMgQLyBAsIEOwgAzBAjIEC8gQLCBDsIAMwQIyBAvIECwgQ7CADMECMgQLyPDT/USPH+LHWHPvnsCPCwvIECwgQ7CADMECMgQLyBAsIEOwgAzBAjIEC8gQLCBDsIAMwQIyBAvIECwgQ7CADMECMgQLyBAsIEOwgAzBAjIEC8gQLCBDsIAMwQIyBAvIECwgQ7CADMECMgQLyBAsIEOwgAzBAjIEC8gQLCBDsIAMwQIyBAvIECwgQ7CAjA+JWgcS+58wIAAAAABJRU5ErkJggg==",//optimizedSVGDataURI, // canvas.toDataURL(),//"https://studyabroad.ust.hk/files/1VV_8833.jpg", //optimizedSVGDataURI, //
                                "name": "Group emotion summary"
                            }
                        ]
                    }
                    console.log(png_url);
                    await proactiveTurnContext.sendActivity(vis_emotion);
                    // await proactiveTurnContext.sendActivity(dialogues_regulation);
                    await proactiveTurnContext.sendActivity(dialogues_suggestion);
                }
                else {
                    console.log('Nothing happen');
                }
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
        var taskMode = onTurn_return[3];
        listenFlag = true;
        try{
            clearTimeout(timeout)
        }catch(e){
        }
        if (taskFlag == true) {
            reference = TurnContext.getConversationReference(context.activity);
            timeout = listen5min(timeout_interval, current_emotion, taskMode);
        }
    });
});
