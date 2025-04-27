const express = require('express');
const db = require('./db');
const bodyParser = require('body-parser');
const app = express();
const path = require('path');
const session = require('express-session');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.json()); // Pour parser le JSON des requêtes
app.use(session({
  secret: 'votre_clé_secrète_à_changer',
  resave: false,
  saveUninitialized: false
}));
// Autoriser les fichiers statiques (HTML, CSS, JS) depuis /public
app.use(express.static(path.join(__dirname, 'public')));


//post
//route pour créer un utilisateur
app.post('/api/inscription', (req, res) => {
  const { username, email, password } = req.body;

  const sql = 'CALL AjouterUtilisateur(?, ?, ?, ?)';
  db.query(sql, [username, email, password, 'utilisateur'], (err, results) => {
    if (err) {
      console.error('Erreur lors de l\'inscription :', err);
      return res.status(500).json({ message: "Erreur serveur." });
    } else {
      res.status(200).json({ message: "Inscription réussie." });
    }
  });
});

app.post('/api/login', (req, res) => {
  const { email, password } = req.body;

  const sql = 'SELECT * FROM Utilisateur WHERE email = ?';
  db.query(sql, [email], (err, results) => {
    if (err) {
      console.error('Erreur lors de la connexion :', err);
      return res.status(500).json({ message: "Erreur serveur." });
    }

    if (results.length === 0) {
      return res.status(401).json({ message: "Email non trouvé." });
    }

    const utilisateur = results[0];

    if (utilisateur.mot_de_passe !== password) {
      return res.status(401).json({ message: "Mot de passe incorrect." });
    }

    // Authentification réussie : on stocke l'utilisateur dans la session
    req.session.utilisateur = {
      id: utilisateur.id,
      nom: utilisateur.nom,
      email: utilisateur.email,
      role: utilisateur.role
    };

    res.status(200).json({ message: "Connexion réussie." });
  });
});

app.post('/api/creer-offre', (req, res) => {
  // Vérifier d’abord que la session existe
  if (!req.session.utilisateur) {
    return res.status(401).json({ message: 'Non autorisé — veuillez vous connecter.' });
  }

  //  Maintenant on peut lire l'ID de l'utilisateur
  const utilisateurID = req.session.utilisateur.id;
  const {
    titre,
    description,
    niveau,
    duree_estimee,
    localisation,
    tags,
    categorieID
  } = req.body;

  // Appel à la procédure stockée
  db.query(
    'CALL CreerOffre(?, ?, ?, ?, ?, ?, ?, ?)',
    [utilisateurID, titre, description, niveau, duree_estimee, localisation, tags, categorieID],
    (err) => {
      if (err) {
        console.error("Erreur création offre :", err);
        return res.status(500).json({ message: 'Erreur serveur lors de la création de l’offre.' });
      }
      res.json({ message: 'Offre créée avec succès !' });
    }
  );
});

// Route pour ajouter un intérêt
app.post('/api/interet', (req, res) => {
  // 1) Vérifier que l’utilisateur est connecté
  if (!req.session.utilisateur) {
    return res.status(401).json({ message: 'Non autorisé — connectez-vous d’abord.' });
  }

  const utilisateurID = req.session.utilisateur.id;
  const { offreID } = req.body;

  // 2) Appel de la procédure stockée AjouterInteret
  db.query(
    'CALL AjouterInteret(?, ?)',
    [utilisateurID, offreID],
    (err, results) => {
      if (err) {
        console.error('Erreur lors de l’ajout de l’intérêt :', err);
        return res.status(500).json({ message: 'Erreur serveur.' });
      }
      // 3) Succès
      res.json({ message: 'Intérêt enregistré !' });
    }
  );
});

//deconnexion 
app.post("/api/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).send("Erreur lors de la déconnexion");
    }
    res.clearCookie("connect.sid"); // Enlève le cookie de session
    res.status(200).send("Déconnexion réussie");
  });
});


