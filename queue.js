// #region Dependancy

var Discord = require('discord.js');
var fs = require("fs");
var config = require('./config.json');
var adminRoleIDs = [];
var modRoleIDs = [];
var queue = [];
var oldqueue = [];

//#endregion

//#region Initalize Bot

// Initialize Discord Bot
var client = new Discord.Client();

//Throws Error if bot's token is not set.
if (config.auth.token === 'YOUR BOT TOKEN' || config.auth.token === '') {
    throw new Error("The 'auth.token' property is not set in the config.js file. Please do this!");
}

//Logs the bot into discord, using it's auth token
client.login(config.auth.token);

//Logs Errors
client.on('error', console.error);

//#endregion

//#region save/load queue functions

//Function that checks to see if changes have been made to the queue, and if they have, saves them to a file
function saveQueue () {

    queueOutput = [];

    if (oldqueue != queue) {
        
        for (i = 0; i < queue.length; i++) {
            queueOutput.push(queue[i]);
        }

        fs.writeFile("savedQueue.json", JSON.stringify(queueOutput), function(err) {
            if (err) {
                console.log(err);
            }
        });

        oldqueue = queue;
    }
}

//Loads a saved queue from file, if one exists
function loadQueue () {
    
    if (fs.existsSync("./savedQueue.json")) {

        fs.readFile("./savedQueue.json", function (err, data) {
            if (err) {
                console.log(err);
            }

            var queueInput = JSON.parse(data);

            for (i = 0; i < queueInput.length; i++) {
                queue.push(queueInput[i]);
            }
        });
    }
}

//#endregion

//#region admin /mod check functions

//Function that calls the server roles
function serverRoleUpdate(sRole) {
    
    //Memory Cleanup
    adminRoleIDs = [];
    modRoleIDs = [];

    //Sets Local Varibles
    var basicServerRoles = {};

    //Saves the Server Roles to an object by name
    for (let [key, value] of sRole) {
        index = value.name;
        basicServerRoles[index] = key;
    }

    //Loops throught the Admin Role Names, pusing them to an array
    for (key in config.general.adminRoles) {
        
        //Pushes role IDs to Admin if they Match config.general.adminRoles
        if (basicServerRoles[config.general.adminRoles[key]]){
            adminRoleIDs.push(basicServerRoles[config.general.adminRoles[key]]);
        }
    }

    //Loops throught the Mod Role Names, pusing them to an array
    for (key in config.general.modRoles) {
        
        //Pushes role IDs to Mods if they Match config.general.modRoles
        if (basicServerRoles[config.general.modRoles[key]]){
            modRoleIDs.push(basicServerRoles[config.general.modRoles[key]]);
        }
    }
}

//Function that returns boolean for if the user who sent the message is an Admin (based off config.connection.adminRoles)
function adminCheck(userRolesArray, serverRolesArray) {
    
    //Calls a function that updates the server role information
    serverRoleUpdate(serverRolesArray);
    
    //Checks to see if any of the user role ids match any of the admin role ids
    for (key in userRolesArray) {
        
        for (a in adminRoleIDs) {

            if (userRolesArray[key] == adminRoleIDs [a]) {

                return true;
            }
        }
    }

    return false;
}

//Function that returns boolean for if the user who sent the message is a Moderator (based off config.connection.modRoles)
function modCheck(userRolesArray, serverRolesArray) {
    
    //Calls a function that updates the server role information
    serverRoleUpdate(serverRolesArray);
    
    //Checks to see if user role ids match any of the mod role ids
    for (key in userRolesArray) {
        
        for (a in modRoleIDs) {

            if (userRolesArray[key] == modRoleIDs [a]) {

                return true;
            }
        }
    }

    return false;
}

//#endregion

//#region handling queue functions

//Removes given user from the queue
//Returns true if it did, false if it did not
function removeUser(userTag) {
    var userIndex = queue.indexOf(userTag);

    if(userIndex != -1) {
        queue.splice(userIndex, 1);
        return true;
    } else {
        return false;
    }
}

//#endregion

//#region Start  Bot

//Logs the Bot info when bot starts
client.on("ready", () => {
    console.log(`Logged in as ${client.user.tag}!`);
    client.user.setPresence({ game: { name: `Use ${config.general.botPrefix}help to show commands` } });
    loadQueue();
    setInterval(saveQueue, 600000);
});

//#endregion

//#region message Handeling

