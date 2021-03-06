// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
// document.write("<script type='text/javascript' src='jquery.min.js'></script>");
const { ActivityTypes } = require('botbuilder');
var request = require('request');
let http = require ('http');
var fs = require('fs');
var rp = require('request-promise');
var ToneAnalyzerV3 = require('watson-developer-cloud/tone-analyzer/v3');

var toneAnalyzer = new ToneAnalyzerV3({
  version: '2019-02-18',
  iam_apikey: 'your apikey', // put your ibm tone analyzer api key here
  url: 'https://gateway-tok.watsonplatform.net/tone-analyzer/api'
});

let accessKey = 'your accessKey'; // put your microsoft text analytics key here
let url = "https://southeastasia.api.cognitive.microsoft.com/text/analytics/v2.0/sentiment"

// Mongodb server srv connection string
const MongoClient = require('mongodb').MongoClient;
const mongodb_uri = "mongodb+srv://..."; // Your mongodb url;


var time_interval = 30;
var start_time;

var overall_sentiment = []; // average sentiment during a period of time
var all_sentiment = []; // store all the sentiment of the conversation
var all_timestamp = []; // store the timestamp of all messages
var overall_tone = [];
//{'joy': [], 'fear': [], 'sadness': [], 'anger': [], 'confident': [], 'tentative': [],  'analytical': []}; //Tones series during a period of time
var all_tone = [];
var mark_start = mark_end = 0;
var mark_negative_start = 0;
var last_send_negative_time = 0;
var tones_label = ['joy', 'sadness', 'anger', 'fear', 'confident', 'analytical', 'tentative'];
var all_message_count = 0;
var per_message_count = 0;
var history_message_count = [];
var history_sentiment = []; // Track sentiment at each time step
var T1 = 90; // Note: T1 is the time interval for current group emotion
var T2 = 25; // T2 is the time for pause.

