'use strict';

// --------------- Helpers that build all of the responses -----------------------

function buildSpeechletResponse(speechOutput, repromptText, shouldEndSession) {
    return {
        outputSpeech: {
            type: 'PlainText',
            text: speechOutput,
        },
        reprompt: {
            outputSpeech: {
                type: 'PlainText',
                text: repromptText,
            },
        },
        shouldEndSession,
    };
}

function buildResponse(sessionAttributes, speechletResponse) {
    return {
        version: '1.0',
        sessionAttributes,
        response: speechletResponse,
    };
}


// --------------- Functions that control the skill's behavior -----------------------

const request = require('request');

function getWelcomeResponse(callback) {
    const sessionAttributes = {};
    const speechOutput = 'Welcome to Toevahla Dev. What can I help you with today?';
    const repromptText = 'What else can I help you with today?';
    const shouldEndSession = false;

    callback(sessionAttributes, buildSpeechletResponse(speechOutput, repromptText, shouldEndSession));
}

function handleSessionEndRequest(callback) {
    const speechOutput = 'Thank you for using Toevahla. Goodbye!';
    const shouldEndSession = true;

    callback({}, buildSpeechletResponse(speechOutput, null, shouldEndSession));
}

function handleConfusion(callback) {
    let sessionAttributes = {};
    const repromptText = 'What else can I help you with today?';
    const shouldEndSession = false;
    const speechOutput = 'I don\'t understand your request. Could you repeat it?';

    callback(sessionAttributes, buildSpeechletResponse(speechOutput, repromptText, shouldEndSession));
}

function getID(session) {
    const jwt = require('jsonwebtoken'); 
    var decoded = jwt.verify(session.user.accessToken, process.env.AUTH0_SECRET).sub;
    
    while(decoded.charAt(0) != '|')
    {
        decoded = decoded.substr(1);
    }
    decoded = decoded.substr(1);
    
    return decoded;
}

function getToken(session) {
    const jwt = require('jsonwebtoken'); 
    const id = getID(session);
    
    var decoded = jwt.verify(session.user.accessToken, process.env.AUTH0_SECRET);
    
    var token = jwt.sign({ 
        iss: decoded.iss,
        sub: decoded.sub,
        aud: [ decoded.aud[0] ],
        iat: decoded.iat,
        exp: decoded.exp,
        azp: decoded.azp,
        scope: decoded.scope,
        user: true, 
        userId: parseInt(id, 10) }, process.env.AUTH0_DECODE);
    
    return token;
}

function ovenCook(agentid, agentkey, body, session, callback) {
    var options = {
        host: 'agent.electricimp.com',
        port: 443,
        path: '/' + agentid + '/cook/routine', 
        headers: { 'Authorization': 'Basic ' + agentkey, 'Content-Type': 'application/json' },
        method: 'POST',
    };
    
    var https = require('https');
    var req = https.request(options, res => {
        res.setEncoding('utf8');
        var responseString = '';
        
        res.on('data', chunk => {
            responseString = responseString + chunk;
        });
        
        res.on('end', () => {
            callback(responseString);
        });
    });
    req.write(body);
    req.end();
}

function ovenStatus(agentid, agentkey, session, callback) {
    var options = {
        host: 'agent.electricimp.com',
        port: 443,
        path: '/' + agentid + '/cook/status', 
        headers: { 'Authorization': 'Basic ' + agentkey },
        method: 'GET',
    };
    
    var https = require('https'); 
    var req = https.request(options, res => {
        res.setEncoding('utf8');
        var responseString = '';
        
        res.on('data', chunk => {
            responseString = responseString + chunk;
        });
        
        res.on('end', () => {
            callback(responseString);
        });
    });
    req.end();
}

function ovenCancel(agentid, agentkey, session, callback) {
    var options = {
        host: 'agent.electricimp.com',
        port: 443,
        path: '/' + agentid + '/cook/cancel', 
        headers: { 'Authorization': 'Basic ' + agentkey, 'Content-Type': 'application/json' },
        method: 'POST',
    };
    
    var https = require('https');
    var req = https.request(options, res => {
        res.setEncoding('utf8');
        var responseString = '';
        
        res.on('data', chunk => {
            responseString = responseString + chunk;
        });
        
        res.on('end', () => {
            callback(responseString);
        });
    });
    req.end();
}

