// functions/authorize-purchase.js
const admin = require('firebase-admin');

// Configuração do Firebase Admin (mantém-se igual)
const serviceAccount = {
  type: "service_account",
  project_id: process.env.FIREBASE_PROJECT_ID,
  private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
  private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  client_email: process.env.FIREBASE_CLIENT_EMAIL,
  client_id: process.env.FIREBASE_CLIENT_ID,
  auth_uri: "https://accounts.google.com/o/oauth2/auth",
  token_uri: "https://oauth2.googleapis.com/token",
  auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
  client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL
};

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

exports.handler = async function (event, context) {
  // ... (cabeçalhos e validação do método OPTIONS mantêm-se iguais)
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers };
  }
  
  // Validação de Segurança do hottok (mantém-se igual)
  const hotmartToken = event.headers['x-hotmart-hottok'];
  if (hotmartToken !== process.env.HOTMART_HOTTOK) {
    return { statusCode: 401, body: 'Acesso não autorizado.', headers };
  }

  try {
    const data = JSON.parse(event.body);

    if (data.event === 'PURCHASE_APPROVED') {
      const buyerEmail = data.data.buyer.email;
      const purchaseDate = new Date(data.creation_date);

      // --- INÍCIO DA ALTERAÇÃO ---
      // Calcula a data de expiração para 1 ano (365 dias) após a compra
      const expirationDate = new Date(purchaseDate);
      expirationDate.setDate(expirationDate.getDate() + 365); 
      // --- FIM DA ALTERAÇÃO ---

      if (buyerEmail) {
        console.log(`Liberando acesso para: ${buyerEmail} até ${expirationDate.toISOString()}`);
        
        // Salva os dados no Firestore, incluindo a nova data de expiração
        await db.collection('authorizedEmails').doc(buyerEmail).set({
          name: data.data.buyer.name,
          purchaseDate: purchaseDate,
          expirationDate: expirationDate, // NOVO CAMPO
          product: data.data.product.name,
        }, { merge: true }); // Usar merge: true para não apagar dados se o cliente recomprar

        console.log("E-mail e data de expiração salvos com sucesso!");
      }
    }

    return {
      statusCode: 200,
      body: 'Notificação recebida com sucesso!',
      headers
    };

  } catch (error) {
    console.error("Erro ao processar webhook da Hotmart:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Ocorreu um erro interno." }),
      headers
    };
  }
};