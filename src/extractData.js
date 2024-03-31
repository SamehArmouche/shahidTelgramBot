
import { URL_API } from '../config.js';
import { allCountries } from './utils/countries.js'

// Importing modules PDF
import PDFDocument from 'pdfkit'
import fs from 'fs'

import SlideSettings from 'nodejs-pptx';
import PPTX from 'nodejs-pptx';
import { uploadFile, setFilePublic } from './utils/uploadGoogle.js'

async function extractData (country, language){
  var result=[];
  return fetch(URL_API + country + "&language=" + language)
  .then((response) => response.json().catch(err => console.log(err)))
  .then((data) => {
    if(data.responseCode==200){
      for(let i=0;i<data.productList?.products?.length;i++){
        var topItem = {};
        topItem.rank=data.productList.products[i].rank;
        topItem.title = data.productList.products[i].title;
        topItem.img = data.productList.products[i].image.posterImage.split("?height=")[0];
        result.push(topItem);
      }
    }
    else{
      //console.log("Unable to fetch data for country - "+allCountries[country.toLowerCase()])
    }
      return result;
  })
  .catch(function (err) {
      console.log("Unable to fetch data for country -", country," err ",err);
      return result;
  });
};

async function extractAllData(type, id){
  let result = [];
  let fileName="";
  const date = new Date();
  const timeDecomposition=date.toLocaleString('en-US', { timeZone: 'Asia/Dubai' }).split(",");  
  var current_date = timeDecomposition[0].replaceAll("/","-")+"T"+timeDecomposition[1].substring(1,timeDecomposition[1].lastIndexOf(":"));

  process.stdout.write("Wait for result \n");
  /*for(let i=0; i<countries.length; i++){
    process.stdout.write(".");
    if(Number.isInteger(i/10) && i!=0)
      process.stdout.write("\n")
    var data={};
    data.country=countries[i];
    data.series=await extractData(countries[i],"EN");
    result.push(data)
  }
  //await generatePDF(result);
  */

  for (const key in allCountries){
    var data={};
    var series = await extractData(key.toUpperCase(),"EN");
    data.country=key;
    if(series.length!=0){
      data.series=series;
      data.statusCode=200;
      data.countryName=allCountries[key];
    }else{
      data.series=["Error with "+allCountries[key]];
      data.statusCode=400;
    }
    result.push(data)
  }
  fileName = (type=='PowerPoint'?await generatePPTX(result, id):await generatePDF(result, id))
  const fileId = await uploadFile(`${fileName}`,`${id}`)
  const link = await setFilePublic(fileId)
  fs.unlinkSync(`./src/assets/${id}.`+fileName.split(".")[1]);
  if(link==undefined) throw "error upload"
  console.log("Successful operation")
  return link;
}

const generatePPTX = async (data, id) =>{
  let pptx = new PPTX.Composer();
  const date = new Date();
  let options = {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: 'Asia/Dubai'
  };
  let current_date = date.toLocaleString('en-GB',options).replaceAll(" ","-")
  await pptx.compose(async pres => {
    pres.addSlide(slide => {
      slide.backgroundColor('181D25');
      slide.addImage(image => {
        image
          .file(`./src/assets/shahid.jpg`)
          .x(240)
          .y(130)
          .cx(250);
      });

      slide.addText(text => {
        text
          .value("Top 10 Series around the world")
          .x(170)
          .y(230)
          .cx(390)
          .fontFace('Alien Encounters')
          .textColor("0074BC")
          .textWrap("none")
          .fontSize(30)
          .textVerticalAlign('center')
          .margin(0);
      });
      slide.addText(text => {
        text
          .value(current_date)
          .x(300)
          .y(270)
          .cx(130)
          .fontFace('Alien Encounters')
          .textColor("0074BC")
          .textWrap("none")
          .fontSize(24)
          .textVerticalAlign('center')
          .margin(0);
      });
    })
    for (let i=0; i<data.length; i++){
      if(data[i].statusCode==200){
        await pres.addSlide(async slide => {
          slide.backgroundColor('181D25');
          // Images can be downloaded from the internet.
          await slide.addImage({
            src: `https://flagsapi.com/${data[i].country.toUpperCase()}/shiny/64.png`,
            href: 'https://www.google.com',
            x: 14,
            y: 40,
          });
          slide.addImage(image => {
            image
              .file(`./src/assets/shahid.jpg`)
              .x(580)
              .y(10)
              .cx(130);
          });
          slide.addText(text => {
            text
              .value(data[i].countryName)
              .x(14)
              .y(10)
              .cx(400)
              .fontFace('Alien Encounters')
              .textColor("FFFFFF")
              .textWrap("none")
              .fontSize(20)
              .textVerticalAlign('center')
              .margin(0);
          });
          var posImgX=14;
          var posLogoTopRankingX=120;
          var posImgY=100;
          var cx=130;
          var cy=180;
          var count =0;
          for (let j=0; j<data[i].series.length; j++){
            let serie = data[i].series[j]; 
            if(j==5) {
              count=0;
              posImgY+=cy+40;
            }
            const imagee = await fetchImage(serie.img+"?height=720?width=507?croppingPoint=26?version=26");
            const buffer = Buffer.from(imagee);

            const base64String = buffer.toString('base64');
            slide.addImage(image => {
              image
                .data(base64String)
                .x(posImgX+(count*(cx+10)))
                .y(posImgY)
                .cx(cx)
                .cy(cy);
            });
            slide.addImage(image => {
              image
                .file(`./src/assets/${data[i].series[j].rank}.png`)
                .x(posLogoTopRankingX+(count*(cx+10)))
                .y(posImgY-6)
                .cx(30);
            });
            count++;
          }
        });
      }
    }
    pres.addSlide(slide => {
      slide.backgroundColor('181D25');
      slide.addText(text => {
        text
          .value("Thanks")
          .x(320)
          .y(230)
          .cx(390)
          .fontFace('Alien Encounters')
          .textColor("0074BC")
          .textWrap("none")
          .fontSize(30)
          .textVerticalAlign('center')
          .margin(0);
      });
    });
  });
  await pptx.save(`./src/assets/${id}.pptx`);
  return `${current_date}.pptx`
}