function createTimeAttributes(time) {
    return { time, };
}

function doToastIntent(intent, session, callback) {
    let time = 0;
    const toastLevel = intent.slots.levelNumber.value;
    let sessionAttributes = {};
    let speechOutput = '';
    let body = '';
    const repromptText = 'What else can I help you with today?';
    const shouldEndSession = false;
    
    const options = {
        uri: 'https://api.dev.tovala.com/alexa/v0/users/' + getID(session),
        headers: { 'Authorization': 'Bearer ' + getToken(session) },
        method: 'GET',
        json: true,
        gzip: true,
    };
    
    if (toastLevel == 1) {
        body = '{ "barcode": "alexa-toast-1", "routine": [{"direct":{"top":50,"bottom":0,"steam":1,"fan":1},"cookTime":75,"temperature":450},{"direct":{"top":50,"bottom":1,"steam":0,"fan":1},"cookTime":90,"temperature":450},{"direct":{"top":50,"bottom":0,"steam":1,"fan":1},"cookTime":45,"temperature":450},{"direct":{"top":50,"bottom":1,"steam":0,"fan":1},"cookTime":60,"temperature":450},{"direct":{"top":100,"bottom":0,"steam":0,"fan":1},"cookTime":30,"temperature":500}], "version": "2016-09-12" }';
    } else if (toastLevel == 2) {
        body = '{ "barcode": "alexa-toast-2", "routine": [{"direct":{"top":50,"bottom":0,"steam":1,"fan":1},"cookTime":75,"temperature":450},{"direct":{"top":50,"bottom":1,"steam":0,"fan":1},"cookTime":105,"temperature":450},{"direct":{"top":50,"bottom":0,"steam":1,"fan":1},"cookTime":45,"temperature":450},{"direct":{"top":50,"bottom":1,"steam":0,"fan":1},"cookTime":105,"temperature":450},{"direct":{"top":100,"bottom":0,"steam":0,"fan":1},"cookTime":45,"temperature":500}], "version": "2016-09-12" }';
    } else if (toastLevel == 3 || toastLevel == undefined) {
        body = '{ "barcode": "alexa-toast-3", "routine": [{"direct":{"top":50,"bottom":0,"steam":1,"fan":1},"cookTime":75,"temperature":450},{"direct":{"top":50,"bottom":1,"steam":0,"fan":1},"cookTime":120,"temperature":450},{"direct":{"top":50,"bottom":0,"steam":1,"fan":1},"cookTime":45,"temperature":450},{"direct":{"top":50,"bottom":1,"steam":0,"fan":1},"cookTime":120,"temperature":450},{"direct":{"top":100,"bottom":0,"steam":0,"fan":1},"cookTime":60,"temperature":500}], "version": "2016-09-12" }';
    } else if (toastLevel == 4) {
        body = '{ "barcode": "alexa-toast-4", "routine": [{"direct":{"top":50,"bottom":0,"steam":1,"fan":1},"cookTime":75,"temperature":450},{"direct":{"top":50,"bottom":1,"steam":0,"fan":1},"cookTime":135,"temperature":450},{"direct":{"top":50,"bottom":0,"steam":1,"fan":1},"cookTime":45,"temperature":450},{"direct":{"top":50,"bottom":1,"steam":0,"fan":1},"cookTime":120,"temperature":450},{"direct":{"top":100,"bottom":0,"steam":0,"fan":1},"cookTime":75,"temperature":500}], "version": "2016-09-12" }';
    } else if (toastLevel == 5) {
        body = '{ "barcode": "alexa-toast-5", "routine": [{"direct":{"top":50,"bottom":0,"steam":1,"fan":1},"cookTime":75,"temperature":450},{"direct":{"top":50,"bottom":1,"steam":0,"fan":1},"cookTime":135,"temperature":450},{"direct":{"top":50,"bottom":0,"steam":1,"fan":1},"cookTime":45,"temperature":450},{"direct":{"top":50,"bottom":1,"steam":0,"fan":1},"cookTime":120,"temperature":450},{"direct":{"top":50,"bottom":0,"steam":1,"fan":1},"cookTime":40,"temperature":450},{"direct":{"top":50,"bottom":1,"steam":0,"fan":1},"cookTime":70,"temperature":450},{"direct":{"top":100,"bottom":0,"steam":0,"fan":1},"cookTime":100,"temperature":500}], "version": "2016-09-12" }';
    } else {
        speechOutput = 'Please repeat your request and choose a toast level from one to five.';
        
        callback(sessionAttributes, buildSpeechletResponse(speechOutput, repromptText, shouldEndSession));
        return;
    }
    
    request(options, (err, res, parsed) => {
        if (err) throw new Error(err);
        
        const agentid = parsed.imps[0].agentid;
        const agentkey = parsed.imps[0].agentkey;

        ovenCook(agentid, agentkey, body, session, (response) => {
            const parseBody = JSON.parse(body);
            const length = parseBody.routine.length;
            
            for (var i = 0; i < length; i ++) {
                time += parseBody.routine[i].cookTime;
            }
            
            sessionAttributes = createTimeAttributes(time);
            speechOutput = 'Push the button to start toasting your food.';
            
            callback(sessionAttributes, buildSpeechletResponse(speechOutput, repromptText, shouldEndSession));
        });
    });
}

