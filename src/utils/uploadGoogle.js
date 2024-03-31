import {FOLDER_ID,CLIENT_ID,CLIENT_SECRET,REFREASH_TOKEN, REDIRECT_URI} from '../../config.js'

import {google} from 'googleapis'
import fs from 'fs'
import path from 'path'

const auth2Client = new google.auth.OAuth2(CLIENT_ID,CLIENT_SECRET, REDIRECT_URI);
auth2Client.setCredentials({refresh_token:REFREASH_TOKEN});
const drive = google.drive({
  version: 'v3',
  auth: auth2Client
})


async function uploadFile (fileName, id){
  try{
    const createFile = await drive.files.create({
      requestBody:{
        name:`Top 10 ${fileName}`,
        mimeType: '*/*',
        parents: [FOLDER_ID],
      },
      media:{
        mimeType:"*/*",
        body: fs.createReadStream(`./src/assets/${id}.`+fileName.split(".")[1]),

      }
    })
   return createFile.data.id;
  }
  catch (error){ console.log(error) }

}

async function setFilePublic (fileId){
  try{
    const setFilePublic = await drive.permissions.create({
      fileId,
      requestBody:{
        role:'reader',
        type: 'anyone'
      }
    })
    const getUrl = await drive.files.get({
      fileId,
      fields:'webViewLink, webContentLink'
    })
    return getUrl.data.webContentLink;
  }
  catch (error){ console.log(error); }
}

export {uploadFile, setFilePublic}