//Handels Messages and their responses
client.on("message", message => {
    
    if (config.general.allowedChannels.indexOf(message.channel.name) != -1) {

        //Varibles for the message info needed
        var userInput = message.content.toLowerCase().split(' ');
        var command = userInput[0];
        var userRoles = message.author.lastMessage.member._roles;
        var serverRoles = message.channel.guild.roles;
        var adminTF = adminCheck(userRoles, serverRoles);
        var modTF = modCheck(userRoles, serverRoles);

        //#region Join
        // join, adds the user who sent the message to an Array containing the Queue list
        if (command == (config.general.botPrefix + 'join')){
        
            location = queue.indexOf(String(message.member.user.tag));

            if (location === -1){
                queue.push(String(message.member.user.tag));
                location = queue.indexOf(String(message.member.user.tag));
                message.reply(`You have joined at position ${location + 1} in the queue!`);
            }
            else {
                message.reply(`You are already at position ${location + 1} in the queue!`);
            }
        };
        //#endregion

        //#region Leave
        // leave, removes the user who sent the message from the Queue list
        if (command == (config.general.botPrefix + 'leave')){
            
            if (removeUser(message.member.user.tag)) {
                message.reply("You have left the queue.");
            }
            else {
                message.reply("You were not in the queue.");
            }
        };
        //#endregion

        //#region Position
        // position, returns the current queue position for the user who sent the message from the Queue list
        if (command == (config.general.botPrefix + 'position')){
            location = queue.indexOf(String(message.member.user.tag));

            if (location === -1){
                message.reply(`You are not currently in the queue!`);
            }
            else {
                message.reply(`You are at position ${location + 1} in the queue!`);
            }
        };
        //#endregion

        //#region Queue
        // queue, displays the current Queue list
        if (command == (config.general.botPrefix + 'queue')){
            arrtext = "";
            msgtxt = "";

            for (i = 0; i < queue.length; i++) {
                arrtext += (i + 1) + ' - ' + queue[i] + "\n";
            }

            if (arrtext === ""){
                arrtext = "Queue is Currently Empty."
            }

            msgtxt = '```' + arrtext + '```';
        
            message.channel.send(msgtxt);
        };
        //#endregion

        //#region Help
        // help, Lists all commands and what they do
        if (command == (config.general.botPrefix + 'help')){
            var rply = '```' + config.general.botPrefix + 'help - Displays All Commands\n' + config.general.botPrefix + 'join - Adds you to the Queue to get into a ship\n' + config.general.botPrefix + 'leave - Removes you from the Queue to get into a ship\n' + config.general.botPrefix + 'position - Displays your current position in the Queue list\n' + config.general.botPrefix + 'queue - Displays the current Queue list\n' + config.general.botPrefix + 'remove @USER - Server Admin/Creators only caommnad that removes the specified user from the Queue List\n' + config.general.botPrefix + 'clearqueue - Server Admin/Creators only command that clears the entire Queue list\n' + config.general.botPrefix + 'info - Information about the bot and its creators.```';
            message.channel.send(rply);
        };
        //#endregion

        //#region Info
        // info, returns info message
        if (command == (config.general.botPrefix + 'info')){
            message.channel.send('```Queue System Bot\nQueue system for Sea of Thieves Fleet/Alliance Servers\nDesigned and Bulit by: NobleWolf42 and DK1\nIf you would like to assist with the bot, you can find us on Discord at https://discord.gg/tgJtK7f, and on GitHub at https://github.com/NobleWolf42/Queue-Bot/.```');
        };
        //#endregion

        //#region ADMIN ONLY COMMANDS
        
        //#region ClearQueue
        // clearqueue, Server Admin/Creator only command that clears the entire Queue list
        if ((adminTF == true) && (command == (config.general.botPrefix + 'clearqueue'))){
            if (adminTF == true){
                queue = [];
                message.reply("Cleared Queue");
            }
            else {
                message.channel.send("You do not have permission to use this command.");
            }
        };
        //#endregion

        //#region Remove
        // remove @USER, Server Admin/Creator only command that removes the user specified from the Queue list
        if (command == (config.general.botPrefix + 'remove')){
            if (adminTF == true){
                if(message.mentions.users.first() !== undefined) {
                    if(removeUser(message.mentions.users.first().tag)) {
                        message.reply(`Removed ${message.mentions.users.first().tag} from the queue.`);
                    } else {
                        message.reply(`This user is not in the queue.`);
                    }
                }
                else {
                    message.reply("You did not @ a user.");
                }
            }
            else {
                message.reply("You do not have permission to use this command.");
            }
        };
        //#endregion
        //#endregion
    };
});

//#endregion