const express = require('express');
const bodyParser = require('body-parser');
const router = express.Router();
var Canvas = require('canvas');
var canvas = Canvas.createCanvas(1500, 700);
var ctx = canvas.getContext('2d');
var fs = require('fs');



function getSum(total, num) { return total + num; }


var tone_category = ['Joy', 'Sadness', 'Anger', 'Fear', 'Confident', 'Analytical', 'Tentative'];
var test_tones = [10, 1, 2, 2, 3, 7, 3];
function draw_horizontal_bar (ctx, data, labels, position_x = 780, position_y = 10, split_interval = 30, pad = 20, barChartHeight = ctx.canvas.height - 20, barWidth = 63, max_bar_length = 600, unit = 'Percentage', total_num = 20) {
  var max_data = Math.max.apply(null, data);
  var sum_data = data.reduce(getSum);
  
  //ctx.fillStyle = 'rgba(0,0,255,0.5)'
  // ctx.strokeStyle = 'red';
  ctx.lineWidth = 1;
  var y;
  data.forEach(function (n, i) {
    if (i === 0) {
      ctx.fillStyle = '#FCD41B';
      // ctx.strokeStyle = 'rgba(255, 102, 102, 1)';
    }
    if (i === 1) {
      ctx.fillStyle = '#0D91E0';
      // ctx.strokeStyle = 'rgba(102, 102, 255, 1)';
    }
    if (i === 2) {
      ctx.fillStyle = '#C90870';
      // ctx.strokeStyle = 'rgba(139, 0, 0, 1)';
    }
    if (i === 3) {
      ctx.fillStyle = '#3B9613';
      // ctx.strokeStyle = 'rgba(32, 32, 32, 1)';
    }
    if (i === 4) {
      ctx.fillStyle = '#DCB79C';
      // ctx.strokeStyle = 'rgba(255, 0, 255, 1)';
    }
    if (i === 5) {
      ctx.fillStyle = '#59B7A5';
      // ctx.strokeStyle = 'rgba(0,128,255, 1)';
    }
    if (i === 6) {
      ctx.fillStyle = '#848484';
      // ctx.strokeStyle = 'rgba(153, 153, 0, 1)';
    }

    
    var x;
    if (i == 0) y = position_y;
    else if (i == 4) y = barWidth + y + split_interval;
    else y = barWidth + y ;
    if (unit == 'Percentage') x = max_bar_length * (n / total_num);
    else x = max_bar_length * (n / max_data);
    if (x == 0) x = 10;
    // ctx.lineTo(x, height - y)
    ctx.fillRect(position_x, y, x, barWidth - pad)
    ctx.fillStyle = 'rgba(50, 50, 50 , 1)';
    ctx.font="30px Arial";
    var text_width = ctx.measureText(labels[i]).width;
    // var text_height = ctx.measureText(labels[i]).actualBoundingBoxDescent;
    // console.log(text_height);
    // console.log(text_width);
    ctx.fillText(labels[i], position_x - text_width - 20, y + 0.45 * barWidth);
    // var txt = "joy";
    // console.log(ctx.measureText(txt));
  })
  ctx.stroke()
}