function doLeftoversIntent(intent, session, callback) {
    let time = 0;
    const mins = intent.slots.minutes.value;
    const secs = intent.slots.seconds.value;
    let sessionAttributes = {};
    let speechOutput = '';
    let body = '';
    const repromptText = 'What else can I help you with today?';
    const shouldEndSession = false;
    
    const options = {
        uri: 'https://api.dev.tovala.com/alexa/v0/users/' + getID(session),
        headers: { 'Authorization': 'Bearer ' + getToken(session) },
        method: 'GET',
        json: true,
        gzip: true,
    };
    
    const cycleTime = 555;
    let totalSeconds = 0;
    if (mins != undefined && secs != undefined) {
        totalSeconds = parseInt(mins, 10) * 60 + parseInt(secs, 10);
    } else if (mins != undefined) {
        totalSeconds = parseInt(mins, 10) * 60;
    }
    
    if (totalSeconds > 0 && totalSeconds < cycleTime) {
        const step1time = Math.floor(90 * 1.0/ (cycleTime * totalSeconds));
        const step2time = Math.floor(75 * 1.0/ (cycleTime * totalSeconds));
        const step3time = Math.floor(300 * 1.0/ (cycleTime * totalSeconds));
        const step4time = Math.floor(90 * 1.0/ (cycleTime * totalSeconds));
        let bakeOffset = 0;
        const calculatedTotalTime = step1time + step2time + step3time + step4time;

        if(totalSeconds != calculatedTotalTime) {
            bakeOffset = totalSeconds - calculatedTotalTime;
        }

        body = '{ "barcode": "alexa-heat", "routine": [{"direct":{"top":100,"bottom":0,"steam":0,"fan":1},"cookTime":' + step1time + ',"temperature":450}, {"direct":{"top":50,"bottom":0,"steam":1,"fan":1},"cookTime":' + step2time + ',"temperature":450}, {"direct":{"top":50,"bottom":1,"steam":0,"fan":1},"cookTime":' + (step3time + bakeOffset) + ',"temperature":400}, {"direct":{"top":100,"bottom":0,"steam":0,"fan":1},"cookTime":' + step4time + ',"temperature":475}], "version": "2016-09-12" }';
    } else if (totalSeconds > cycleTime) {
        const additionalBakeTime = totalSeconds - cycleTime;
        body = '{ "barcode": "alexa-heat", "routine": [{"direct":{"top":100,"bottom":0,"steam":0,"fan":1},"cookTime":90,"temperature":450}, {"direct":{"top":50,"bottom":0,"steam":1,"fan":1},"cookTime":75,"temperature":450}, {"direct":{"top":50,"bottom":1,"steam":0,"fan":1},"cookTime":' + (300 + additionalBakeTime) + ',"temperature":400}, {"direct":{"top":100,"bottom":0,"steam":0,"fan":1},"cookTime":90,"temperature":475}], "version": "2016-09-12" }';
    } else {
        body = '{ "barcode": "alexa-heat", "routine": [{"direct":{"top":100,"bottom":0,"steam":0,"fan":1},"cookTime":90,"temperature":450},{"direct":{"top":50,"bottom":0,"steam":1,"fan":1},"cookTime":75,"temperature":450},{"direct":{"top":50,"bottom":1,"steam":0,"fan":1},"cookTime":300,"temperature":400},{"direct":{"top":100,"bottom":0,"steam":0,"fan":1},"cookTime":90,"temperature":475}], "version": "2016-09-12" }';
    }
    
    request(options, (err, res, parsed) => {
        if (err) throw new Error(err);
        
        const agentid = parsed.imps[0].agentid;
        const agentkey = parsed.imps[0].agentkey;

        ovenCook(agentid, agentkey, body, session, (response) => {
            const parseBody = JSON.parse(body);
            const length = parseBody.routine.length;
            
            for (var i = 0; i < length; i ++) {
                time += parseBody.routine[i].cookTime;
            }
            
            sessionAttributes = createTimeAttributes(time);
            speechOutput = 'Push the button to start reheating your food.';
            
            callback(sessionAttributes, buildSpeechletResponse(speechOutput, repromptText, shouldEndSession));
        });
    });
}