async function generatePDF (data, id){
  // Create a document
  const doc = new PDFDocument({size: [620,480]})
  let imageWidth = 240
  let margin =20;
  // Saving the pdf file in root directory with current date name.

  const date = new Date();
  let options = {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: 'Asia/Dubai'
  };
  let current_date = date.toLocaleString('en-GB',options).replaceAll(" ","-")

  doc.pipe(fs.createWriteStream(`src/assets/${id}.pdf`));
  doc
  .rect(0, 0, doc.page.width, doc.page.height).fill('#181d25')
  .image("./src/assets/shahid.jpg", 
    doc.page.width/2 - imageWidth/2,doc.y,{
    width:imageWidth
  });
  
  doc.fontSize(30)
  doc
  .fillColor('#0074BC')
  .text("Top 10 Series around the world", 0, (doc.page.height/3)+35, {
    width: 640,
    align: 'center'
    }
  );

   doc.fontSize(25)
   doc
   .fillColor('#0074BC')
   .text(current_date, 0, (doc.page.height/3)+75, {
     width: 640,
     align:'center'
    }
    );

    let widthImageSerie=100;
    let yStartImageSerie=110;
    for (let i=0; i<data.length; i++){
      if(data[i].statusCode==200){
        const flag= await fetchImage(`https://flagsapi.com/${data[i].country.toUpperCase()}/shiny/64.png`);
        doc
        .addPage()
        .rect(0, 0, doc.page.width, doc.page.height).fill('#181d25')
        .fillColor('white')
        .text(data[i].countryName, margin, 20,{})
        .image(flag,margin, 45, {width:40})
        .image('./src/assets/shahid.jpg',doc.page.width-105, margin, {width:90});
        var count =0;
        for (let j=0; j<data[i].series.length; j++){
          const img = await fetchImage(encodeURI(data[i].series[j].img)+"?height=720?width=507?croppingPoint=26?version=26");
          if(j>4) {
            doc.image(img,margin+(count*(widthImageSerie+20)) , yStartImageSerie+190, {width:widthImageSerie});
            doc.image(`./src/assets/${data[i].series[j].rank}.png`,105+(count*(widthImageSerie+20)) , yStartImageSerie-6+190, {width:20});
          }else{
            doc.image(img,margin+(j*(widthImageSerie+20)) , yStartImageSerie, {width:widthImageSerie});
            doc.image(`./src/assets/${data[i].series[j].rank}.png`,105+(j*(widthImageSerie+20)) , yStartImageSerie-6, {width:20});
          }
          count++;
          if(j==4){
            count=0;
          }
        }
      }
    }

  doc
  .addPage()
  .rect(0, 0, doc.page.width, doc.page.height).fill('#181d25')
  doc.fontSize(30)
  doc
  .fillColor('#0074BC')
  .text("Thanks", 0, (doc.page.height/3)+35, {
    width: 640,
    align: 'center'
    }
  );
  doc.end();
  return `${current_date}.pdf`
}

const fetchImage = async (src) => {
  const response = await fetch(src);
  const image = await response.arrayBuffer();
  return image;
};

export {extractAllData,generatePDF}