// draw normal coordinate.
function draw_coordinate(unit = 'Percentage', interval = 10, axis_x = true, axis_y = true, grid_x = true, grid_y = true, axis_x_position = 'down', origin_x = 777, origin_y = 450, x_len = 700, y_len = 470, dx = 50, dy = 60){
  // ctx.beginPath();
  ctx.setLineDash([]);
 
  if (axis_x) {
    ctx.lineWidth=3;
    ctx.strokeStyle='rgba(0, 0, 0, 0.5)'; 
    ctx.beginPath();
    if (axis_x_position == 'down') {
      ctx.moveTo(origin_x, origin_y);
      ctx.lineTo(origin_x + x_len, origin_y);
    }
    else if (axis_x_position == 'up') {
      ctx.moveTo(origin_x, origin_y - y_len);
      ctx.lineTo(origin_x + x_len, origin_y - y_len);
    }
    ctx.stroke(); 
  }

  // ctx.beginPath();
  //ctx.lineWidth="5";
  //ctx.strokeStyle='rgba(0, 0, 0, 1)'; 
  if (axis_y) {
    ctx.lineWidth=3;
    ctx.beginPath();
    ctx.moveTo(origin_x, origin_y);
    ctx.lineTo(origin_x, origin_y - y_len);
    ctx.strokeStyle='rgba(0, 0, 0, 0.5)'; 
    ctx.stroke(); 
  }
  
  // if (unit == 'Percentage' && axis_x && origin_y > 500) {
  //   ctx.fillStyle='rgba(0, 0, 0, 0.8)'; 
  //   ctx.font="30px Arial";
  //   var text_width = ctx.measureText(unit).width;
  //   if (axis_x_position == 'up') ctx.fillText(unit, ctx.canvas.width - text_width - 20, origin_y + 60);
  //   else if (axis_x_position == 'down') ctx.fillText(unit, ctx.canvas.width - text_width - 20, origin_y - y_len - 60);
  //   ctx.stroke();
  // }

  

  if (interval > 0) dx = x_len / interval;
  var unit_count = 0;
  var y = origin_y;
  var x = origin_x; 
  
  // ctx.fillStyle='rgba(192, 0, 0, 0.1)';
  while (x < origin_x + x_len) {
    x = x + dx;
    if (grid_x) {
      ctx.strokeStyle = 'rgba(100, 100, 100, 0.3)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, origin_y);
      ctx.lineTo(x, origin_y - y_len);
    }
    if (unit == 'Percentage' && axis_y && origin_y > 500) {
      ctx.fillStyle='rgba(0, 0, 0, 0.8)'; 
      ctx.font="30px Arial";
      unit_count = unit_count + 100 / interval;
      var interval_text = `${unit_count}` + '%';
      var text_width = ctx.measureText(interval_text).width;
      if (axis_x_position == 'up') ctx.fillText(interval_text, x - text_width / 2, origin_y + 30);    
      else if (axis_x_position == 'down') ctx.fillText(interval_text, x - text_width / 2, origin_y - y_len - 30);    
    }
    
    ctx.stroke();
  }
  while (y > origin_y - y_len + dy) {
    y = y - dy;
    if (grid_y) {
      ctx.strokeStyle = 'rgba(192, 192, 192, 0.1)';
      ctx.beginPath();
      ctx.moveTo(origin_x, y);
      ctx.lineTo(origin_x + x_len, y);
      ctx.stroke();
    }
  }
}


function draw_face (context, centerX, centerY, radius, eyeRadius, eyeXOffset, eyeYOffset, mouth_r, type = 'positive') {
  // var centerX = canvas.width / 2;
  // var centerY = canvas.height / 2;
  // var radius = 70;
  // var eyeRadius = 10;
  // var eyeXOffset = 25;
  // var eyeYOffset = 20;
  ctx.setLineDash([]);
  // draw the yellow circle
  context.beginPath();
  context.arc(centerX, centerY, radius, 0, 2 * Math.PI, false);
  context.fillStyle = 'rgba(252, 244, 11, 1)';
  context.fill();
  context.lineWidth = 5;
  context.strokeStyle = 'black';
  context.stroke();
    
  // draw the eyes
  context.beginPath();
  var eyeX = centerX - eyeXOffset;
  var eyeY = centerY - eyeXOffset;
  context.arc(eyeX, eyeY, eyeRadius, 0, 2 * Math.PI, false);
  var eyeX = centerX + eyeXOffset;
  context.arc(eyeX, eyeY, eyeRadius, 0, 2 * Math.PI, false);
  context.fillStyle = 'black';
  context.fill();
  // context.stroke();
  // draw the mouth
  context.beginPath();
  if (type == 'positive') context.arc(centerX, centerY, mouth_r, Math.PI * 0.1, Math.PI * 0.9, false);
  else if (type == 'neutral') {
    ctx.beginPath();
    ctx.moveTo(centerX - mouth_r * 2 / 3, centerY + mouth_r * 2 / 3);
    ctx.lineTo(centerX + mouth_r * 2 / 3, centerY + mouth_r * 2 / 3);
  }
  else if (type == 'negative') context.arc(centerX, centerY + mouth_r * 1.2, mouth_r, - Math.PI * 0.1, - Math.PI * 0.9, true);
  context.stroke();
}





