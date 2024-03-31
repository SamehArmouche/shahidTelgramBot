
import { extractAllData, generatePDF } from './src/extractData.js'
import { allCountries } from './src/utils/countries.js'
import express from 'express';
import TeleBot from "telebot";
import { BOT_TOKEN } from './config.js'



const bot = new TeleBot({
  token: BOT_TOKEN,
});
const app = express();
const port = 3000;
app.get('/', (req, res) => { });
app.listen(port, () => { });




bot.on('text',async (msg) => {
  let to = (msg.from.username==undefined?"":msg.from.username)
  if(msg.text=="/start"){
    const telebotName= await bot.getMe();
    return bot.sendMessage(msg.from.id, `Hello ${to} 😁 \n\n${telebotName.first_name} helps you to get top 10 series around the world from shahid website\n\nChoose an option:\n/powerpoint\n/pdf`);
  }
  if(msg.text!="/powerpoint" && msg.text!="/pdf"){
    return bot.sendMessage(msg.from.id, `Sorry ${to} you have entered an incorrect option !, the available options:\n/powerpoint\n/pdf`);
  }else{
    bot.sendMessage(msg.from.id, `Ok, ${to} wait please ...`);
    let option = (msg.text=="/pdf"?"PDF":"PowerPoint")
    extractAllData(option, msg.from.id)
    .then(async (link) =>{
      return bot.sendMessage(msg.from.id, `Click below to download ${option} file 👇 \n${link}`).catch(err=>console.log(err));
    })
    .catch(err=>{
      console.log(err);
      return bot.sendMessage(msg.chat.id, `Sorry ${to} try again later ... 😢\n\nIf the problem persists contact with @sameharmouche`);
    });
  }return;
});

bot.start();