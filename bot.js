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
  iam_apikey: '_bBPYi_371EQWmW2m1Gn_HMSf9zkUawx0hlAXU35yMgn',
  url: 'https://gateway-tok.watsonplatform.net/tone-analyzer/api'
});

let accessKey = 'b02685e71305418e8c4b5d1f655bd617';
let url = "https://southeastasia.api.cognitive.microsoft.com/text/analytics/v2.0/sentiment"

// Mongodb server srv connection string
const MongoClient = require('mongodb').MongoClient;
const mongodb_uri = "mongodb+srv://Harry:peng19950822@hkusthcicscw2019-phhot.azure.mongodb.net/test?retryWrites=true";
const client = new MongoClient(mongodb_uri, { useNewUrlParser: true });

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
var T1 = 15; // Note: T1 is the time interval for current group emotion
var T2 = 10; // T2 is the time for pause.

var task_flag = false;
var task_mode = 'with'; // or 'without'
class MyBot {
    /**
     *
     * @param {TurnContext} on turn context object.
     */
    async onTurn(turnContext) {
        
        if (turnContext.activity.type === ActivityTypes.Message) {
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
                    uri : "http://47.75.124.98:80/api/getimage",
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
            return [0,0,0];
            }

            // Check if it is setting the time interval T1
            // The command should has "set time interval t1" and contains the number to indicate the seconds, e.g., "120s".
            if (text.search(/set time interval/i) > -1) { 
                console.log('We are setting the time interval for showing the current result.');
                console.log('Before setting, time interval: ' + T1);
                T1 = text.match(/\d+/);
                console.log('After setting, time interval: ' + T1);
                return [0, 0, 0];
            }

            // Check if it is setting the time interval T1
            // The command should has "set time interval t1" and contains the number to indicate the seconds, e.g., "120s".
            if (text.search(/set pause/i) > -1) { 
                console.log('We are setting the time interval for pause');
                console.log('Before setting, time interval: ' + T2);
                T2 = text.match(/\d+/);
                console.log('After setting, time interval: ' + T2);
                return [0, 0, 0];
            }

            collection_name = 'group_1';
            // The command format is: "start task 2."
            if (text.search(/start task/i) > -1) {
                var group_num = collection_name.match(/\d+/g).map(Number)[0]
                var task_num = text.match(/\d+/g).map(Number)[0];
                if (group_num % 2 == 1) {
                    if (task_num == 1) task_mode = 'with';
                    else task_mode = 'without';
                }
                else {
                    if (task_num == 1) task_mode = 'without';
                    else task_mode = 'with';
                }
                task_flag = true;
                console.log('Start the task, start processing text messages.');
                return [0, 0, 0];
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
                        'turns': history_message_count
                    }
                    client.connect(err => {
                    const collection = client.db("test").collection(collection_name);
                    console.log('Uploading data.');
                    collection.insertOne(task_data).then(function(r){
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
                        // overall_tone = {'joy': [], 'fear': [], 'sadness': [], 'anger': [], 'confident': [], 'tentative': [],  'analytical': []};
                        // all_tone = {'joy': [], 'fear': [], 'sadness': [], 'anger': [], 'confident': [], 'tentative': [],  'analytical': []};
                        // all_message_count = 0;
                        // per_message_count = 0;
                        console.log('Finish resetting.');
                        });
                    });
                    task_flag = false;
                    return [0, 0, 0];
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
                await sleep_for_tone(text)
                .then(function (results) {
                    tones = results.document_tone.tones;
                    var num_tone = tones.length;
                    var tones_vector = [0, 0, 0, 0, 0, 0, 0]; 
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

                var upload_data = {
                    'text': text,
                    'timestamp': turnContext.activity.timestamp,
                    'localTimestamp': turnContext.activity.localTimestamp,
                    'conversationId': turnContext.activity.conversation.id,
                    'converstaionName': turnContext.activity.conversation.name,
                    'channelId': turnContext.activity.channelId,
                    'channelData': turnContext.activity.channelData,
                    'fromId': turnContext.activity.from.id,
                    'fromName': turnContext.activity.from.name,
                    'task_num': task_num
                };
                client.connect(err => {
                    const collection = client.db("test").collection(collection_name);
                    // perform actions on the collection object
                    upload_data['tone'] = tones;
                    upload_data['sentiment'] = sentiment; 
                    collection.insertOne(upload_data).then(function(r){
                        console.log('Successful upload');
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
                    'time': turnContext.activity.timestamp
                }
                console.log('Current json_group_emotion');
                console.log(json_group_emotion);

                if (task_mode == 'with') {
                    var threshold_neg = 0.33;
                    var threshold_pos = 0.66;
                    var m = 10;
                    var n = 5;
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
                                uri : "http://47.75.124.98:80/api/getimage",
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

                            // Should design different dialogue for different conditions here.
                            var GremoBot_dialogue = 'Hey, we can do better!';
                            var vis_emotion = {
                                "type": "message",
                                "text": GremoBot_dialogue,
                                "attachments": [
                                    {
                                        "contentType": "image/png",
                                        "contentUrl": 'data:image/jpeg;base64,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';//png_base64, 
                                        "name": "Group emotion summary"
                                    }
                                ]
                            }
                            await turnContext.sendActivity('Ha,ha,ha');
                            await turnContext.sendActivity(vis_emotion);
                            return [0, 0, 0];
                        }
                    }
                }
                else return [0, 0, 0];
                if (task_mode = 'with')  return [task_flag, T2, json_group_emotion];
                else return [0, 0, 0];
               
            }
            return [0, 0, 0];
            //     // while (true) {
            //     //     if (mark_end == all_timestamp.length) {
            //     //         console.log('For last interval in latest T1');
            //     //         console.log(mark_start);
            //     //         console.log(mark_end);
            //     //         // let tmp_sentiment = overall_sentiment.slice(mark_start, mark_end);
            //     //         // let tmp_sum_sentiment = tmp_sentiment.reduce((previous, current) => current += previous);
            //     //         // let tmp_ave_sentiment = (tmp_sum_sentiment / tmp_sentiment.length);
                        
            //     //         history_sentiment.push(current_sentiment);
            //     //         break;
            //     //     }
            //     //     if (all_timestamp[mark_end] - all_timestamp[mark_start] < (T1 * 1000)){
            //     //         mark_end ++;
            //     //         continue;
            //     //     }
            //     //     console.log('For one interval T1');
            //     //     console.log(mark_start);
            //     //     console.log(mark_end);
            //     //     let tmp_sentiment = overall_sentiment.slice(mark_start, mark_end);
            //     //     let tmp_sum_sentiment = tmp_sentiment.reduce((previous, current) => current += previous);
            //     //     let tmp_ave_sentiment = (tmp_sum_sentiment / tmp_sentiment.length);
            //     //     if (history_sentiment.length > 0) history_sentiment.pop();
            //     //     history_sentiment.push(tmp_ave_sentiment);
            //     //     mark_start = mark_end;
            //     // }

                

            //     // Every T1, store the data
            //     if (date.getTime() - start_time > (T1 * 1000)) {
            //         console.log(`Process group emotion in the past ${time_interval}s.`);
            //         // var positive_sentiment_per = 0, neutral_sentiment_per = 0, negative_sentiment_per = 0, positive_sentiment_sum = 0, negative_sentiment_sum = 0, neutral_sentiment_sum = 0;
            //         // for (var i = 0; i < overall_sentiment.length; i++) {
            //         //     if (i < 0.35) negative_sentiment_per++;
            //         //     else if (i > 0.65) positive_sentiment_per++;
            //         //     else neutral_sentiment_per++;
            //         // }
            //         // for (var i = 0; i < all_sentiment.length; i++) {
            //         //     if (i < 0.35) negative_sentiment_sum++;
            //         //     else if (i > 0.65) positive_sentiment_sum++;
            //         //     else neutral_sentiment_sum++;
            //         // }
            //         // var sum_joy = overall_tone.joy.reduce((previous, current) => current += previous),
            //         //     sum_fear = overall_tone.fear.reduce((previous, current) => current += previous),
            //         //     sum_sadness = overall_tone.sadness.reduce((previous, current) => current += previous),
            //         //     sum_anger = overall_tone.anger.reduce((previous, current) => current += previous),
            //         //     sum_analytical = overall_tone.analytical.reduce((previous, current) => current += previous),
            //         //     sum_tentative = overall_tone.tentative.reduce((previous, current) => current += previous),
            //         //     sum_confident = overall_tone.confident.reduce((previous, current) => current += previous);

            //         var joy_per = overall_tone.joy.length, sadness_per = overall_tone.sadness.length, tentative_per = overall_tone.tentative.length,
            //             anger_per = overall_tone.anger.length, fear_per = overall_tone.fear.length, confident_per = overall_tone.confident.length, 
            //             analytical_per = overall_tone.analytical.length;
            //         // var joy_sum_num = all_tone.joy.length, sadness_sum_num = all_tone.sadness.length, tentative_sum_num = all_tone.tentative.length,
            //         //     anger_sum_num = all_tone.anger.length, fear_sum_num = all_tone.fear.length, confident_sum_num = all_tone.confident.length, 
            //         //     analytical_sum_num = all_tone.analytical.length;           
            //         // // Calculate the average tones.
            //         // var average_joy = -1, average_fear = -1, average_sadness = -1, average_anger = -1, average_analytical = -1, average_tentative = -1, average_confident = -1;
            //         // if (analytical_per > 0) {
            //         //     var sum_analytical = overall_tone.analytical.reduce((previous, current) => current += previous);
            //         //     average_analytical = (sum_analytical / analytical_per).toFixed(3);
            //         // }
            //         // if (anger_per > 0) {
            //         //     var sum_anger = overall_tone.anger.reduce((previous, current) => current += previous);
            //         //     average_anger = (sum_anger / anger_per).toFixed(3);
            //         // }
            //         // if (confident_per > 0) {
            //         //     var sum_confident = overall_tone.confident.reduce((previous, current) => current += previous);
            //         //     average_confident = (sum_confident / confident_per).toFixed(3);
            //         // }
            //         // if (fear_per > 0) {
            //         //     var sum_fear = overall_tone.fear.reduce((previous, current) => current += previous);
            //         //     average_fear = (sum_fear / fear_per).toFixed(3);
            //         // }
            //         // if (joy_per > 0) {
            //         //     var sum_joy = overall_tone.joy.reduce((previous, current) => current += previous);
            //         //     average_joy = (sum_joy / joy_per).toFixed(3);
            //         // }
            //         // if (sadness_per > 0) {
            //         //     var sum_sadness = overall_tone.sadness.reduce((previous, current) => current += previous);
            //         //     average_sadness = (sum_sadness / sadness_per).toFixed(3);
            //         // }
            //         // if (tentative_per > 0) {
            //         //     var sum_tentative = overall_tone.tentative.reduce((previous, current) => current += previous);
            //         //     average_tentative = (sum_tentative / tentative_per).toFixed(3);
            //         // }
                    
            //         history_sentiment.push(average_sentiment);
            //         history_message_count.push(per_message_count);

            //         var group_emotion_num = `Estimated group emotion in the past ${time_interval}s, in number \n`
            //             // + `Positive sentiment: ${positive_sentiment_per} \n`
            //             // + `Neutral sentiment: ${neutral_sentiment_per} \n`
            //             // + `Negative sentiment: ${negative_sentiment_per} \n`
            //             + `Sentiment: ${average_sentiment} \n`
            //             + `Joy: ${joy_per} \n`
            //             + `Sadness: ${sadness_per} \n`
            //             + `Tentative: ${tentative_per} \n`
            //             + `Anger: ${anger_per} \n`
            //             + `Fear: ${fear_per} \n`
            //             + `Confident: ${confident_per} \n`
            //             + `Analytical: ${analytical_per}`;
            //         console.log(group_emotion_num);
        
            //         // var group_emotion = `Estimated group emotion in the past ${time_interval}s, in score or likelihood \n`
            //         //                     + `Sentiment: ${average_sentiment} \n`
            //         //                     + `Joy: ${average_joy} \n`
            //         //                     + `Sadness: ${average_sadness} \n`
            //         //                     + `Tentative: ${average_tentative} \n`
            //         //                     + `Anger: ${average_anger} \n`
            //         //                     + `Fear: ${average_fear} \n`
            //         //                     + `Confident: ${average_confident} \n`
            //         //                     + `Analytical: ${average_analytical}`;
            //         // console.log(group_emotion);
            //         var json_group_emotion = {
            //             'sentiment': history_sentiment,
            //             'tones': [joy_per, sadness_per, anger_per, fear_per, confident_per, analytical_per, tentative_per],
            //             'turns': per_message_count
            //         }
                    
            //         let image_rp_params = {
            //             method : 'POST',
            //             uri : "http://47.75.124.98:80/api/getimage",
            //             body: json_group_emotion,
            //             json: true
            //         };
        
            //         var png_base64;
            //         function get_image() {
            //             return rp(image_rp_params)
            //             .then(function (parsedBody){
            //             // console.log(parsedBody);
            //                 png_base64 = parsedBody;
            //             })
            //             .catch(function (err) {
            //                 throw err;
            //             });
            //         }
            //         if (task_mode == 'with') {
            //             await get_image();
            //             var GremoBot_dialogue = 'Hey, we can do better!';
            //             var vis_emotion = {
            //                 "type": "message",
            //                 "text": GremoBot_dialogue,
            //                 "attachments": [
            //                     {
            //                         "contentType": "image/png",
            //                         "contentUrl": png_base64, //"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAASwAAADICAYAAABS39xVAAAABmJLR0QA/wD/AP+gvaeTAAACy0lEQVR4nO3cMQ7DMAwEQSrIvw2/3ClSpE0nLTDzgqsWrLhmZmaeazjEuncvgFO9dg8A+JdgARmCBWQIFpAhWECGYAEZggVkCBaQIVhAhmABGYIFZAgWkCFYQIZgARmCBWQIFpAhWECGYAEZggVkCBaQIVhAhmABGYIFZAgWkCFYQIZgARmCBWQIFpAhWECGYAEZggVkCBaQIVhAhmABGYIFZAgWkCFYQIZgARmCBWQIFpAhWECGYAEZggVkCBaQIVhAhmABGYIFZAgWkCFYQIZgARmCBWQIFpAhWECGYAEZggVkCBaQIVhAhmABGYIFZAgWkCFYQIZgARmCBWQIFpAhWECGYAEZggVkCBaQIVhAhmABGYIFZAgWkCFYQIZgARmCBWQIFpAhWECGYAEZggVkCBaQIVhAhmABGYIFZAgWkCFYQIZgARmCBWQIFpAhWECGYAEZggVkCBaQIVhAhmABGYIFZAgWkCFYQIZgARmCBWQIFpAhWECGYAEZggVkCBaQIVhAhmABGYIFZAgWkCFYQIZgARmCBWQIFpAhWECGYAEZggVkCBaQIVhAhmABGYIFZAgWkCFYQIZgARmCBWQIFpAhWECGYAEZggVkCBaQIVhAhmABGYIFZAgWkCFYQIZgARmCBWQIFpAhWECGYAEZggVkvHcPgNM9M9fuDXy5sIAMwQIyBAvIECwgQ7CADMECMgQLyBAsIEOwgAzBAjIEC8gQLCBDsIAMwQIyBAvIECwgQ7CADMECMgQLyPDT/USPH+LHWHPvnsCPCwvIECwgQ7CADMECMgQLyBAsIEOwgAzBAjIEC8gQLCBDsIAMwQIyBAvIECwgQ7CADMECMgQLyBAsIEOwgAzBAjIEC8gQLCBDsIAMwQIyBAvIECwgQ7CADMECMgQLyBAsIEOwgAzBAjIEC8gQLCBDsIAMwQIyBAvIECwgQ7CAjA+JWgcS+58wIAAAAABJRU5ErkJggg==",//optimizedSVGDataURI, // canvas.toDataURL(),//"https://studyabroad.ust.hk/files/1VV_8833.jpg", //optimizedSVGDataURI, //
            //                         "name": "Group emotion summary"
            //                     }
            //                 ]
            //             }
            //             await turnContext.sendActivity(vis_emotion);
            //         }

            //         // await turnContext.sendActivity(group_emotion_num + '\n' + group_emotion);
            //         // await turnContext.sendActivity(group_emotion_num);
            //         // await turnContext.sendActivity(group_emotion);
            //         start_time = date.getTime();
            //         per_message_count = 0;
            //         overall_sentiment = [];
            //         overall_tone = {'joy': [], 'fear': [], 'sadness': [], 'anger': [], 'confident': [], 'tentative': [],  'analytical': []};
            //         console.log('Stored average data is cleared again.');
            //     }

            //     // Code for send back messages immediately.
            //     // await turnContext.sendActivity(`Analysis for member "${current_speaker}":  \n`
            //     //                                 + `Sentiment: ${c.toFixed(3)} \n` 
            //     //                                 + `${current_tone}`
            //     //                                 + `\n I can monitor the text sentiment and tones!`);
            //     // console.log(`你刚刚说的话的sentiment score为 ${c.toFixed(3)}`) // log some information if send successfully.

        


        } else {
            return [0,0,0];
            //await turnContext.sendActivity(`[${ turnContext.activity.type } event detected]`);
        }
        
    }
}

module.exports.MyBot = MyBot;