function draw_bar (ctx, data, labels, position_x = 780, position_y = -10, pad = 35, width = 700, barWidth = 90, max_bar_length = 400) {
  var height = ctx.canvas.height
  var max_data = Math.max.apply(null, data);
  //ctx.fillStyle = 'rgba(0,0,255,0.5)'
  // ctx.strokeStyle = 'red';
  ctx.lineWidth = 2;
  data.forEach(function (n, i) {
    if (i === 0) {
      ctx.fillStyle = 'rgba(255, 102, 102, 0.5)';
      ctx.strokeStyle = 'rgba(255, 102, 102, 1)';
    }
    if (i === 1) {
      ctx.fillStyle = 'rgba(255, 0, 255,0.5)';
      ctx.strokeStyle = 'rgba(255, 0, 255, 1)';
    }
    if (i === 2) {
      ctx.fillStyle = 'rgba(0,128,255,0.5)';
      ctx.strokeStyle = 'rgba(0,128,255, 1)';
    }
    if (i === 3) {
      ctx.fillStyle = 'rgba(153, 153, 0,0.5)';
      ctx.strokeStyle = 'rgba(153, 153, 0, 1)';
    }
    if (i === 4) {
      ctx.fillStyle = 'rgba(102, 102, 255,0.5)';
      ctx.strokeStyle = 'rgba(102, 102, 255, 1)';
    }
    if (i === 5) {
      ctx.fillStyle = 'rgba(139, 0, 0 , 0.5)';
      ctx.strokeStyle = 'rgba(139, 0, 0, 1)';
    }
    if (i === 6) {
      ctx.fillStyle = 'rgba(32, 32, 32, 0.8)';
      ctx.strokeStyle = 'rgba(32, 32, 32, 1)';
    }
    var x = i * barWidth + position_x;
    var y = max_bar_length * (n / max_data)
    // ctx.lineTo(x, height - y)
    ctx.fillRect(x, height - 40, barWidth - pad, -y + position_y)
    ctx.fillStyle = 'rgba(0, 0, 0, 1)';
    ctx.font="20px Arial";
 
    ctx.fillText(labels[i], x, height - 15);
    // var txt = "joy";
    // console.log(ctx.measureText(txt));
  })
  ctx.stroke();
}

