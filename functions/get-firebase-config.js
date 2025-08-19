exports.handler = async function (event, context) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  try {
    const firebaseConfig = {
      apiKey: process.env.FIREBASE_API_KEY,
      authDomain: process.env.FIREBASE_AUTH_DOMAIN,
      projectId: process.env.FIREBASE_PROJECT_ID,
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.FIREBASE_APP_ID,
      measurementId: process.env.FIREBASE_MEASUREMENT_ID
    };

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(firebaseConfig),
    };

  } catch (error) {
    console.error("Erro ao carregar a configuração do Firebase:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "Não foi possível carregar a configuração." }),
    };
  }
};
