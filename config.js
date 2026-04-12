const fs = require('fs');
if (fs.existsSync('config.env')) require('dotenv').config({ path: './config.env' });

function convertToBool(text, fault = 'true') {
    return text === fault ? true : false;
}
module.exports = {
SESSION_ID: process.env.SESSION_ID || "HZhTSTaR#GSbb2P9sxKEAnd9Azxm8lHr11m7owXEc-g-lcLAda-M",
ALIVE_IMG: process.env.ALIVE_IMG || "https://cloud.laksidunimsara.com/f/Gavesh/1776016994166-file_0000000029e871fab9c27ac6f4da761b.png",
ALIVE_MSG: process.env.ALIVE_MSG || "*Hello👋 Vima Md Is Alive Now😍*            © by Vima  ✨",
BOT_OWNER: '94742838159',  // Replace with the owner's phone number


};
 
 
 
