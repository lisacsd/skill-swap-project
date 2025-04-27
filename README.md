# Skill-swap-project
Plateforme web légère d’échange de compétences entre utilisateurs — Mini-projet GreenIT EFREI 2024-2025

# SkillSwap

SkillSwap est un site éducatif et collaboratif, basé sur l’échange entre utilisateurs. 
Il s’agit d’une plateforme d’apprentissage donnant donnant, où chacun peut partager ses connaissances et compétences en échange d’en recevoir d'autres. 

# Instalation du projet
git clone https://github.com/lisacsd/skill-swap-project.git

# Lancement du projet
Il est necessaire de copier le fichier table_procedure.sql, de l'ouvrir dans MySQL et l'executer.
Dans bd.js, il faut modifier pasword par votre mot de passe du serveur MySQL.
Lancer la commande dans la console de votre IDE : node serveur.js

# Stack technique
- Front-end : HTML/CSS/JS 
- Back-end : Node.js + Express + DB + Bodyparser + express-cession
- Base de données : MySQL

# Branches
- `dev-front` : développement du front-end
- `dev-back` : développement du back-end
- `database` : modélisation et accès BDD
- `main` : code final validé (fusion des branches)

# Fonctionalités
- Création d’un profil utilisateur, 
- modification de son profil, 
- publication d’offres avec titre, description et catégorie 
- suppression de ses offres 
- consultation d’offres disponibles, 
- filtrage des thèmes par mots-clés, catégories 
- choisir certaines offres pour les mettre dans une liste “je suis intéressé”. 
- Pour les admins, il est aussi possible d’avoir accès à la liste des utilisateurs et de supprimer des comptes.