function doCookIntent(intent, session, callback) {
    let time = 0;
    const method = intent.slots.cookingMethod.value;
    const temp = intent.slots.degrees.value;
    const mins = intent.slots.minutes.value;
    const secs = intent.slots.seconds.value;
    let sessionAttributes = {};
    let speechOutput = '';
    let body = '';
    const repromptText = 'What else can I help you with today?';
    const shouldEndSession = false;
    
    const options = {
        uri: 'https://api.dev.tovala.com/alexa/v0/users/' + getID(session),
        headers: { 'Authorization': 'Bearer ' + getToken(session) },
        method: 'GET',
        json: true,
        gzip: true,
    };
    
    let totalSeconds = 0;
    if (mins != undefined && secs != undefined) {
        totalSeconds = parseInt(mins, 10) * 60 + parseInt(secs, 10);
    } else if (mins != undefined) {
        totalSeconds = parseInt(mins, 10) * 60;
    } else {
        speechOutput = 'Please repeat your request and specify how long you would like to '+ method + ' your food.';

        callback(sessionAttributes, buildSpeechletResponse(speechOutput, repromptText, shouldEndSession));
        return;
    }

    if (temp > 0 && temp <= 500) {
        if (method === 'broil') {
            body = '{ "barcode": "alexa-broil", "routine": [{"direct":{"top":100,"bottom":0,"steam":0,"fan":1},"cookTime":' + totalSeconds + ',"temperature":500}], "version": "2016-09-12" }';
        } else if (method === 'steam') {
            if (totalSeconds <= 150) {
                body = '{ "barcode": "alexa-steam", "routine": [{"direct":{"top":0,"bottom":1,"steam":1,"fan":1},"cookTime":' + totalSeconds + ',"temperature":' + temp +'}], "version": "2016-09-12" }';
            } else {
                body = '{ "barcode": "alexa-steam", "routine": [{"direct":{"top":0,"bottom":1,"steam":1,"fan":1},"cookTime":150,"temperature":' + temp +'}, {"direct":{"top":50,"bottom":1,"steam":0,"fan":1},"cookTime":' + (totalSeconds - 150) + ',"temperature":' + temp +'}], "version": "2016-09-12" }';
            }
        } else if (method === 'bake') {
            body = '{ "barcode": "alexa-bake", "routine": [{"direct":{"top":50,"bottom":1,"steam":0,"fan":1},"cookTime":' + totalSeconds + ',"temperature":' + temp +'}], "version": "2016-09-12" }';
        } else {
            speechOutput = 'I can only broil, steam, or bake your food. Please repeat your request and choose one of those methods.';

            callback(sessionAttributes, buildSpeechletResponse(speechOutput, repromptText, shouldEndSession));
            return;
        }
    } else {
        speechOutput = 'Please repeat your request and specify at what temperature you would like to '+ method + ' your food for.';

        callback(sessionAttributes, buildSpeechletResponse(speechOutput, repromptText, shouldEndSession));
        return;
    }
    
    request(options, (err, res, parsed) => {
        if (err) throw new Error(err);
        
        const agentid = parsed.imps[0].agentid;
        const agentkey = parsed.imps[0].agentkey;

        ovenCook(agentid, agentkey, body, session, (response) => {
            const parseBody = JSON.parse(body);
            const length = parseBody.routine.length;
            
            for (var i = 0; i < length; i ++) {
                time += parseBody.routine[i].cookTime;
            }
            
            sessionAttributes = createTimeAttributes(time);
            speechOutput = 'Push the button to start ' + method + 'ing your food at ' + temp + ' degrees.';
            
            callback(sessionAttributes, buildSpeechletResponse(speechOutput, repromptText, shouldEndSession));
        });
    });
}

