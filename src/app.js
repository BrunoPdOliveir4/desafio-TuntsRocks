// app.js
const { google } = require('googleapis');
const path = require('path');

async function getAuthSheets() {
  const auth = new google.auth.GoogleAuth({
    keyFile: "credentials.json",
    scopes: "https://www.googleapis.com/auth/spreadsheets"
  });

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

function initializeApp(app) {
  app.get('/', serveHomePage);
  app.post('/sendMedia', processMediaData);
}

async function serveHomePage(req, res) {
  const options = {
    root: path.join(__dirname),
  };

  const fileName = './pages/index.html';
  res.sendFile(fileName, options, function (err) {
    if (err) {
      console.error('Erro ao enviar o arquivo:', err);
    } else {
      console.log('Enviado:', fileName);
    }
  });
}

async function processMediaData(req, res) {
  try {
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
  } catch (error) {
    console.error('Erro ao processar dados da mídia:', error);
    res.status(500).send('Erro interno do servidor');
  }
}

module.exports = {
  getAuthSheets,
  initializeApp,
  serveHomePage,
  processMediaData,
};