var sentiment_data = [0.2, 0.3, 0.7, 0.8, 0.65, 0.7, 0.3, 0.89];
function draw_sentiment(data, origin_x, origin_y, x_len, y_len, cur_pos_x, T1, interval_last_T1){
  var num_point = data.length;
  var point_size = 16;
  var cur_x = cur_pos_x; // for draw line at the end
  ctx.strokeStyle = "rgba(10, 10, 10, 0.8)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(origin_x, origin_y);
  ctx.lineTo(origin_x, origin_y - y_len);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(origin_x, origin_y);
  ctx.lineTo(origin_x + x_len, origin_y);
  ctx.stroke();

  
  var lingrad = ctx.createLinearGradient(origin_x,origin_y,origin_x,origin_y - y_len);
  lingrad.addColorStop(0, '#67001f');
  lingrad.addColorStop(0.33, '#d6604d');
  lingrad.addColorStop(0.33, '#f4a582');
  lingrad.addColorStop(0.66, '#BCB2A8');
  lingrad.addColorStop(0.66, '#4393c3');
  lingrad.addColorStop(1, '#053061');
  ctx.fillStyle = lingrad;


  // var lingrad = ctx.createLinearGradient(origin_x,origin_y,origin_x,origin_y - y_len);
  // lingrad.addColorStop(0, 'rgb(234, 23, 25, 0.3)');
  // lingrad.addColorStop(0.33, 'rgb(200, 153, 51, 0.3) ');
  // lingrad.addColorStop(0.33, 'rgb(229, 211, 49, 0.3)');
  // lingrad.addColorStop(0.66, 'rgb(255, 255, 204, 0.3)');
  // lingrad.addColorStop(0.66, 'rgb(199, 226, 57, 0.3)');
  // lingrad.addColorStop(1, 'rgb(75, 208, 39, 0.3)');
 
  // ctx.fillStyle = lingrad;
  // ctx.fillRect(origin_x, origin_y - y_len, x_len, y_len);

 
  // ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
  var cur_sen = data[num_point - 1];
  var y = origin_y - y_len * (cur_sen / 1);
  var cur_y = y; 
  //ctx.fillRect(cur_pos_x - point_size / 2, y - point_size / 2, point_size + 1, point_size + 1 );
  ctx.beginPath();
  ctx.arc(cur_pos_x, y, point_size, 0, Math.PI*2, true);
  ctx.fill();
  point_size = 10;
  if (num_point > 1) {
    var interval_len;
    if (interval_last_T1 == 0) interval_len = (cur_pos_x - origin_x) / ( num_point);
    else interval_len = (cur_pos_x - origin_x) / ( num_point - 1 + interval_last_T1 / T1); 
    console.log(Number(interval_last_T1) / Number(T1));
    var next_point = [cur_pos_x, y];
    console.log(interval_len);
    for (var i = num_point - 2; i >= 0; i--) {
      //ctx.fillStyle = 'rgba(50, 50, 50, 0.8)';
      cur_pos_x = (i + 1) * interval_len + origin_x; 
      y = origin_y - y_len * (data[i] / 1) ;
      console.log(cur_pos_x);
      console.log(y);
      //ctx.fillRect(cur_pos_x - point_size / 2, y - point_size / 2, point_size + 1, point_size + 1 );
      ctx.beginPath();
      ctx.arc(cur_pos_x, y, point_size, 0, Math.PI*2, true);
      ctx.fill();
      ctx.strokeStyle = lingrad; //lingrad; //
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.lineWidth = 2;
      
      ctx.moveTo(cur_pos_x, y);
      ctx.lineTo(next_point[0], next_point[1]);
      ctx.stroke();
      if (i == 1 || i == 0) {
        ctx.strokeStyle = "rgba(100, 100, 100, 1)";
        ctx.lineWidth = 1;
        ctx.setLineDash([5, 5]);
        ctx.lineDashOffset = 0;
        ctx.beginPath();
        ctx.moveTo(cur_pos_x, origin_y + 10);
        ctx.lineTo(cur_pos_x, y);
        ctx.stroke();
      }
      if (i == 0) {
        ctx.fillStyle = 'rgba(0, 0, 0, 1)';
        ctx.font="30px Arial";
        var txt = T1 + 's';
        console.log(T1);
        // console.log('333');
        var text_width = ctx.measureText(txt).width;
        if (num_point > 2) ctx.fillText(txt, cur_pos_x + interval_len /2 - text_width / 2, origin_y + 35);  
        else ctx.fillText(txt, origin_x + interval_len /2 - text_width / 2, origin_y + 35);  
      }
      next_point = [cur_pos_x, y];
    }
  }
  ctx.strokeStyle = "rgba(100, 100, 100, 1)";
  ctx.lineWidth = 1;
  ctx.setLineDash([5, 5]);
  ctx.lineDashOffset = 0;
  ctx.beginPath();
  ctx.moveTo(cur_x, origin_y + 10);
  ctx.lineTo(cur_x, origin_y - y_len);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(origin_x, origin_y - y_len / 3);
  ctx.lineTo(origin_x + x_len, origin_y - y_len / 3);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(origin_x, origin_y - 2* y_len / 3);
  ctx.lineTo(origin_x + x_len, origin_y - 2* y_len / 3);
  ctx.stroke();

  ctx.fillStyle = 'rgba(0, 0, 0, 1)';
  ctx.font="30px Arial";
  var txt = "Now";
  var text_width = ctx.measureText(txt).width;
  ctx.fillText(txt, cur_x - text_width / 2, origin_y + 35);    

  var sentiment_type;
  if (data[num_point - 1] > 0.66) sentiment_type = 'positive';
  else if (data[num_point - 1] > 0.33) sentiment_type = 'neutral';
  else sentiment_type = 'negative';
  draw_face (ctx, cur_x + 80, cur_y, 50, 8, 20, 20, mouth_r = 24, type = sentiment_type);
}