function doCancelIntent(intent, session, callback) {
    let sessionAttributes = {};
    let speechOutput = '';
    const repromptText = 'What else can I help you with today?';
    const shouldEndSession = false;

    const options = {
        uri: 'https://api.dev.tovala.com/alexa/v0/users/' + getID(session),
        headers: { 'Authorization': 'Bearer ' + getToken(session) },
        method: 'GET',
        json: true,
        gzip: true,
    };
    
    request(options, (err, res, parsed) => {
        if (err) throw new Error(err);
        
        const agentid = parsed.imps[0].agentid;
        const agentkey = parsed.imps[0].agentkey;
        
        ovenCancel(agentid, agentkey, session, (response) => {
            
            sessionAttributes = createTimeAttributes(0);
            speechOutput = 'Your cook cycle was canceled.';
            
            callback(sessionAttributes, buildSpeechletResponse(speechOutput, repromptText, shouldEndSession));
        });
    });
}

function doFoodReadyIntent(intent, session, callback) {
    let time;
    let ready;
    let sessionAttributes = {};
    let speechOutput = '';
    const repromptText = 'What else can I help you with today?';
    const shouldEndSession = false;
    
    const options = {
        uri: 'https://api.dev.tovala.com/alexa/v0/users/' + getID(session),
        headers: { 'Authorization': 'Bearer ' + getToken(session) },
        method: 'GET',
        json: true,
        gzip: true,
    };
    
    request(options, (err, res, parsed) => {
        if (err) throw new Error(err);
        
        const agentid = parsed.imps[0].agentid;
        const agentkey = parsed.imps[0].agentkey;

        ovenStatus(agentid, agentkey, session, (response) => {
            const parsed = JSON.parse(response);
            if (session.attributes) {
                time = session.attributes.time;
                sessionAttributes = createTimeAttributes(time);
                ready = time - (Math.floor(new Date()/1000) - parsed.cycle_started_at);
            } else {
                ready = ((parsed.last_published - parsed.cycle_started_at) * 100 / parsed.cycle_progress) - (Math.floor(new Date()/1000) - parsed.cycle_started_at);
            }
            
            var mins = Math.floor(ready / 60);
            var secs = Math.floor(ready % 60);
            if (mins === 0 && secs === 0 || parsed.state === 'idle') {
                speechOutput = 'Your food is ready.';
            } else if (mins === 0 && secs > 0) {
                speechOutput = 'Your food will be ready in ' + secs + ' seconds.';
            } else if (mins > 0 && secs === 0) {
                speechOutput = 'Your food will be ready in ' + mins + ' minutes.';
            } else if (mins > 0 && secs > 0) {
                speechOutput = 'Your food will be ready in ' + mins + ' minutes and '+ secs + ' seconds.';
            }
        
            callback(sessionAttributes, buildSpeechletResponse(speechOutput, repromptText, shouldEndSession));
            });
    });
    
}

