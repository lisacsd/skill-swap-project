DROP DATABASE IF EXISTS SkillSwap;
CREATE DATABASE SkillSwap ;
USE SkillSwap;


CREATE TABLE Utilisateur (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nom VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    mot_de_passe VARCHAR(255) NOT NULL,
    date_inscription TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE Offre (
    id INT PRIMARY KEY AUTO_INCREMENT,
    utilisateur_id INT NOT NULL,
    titre VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    niveau ENUM('débutant', 'intermédiaire', 'avancé') NOT NULL,
    duree_estimee VARCHAR(50),  -- Ex: "2 heures", "3 jours"
    localisation VARCHAR(255),  -- Peut être "en ligne" ou une ville
    tags VARCHAR(255), 
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (utilisateur_id) REFERENCES Utilisateur(id) ON DELETE CASCADE
);





CREATE TABLE Interet (
    id INT PRIMARY KEY AUTO_INCREMENT,
    utilisateur_id INT NOT NULL,
    offre_id INT NOT NULL,
    date_interet TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (utilisateur_id) REFERENCES Utilisateur(id) ON DELETE CASCADE,
    FOREIGN KEY (offre_id) REFERENCES Offre(id) ON DELETE CASCADE
);


CREATE TABLE Categorie (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nom VARCHAR(100) UNIQUE NOT NULL
);

CREATE TABLE Offre_Categorie (
    offre_id INT NOT NULL,
    categorie_id INT NOT NULL,
    PRIMARY KEY (offre_id, categorie_id),
    FOREIGN KEY (offre_id) REFERENCES Offre(id) ON DELETE CASCADE,
    FOREIGN KEY (categorie_id) REFERENCES Categorie(id) ON DELETE CASCADE
);

ALTER TABLE Utilisateur ADD COLUMN role ENUM('utilisateur', 'admin') DEFAULT 'utilisateur';

-- -------------------------------Remplisage
INSERT INTO Utilisateur (nom, email, mot_de_passe) VALUES
('Alice Dupont', 'alice.dupont@email.com', 'password123'),
('Bob Martin', 'bob.martin@email.com', 'password456'),
('Clara Lemoine', 'clara.lemoine@email.com', 'password789');

INSERT INTO Categorie (nom) VALUES
('Développement Web'),
('Data Science'),
('Marketing Digital'),
('Graphisme'),
('Gestion de projet');



INSERT INTO Offre (utilisateur_id, titre, description, niveau, duree_estimee, localisation, tags) VALUES
(1, 'Développement d\'un site web', 'Création d\'un site web responsive avec React', 'avancé', '3 semaines', 'Paris', 'React, Web, Frontend'),
(2, 'Analyse de données avec Python', 'Projet de data science utilisant Python et Pandas pour analyser un dataset', 'intermédiaire', '2 jours', 'En ligne', 'Python, Data Science, Pandas'),
(3, 'Campagne publicitaire en ligne', 'Mise en place d une campagne de marketing digital sur les réseaux sociaux', 'débutant', '1 semaine', 'Lyon', 'Marketing, Réseaux Sociaux, Publicité');


INSERT INTO Offre_Categorie (offre_id, categorie_id) VALUES
(1, 1),  -- "Développement d'un site web" -> "Développement Web"
(2, 2),  -- "Analyse de données avec Python" -> "Data Science"
(3, 3);  -- "Campagne publicitaire en ligne" -> "Marketing Digital"

INSERT INTO Interet (utilisateur_id, offre_id) VALUES
(1, 2),  -- Alice est intéressée par l'offre "Analyse de données avec Python"
(2, 3),  -- Bob est intéressé par l'offre "Campagne publicitaire en ligne"
(3, 1);  -- Clara est intéressée par l'offre "Développement d'un site web"



INSERT INTO Utilisateur (nom, email, mot_de_passe, role) VALUES
('Admin', 'admin@email.com', 'adminpassword123', 'admin');

SELECT * FROM Utilisateur WHERE role = 'admin';





-- ------------------------------------- Fonctionnalité
DELIMITER $$

CREATE PROCEDURE AjouterUtilisateur(
    IN nom VARCHAR(100), 
    IN email VARCHAR(255), 
    IN mdp VARCHAR(255), 
    IN role VARCHAR(50)
)
BEGIN
    INSERT INTO Utilisateur (nom, email, mot_de_passe, role)
    VALUES (nom, email, mdp, COALESCE(role, 'utilisateur'));
END $$

DELIMITER ;



DROP PROCEDURE IF EXISTS CreerOffre;

DELIMITER $$


CREATE PROCEDURE CreerOffre(
    IN utilisateurID INT, 
    IN titre VARCHAR(255), 
    IN description TEXT, 
    IN niveau ENUM('débutant', 'intermédiaire', 'avancé'), 
    IN duree_estimee VARCHAR(50), 
    IN localisation VARCHAR(255), 
    IN tags VARCHAR(255),
    IN categorieID INT
)
BEGIN
    DECLARE offreID INT;


    INSERT INTO Offre (utilisateur_id, titre, description, niveau, duree_estimee, localisation, tags)
    VALUES (utilisateurID, titre, description, niveau, duree_estimee, localisation, tags);

    SET offreID = LAST_INSERT_ID();

    -- Vérifier que la catégorie existe
    IF (SELECT COUNT(*) FROM Categorie WHERE id = categorieID) > 0 THEN
        -- Associer l'offre à la catégorie existante
        INSERT INTO Offre_Categorie (offre_id, categorie_id)
        VALUES (offreID, categorieID);
    ELSE
        -- Si la catégorie n'existe pas, suppression de l'offre pour éviter des incohérences
        DELETE FROM Offre WHERE id = offreID;
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Erreur: La catégorie spécifiée n existe pas.';
    END IF;
END $$

DELIMITER ;





DELIMITER $$

CREATE PROCEDURE ModifierOffre(
    IN offreID INT, 
    IN utilisateurID INT, 
    IN nouveauTitre VARCHAR(255), 
    IN nouvelleDescription TEXT,
    IN nouveauNiveau ENUM('débutant', 'intermédiaire', 'avancé'),
    IN nouvelleDuree VARCHAR(50),
    IN nouvelleLocalisation VARCHAR(255),
    IN nouveauxTags VARCHAR(255)
)
BEGIN
    UPDATE Offre 
    SET titre = nouveauTitre, 
        description = nouvelleDescription,
        niveau = nouveauNiveau, 
        duree_estimee = nouvelleDuree, 
        localisation = nouvelleLocalisation,
        tags = nouveauxTags
    WHERE id = offreID AND utilisateur_id = utilisateurID;
END $$

DELIMITER ;



DROP PROCEDURE IF EXISTS SupprimerOffre;
DELIMITER $$

CREATE PROCEDURE SupprimerOffre(IN offreID INT, IN utilisateurID INT)
BEGIN
    -- Vérifie si l'offre existe avant de la supprimer
    IF EXISTS (SELECT 1 FROM Offre WHERE id = offreID AND utilisateur_id = utilisateurID) THEN
        DELETE FROM Offre WHERE id = offreID AND utilisateur_id = utilisateurID;
    ELSE
        -- Si l'offre n'existe pas, un message peut être retourné ou loggé ici, si nécessaire
        SELECT 'Aucune offre trouvée pour cet utilisateur à supprimer' AS Message;
    END IF;
END $$

DELIMITER ;




DROP PROCEDURE IF EXISTS AjouterInteret;

DELIMITER $$

CREATE PROCEDURE AjouterInteret(IN utilisateurID INT, IN offreID INT)
BEGIN
    -- Vérifie si l'intérêt existe déjà
    IF NOT EXISTS (SELECT 1 FROM Interet WHERE utilisateur_id = utilisateurID AND offre_id = offreID) THEN
        -- Si l'intérêt n'existe pas, l'ajouter
        INSERT INTO Interet (utilisateur_id, offre_id) 
        VALUES (utilisateurID, offreID);
    ELSE
        -- Sinon, retourner un message (ou une gestion d'erreur si nécessaire)
        SELECT 'L intérêt existe déjà pour cette offre et cet utilisateur' AS Message;
    END IF;
END $$

DELIMITER ;



DROP PROCEDURE IF EXISTS SupprimerInteret;

DELIMITER $$

CREATE PROCEDURE SupprimerInteret(IN utilisateurID INT, IN offreID INT)
BEGIN
    -- Vérifie si une entrée existe avant de la supprimer
    IF EXISTS (SELECT 1 FROM Interet WHERE utilisateur_id = utilisateurID AND offre_id = offreID) THEN
        DELETE FROM Interet 
        WHERE utilisateur_id = utilisateurID AND offre_id = offreID;
    ELSE
        -- Si l'entrée n'existe pas, un message peut être retourné ou loggé ici, si nécessaire
        SELECT 'Aucune entrée correspondante à supprimer' AS Message;
    END IF;
END $$

DELIMITER ;



DELIMITER $$

CREATE PROCEDURE SupprimerUtilisateur(IN adminID INT, IN utilisateurID INT)
BEGIN
    DECLARE adminRole ENUM('utilisateur', 'admin');
    
    -- Vérifier si l'utilisateur est bien administrateur
    SELECT role INTO adminRole FROM Utilisateur WHERE id = adminID;

    IF adminRole = 'admin' THEN
        DELETE FROM Utilisateur WHERE id = utilisateurID;
    END IF;
END $$

DELIMITER ;

-- ------------------------------ Test

call AjouterUtilisateur('Loéiz', 'ab0gmail.com', 'abcd', 'admin');

Select * from utilisateur;
Select * from categorie;
Select * from interet;
Select * from offre;
Select * from offre_categorie;

call CreerOffre(
    1, 
    'Initiation au web', 
    'Je peux vous aider a apprendre les base du web pour crée une site web simple (HTML et CSS)', 
    'débutant', 
    '2h30', 
    'Angers', 
    '#CSS #HTML',
    1
);

CALL SupprimerOffre(4, 1);
call AjouterInteret(1, 2);
call SupprimerInteret(1, 2);
call SupprimerUtilisateur(4, 5);