//get
// Route pour récupérer les offres de l'utilisateur connecté
app.get('/api/mes-offres', (req, res) => {
  // 1) Vérifier que l'utilisateur est connecté
  if (!req.session.utilisateur) {
    return res.status(401).json({ message: 'Non autorisé' });
  }

  const userId = req.session.utilisateur.id;
  const sql = `
    SELECT 
      o.id,
      o.titre,
      o.description,
      o.niveau,
      o.duree_estimee,
      o.localisation,
      o.tags,
      GROUP_CONCAT(u.nom SEPARATOR ', ') AS interesses
    FROM Offre o
    LEFT JOIN Interet i ON i.offre_id = o.id
    LEFT JOIN Utilisateur u ON u.id = i.utilisateur_id
    WHERE o.utilisateur_id = ?
    GROUP BY o.id, o.titre, o.description, o.niveau, o.duree_estimee, o.localisation, o.tags
    ORDER BY o.date_creation DESC
  `;
  db.query(sql, [userId], (err, results) => {
    if (err) {
      console.error('Erreur récupération mes offres :', err);
      return res.status(500).json({ message: 'Erreur serveur' });
    }
    res.json(results);
  });
});

app.get('/api/offres', (req, res) => {
  const userId = req.session.utilisateur ? req.session.utilisateur.id : null;

  let sql = `
    SELECT o.id,
           o.titre,
           o.description,
           o.niveau,
           o.duree_estimee,
           o.localisation,
           o.tags,
           u.nom
    FROM Offre o
    JOIN Utilisateur u
      ON o.utilisateur_id = u.id
  `;
  const params = [];

  if (userId) {
    sql += `
      WHERE o.utilisateur_id <> ?
        AND NOT EXISTS (
          SELECT 1
          FROM Interet i
          WHERE i.offre_id = o.id
            AND i.utilisateur_id = ?
        )
    `;
    params.push(userId, userId);
  }

  db.query(sql, params, (err, results) => {
    if (err) {
      console.error("Erreur lors de la récupération des offres :", err);
      return res.status(500).json({ error: "Erreur serveur" });
    }
    res.json(results);
  });
});

// Récupérer toutes les offres auxquelles l'utilisateur connecté s'est inscrit
app.get('/api/inscriptions', (req, res) => {
  if (!req.session.utilisateur) {
    return res.status(401).json({ message: 'Non autorisé' });
  }

  const userId = req.session.utilisateur.id;

  const sql = `
    SELECT 
      o.id,
      o.titre,
      o.description,
      u.nom AS auteur,
      GROUP_CONCAT(ui.nom SEPARATOR ', ') AS interesses
    FROM Interet i                -- l'intérêt de l'utilisateur
    JOIN Offre o ON i.offre_id = o.id
    JOIN Utilisateur u 
      ON o.utilisateur_id = u.id   -- l'auteur de l'offre
    LEFT JOIN Interet i2 
      ON i2.offre_id = o.id        -- tous les autres intérêts
    LEFT JOIN Utilisateur ui 
      ON ui.id = i2.utilisateur_id -- les utilisateurs intéressés
    WHERE i.utilisateur_id = ?     -- filtre sur l'utilisateur connecté
    GROUP BY o.id, o.titre, o.description, auteur
    ORDER BY o.date_creation DESC
  `;

  db.query(sql, [userId], (err, results) => {
    if (err) {
      console.error('Erreur récupération inscriptions :', err);
      return res.status(500).json({ message: 'Erreur serveur' });
    }
    res.json(results);
  });
});

app.get('/api/user', (req, res) => {
  if (!req.session.utilisateur) {
    return res.status(401).json({ message: "Non connecté." });
  }
  res.json(req.session.utilisateur);
});

//Liste de tous les utilisateurs (admin only)
app.get('/api/utilisateurs', (req, res) => {
  if (!req.session.utilisateur || req.session.utilisateur.role !== 'admin') {
    return res.status(401).json({ message: 'Non autorisé' });
  }
  db.query('SELECT id, nom, email FROM Utilisateur', (err, rows) => {
    if (err) return res.status(500).json({ message: 'Erreur serveur' });
    res.json(rows);
  });
});