function doMealArriveIntent(intent, session, callback) {
    let sessionAttributes = {};
    let speechOutput = '';
    const repromptText = 'What else can I help you with today?';
    const shouldEndSession = false;
    
    const options1 = {
        uri: 'https://api.dev.tovala.com/alexa/v0/users/' + getID(session) + '/calendarView',
        headers: { 'Authorization': 'Bearer ' + getToken(session) },
        method: 'GET',
        json: true,
        gzip: true,
    };
    
    request(options1, (err, res, parsed1) => {
        if (err) throw new Error(err);
        
        const check = parsed1.past.terms[4];
        
        if (parsed1.past.terms[4].term.meals.length === 0 || !(check.hasOwnProperty('meal_selections'))) {
            speechOutput = 'No meals are arriving this week.';
            
            callback(sessionAttributes, buildSpeechletResponse(speechOutput, repromptText, shouldEndSession));
            return;
        } else if (parsed1.past.terms[4].meal_selections.length === 0) {
            speechOutput = 'No meals are arriving this week.';
            
            callback(sessionAttributes, buildSpeechletResponse(speechOutput, repromptText, shouldEndSession));
            return;
        } else {  
            const options2 = {
                uri: 'https://api.dev.tovala.com/alexa/v0/users/' + getID(session),
                headers: { 'Authorization': 'Bearer ' + getToken(session) },
                method: 'GET',
                json: true,
                gzip: true,
            };
            
            request(options2, (err, res, parsed2) => {
                if (err) throw new Error(err);
                
                const arrive = parsed2.shipping_address.estimated_delivery_days;
                
                if (arrive === 1) {
                    speechOutput = 'Your meals are arriving on Tuesday.';
                } else if (arrive === 2) {
                    speechOutput = 'Your meals are arriving on Wednesday.';
                } else if (arrive === 0) {
                    speechOutput = 'No meals are arriving this week.';
                }
                
                callback(sessionAttributes, buildSpeechletResponse(speechOutput, repromptText, shouldEndSession));
            });
        }
    });
}

function doMealTypeIntent(intent, session, callback) {
    let sessionAttributes = {};
    let speechOutput = '';
    const repromptText = 'What else can I help you with today?';
    const shouldEndSession = false;
    
    const options = {
        uri: 'https://api.dev.tovala.com/alexa/v0/users/' + getID(session) + '/calendarView',
        headers: { 'Authorization': 'Bearer ' + getToken(session) },
        method: 'GET',
        json: true,
        gzip: true,
    };
    
    request(options, (err, res, parsed) => {
        if (err) throw new Error(err);
        
        const check = parsed.past.terms[4];
        
        if (parsed.past.terms[4].term.meals.length === 0 || !(check.hasOwnProperty('meal_selections'))) {
            speechOutput = 'No meals are arriving this week.';
        } else if (parsed.past.terms[4].meal_selections.length === 0) {
            speechOutput = 'No meals are arriving this week.';
        } else {
            const array = parsed.past.terms[4].term.meals;
            const ids = parsed.past.terms[4].meal_selections;
            const meals = new Array();
                
            const len1 = ids.length;
            const len2 = array.length;
            for(var i = 0; i < len1; i ++) {
                for(var j = 0; j < len2; j ++) {
                    if(ids[i].mealid === array[j].id) {
                        meals.push(array[j].title);
                    }
                }
            }
            
            if (len1 > 0 && len2 > 0) {
                for (var k = 0; k < len1; k ++) {
                    if(k + 1 === len1) {
                        speechOutput += 'and ' + meals[k] + ' are your next orders.';
                    } else {
                        speechOutput += meals[k] + ', ';
                    }
                }
            } else {
                speechOutput = 'No meals are arriving this week.';
            }
        }
        
        callback(sessionAttributes, buildSpeechletResponse(speechOutput, repromptText, shouldEndSession));
    });
}

