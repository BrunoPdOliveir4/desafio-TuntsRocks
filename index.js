const express = require('express');
const { google } = require('googleapis');
const path = require('path')

const app = express();
app.use(express.json());

const PORT = 3001;
async function getAuthSheets(){

  const auth = new google.auth.GoogleAuth({
    keyFile: "credentials.json",
    scopes: "https://www.googleapis.com/auth/spreadsheets"
  })

  const client = await auth.getClient();

  const googleSheets = google.sheets({
    version: "v4",
    auth: client
  });

  const spreadsheetId = "1_-cdh8uhDldiYYGqPcbxt8k4RMK0k7bEYoIRo5_jJwc";

  return {
    auth,
    client,
    googleSheets,
    spreadsheetId
  };
}

app.get('/', function (req, res) {
  const options = {
      root: path.join(__dirname)
  };

  const fileName = 'index.html';
  res.sendFile(fileName, options, function (err) {
      if (err) {
          console.error('Error sending file:', err);
      } else {
          console.log('Sent:', fileName);
      }
  });
});

// UNUSED POSSIBLE ROUTES 
//GET METADATA PADRÃO
/*
app.get("/metadata", async(req, res) => {

  const { googleSheets, auth, spreadsheetId } = await getAuthSheets();

  const metadata = await googleSheets.spreadsheets.get({
    auth,
    spreadsheetId,
  });

  res.send(metadata);
})*/

//Rota get
/*app.get("/getRows", async (req, res) =>{
  const { googleSheets, auth, spreadsheetId } = await getAuthSheets();

  const getRows = await googleSheets.spreadsheets.values.get({
    auth,
    spreadsheetId,
    range: "engenharia_de_software",
    valueRenderOption: "UNFORMATTED_VALUE"
  })
  const dataValues = getRows.data.values;

  let treatedValues = [];

  for(let value = 0; value < dataValues.length; value++){
    let thisData = dataValues[value];
    if(typeof thisData[0] === 'number'){
      let values = [thisData[3], thisData[4], thisData[5]];
    
      /*let media = await funcsRepeated.getMedia(values);
      console.log(media)

      let result = await funcsRepeated.compareMedia(media);
      
      let media = (values[0] + values[1] + values[2])/3
      console.log(media)
      switch(true){
          case media < 50:
              thisData[6] =  "Reprovado por nota";
              thisData[7] = 0;
              this
              break;
          case media < 70:
              thisData[6] = "Exame final";
              thisData[7] = (100 - (media)) * -1; 
              // 50 <= (media+naf /2 ) é igual a 100 <= media + naf, ou seja, se eu retirar a media de 100 sobra o valor que falta para naf
              break;
          case media >= 70:
              thisData[6] = "Aprovado";
              thisData[7] = 0;
              break;
      }
      
    } 
    treatedValues[value] = thisData;
  }
  console.log(treatedValues)
  res.send(getRows.data.values)
})
*/

//Rota para dar append
/*app.post("/addRows", async (req, res) => {
  const { googleSheets, auth, spreadsheetId } = await getAuthSheets();
  
  const { values } = req.body;
  const row = await googleSheets.spreadsheets.values.append({
    auth,
    spreadsheetId, 
    range: "engenharia_de_software",
    valueInputOption: "USER_ENTERED",
    resource: {
      values: values,
    }
  });

  res.send(row.data);
});*/

//dar update geral nos valores
/*app.post("/updateValues", async(req, res) => {
  const { googleSheets, auth, spreadsheetId } = await getAuthSheets();

  const { values } = req.body;

  const updateValues = await googleSheets.spreadsheets.values.update({
    spreadsheetId,
    range: "engenharia_de_software",
    valueInputOption: "USER_ENTERED",
    resource: {
      values: values,
    }
  });

  res.send(updateValues);
});*/

app.post("/sendMedia", async (req, res) => {
  // Elabora uma conexão
  const { googleSheets, auth, spreadsheetId } = await getAuthSheets();

  // Pega os dados da planilha
  const getRows = await googleSheets.spreadsheets.values.get({
    auth,
    spreadsheetId,
    range: "engenharia_de_software",
    valueRenderOption: "UNFORMATTED_VALUE"
  })
  const spreadSheetValues = getRows.data.values;

  // Pega o total de aulas
  const totalAulas = Number(spreadSheetValues[1][0].split(': ')[1]);
  
  
  // Trata os dados
  spreadSheetValues.forEach((row, index) => {    
    // Checar se é cabeçalho
    if (index <= 2) return row;
    

    // Checa se é reprovado por falta
    const faults = row[2];
    if (faults > (totalAulas/4)) {
      row[6] = "Reprovado por Faltas";
      row[7] = 0;
      return;
    }


    // Checa aprovação por exame final
    const media = Math.round((row[3] + row[4] + row[5])/3);

    if (media < 50) {
      row[6] = "Reprovado por nota";
      row[7] = 0;
      return;
    }
    
    if (media < 70) {
      row[6] = "Exame final";
      row[7] = 100 - (media)
      // 50 <= (media + naf / 2) é igual a 100 <= media + naf, ou seja, se eu retirar a media de 100 sobra o valor que falta para naf
      return;
    }
    row[6] = "Aprovado";
    row[7] = 0;

  });


  
  const updateValues = await googleSheets.spreadsheets.values.update({
    spreadsheetId,
    range: "engenharia_de_software",
    valueInputOption: "USER_ENTERED",
    resource: {
      values: spreadSheetValues,
    }
  });

  res.send(updateValues);
  
})

app.listen(PORT, () => console.log("servidor online"));