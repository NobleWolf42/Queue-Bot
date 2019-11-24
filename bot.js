var Discord = require('discord.io');
var fs = require("fs");
var CONFIG = require('./config.json');
//var qjson = require('./queue.json');
var queue = [];
var User = require('./user.js');
var memberinfo = [];
var roleids = [];


//List the Admin Roles Here
var rolenames = ["Server Admin", "Creator"];

// Initialize Discord Bot
var bot = new Discord.Client({
   token: CONFIG.AUTH.TOKEN,
   autorun: true
});

//Include this function at the top of any admin olny commands
function admincheck () {

    // Change this to the ID of your Server
    serverinfo = bot.servers[CONFIG.CONNECTION.SERVER_ID];
    //serverinfotest = bot.servers['644966355875135499'];

    //This pulls the role information required to verify Admin
    memberinfo = serverinfo.members;
    role = serverinfo.roles;

    //Makes an arry of ids for selected roles
    for (key in role) {

        for (a in rolenames){

            if (role[key].name === rolenames[a] || role[key].name === rolenames[a]) {
                roleids.push(role[key].id);
            };
        };
    };
};

//Function for checking roles
function checkarray (chkvlu) {
    idlen = roleids.length;
    idlen2 = chkvlu.length;

    for (i = 0; i < idlen; i++) {
  
        for (x = 0; x < idlen2; x++) {

            if (roleids[i] === chkvlu[x]) {
                console.log("True");
                return true;
            }
            if (i === idlen){
                console.log("False");
                return false;
            }
        }
    }
}

function saveQueue () {

    console.log("Saving queue...");

    var queueOutput = [];

    for (i = 0; i < queue.length; i++) {
        queueOutput.push({
            "Name": queue[i].Name,
            "Message": queue[i].Message
        });
    }

    fs.writeFile("savedQueue.json", JSON.stringify(queueOutput), function(err) {
        if (err) {
            console.log(err);
        }
    });

    console.log("Done saving!");
}

function loadQueue () {
    if (fs.existsSync("./savedQueue.json")) {
        console.log("Loading queue...");

        fs.readFile("./savedQueue.json", function (err, data) {
            if (err) {
                console.log(err);
            }

            var queueInput = JSON.parse(data);

            for (i = 0; i < queueInput.length; i++) {
                queue.push(new User (queueInput[i].Name, queueInput[i].Message));
            }
        });

        console.log("Done loading queue!");
    }
}

// Checks the given channel ID to the allowed channel IDs in our config
function isChannelAllowed (channelID) {
    if(CONFIG.CONNECTION.ALLOWED_CHANNEL_IDS.indexOf(channelID) >= 0) { 
        return true;
    }
    return false;
}

// Get index in queue from user id
function getQueueIndexFromUserName (userName) {
    for (i = 0; i < queue.length; i++) {
        if (queue[i].Name === userName) {
            return i;
        }
    }
    return -1;
}

// Sets the Status Message of the bot (i.e. when a user is "Playing Sea Of Thieves")
bot.on('ready', function(evt) {
    bot.setPresence( {game: {name: "*help"}} );
    loadQueue();

    setInterval(function(){ saveQueue()}, 60000);
    
    //Info code for minor Debugging
    /*for (key in bot.servers['614167683247898684'].channels) {
        console.log(bot.servers['614167683247898684'].channels[key]);
    };*/
});

// Listens to Messages and executes various commands
bot.on('message', function (user, userID, channelID, message, evt) {

    // The bot will listen for messages that will start with `*`
    if ((message.substring(0, 1) == '*' && isChannelAllowed(channelID))) {
        var args = message.substring(1).split(' ');
        var cmd = args[0]; 
       
        args = args.splice(1);
        var userName = String(user + "#" + bot.users[userID].discriminator);
        
        // All commands go here
        switch(cmd) {
            
            // *join, adds the user who sent the message to an Array containing the Queue list
            case 'join':
                if (getQueueIndexFromUserName(userName) === -1) {
                    queue.push(new User(userName, message.replace("*join", "").trim()));
                    location = getQueueIndexFromUserName(userName);
                    bot.sendMessage({
                        to: channelID,
                        message: `You are at position ${location + 1} in the queue!`
                    });
                }
                else {
                    location = getQueueIndexFromUserName(userName);
                    bot.sendMessage({
                        to: channelID,
                        message: `You are already at position ${location + 1} in the queue!`
                    });
                }
            break;

            // *leave, removes the user who sent the message from the Queue list
            case 'leave':
                queue.splice(getQueueIndexFromUserName(userName), 1);
                bot.sendMessage({
                    to: channelID,
                    message: 'You have left the queue!'
                });
            break;

            // *queue, displays the current Queue list
            case 'queue':
                arrtext = "";
                msgtxt = "";
                arrlen = queue.length;

                for (i = 0; i < arrlen; i++) {
                    arrtext += (i + 1) + ' - ' + queue[i].DisplayName() + "\n";
                }

                if (arrtext === ""){
                    arrtext = "Queue is Currently Empty."
                }

                msgtxt = '```' + arrtext + '```';
                bot.sendMessage({
                    to: channelID,
                    message: `${msgtxt}`
                });
            break;

            // *remove "USERNAME", Server Admin/Creator only command that removes the user specified from the Queue list
            case 'remove':
                admincheck();
                console.log(memberinfo[userID].roles);
                console.log(args);

                if(checkarray(memberinfo[userID].roles)) {

                    if (getQueueIndexFromUserName(args[0]) === -1) {
                        bot.sendMessage({
                            to: channelID,
                            message: `You did not specify a valid user.`
                        });
                    }
                    else {
                        queue.splice(getQueueIndexFromUserName(args[0]), 1);
                        bot.sendMessage({
                            to: channelID,
                            message: `Removed ${args} from Queue.`
                        });
                    }
                }
                else {
                    bot.sendMessage({
                        to: channelID,
                        message: `You do not have permission to use this command.`
                    });
                }
            break;

            // *clearqueue, Server Admin/Creator only command that clears the entire Queue list
            case 'clearqueue':
                admincheck();
                
                if(checkarray(memberinfo[userID].roles)) {
                    queue = [];
                    bot.sendMessage({
                        to: channelID,
                        message: `Cleared Queue.`
                    });
                }
                else {
                    bot.sendMessage({
                        to: channelID,
                        message: `You do not have permission to use this command.`
                    });
                }
            break;

            // *help, Lists all commands and what they do
            case 'help':
                bot.sendMessage({
                    to:channelID,
                    message: '```*help - Displays All Commands\n*join "MESSAGE" - Adds you to the Queue to get into a ship with an optional message next to your name\n*leave - Removes you from the Queue to get into a ship\n*queue - Displays the current Queue list\n*remove "USERNAME" - Server Admin/Creators only caommnad that removes the specified user from the Queue List\n*clearqueue - Server Admin/Creators only command that clears the entire Queue list```'
                })
            break;

            // *info, Lists all commands and what they do
            case 'info':
                bot.sendMessage({
                    to:channelID,
                    message: '```Queue System Bot\nQueue system for Sea of Thieves Fleet/Alliance Servers\nDesigned and Bulit by: NobleWolf42 and DK1```'
                })
            break;
         }
     }
});
