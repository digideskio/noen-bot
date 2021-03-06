var Botkit = require('botkit');
var os = require('os');

var controller = Botkit.slackbot({
    debug: false,
});

var global_users;
var channels;
var current_channel;
var channel_users;

var bot = controller.spawn({
    token: process.env.TOKEN
}).startRTM(function(err, bot, payload) {
    if (err) {
        console.log(err)
    } else {
        // This callback is where we get all the data. We save the parts we want:
        global_users = payload.users.filter(user =>
            !user.deleted &&
            !user.is_bot &&
            user.id != 'USLACKBOT' &&
            exclude.indexOf(user.name) == -1
        );
        channels = payload.channels;
    }
});

var exclude = [];
if (process.env.EXCLUDE) {
    const exclude_raw = process.env.EXCLUDE;
    exclude = exclude_raw.trim().split(',');
}

const prefixes = [
    'Time to shine', "The work doesn't do itself", 'Get going', 'lol rekt',
    'About time you got picked', 'RIP', 'Move it'
];

function shuffle(a) {
    var j, x, i;
    for (i = a.length; i; i -= 1) {
        j = Math.floor(Math.random() * i);
        x = a[i - 1];
        a[i - 1] = a[j];
        a[j] = x;
    }
    return a;
}

// For mentions of the bot with its' own username
controller.on('mention,direct_mention',function(bot,message) {
    // The mention is replaced with `botName` in the message, so
    // `@noen asd` -> `<@2F124EA> asd`, for instance.
    var botName = '<@' + bot.identity.id + '>';
    var re = new RegExp(botName, 'g');
    var numberOfMentions =  (message.text.match(re) || []).length
    // the mention is stripped from a direct mention
    if (message.event === 'direct_mention') {
      numberOfMentions++;
    }

    // Find which users are in the current channel
    current_channel = channels.filter(channel => channel.id == message.channel)[0];
    channel_users = global_users.filter(user => current_channel.members.indexOf(user.id) != -1);

    if (numberOfMentions > channel_users.length) {
      numberOfMentions = channel_users.length;
    }

    // Emoji reaction
    bot.api.reactions.add({
        timestamp: message.ts,
        channel: message.channel,
        name: 'robot_face',
    },function(err, res) {
        if (err) {
            bot.botkit.log('Failed to add emoji reaction :(',err);
        }
    });

    // Actual reply
    controller.storage.users.get(message.user, function(err, user) {
        if (!user) {
            user = {
                id: message.user,
            };
        }
        controller.storage.users.save(user, function(err, id) {
            const rekts = shuffle(channel_users).slice(0, numberOfMentions);
            const makeMention = user => '<@' + user.id + '>';

            var text = '';
            if (rekts.length > 1) {
              // comma separate them nicely :)
              const last = rekts[numberOfMentions - 1];
              const rest = rekts.slice(0, numberOfMentions - 1);
              text += rest.map(makeMention).join(', ');
              text += ', and ' + makeMention(last);
            } else {
              text = makeMention(rekts[0]);
            }
            const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
            bot.reply(message,{
              text: prefix + ' ' + text,
              username: 'noen',
              icon_url: rekts[0].profile.image_48,
            });
        });
    });

});


// For mentions of the bot with its' own username
controller.hears(['@aktiv','@active'],'message_received,ambient',function(bot,message) {
    // The mention is replaced with `botName` in the message, so
    // `@noen asd` -> `<@2F124EA> asd`, for instance.
    var botName = '<@' + bot.identity.id + '>';

    // Find which users are in the current channel
    current_channel = channels.filter(channel => channel.id == message.channel)[0];
    channel_users = global_users.filter(user => current_channel.members.indexOf(user.id) != -1);

    // Emoji reaction
    bot.api.reactions.add({
        timestamp: message.ts,
        channel: message.channel,
        name: 'robot_face',
    },function(err, res) {
        if (err) {
            bot.botkit.log('Failed to add emoji reaction :(',err);
        }
    });

    // Actual reply
    controller.storage.users.get(message.user, function(err, user) {
        if (!user) {
            user = {
                id: message.user,
            };
        }
        const makeMention = (user) => ' <@' + user.id + '>';
        const active_tags = channel_users.map(person => makeMention(person));

        controller.storage.users.save(user, function(err, id) {

            bot.reply(message,{
              text: '' + active_tags,
              username: 'noen',
            });
        });
    });

});

var new_users = [];
if (process.env.NEW) {
    const new_raw = process.env.NEW;
    new_users = new_raw.trim().split(',');
}

// For mentions of the bot with its' own username
controller.hears(['@nye'],'message_received,ambient',function(bot,message) {
    // The mention is replaced with `botName` in the message, so
    // `@noen asd` -> `<@2F124EA> asd`, for instance.
    var botName = '<@' + bot.identity.id + '>';

    // Find which users are in the current channel
    current_channel = channels.filter(channel => channel.id == message.channel)[0];
    channel_users = global_users.filter(user => current_channel.members.indexOf(user.id) != -1);

    // Emoji reaction
    bot.api.reactions.add({
        timestamp: message.ts,
        channel: message.channel,
        name: 'robot_face',
    },function(err, res) {
        if (err) {
            bot.botkit.log('Failed to add emoji reaction :(',err);
        }
    });

    // Actual reply
    controller.storage.users.get(message.user, function(err, user) {
        if (!user) {
            user = {
                id: message.user,
            };
        }

        const makeMention = (user) => ' <@' + user.id + '>';
        const new_users_in_channel = channel_users.filter(
            (person) => new_users.indexOf(person.name) !== -1
        );
        const active_tags = new_users_in_channel.map(person => makeMention(person));

        controller.storage.users.save(user, function(err, id) {

            bot.reply(message,{
              text: '' + active_tags,
              username: 'noen',
            });
        });
    });

});
