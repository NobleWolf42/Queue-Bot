var Discord = require('discord.io');
var auth = require('./auth.json');
var queue = ['Test'];
var memberinfo = [];
var roleids = [];

//List the Admin Roles Here
var rolenames = ["Server Admin", "Creator"];

// Initialize Discord Bot
var bot = new Discord.Client({
   token: auth.token,
   autorun: true
});

//Include this function at the top of any admin olny commands
function admincheck () {

    // Change this to the ID of your Server
    serverinfo = bot.servers['614167683247898684'];
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

    for (i = 0; i < idlen; i++) {

        if (roleids[i] === chkvlu[0]) {
            return true;
        }
        if (i === idlen){
            return false;
        }
    }
}

// Sets the Status Message of the bot (i.e. when a user is "Playing Sea Of Thieves")
bot.on('ready', function(evt) {
    bot.setPresence( {game: {name: "*help"}} )
})

// Listens to Messages and executes various commands
bot.on('message', function (user, userID, channelID, message, evt) {

    // The bot will listen for messages that will start with `*`
    if (message.substring(0, 1) == '*') {
        var args = message.substring(1).split(' ');
        var cmd = args[0];
       
        args = args.splice(1);
        
        // All commands go here
        switch(cmd) {
            
            // *join, adds the user who sent the message to an Array containing the Queue list
            case 'join':
                if (queue.indexOf(String(user + "#" + bot.users[userID].discriminator)) === -1) {
                    queue.push(String(user + "#" + bot.users[userID].discriminator));
                    location = queue.indexOf(String(user + "#" + bot.users[userID].discriminator));
                    bot.sendMessage({
                        to: channelID,
                        message: `You are at position ${location} in the queue!`
                    });
                }
                else {
                    location = queue.indexOf(String(user + "#" + bot.users[userID].discriminator));
                    bot.sendMessage({
                        to: channelID,
                        message: `You are already at position ${location} in the queue!`
                    });
                }
            break;

            // *leave, removes the user who sent the message from the Queue list
            case 'leave':
                queue.splice(queue.indexOf(String(user + "#" + bot.users[userID].discriminator)), 1);
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

                for (i = 1; i < arrlen; i++) {
                    arrtext += i + ' - ' + queue[i] + "\n";
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

                if(checkarray(memberinfo[userID].roles)) {

                    if (queue.indexOf(String(args)) == -1) {
                        bot.sendMessage({
                            to: channelID,
                            message: `You did not specify a valid user.`
                        });
                    }
                    else {
                        queue.splice(queue.indexOf(String(args)), 1);
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
                    queue = ['Test'];
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
                    message: '```*help - Displays All Commands\n*join - Adds you to the Queue to get into a ship\n*leave - Removes you from the Queue to get into a ship\n*queue - Displays the current Queue list\n*remove "USERNAME" - Server Admin/Creators only caommnad that removes the specified user from the Queue List\n*clearqueue - Server Admin/Creators only command that clears the entire Queue list```'
                })
         }
     }
});
