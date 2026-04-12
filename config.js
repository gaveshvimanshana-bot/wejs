const fs = require('fs');
if (fs.existsSync('config.env')) require('dotenv').config({ path: './config.env' });

function convertToBool(text, fault = 'true') {
    return text === fault ? true : false;
}
module.exports = {
SESSION_ID: process.env.SESSION_ID || "HZhTSTaR#GSbb2P9sxKEAnd9Azxm8lHr11m7owXEc-g-lcLAda-M",
ALIVE_IMG: process.env.ALIVE_IMG || "https://raw.githubusercontent.com/gaveshvimanshana-bot/hnsk/main/IMG-20260410-WA0000.jpg",
ALIVE_MSG: process.env.ALIVE_MSG || "*Hello👋 HANSA-MD Is Alive Now😍*            © by HANSAKA NIRMAN 💙",
BOT_OWNER: '94742838159',  // Replace with the owner's phone number


};
 
 
 