function doHelpIntent(intent, session, callback) {
    let sessionAttributes = {};
    const repromptText = 'What else can I help you with today?';
    const shouldEndSession = false;
   
    const speechOutput = 'You can ask me to toast, steam, bake, broil, reheat, or cancel your food. In addition, you can ask when your food is ready, when your meals are coming, and what meals are coming in this week.';
    
    callback(sessionAttributes, buildSpeechletResponse(speechOutput, repromptText, shouldEndSession));
}

function doAliceIntent(intent, session, callback) {
    let sessionAttributes = {};
    const repromptText = 'What else can I help you with today?';
    const shouldEndSession = false;
   
    const speechOutput = 'Alice learned how to master public transit, that physical labor is not and will never be her forte, that Wildberry has hands down the best pancakes to have graced this Earth, that seaweed can subsitute for dollar bills if Debs takes enough photos, and that honestly, she wouldnt have minded if the interns were taken to Urban Belly for a fourth time, because its really not that bad and there are a ton of options, but please dont tell the others... The bottom line is, Alice has learned a lot both in and outside of work in Chicago, and she is incredibly, incredibly, incredibly, incredibly, incredibly -- No I am not glitching, Alice just wanted to prove that repeating words sound really weird on the Alexa. Anyway, Alice is incredibly grateful to Toevahla for having made her experience in Chicago all the better. Thank you all for cultivating such a welcoming and exciting environment, and heres to the Minivahlas future success, reducing shipping costs to California, and most importantly, intern lunches.';
    
    callback(sessionAttributes, 
                buildSpeechletResponse(speechOutput, repromptText, shouldEndSession));
}

// --------------- Events -----------------------

function onLaunch(launchRequest, session, callback) {
    console.log(`LAUNCH REQUEST`);
    getWelcomeResponse(callback);
}

function onIntent(intentRequest, session, callback) {
    console.log(intentRequest.intent.name);
    const intent = intentRequest.intent;
    const intentName = intentRequest.intent.name;

    if (intentName === 'ToastIntent') {
        doToastIntent(intent, session, callback);
    } else if (intentName === 'LeftoversIntent') {
        doLeftoversIntent(intent, session, callback); 
    } else if (intentName === 'CookIntent') {
        doCookIntent(intent, session, callback); 
    } else if (intentName === 'CancelIntent') {
        doCancelIntent(intent, session, callback);
    } else if (intentName === 'FoodReadyIntent') {
        doFoodReadyIntent(intent, session, callback);
    } else if (intentName === 'MealArriveIntent') {
        doMealArriveIntent(intent, session, callback); 
    } else if (intentName === 'MealTypeIntent') {
        doMealTypeIntent(intent, session, callback);
    } else if (intentName === 'AliceIntent') {
        doAliceIntent(intent, session, callback);
    } else if (intentName === 'AMAZON.HelpIntent') {
        doHelpIntent(intent, session, callback);
    } else if (intentName === 'AMAZON.StopIntent') {
        handleSessionEndRequest(callback);
    } else {
        handleConfusion(callback);
    }
}

// --------------- Main handler -----------------------

exports.handler = (event, context, callback) => {
    try {
        if (event.session.application.applicationId !== 'amzn1.ask.skill.fcaf0ba1-b076-467b-b2b2-88466513416c') {
             callback('Invalid Application ID');
        }
        if (event.request.type === 'LaunchRequest') {
            onLaunch(event.request,
                event.session,
                (sessionAttributes, speechletResponse) => {
                    callback(null, buildResponse(sessionAttributes, speechletResponse));
                });
        } else if (event.request.type === 'IntentRequest') {
            onIntent(event.request,
                event.session,
                (sessionAttributes, speechletResponse) => {
                    callback(null, buildResponse(sessionAttributes, speechletResponse));
                });
        }
    } catch (err) {
        callback(err);
    }
};