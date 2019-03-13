// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

const { ActivityTypes, TurnContext } = require('botbuilder');
var rp = require('request-promise');

var reference;
class MyBot {
    // /**
    //      *
    //      * @param {BotState} botState A BotState object used to store information for the bot independent of user or conversation.
    //      * @param {BotAdapter} adapter A BotAdapter used to send and receive messages.
    //      */
    //     constructor(botState, adapter) {
    //         this.botState = botState;
    //         this.adapter = adapter;
    
    //         this.jobsList = this.botState.createProperty(JOBS_LIST);
    //     }
   
   
   
    /**
     *
     * @param {TurnContext} on turn context object.
     */
    async onTurn(turnContext) {
       
        // console.log(turnContext.activity.type);
        // reference = TurnContext.getConversationReference(turnContext.activity);
        // See https://aka.ms/about-bot-activity-message to learn more about the message and other activity types.
        if (turnContext.activity.type === ActivityTypes.Message) {
            
            var test_sentiment = 0.267;
            var test_json = {
                'sentiment': test_sentiment,
                'tones':{'joy': [0.2, 0.3], 'fear': [0.2], 'sadness': [0.4, 0.1], 'anger': [], 'confident': [], 'tentative': [],  'analytical': []}
            }
            var json_group_emotion = {
                'sentiment': [0.3, 0.4, 0.8, 0.6],
                'tones': [10, 0, 2, 3, 6, 3, 7],
                'turns': 15
            }
            let image_rp_params = {
                method : 'POST',
                uri : "http://127.0.0.1:80/api/getimage",
                body: json_group_emotion,
                json: true
            };
            var test_body;
            function get_image() {
                return rp(image_rp_params)
                .then(function (parsedBody){
                // console.log(parsedBody);
                test_body = parsedBody;
                })
                .catch(function (err) {
                    throw err;
                });
            }
            await get_image();
            var test_image = {
                "type": "message",
                "text": "Sending you back the image...",
                "attachments": [
                    {
                        "contentType": "image/png",
                        "contentUrl": test_body, //"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAASwAAADICAYAAABS39xVAAAABmJLR0QA/wD/AP+gvaeTAAACy0lEQVR4nO3cMQ7DMAwEQSrIvw2/3ClSpE0nLTDzgqsWrLhmZmaeazjEuncvgFO9dg8A+JdgARmCBWQIFpAhWECGYAEZggVkCBaQIVhAhmABGYIFZAgWkCFYQIZgARmCBWQIFpAhWECGYAEZggVkCBaQIVhAhmABGYIFZAgWkCFYQIZgARmCBWQIFpAhWECGYAEZggVkCBaQIVhAhmABGYIFZAgWkCFYQIZgARmCBWQIFpAhWECGYAEZggVkCBaQIVhAhmABGYIFZAgWkCFYQIZgARmCBWQIFpAhWECGYAEZggVkCBaQIVhAhmABGYIFZAgWkCFYQIZgARmCBWQIFpAhWECGYAEZggVkCBaQIVhAhmABGYIFZAgWkCFYQIZgARmCBWQIFpAhWECGYAEZggVkCBaQIVhAhmABGYIFZAgWkCFYQIZgARmCBWQIFpAhWECGYAEZggVkCBaQIVhAhmABGYIFZAgWkCFYQIZgARmCBWQIFpAhWECGYAEZggVkCBaQIVhAhmABGYIFZAgWkCFYQIZgARmCBWQIFpAhWECGYAEZggVkCBaQIVhAhmABGYIFZAgWkCFYQIZgARmCBWQIFpAhWECGYAEZggVkCBaQIVhAhmABGYIFZAgWkCFYQIZgARmCBWQIFpAhWECGYAEZggVkvHcPgNM9M9fuDXy5sIAMwQIyBAvIECwgQ7CADMECMgQLyBAsIEOwgAzBAjIEC8gQLCBDsIAMwQIyBAvIECwgQ7CADMECMgQLyPDT/USPH+LHWHPvnsCPCwvIECwgQ7CADMECMgQLyBAsIEOwgAzBAjIEC8gQLCBDsIAMwQIyBAvIECwgQ7CADMECMgQLyBAsIEOwgAzBAjIEC8gQLCBDsIAMwQIyBAvIECwgQ7CADMECMgQLyBAsIEOwgAzBAjIEC8gQLCBDsIAMwQIyBAvIECwgQ7CAjA+JWgcS+58wIAAAAABJRU5ErkJggg==",//optimizedSVGDataURI, // canvas.toDataURL(),//"https://studyabroad.ust.hk/files/1VV_8833.jpg", //optimizedSVGDataURI, //
                        "name": "test_sentiment_summary.jpg"
                    }
                ]
            }
            await turnContext.sendActivity(test_image);




        } else {
            /// await turnContext.sendActivity(`[${ turnContext.activity.type } event detected]`);
        }
    }
}

module.exports.MyBot = MyBot;
