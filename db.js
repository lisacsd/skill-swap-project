const mysql = require('mysql2');

const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',              // ou le nom que vous utilisez
  password: 'Toccata565',              // mot de passe de Workbench
  database: 'skillswap'
});

db.connect((err) => {
  if (err) {
    console.error('Erreur de connexion à la base de données :', err);
    return;
  }
  console.log('✅ Connecté à la base de données MySQL');
});

module.exports = db;