router.use(bodyParser.json());
router.post('/getimage', function(req, res){
    var json_data = req.body;
    console.log(json_data);
    console.log(json_data['user'] + ' : ' + json_data['time']);
    console.log(json_data['message']);
    // var current_sentiment = json_data.json['sentiment'];
    // var current_tones = json_data.json['tones'];
    // var num_utterances = json_data.json['turns'];
    var current_sentiment = json_data['sentiment'];
    console.log(current_sentiment);
    var current_tones = json_data['tones'];
    console.log(current_tones);
    var num_utterances = json_data['turns'];
    var interval_last_T1 = json_data['interval_to_lastT1'];
    var task_name = json_data['task'];
    var T1 = json_data['T1'];
    console.log('T1');
    var group_name = json_data['group_name'];
    // var task_number = json_data['task_num'];
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    //draw_bar(ctx, test_tones, tone_category);
    var bar_x = 900, bar_y = 80, bar_width = 60, bar_pad = 20, two_tones_interval = 110;
    var sen_x = 50, sen_y = 600, sen_width = 650, sen_height = 515, sen_cur_x = 550;
    
    // For testing
    // draw_horizontal_bar(ctx, test_tones, tone_category, position_x = bar_x, position_y = bar_y,  split_interval = two_tones_interval , pad = bar_pad, barChartHeight = ctx.canvas.height - 20, barWidth = bar_width, max_bar_length = ctx.canvas.width - bar_x - 40, unit = 'Percentage', total_num = num_utterances);
    // draw_sentiment(sentiment_data, origin_x = sen_x, origin_y = sen_y, x_len = sen_width, y_len = sen_height, cur_pos_x = sen_cur_x);
    // draw_coordinate(unit = 'Percentage', interval = 4, axis_x = true, axis_y = true, grid_x = true, grid_y = false, axis_x_position = 'up', origin_x = bar_x - 1, origin_y = bar_y + 7 * bar_width - bar_pad / 2 + two_tones_interval, x_len = ctx.canvas.width - bar_x - 40, y_len = 3 * bar_width, dx = 80, dy = bar_width);
    // draw_coordinate(unit = '', interval = 4, axis_x = true, axis_y = true, grid_x = true, grid_y = false, axis_x_position = 'up', origin_x = bar_x - 1, origin_y = bar_y + 4 * bar_width - bar_pad / 2, x_len = ctx.canvas.width - bar_x - 40, y_len = 4 * bar_width, dx = 80, dy = bar_width);
   
    // For real data
    draw_horizontal_bar(ctx, current_tones, tone_category, position_x = bar_x, position_y = bar_y,  split_interval = two_tones_interval , pad = bar_pad, barChartHeight = ctx.canvas.height - 20, barWidth = bar_width, max_bar_length = ctx.canvas.width - bar_x - 40, unit = 'Percentage', total_num = num_utterances);
    draw_sentiment(current_sentiment, origin_x = sen_x, origin_y = sen_y, x_len = sen_width, y_len = sen_height, cur_pos_x = sen_cur_x, T1 = T1, interval_last_T1 = interval_last_T1);
    draw_coordinate(unit = 'Percentage', interval = 4, axis_x = true, axis_y = true, grid_x = true, grid_y = false, axis_x_position = 'up', origin_x = bar_x - 1, origin_y = bar_y + 7 * bar_width - bar_pad / 2 + two_tones_interval, x_len = ctx.canvas.width - bar_x - 40, y_len = 3 * bar_width, dx = 80, dy = bar_width);
    draw_coordinate(unit = '', interval = 4, axis_x = true, axis_y = true, grid_x = true, grid_y = false, axis_x_position = 'up', origin_x = bar_x - 1, origin_y = bar_y + 4 * bar_width - bar_pad / 2, x_len = ctx.canvas.width - bar_x - 40, y_len = 4 * bar_width, dx = 80, dy = bar_width);
   
    // Add title summary
    ctx.fillStyle = 'rgba(0, 0, 0, 1)';
    ctx.font = "40px Arial";
    ctx.fillText('Group Sentiment Summary', sen_x, sen_y - sen_height - 30);    
    ctx.fillText('Emotional Tones', bar_x, bar_y - 30);   
    ctx.fillText('Language Tones', bar_x, bar_y + 4 * bar_width - bar_pad / 2 + two_tones_interval - 25); 
    
    //ctx.drawImage('happy.png', 10, 10)
    var date = new Date();
    var timestamp = date.getTime();
    var buf = canvas.toBuffer();
    var image_path = 'images/' + group_name  + '_' + task_name + '_' + timestamp.toString() + '.png'; //+ '_' + task_number.toString()

    fs.writeFile(image_path, buf, (err) => {
      if (err) throw err;
      console.log('It\'s saved!');
      console.log(image_path);
      res.send('http://47.75.124.98:80/' + image_path);
      console.log('http://47.75.124.98:80/' + image_path);
    });
    
    // res.send(canvas.toDataURL());
    
    // console.log(canvas.toDataURL());
});

router.use('*', function(req, res){
  res.status(404);
  res.json({ message: 'api.not.found' });
});

module.exports = router;
