'use strict';

const path = require('node:path');
const { createStrapi } = require('@strapi/strapi');

async function main() {
  const strapi = await createStrapi({
    distDir: path.resolve(__dirname, 'dist'),
  });

  await strapi.start();
}

main().catch((error) => {
  console.error('Error starting Strapi:', error);
  process.exit(1);
});