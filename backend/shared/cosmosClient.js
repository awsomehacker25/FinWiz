const { CosmosClient } = require('@azure/cosmos');

const endpoint = process.env.COSMOS_DB_URI;
const key = process.env.COSMOS_DB_KEY;

let client;

function getCosmosClient() {
  if (!client) {
    client = new CosmosClient({ endpoint, key });
  }
  return client;
}

module.exports = {
  getCosmosClient,
}; 