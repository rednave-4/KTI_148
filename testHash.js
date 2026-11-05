const argon2 = require('argon2');

async function generate() {
  const hash = await argon2.hash('evanganteng');
  console.log('HASH ASLI:', hash);
}

generate();