// Route par défaut (facultative si index.html est bien dans /public)
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});



///put
//modifier le profil user
app.put('/api/user', (req, res) => {
  if (!req.session.utilisateur) {
    return res.status(401).json({ message: 'Non autorisé' });
  }

  const userId = req.session.utilisateur.id;
  const { nom, email, mot_de_passe } = req.body;

  // Mise à jour en base
  const sql = `
    UPDATE Utilisateur 
    SET nom = ?, email = ?, mot_de_passe = ?
    WHERE id = ?
  `;

  db.query(sql, [nom, email, mot_de_passe, userId], (err) => {
    if (err) {
      console.error('Erreur mise à jour profil :', err);
      return res.status(500).json({ message: 'Erreur serveur' });
    }

    // Met à jour la session pour refléter les nouvelles infos
    req.session.utilisateur.nom  = nom;
    req.session.utilisateur.email = email;

    res.json({ message: 'Profil mis à jour avec succès', nom, email });
  });
});



//delete
// Supprimer un intérêt pour l'utilisateur connecté
app.delete('/api/interet', (req, res) => {
  if (!req.session.utilisateur) {
    return res.status(401).json({ message: 'Non autorisé' });
  }
  const utilisateurID = req.session.utilisateur.id;
  const { offreID } = req.body;

  db.query(
    'CALL SupprimerInteret(?, ?)',
    [utilisateurID, offreID],
    (err) => {
      if (err) {
        console.error('Erreur suppression intérêt :', err);
        return res.status(500).json({ message: 'Erreur serveur' });
      }
      res.json({ message: 'Intérêt supprimé' });
    }
  );
});

// Supprimer une offre (uniquement par son auteur ou par un admin)
app.delete('/api/offres/:id', (req, res) => {
  // Vérifier session
  if (!req.session.utilisateur) {
    return res.status(401).json({ message: 'Non autorisé' });
  }

  const offreID = parseInt(req.params.id, 10);
  const userID  = req.session.utilisateur.id;
  const userRole = req.session.utilisateur.role; // 'utilisateur' ou 'admin'

  // Si l'utilisateur est ni l'auteur, ni admin, refuser
  const checkSql = 'SELECT utilisateur_id FROM Offre WHERE id = ?';
  db.query(checkSql, [offreID], (err, rows) => {
    if (err) {
      console.error('Erreur vérification offre :', err);
      return res.status(500).json({ message: 'Erreur serveur' });
    }
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Offre introuvable' });
    }
    const auteurID = rows[0].utilisateur_id;
    if (auteurID !== userID && userRole !== 'admin') {
      return res.status(403).json({ message: 'Accès refusé' });
    }

    // Appel de la procédure stockée SupprimerOffre
    db.query('CALL SupprimerOffre(?, ?)', [offreID, userID], (err2) => {
      if (err2) {
        console.error('Erreur suppression offre :', err2);
        return res.status(500).json({ message: 'Erreur serveur lors de la suppression' });
      }
      res.json({ message: 'Offre supprimée avec succès' });
    });
  });
});

// Suppression d'un utilisateur (appelle votre procédure)
app.delete('/api/utilisateur/:id', (req, res) => {
  const adminID = req.session.utilisateur?.id;
  const targetID = parseInt(req.params.id, 10);
  if (!adminID) {
    return res.status(401).json({ message: 'Non autorisé' });
  }
  db.query('CALL SupprimerUtilisateur(?, ?)', [adminID, targetID], (err) => {
    if (err) {
      console.error('Erreur suppression utilisateur:', err);
      return res.status(500).json({ message: 'Erreur serveur' });
    }
    res.json({ message: 'Utilisateur supprimé' });
  });
});



// Lancer le serveur
app.listen(3000, () => {
  console.log('Serveur en cours d\'exécution sur le port 3000');
});
