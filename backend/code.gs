/**
 * CONFIGURAÇÕES
 */
const NOME_ABA_VEICULOS = "Veículos";
const NOME_ABA_INSPECOES = "Inspeções";

/**
 * Função auxiliar para pegar a planilha (Vinculada)
 */
function getSS() {
  return SpreadsheetApp.getActiveSpreadsheet();
}

/**
 * Função principal que roda ao acessar a URL da Web App
 */
function doGet(e) {
  estruturarPlanilha();
  
  const action = e.parameter.action;
  
  if (action === "getVeiculos") {
    return responderJSON(buscarDados(NOME_ABA_VEICULOS));
  }
  
  if (action === "getInspecoes") {
    return responderJSON(buscarDados(NOME_ABA_INSPECOES));
  }
  
  return responderJSON({ status: "success", message: "Backend Inspeção Ativo" });
}

/**
 * Função que recebe dados via POST
 */
function doPost(e) {
  const data = JSON.parse(e.postData.contents);
  const action = data.action;
  
  if (action === "salvarInspecao") {
    return salvarDados(NOME_ABA_INSPECOES, data.payload);
  }
  
  if (action === "cadastrarVeiculo") {
    return salvarDados(NOME_ABA_VEICULOS, data.payload);
  }
  
  return responderJSON({ status: "error", message: "Ação não reconhecida" });
}

/**
 * Estrutura a planilha automaticamente
 */
function estruturarPlanilha() {
  const ss = getSS();
  
  // Aba Veículos
  let abaVeiculos = ss.getSheetByName(NOME_ABA_VEICULOS);
  if (!abaVeiculos) {
    abaVeiculos = ss.insertSheet(NOME_ABA_VEICULOS);
    abaVeiculos.appendRow(["Cod Fornecedor", "Fornecedor", "Contrato", "Cod Equipamen", "Rota", "Descricao Rota", "Descricao Veiculo", "Placa"]);
    abaVeiculos.getRange("1:1").setFontWeight("bold").setBackground("#27ae60").setFontColor("white");
  }
  
  // Aba Inspeções (Com Período)
  let abaInspecoes = ss.getSheetByName(NOME_ABA_INSPECOES);
  if (!abaInspecoes) {
    abaInspecoes = ss.insertSheet(NOME_ABA_INSPECOES);
    abaInspecoes.appendRow(["Data", "Periodo", "Periodo Completo", "Placa", "Rota", "Fornecedor", "Status", "Mecanica", "Eletrica", "Outros", "Observacoes"]);
    abaInspecoes.getRange("1:1").setFontWeight("bold").setBackground("#2980b9").setFontColor("white");
  } else {
    const headers = abaInspecoes.getRange(1, 1, 1, abaInspecoes.getLastColumn()).getValues()[0];
    // Garante que a coluna Rota exista
    if (headers.indexOf("Rota") === -1) {
      abaInspecoes.insertColumnBefore(3);
      abaInspecoes.getRange(1, 3).setValue("Rota").setFontWeight("bold").setBackground("#2980b9").setFontColor("white");
    }
    // Garante que a coluna Periodo exista
    const headersAtual = abaInspecoes.getRange(1, 1, 1, abaInspecoes.getLastColumn()).getValues()[0];
    if (headersAtual.indexOf("Periodo") === -1) {
      abaInspecoes.insertColumnAfter(1);
      abaInspecoes.getRange(1, 2).setValue("Periodo").setFontWeight("bold").setBackground("#2980b9").setFontColor("white");
      abaInspecoes.insertColumnAfter(2);
      abaInspecoes.getRange(1, 3).setValue("Periodo Completo").setFontWeight("bold").setBackground("#2980b9").setFontColor("white");
    }
  }
}

/**
 * Busca todos os dados e normaliza os headers
 */
function buscarDados(nomeAba) {
  const sheet = getSS().getSheetByName(nomeAba);
  if (!sheet) return [];
  
  const range = sheet.getDataRange();
  if (range.getNumRows() < 1) return [];
  
  const rows = range.getValues();
  const headers = rows.shift();
  
  return rows.map(row => {
    const obj = {};
    headers.forEach((header, i) => {
      const key = header.toString().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/ /g, "_");
      obj[key] = row[i];
    });
    return obj;
  });
}

/**
 * Salva dados mapeando as chaves do payload para as colunas da planilha
 */
function salvarDados(nomeAba, payload) {
  try {
    const ss = getSS();
    let sheet = ss.getSheetByName(nomeAba);
    if (!sheet) {
       estruturarPlanilha();
       sheet = ss.getSheetByName(nomeAba);
    }
    
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    
    const newRow = headers.map(header => {
      const key = header.toString().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/ /g, "_");
      return payload[key] !== undefined ? payload[key] : "";
    });
    
    sheet.appendRow(newRow);
    return responderJSON({ status: "success", message: "Dados salvos com sucesso" });
  } catch (e) {
    return responderJSON({ status: "error", message: e.toString() });
  }
}

/**
 * Auxiliar para retornar JSON
 */
function responderJSON(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