// var dialogues_reason_pool = ['Stuck with some items?', 'Challenging task, isn\'t it?', 'Seems that finding the best solution is not that easy.', 'Hard to reach agreement?'];
var dialogues_reason_pool = ['Sorry to interrupt you, but I feel like the group is down for a while.', 'No offence but just a remind, the chat is about to be negative.'];
var dialogues_regulation_pool = ['The task is meant to thought-provoking.', 'It is important to keep a healthy discussion going.', 'I am sure that the group will work it out.', 'Keep an open mind and keep moving forward.']; //, ['You all have provided useful information that helps build the big picture. Has the group visited all possibilities?', 'Each of you contributes good thoughts, maybe the group can summarize all the pros and cons for a better comparison.', 'Your perspectives are all valid and they matter. This is a consensus-building process.', 'It is a good start with everything the group has shared so far. Perhaps think outside the box and be adventurous.']];
var desert_suggestions_pool = ['You all have provided useful information that helps build the big picture. Compromise has to be made for the whole team\'s survival.', 'Your perspectives are all valid and they matter. This is a consensus-building process.', 'Your initial discussions have laid the groundwork. Keep the end goal in mind.', 'Your perspectives are all valid and they matter. This is a consensus-building process.'];
var creativity_pool = ['It is a good start with everything the group has shared so far. Perhaps think outside the box and be adventurous.', 'Each of you contributes good thoughts, maybe the group can summarize all the pros and cons for a better comparison.', 'Keep the ideas flowing and stay constructive.'];
var debate_pool = ['It is a heated discussion. Everyone has a point but it is also important to know where you stand.', 'The key to a convincing argument is to make other people feel comfortable enough to change their position.', 'Honor the experience, but question the conclusion.'];
var introduction_dilalogue = 'Hi, GremoBot here! :grinning: I\'m the bot to monitor the group emotion in this channel, and will remind you if I sense potential negative feelings here. :grinning: Enjoy the group chat now!';
var task_flag = false;
var is_first_task = true;
var task_count = 0;
var task_mode = 'with'; // or 'without'
var task_name = '';
var dialogues_suggestion_pool = [];
const client = new MongoClient(mongodb_uri, { useNewUrlParser: true });
class MyBot {
    /**
     *
     * @param {TurnContext} on turn context object.
     */
    async onTurn(turnContext) {
        
        if (turnContext.activity.type === ActivityTypes.Message) {
            //test
            // await turnContext.sendActivity(':grinning: Hi')
            var text = `${turnContext.activity.text}`;
            var collection_name = `${turnContext.activity.conversation.name}`;
            var date = new Date();
            var timestamp = date.getTime();// turnContext.activity.timestamp; // the sending time of the message
            console.log(timestamp);
            if (text.search(/local test/i) > -1) { 
                console.log('We are testing');
                var json_group_emotion = {
                    'sentiment': [0.2, 0.4, 0.6],
                    'tones': [1,2,3,4,5,6,7],
                    'turns': 15
                }
                let image_rp_params = {
                    method : 'POST',
                    uri : "http://127.0.0.1:80/api/getimage", // The url to your image drawing local server for testing. 
                    body: json_group_emotion,
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
                var GremoBot_dialogue = 'Hey, we can do better!';
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
                await turnContext.sendActivity(vis_emotion);
            return [0,0,0,0];
            }

            // Check if it is setting the time interval T1
            // The command should has "set time interval t1" and contains the number to indicate the seconds, e.g., "120s".
            if (text.search(/set time interval/i) > -1) { 
                console.log('We are setting the time interval for showing the current result.');
                console.log('Before setting, time interval: ' + T1);
                T1 = text.match(/\d+/);
                console.log('After setting, time interval: ' + T1);
                return [0, 0, 0,0];
            }
            
            if (text.search(/fill your background information/i) > -1) { 
                // await turnContext.sendActivity(introduction_dilalogue);
                return [0, 0, 0,0];
            }
            // Check if it is setting the time interval T1
            // The command should has "set time interval t1" and contains the number to indicate the seconds, e.g., "120s".
            if (text.search(/set pause/i) > -1) { 
                console.log('We are setting the time interval for pause');
                console.log('Before setting, time interval: ' + T2);
                T2 = text.match(/\d+/);
                console.log('After setting, time interval: ' + T2);
                return [0, 0, 0,0];
            }

            // collection_name = 'group_1_keep_going';
            
            if (text.search(/start desert survival task/i) > -1) {
                // var group_num = collection_name.match(/\d+/g).map(Number)[0]
                task_name = 'desert_survival';
                task_flag = true;
                T2 = 31;
                task_count += 1;
                dialogues_suggestion_pool = desert_suggestions_pool;
                console.log(`Start the ${task_name} task, start processing text messages.`);
                if (is_first_task) {
                    await turnContext.sendActivity(introduction_dilalogue);
                    is_first_task = false;
                }
                if (task_count == 3) {
                    task_count = 0;
                    is_first_task = true;
                }
                return [0, 0, 0, 0];
            }
            if (text.search(/start creativity task/i) > -1) {
                // var group_num = collection_name.match(/\d+/g).map(Number)[0]
                task_name = 'creativity';
                task_flag = true;
                T2 = 43;
                task_count += 1;
                dialogues_suggestion_pool = creativity_pool;
                console.log(`Start the ${task_name} task, start processing text messages.`);
                if (is_first_task) {
                    await turnContext.sendActivity(introduction_dilalogue);
                    is_first_task = false;
                }
                if (task_count == 3) {
                    task_count = 0;
                    is_first_task = true;
                }
                return [0, 0, 0, 0];
            }
            if (text.search(/start debate task/i) > -1) {
                // var group_num = collection_name.match(/\d+/g).map(Number)[0]
                task_name = 'debate';
                task_flag = true;
                T2 = 30
                task_count += 1;
                dialogues_suggestion_pool = debate_pool;
                console.log(`Start the ${task_name} task, start processing text messages.`);
                if (is_first_task) {
                    await turnContext.sendActivity(introduction_dilalogue);
                    is_first_task = false;
                }
                if (task_count == 3) {
                    task_count = 0;
                    is_first_task = true;
                }
                return [0, 0, 0, 0];
            }
            

            if (task_flag) {
                
                // Check if it is the end of the task. If yes, reset the sum_sentiment data.
                // The command should has "end the task".
                if (text.search(/I am ending the task/i) > -1) { 
                    console.log('We are ending the task...');
                    var task_data = {
                        'group_sentiment': all_sentiment,
                        'period_sentiment': history_sentiment,
                        'group_tone': all_tone,
                        'turns': history_message_count,
                        'task': task_name
                    }
                    client.connect(err => {
                        const collection = client.db("real").collection(collection_name);
                        console.log('Uploading data.');
                        collection.insertOne(task_data).then(function(r){
                            // client.close();    
                        });
                    });
                    if (text.search(/reset/i) > -1) {
                        task_count = 0;
                        is_first_task = true;
                    }

                    overall_sentiment = []; 
                    all_sentiment = [];
                    history_sentiment = [];
                    history_message_count = []; // reset the data
                    overall_tone = [];
                    all_tone = [];
                    all_timestamp = [];
                    mark_negative_start = 0;
                    mark_start = 0;
                    mark_end = 0;
                    last_send_negative_time = 0;
                    console.log('Finish resetting.');
                    task_flag = false;
                    return [0, 0, 0, 0];
                }
 
                      
                // Return tone results
                function sleep_for_tone(utterance) {
                    return new Promise(function (resolve, reject) {
                        var res = {};
                        toneAnalyzer.tone({'text': utterance}, function(err,res) {
                            if (err)
                                reject(err);
                            else
                                resolve(res);
                        });
                    });
                }
                // Process returned tone results
                var tones = []; // Tones in each message   
                var tones_vector = [0, 0, 0, 0, 0, 0, 0]; 
                await sleep_for_tone(text)
                .then(function (results) {
                    tones = results.document_tone.tones;
                    var num_tone = tones.length;
                    for (var i = 0; i < tones_label.length; i++) {
                        for (var j = 0; j < num_tone; j ++) {
                            if (tones_label[i] == tones[j].tone_id) tones_vector[i] = 1;
                        }
                    }
                    console.log(tones);
                    console.log(tones_vector);
                    all_tone.push(tones_vector);  // tones up to now
                })
                .catch(function (err) {
                    throw err;
                });

                // Return sentiment results
                let rp_params = {
                    method : 'POST',
                    uri : url,
                    headers : { 'Ocp-Apim-Subscription-Key' : accessKey,},
                    body: { 'documents': [ { 'id': '1', 'language': 'en', 'text': text },]},
                    json: true
                };
                var sentiment = 0.5; // Variable for sentiment score
                function sleep() {
                    return rp(rp_params)
                    .then(function (parsedBody){
                        sentiment = parsedBody.documents[0].score;
                        console.log('Turn sentiment: ' + sentiment);
                        all_sentiment.push(sentiment); // sentiments up to now
                    })
                    .catch(function (err) {
                        throw err;
                    });
                }
                await sleep(); 
                // const client = new MongoClient(mongodb_uri, { useNewUrlParser: true });
                var upload_data = {
                    'text': text,
                    'timestamp': turnContext.activity.timestamp,
                    'localTimestamp': turnContext.activity.localTimestamp,
                    'conversationId': turnContext.activity.conversation.id,
                    'conversationName': turnContext.activity.conversation.name,
                    'channelId': turnContext.activity.channelId,
                    'channelData': turnContext.activity.channelData,
                    'fromId': turnContext.activity.from.id,
                    'fromName': turnContext.activity.from.name,
                    'task': task_name
                };
                client.connect(err => {
                    const collection = client.db("real").collection(collection_name);
                    // perform actions on the collection object
                    upload_data['tone'] = tones;
                    upload_data['tones_vector'] = tones_vector;
                    upload_data['sentiment'] = sentiment; 
                    collection.insertOne(upload_data).then(function(r){
                        console.log('Successful upload');
                        // client.close();
                    });
                });
                

                // Get sentiments and tones in last T1
                all_timestamp.push(timestamp);
                var last_T1; // For locating the furthest message in last T1
                for (var i = 0; i < all_timestamp.length; i++) {
                    last_T1 = i;
                    if (timestamp - all_timestamp[i] < (T1 * 1000)) break;
                }
                overall_sentiment = all_sentiment.slice(last_T1); 
                overall_tone = all_tone.slice(last_T1);
                console

                // Calculate current sentiment and tones (in last T1)
                let sum_sentiment = overall_sentiment.reduce((previous, current) => current += previous);
                let current_sentiment = (sum_sentiment / overall_sentiment.length); 
                var current_tones_vector = [0, 0, 0, 0, 0, 0, 0];                
                for (var i = 0; i < overall_tone.length; i++) {
                    for (var j = 0; j < tones_label.length; j++) {
                        current_tones_vector[j] += overall_tone[i][j];
                    }
                }
                
                // Calculate history sentiment, where T1 is the interval, the current point is the average sentiment in last T1
                
                console.log('Check if the history sentiment is correct');
                if (history_sentiment.length == 0) history_sentiment.push(current_sentiment);
                else {history_sentiment.pop(); history_sentiment.push(current_sentiment);}

                mark_end = all_timestamp.length - 1;
                if (all_timestamp[mark_end] - all_timestamp[mark_start] < (T1 * 1000)) {}
                else {
                    console.log(mark_start);
                    console.log(mark_end);
                    let tmp_sentiment = all_sentiment.slice(mark_start, mark_end);
                    let tmp_sum_sentiment = tmp_sentiment.reduce((previous, current) => current += previous);
                    let tmp_ave_sentiment = (tmp_sum_sentiment / tmp_sentiment.length);
                    history_sentiment.pop();
                    history_sentiment.push(tmp_ave_sentiment);
                    history_sentiment.push(current_sentiment);
                    mark_start = mark_end;
                }
                var interval_to_lastT1;
                if (history_sentiment.length == 0) interval_to_lastT1 = 0;
                else interval_to_lastT1 = (all_timestamp[mark_end] - all_timestamp[mark_start]) / 1000;
                var json_group_emotion = {
                    'sentiment': history_sentiment,
                    'tones': current_tones_vector,
                    'turns': overall_tone.length,
                    'T1': T1,
                    'interval_to_lastT1': interval_to_lastT1,
                    'user': turnContext.activity.from.name,
                    'message': text,
                    'time': turnContext.activity.timestamp,
                    'group_name': collection_name,
                    'task': task_name
                }
                console.log('Current json_group_emotion');
                console.log(json_group_emotion);

            
                var threshold_neg = 0.33;
                var threshold_pos = 0.66;
                var m = 10;
                var n = 3;
                var recen_neg_count = 0;
                var negative_flag = false;
                if (all_sentiment.length - mark_negative_start == m) mark_negative_start++;
                for (var i = mark_start; i < all_sentiment.length; i++) {
                    if (all_sentiment[i] < threshold_neg) recen_neg_count++;
                }
                if (recen_neg_count >= n) {
                    negative_flag = true;
                    mark_negative_start = all_sentiment.length;
                }                

                if ( (current_sentiment < threshold_neg) || negative_flag) {
                    var send_negative = false;
                    if (last_send_negative_time == 0) {
                        last_send_negative_time = timestamp;
                        send_negative = true;
                    }
                    else if (timestamp - last_send_negative_time > (T1 * 1000 / 2)) {
                        send_negative = true;
                        last_send_negative_time = timestamp;
                    }
                    if (send_negative){
                        let image_rp_params = {
                            method : 'POST',
                            uri : "http://47.75.124.98:80/api/getimage", // The url to your image drawing online server for retrieving real-time visual feedback. 
                            body: json_group_emotion,
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

                            // var dialogues_reason_pool = ['Stuck with some items?', 'Challenging task, isn\'t it?', 'Seems that finding the best solution is not that easy.', 'Hard to reach agreement?'];
                            // var dialogues_regulation_pool = [['The task is meant to thought-provoking.', 'It is important to keep a healthy discussion going.', 'I am sure that the group will work it out.', 'Keep an open mind and keep moving forward.'], ['You all have provided useful information that helps build the big picture. Has the group visited all possibilities?', 'Each of you contributes good thoughts, maybe the group can summarize all the pros and cons for a better comparison.', 'Your perspectives are all valid and they matter. This is a consensus-building process.', 'It is a good start with everything the group has shared so far. Perhaps think outside the box and be adventurous.']];
                    
                        var random_1 = Math.floor(Math.random() * dialogues_reason_pool.length);
                        var random_2 = Math.floor(Math.random() * dialogues_regulation_pool.length);
                        var random_3 = Math.floor(Math.random() * dialogues_suggestion_pool.length);
                        var dialogue_reason = dialogues_reason_pool[random_1];
                        var emoji = [':muscle: '];
                        var random_emoji = Math.floor(Math.random() * emoji.length);
                        var dialogues_regulation = emoji[random_emoji] + dialogues_regulation_pool[random_2];
                        var dialogue_suggestion = 'Tip :point_right: ' + dialogues_suggestion_pool[random_3];
                        
                        // Should design different dialogue for different conditions here.
                        // var GremoBot_dialogue = 'Hey, we can do better!';
                        var vis_emotion = {
                            "type": "message",
                            "text": dialogues_regulation,
                            "attachments": [
                                {
                                    "contentType": "image/png",
                                    "contentUrl": png_url, 
                                    "name": "Group emotion summary"
                                }
                            ]
                        }
                        await turnContext.sendActivity(vis_emotion);
                        // await turnContext.sendActivity(dialogues_regulation);
                        await turnContext.sendActivity(dialogue_suggestion);
                        return [0, 0, 0, 0];
                    }
                }
                if (task_flag)  return [task_flag, T2, json_group_emotion, 1];
                // else if (task_mode == 'without') return [task_flag, T2, json_group_emotion, 0];
                else return [0, 0, 0, 0];
               
            }
            return [0, 0, 0, 0];


        } else {
            return [0,0,0,0];
            //await turnContext.sendActivity(`[${ turnContext.activity.type } event detected]`);
        }
        
    }
}

module.exports.MyBot = MyBot;
