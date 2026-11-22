<!-- 프랑스어 가이드북 원고. 원본과 장·쪽·그림 순서를 맞춘다. python tools/guidebook/build.py 로 적용한다. -->


## Premiers pas

Chaque écran est illustré avec des numéros rouges et la fonction des boutons correspondants. **← →** tourne les pages ; cliquez sur une image pour l’agrandir.

### Écran d’accueil

![Écran d’accueil](guide/p01_title)

| # | Bouton | Fonction |
| --- | --- | --- |
| 1 | Nouvelle traversée | Créer un amiral et commencer le 1 mai 1480 dans son port d’origine |
| 2 | Première traversée (didacticiel) | Traversée guidée en 18 étapes, au départ de Séville en 1480. Les compagnons expliquent chaque étape |
| 3 | Mode histoire | Choisir un personnage sur la carte du monde et suivre son histoire (La photographie de mon père, L’Impératrice des pirates…) |
| 4 | Charger un journal de bord | Charger l’un des 5 emplacements automatiques ou des 5 journaux d’auberge |
| 5 | Commandes | Résumé des commandes et accès à ce guide |
| 6 | Affichage · Police | Taille du texte, police et rendu (deux pages plus loin) |

### Créer un amiral

![Créer un amiral](guide/p02_create)

| # | Bouton | Fonction |
| --- | --- | --- |
| 1 | Visage précédent · Visage suivant | Choisir l’apparence. À quarante ans, le visage devient celui d’un quadragénaire barbu |
| 2 | Nom · Nom | Saisir séparément prénom et nom. Le bouton voisin propose un autre nom |
| 3 | Anniversaire | Détermine le signe du zodiaque, qui ajoute +6 à un attribut |
| 4 | Âge (18–40 ans) | La jeunesse favorise vitalité et force ; l’âge favorise intelligence, charisme et points bonus |
| 5 | Nationalité | Portugal (départ de Lisbonne) · Espagne (départ de Séville) |
| 6 | Métier | Les compétences initiales diffèrent (tableau ci-dessous) |
| 7 | Difficulté | Facile · Normale · Règles strictes (tableau ci-dessous) |
| 8 | Attributs ＋ − | Répartir les points bonus d’âge entre vitalité, intelligence, force et charisme |
| 9 | Relancer les dés | Tirer de nouveaux attributs |
| 10 | Compétences · Langues ＋ − | Employer les points restants pour améliorer les 17 compétences et les langues |
| 11 | Accueil | Abandonner la création |
| 12 | Prêt à appareiller | Commencer avec ces choix |

### Métiers et difficulté

- Bonus d’âge : 4 + (âge − 18) × 0,5 points d’attributs ; 3 + (âge − 18) ÷ 4 points de compétences.
- Bonus de connaissances : +1 point de compétences tous les 15 points d’intelligence à partir de 40 (jusqu’à +3) ; +4 à partir de 99.

| Métier | Compétences initiales |
| --- | --- |
| Explorateur | Navigation 2 · Arpentage 2 · Manœuvre 1 |
| Archéologue | Histoire 2 · Éloquence 2 |
| Chasseur | Manœuvre 3 · Sciences 1 |
| Conquérant | Escrime 3 · Artillerie 1 |
| Missionnaire | Théologie 3 · Éloquence 1 |
| Marchand | Comptabilité 3 · Éloquence 1 (premier navire : caravelle) |
| Soldat | Artillerie 2 · Tir 2 |

| Difficulté | Entrées et départs | Or initial | Sauvegarde |
| --- | --- | --- | --- |
| Facile | 1 jour | 5,000 pièces d’or | Partout |
| Normale | 3 jours | 3,000 pièces d’or | À l’auberge |
| Règles strictes | 10 jours | 3,000 pièces d’or | Uniquement à l’auberge d’une ville de votre nation |

### Affichage · Police

![Fenêtre Affichage · Police](guide/p03_display)

| # | Bouton | Fonction |
| --- | --- | --- |
| 1 | Taille du texte | DEFAULT adapte la taille à l’écran et à sa densité de pixels. Les fenêtres et menus suivent l’échelle (sur cet appareil seulement) |
| 2 | Police | DEFAULT choisit Nanum Myeongjo sur un écran dense et Noto Serif KR sur un écran moins dense |
| 3 | Rendu du texte | Net (par défaut) : texte dessiné à la résolution réelle ; Classique : tout l’écran est agrandi |

### Sauvegarde

- **Sauvegarde automatique** — Toutes les minutes, les 5 emplacements sont utilisés à tour de rôle en remplaçant le plus ancien. Désactivable dans les paramètres.
- **Journal d’auberge** — À l’auberge, choisissez « Services → Écrire le journal de bord (sauvegarder) », ou sauvegardez chez vous, dans l’un des 5 emplacements.
- Avec les règles strictes, vous ne pouvez écrire votre journal qu’à l’auberge d’une ville de votre nation.

## Ville

### Écran de ville

![Les rues de Lisbonne](guide/p04_city)

| # | Bouton | Fonction |
| --- | --- | --- |
| 1 | Date · Ville · Langue | Langue : niveau du groupe, interprètes compris, dans la langue locale ●○○ |
| 2 | Latitude · Longitude | Toujours affichées en ville |
| 3 | Vivres · Eau potable · Fatigue | Vivres et eau en jours restants. Moins de 7 : réserves faibles ; moins de 3 : urgence |
| 4 | Contrat | Jours restants. Survol : mécène, objectif et échéance |
| 5 | Or · Renommée · Rang | Rang : appellation liée à la renommée, en l’absence de titre de noblesse |
| 6 | Nom de la ville | Pays souverain, dirigeant, culture, religion et langue |
| 7 | Activités en ville | Jusqu’à 6 lignes : contrat à présenter, commerce rentable, préparatifs du départ, etc. Cliquez pour rejoindre le bâtiment |
| 8 | Liste des bâtiments | Cliquez pour que l’amiral s’y rende et entre. Les découvertes urbaines (★) y figurent aussi |
| 9 | Rue | ←→ marcher · Maj courir · ↑ entrer ; cliquer sur un bâtiment fonctionne aussi |
| 10 | Boutons du carnet | Amiral, flotte, inventaire, découvertes, contrats, missions, carte, journal et carnet : ouvre l’onglet correspondant |
| 11 | Paramètres | Fenêtre des paramètres (plus loin) |

- Entrer dans un bâtiment fait passer une journée.
- Le rang progresse avec la renommée. Le tableau ci-dessous présente les appellations, jusqu’à la dernière à 2 millions de renommée. Un titre de noblesse est affiché en priorité dans la barre supérieure.


{{명성_칭호}}

### Carnet de navigation

![Carnet de navigation — Onglet Amiral](guide/p05_book)

| # | Onglet | Contenu |
| --- | --- | --- |
| 1 | Amiral | Âge · Renommée par domaine · Or · Dépôts · Infamie · Santé · Titre de noblesse · Armes · Conjoint · Enfants · Attributs · Compétences · Chevaux |
| 2 | Flotte | Discipline, fatigue, équipage minimal et maximal, vivres, eau, cargaison, navires et vitesse de la flotte (déterminée par le plus lent) |
| 3 | Compagnons | Attributs des compagnons (vitalité, intelligence, force, charisme), compétences et langues |
| 4 | Navigateurs itinérants | Navigateurs dont vous connaissez la position et lieu au moment de la nouvelle |
| 5 | Inventaire | Jusqu’à 40 places : équiper, jeter et lire |
| 6 | Découvertes | Nombre de découvertes, carte complétée et cartes par catégorie (rapportées, annoncées, non signalées, rivaux) |
| 7 | Indices | Indices recueillis |
| 8 | Succès | Succès |
| 9 | Contrats · Missions | Contrats des mécènes et missions de la guilde |
| 10 | Carnet de commerce | Prix des villes visitées et demande selon l’époque |
| 11 | Situation en Europe | Relations entre pays européens |
| 12 | Carte marine | Mers explorées et expérience des routes |
| 13 | Journal de bord | Événements datés, les plus récents en premier |

- Après avoir entendu sa position à la taverne, un navigateur itinérant reste 59 jours dans ce port. Une nouvelle demande au sujet de la même personne ne prolonge pas le délai : le nombre de jours restants diminue normalement. L’onglet « Navigateurs itinérants » l’indique aussi.
- Cet onglet ne recense que les navigateurs rencontrés, localisés par une nouvelle ou ayant voyagé avec vous. Le lieu est celui où ils se trouvaient au moment de l’information ; avec le temps, il s’estompe et devient « Autrefois à… ».
- À la taverne, demandez à la serveuse de retrouver un navigateur et saisissez son nom exact. S’il n’est pas trop loin, elle interrogera les marins des environs. Revenez la voir plus tard pour obtenir la réponse.
- Avec l’âge de l’amiral et les années de voyage, des compagnons peuvent mourir, tomber malades ou quitter le bord pour d’autres raisons. Les médicaments en cale, le médecin du navire ou celui d’un port peuvent parfois les sauver.

### Paramètres

![Fenêtre des paramètres](guide/p06_settings)

| # | Option | Fonction |
| --- | --- | --- |
| 1 | Difficulté | Difficulté actuelle et lieux où sauvegarder |
| 2 | Effets sonores · Musique | Volume |
| 3 | Plein écran | Plein écran du jeu ; F11 l’active ou le quitte aussi |
| 4 | Graphismes | Rapide · Moyen |
| 5 | Taille du texte | Comme dans « Affichage · Police » |
| 6 | Police | Comme dans « Affichage · Police » |
| 7 | Rendu du texte | Comme dans « Affichage · Police » |
| 8 | Sauvegarde automatique | Oui · Non |
| 9 | Secousses et éclairs des batailles navales | Oui · Non |

### Paramètres (suite)

Faites défiler la fenêtre pour voir la suite :

| Option | Fonction |
| --- | --- |
| Conversations des compagnons lors des découvertes | Oui · Non |
| Flèches en mer | Directions (↑ nord ↓ sud ← ouest → est) / Gouverne manuelle (maintenir ↑ pour avancer, ←→ pour tourner, ↓ pour arrêter) |
| Suivi de la souris | Activé : un clic puis la direction suit la souris ; désactivé : rejoindre le point cliqué |
| Sensibilité des commandes | Lente · Normale · Rapide : vitesse des changements de direction à la souris et aux flèches |
| Confirmation d’entrée en ville | Notification seule · Demander à l’arrêt · Toujours demander |
| Raccourcis clavier | Cliquez sur une action puis sur la nouvelle touche. Une touche déjà utilisée échange les deux affectations |

## Bâtiments

### Port

![Port](guide/p10_harbor)

| # | Bouton | Fonction |
| --- | --- | --- |
| 1 | Préparatifs du départ | Équipage, réparations, vivres, eau et matériaux en une seule opération (page suivante) |
| 2 | Appareiller | Prendre la mer. Une route connue permet aussi de partir en navigation automatique |
| 3 | Approvisionnement | Régler séparément vivres et eau (jours) et matériaux (tonneaux). Les réserves retirées sont revendues à 50 % du prix d’approvisionnement |
| 4 | Organiser la flotte | Jusqu’à 5 navires ; le premier est le navire amiral. Changer de navire amiral, équipages automatiques, entrées et sorties des docks, démantèlement |
| 5 | Renseignements sur les villes | Acheter la position d’une ville inconnue pour l’ajouter à la carte : 40 + taille de la ville × 20 pièces |
| 6 | Annoncer une découverte | Annoncer une découverte au monde : renommée seulement (grisé sans découverte disponible) |

- Départ impossible : aucun navire, moins de 5 marins ou moins d’un tiers de l’effectif minimal, ou moins de 2 jours de vivres ou d’eau.
- Les ports des mers de mousson proposent aussi un état de la mousson.
- Les docks gardent les navires retirés de la flotte. Jusqu’à 10 sans limite de durée au port d’attache ; 3 dans un autre port, démantelés au bout de 2 ans (avertissements à 90 et 30 jours). Le chantier naval permet aussi de changer de navire amiral.

### Préparatifs du départ

![Fenêtre des préparatifs](guide/p11_prep)

| # | Bouton | Fonction |
| --- | --- | --- |
| 1 | Informations | Situation locale : scorbut, routes automatiques, etc. |
| 2 | − ＋ / Jours | Nombre de jours de navigation à approvisionner |
| 3 | 20 jours · 40 jours · 60 jours · Max. | Raccourcis ; avec un contrat, ajoute « Jusqu’à l’objectif » et « Aller-retour » |
| 4 | Coût | Somme à payer |
| 5 | Valider | Compléter l’équipage au minimum + 4, réparer si un chantier existe, embarquer vivres, eau et matériaux (6 tonneaux + 3 par navire) |

### Comptoir

![Comptoir](guide/p12_trade)

| # | Bouton | Fonction |
| --- | --- | --- |
| 1 | Acheter | Acheter des marchandises (page suivante) |
| 2 | Vendre | Vendre des marchandises ; les achats de ce comptoir ne peuvent y être revendus au-dessus de leur prix d’achat |
| 3 | Investir | Investir au comptoir : à partir de 1 000 pièces, sans remboursement du capital |
| 4 | Conversation | Une fois par visite : événements du marché, modes, conseils commerciaux et indices |
| 5 | Cours du marché | Prix par catégorie (100 % = normal), prix des objets du marché et carnet des autres villes |
| 6 | Marchander | En cas de réussite, réduit le prix d’achat (jusqu’à 25 %). Avec un comptable, possibilité de négocier plus durement |

- Seuils d’investissement : 4 000, 12 000, 30 000, 70 000 et 150 000 pièces. Par niveau : achats −3 %, ventes +3 %, réserves −6 %. Dividendes tous les 90 jours.
- Marchandages quotidiens : comptabilité 0, une tentative ; niveaux 1–2, deux ; niveau 3, trois ; +1 avec un comptable. Échec si aucune langue commune.
- La comptabilité de niveau 3 donne accès au marché noir des ruelles.

### Comptoir — Fenêtre d’achat

![Fenêtre d’achat](guide/p13_trade_buy)

| # | Colonne | Signification |
| --- | --- | --- |
| 1 | Case à cocher | Choisir plusieurs marchandises à acheter ensemble ; cliquer sur une ligne choisit ce seul produit |
| 2 | Étiquettes | Spécialité ×N · Transit · Mode · Époque ▲▼ |
| 3 | Prix · Stock | Prix d’un tonneau et quantité disponible |
| 4 | Meilleur prix connu · Bénéfice par tonneau | Meilleur débouché enregistré dans le carnet et bénéfice par tonneau |
| 5 | Cale disponible | Cale restante (tonneaux), poids et nombre de produits |
| 6 | Acheter la sélection | Acheter ensemble les produits cochés |

### Chantier naval

![Chantier naval](guide/p14_shipyard)

| # | Bouton | Fonction |
| --- | --- | --- |
| 1 | Acheter | Navires de la culture locale. Ceux dépassant la technologie du chantier sont verrouillés |
| 2 | Vendre | Impossible de vendre le navire amiral ou un navire emprunté |
| 3 | Réparer | Tout réparer ou choisir un navire |
| 4 | Modifier | Canons, voiles (300 pièces chacune), gréement, sabords (250 chacun), figure de proue (150), reconstruction de coque, nom et cabines (navire amiral). L’option supérieure modifie les voiles, canons et gréements de plusieurs navires à la fois |
| 5 | Investir dans les techniques | Par milliers de pièces. Chaque total de 10 000, 30 000 et 70 000 ajoute un niveau de construction navale, jusqu’à 5 |

- Gréement face au vent : voile triangulaire avant, puis coupe des voiles et cordages améliorés, puis quille renforcée. Coûts : 8 %, 12 %, 16 % du prix du navire ; technologies requises : 1, 3, 4.
- Les canons et figures de proue se débloquent selon le niveau du chantier. Les modèles supérieurs restent visibles mais verrouillés jusqu’à un investissement technique suffisant.

#### Effets des figures de proue

| Effet | Application réelle |
| --- | --- |
| Vitesse | Vitesse +% pour le seul navire portant cette figure |
| Coque | Dégâts reçus des canons et tempêtes −% |
| Tempête | Rencontres de tempêtes −(3 × valeur)% (maximum −65 %) ; dégâts des tempêtes −(2 × valeur)% (maximum −30 %) |
| Monstre | Chance de faire reculer un monstre marin ; dégâts subis des monstres −% (maximum −50 %) |
| Bataille navale | Précision de nos canons +% |
| Chance | Probabilité d’éviter les incidents maritimes (vaisseau fantôme, iceberg, hauts-fonds, fièvre, sirène) +(2 × valeur) points |
| Discipline | Chaque jour en mer, discipline +(2 × valeur) ; la figure du roi démon la réduit |

- Avec plusieurs figures de même effet, la plus forte s’applique entièrement ; celles des autres navires ajoutent un quart de leur effet. Le total figure sous « Effets des figures de proue » dans la fenêtre Flotte.
- Les figures mythiques (fée, licorne, griffon, Pégase, sirène, Triton, qilin, dragon, phénix, Garuda) ne sont pas vendues au chantier. Elles proviennent seulement des reliques de grandes découvertes : Avalon, licorne, Persépolis, Parthénon, Troie, Atlantide, qilin, dragon noir, Sainte-Sophie de Kiev, Prambanan, etc.
- ★ Les 7 figures légendaires récompensent la victoire contre les monstres légendaires : Léviathan, Bakunawa, Zaratan, Jörmungandr, Isonade, Cipactli et vaisseau fantôme. Leurs pouvoirs uniques : mer paisible (tempêtes jusqu’à −88 %), étreinte maternelle (pertes humaines divisées par deux), carapace qui guérit (coque +1 % par jour), murmure du bout du monde (indice tous les 30 jours), queue qui remorque (bonus de vitesse à toute la flotte), canonniers tremblants (précision ennemie −12 %), malédiction du roi démon (bloquée par ange, Vierge, saint Michel ou saint Nicolas).
- Les figures-reliques et légendaires retournent dans l’inventaire lorsqu’on les retire ou lorsque le navire est vendu ou démantelé.

### Taverne

![Taverne](guide/p15_tavern)

| # | Bouton | Fonction |
| --- | --- | --- |
| 1 | Boire un verre | 4 + taille de la ville × 2 pièces, fatigue −4. À partir du quatrième verre, risque de s’effondrer ivre |
| 2 | Offrir une tournée | Discipline +12, fatigue −15, loyauté de tous les compagnons +3, renommée sociale +1 |
| 3 | Écouter les rumeurs commerciales | Le prix d’un verre, deux fois par jour |
| 4 | Demander des renseignements | Seulement avec un contrat : renseignements sur son objectif |
| 5 | Observer les clients | Une fois par visite : rencontrer quelqu’un ou provoquer une querelle |
| 6 | Recruter des marins | Régler les effectifs. Raccourcis : minimum, relève confortable (minimum × 1,3), maximum |
| 7 | Chercher des navigateurs | Liste des navigateurs actuellement dans cette ville (page suivante) |
| 8 | Parler à la serveuse | Seulement dans les villes disposant d’une serveuse |
| 9 | Proposer une partie de poker | Mises : 100, 500, 1 000 ou 5 000 pièces |
| 10 | Affecter les officiers | Rôles des compagnons et cabines du navire amiral |
| 11 | Parler aux compagnons | S’asseoir face à un compagnon ; les cadeaux sont réservés au sexe opposé |

### Chercher des navigateurs

![Liste des navigateurs](guide/p16_hire)

| # | Colonne | Signification |
| --- | --- | --- |
| 1 | Liste | Nom, résumé des compétences, renommée requise. Les explorateurs rivaux ne sont pas recrutables |
| 2 | Fiche du personnage | Origine, résidence, dates de vie et présentation |
| 3 | Attributs | Vitalité · Intelligence · Force · Charisme |
| 4 | Compétences | Niveaux ●●● (maximum 3) |
| 5 | Chevaux | Langues parlées et compréhension mutuelle avec votre groupe |
| 6 | Bouton de recrutement | Renommée suffisante et au moins un peu de compréhension mutuelle requises |

- Loyauté initiale = 40 + niveau de langue commune × 10. Salaire versé chaque mois.

### Auberge

![Auberge](guide/p17_inn)

| # | Bouton | Fonction |
| --- | --- | --- |
| 1 | Passer la nuit | 8 + 6 × taille de la ville pièces par nuit, de 1 à 60 nuits. Fatigue à 0, vitalité +30 par nuit |
| 2 | Chercher des navigateurs | L’aubergiste présente un navigateur ; pas d’explorateur rival |
| 3 | Affecter les officiers | Comme à la taverne |
| 4 | Parler aux compagnons | Comme à la taverne |
| 5 | Petits travaux | Gagner un salaire et apprendre la langue locale ; renommée −1 par jour. Jusqu’à 90 jours cumulés |
| 6 | Services | Écrire le journal (sauvegarder), charger et paramètres |

### Marché

![Marché](guide/p18_market)

| # | Bouton | Fonction |
| --- | --- | --- |
| 1 | Acheter | Armes, armures, instruments de navigation et bijoux. Assortiment renouvelé tous les 45 jours. Boussole et sextant toujours disponibles au marché d’origine |
| 2 | Vendre | Généralement 50 % du prix de base. Un objet acheté ici ne peut dépasser son prix d’achat |
| 3 | Cours du marché | Comme la fenêtre des cours du comptoir |
| 4 | Inventaire | Onglet Inventaire (40 places) |

### Église

![Église](guide/p19_church)

| # | Bouton | Fonction |
| --- | --- | --- |
| 1 | Faire un don | Infamie −1 par tranche de 200 pièces. Renommée sociale : niveau de théologie + 1 par tranche de 1 000 pièces données |
| 2 | Prier | Une fois par visite. Moins de tempêtes pendant 120 jours. Théologie au moins 1 : discipline +5 |
| 3 | Demander des soins | En échange d’un don, santé à 100 et malades à 0 |

### Bibliothèque

![Bibliothèque](guide/p20_library)

| # | Bouton | Fonction |
| --- | --- | --- |
| 1 | Lire | Choisir et lire un livre sur les rayons (image suivante) |
| 2 | Rechercher | Trouver la ville où se conserve un livre absent d’ici |

### Bibliothèque — Rayons

![Rayons](guide/p21_shelf)

| # | Colonne | Signification |
| --- | --- | --- |
| 1 | Légende | Noir : déjà lu ; doré : lisible ; rouge : pas encore lisible |
| 2 | Livre doré | Cliquer ou choisir avec les flèches, puis ouvrir avec Entrée |
| 3 | Informations des rayons | Nombre de livres et nombre actuellement lisible |
| 4 | Ligne d’aide | À l’approche d’un livre : titre et auteur |

- Une première lecture prend une journée. Il faut un lecteur de la langue dans le groupe et, pour un ouvrage savant, quelqu’un qui connaisse la discipline.
- Langue 3 : tout le texte ; niveau 2 : environ 70 % ; niveau 1 : environ 35 %.
- Rouge : pas encore publié, volumes précédents non déchiffrés, langue ou savoir insuffisant, ou région encore inconnue.

### Palais · Demeures (mécènes)

![Palais royal](guide/p22_palace)

| # | Bouton | Fonction |
| --- | --- | --- |
| 1 | Proposer une expédition | Proposer une découverte dont vous possédez un indice pour conclure un contrat. Petits travaux disponibles ; plusieurs découvertes prêtes permettent un rapport groupé |
| 2 | Faire un rapport | Seulement pendant un contrat avec ce mécène |
| 3 | Converser | Goûts du mécène. À partir de 25 de confiance, il peut donner un indice ou recommander un livre |
| 4 | Missions royales | Lors d’une convocation : choisir une de 3 missions royales (2 ans de délai). Réussite : titre de noblesse supérieur |
| 5 | Lettres patentes | Titre de noblesse local requis : lettre de marque (attaques pirates −80 %) ou exemption fiscale |

- Votre souverain vous convoque chaque fois que la renommée totale progresse de 10 000.
- **Présenter la carte** (mécènes royaux ou savants) : or et renommée d’exploration selon les nouveaux relevés depuis le dernier rapport. Les rois donnent davantage d’or, les savants davantage de renommée et, pour une grande carte, un indice maritime. Mécène amateur de géographie : +20 %.
- Les passages répétés précisent la carte : ① contours → ② fleuves → ③ montagnes → ④ terrains. Valeur d’une case : 1 ; 2,5 ; 4,5 ; 7,5. Davantage de détails rapportent davantage.
- Un cartographe (arpentage ★, dessin ☆), les vigies du navire amiral et les guetteurs des autres navires doués en arpentage ajoutent davantage de détails à chaque passage (vitesse de cartographie jusqu’à +150 %).

### Renommée insuffisante

- L’intendant vous arrête si votre renommée est insuffisante. Vous pouvez néanmoins demander un petit travail du maître des lieux : carte, approvisionnement ou vérification de rumeurs.

![Renommée insuffisante — L’intendant](guide/p23_butler)

![Petits travaux](guide/p24_errand)

### Guilde

![Guilde](guide/p25_guild)

| # | Bouton | Fonction |
| --- | --- | --- |
| 1 | Examiner les missions | Missions du tableau ; jusqu’à 3 simultanément |
| 2 | Rendre compte d’une mission | Missions terminées |
| 3 | Missions acceptées | Progression |
| 4 | Entraîner une compétence | (niveau + 1) × 1 500 pièces et (niveau + 1) × 10 jours. Une intelligence élevée facilite la réussite |
| 5 | Étudier une langue | Langues de cette ville et des régions voisines : (niveau + 1) × 1 000 pièces, (niveau + 1) × 15 jours |

- Pendant le délai de grâce, une mission en retard rapporte la moitié de la récompense et de la renommée. Abandon : perte de renommée égale à 1,5 fois celle de la mission.

### Porte de la ville

![Porte de la ville](guide/p26_gate)

| # | Bouton | Fonction |
| --- | --- | --- |
| 1 | Partir en expédition | Au moins 5 marins. Choisir une monture demande 10 jours de préparation |
| 2 | Écurie | Acheter et garder des montures ou les revendre (page suivante) |

### Porte de la ville — Écurie

![Écurie](guide/p27_stable)

| # | Colonne | Signification |
| --- | --- | --- |
| 1 | Fiche du moyen de transport | Prix, capacité de transport et allure selon le terrain |
| 2 | Adaptation au terrain | ◎ Excellent · ○ Bon · △ Léger avantage · × Mauvais |
| 3 | Légende | Des animaux en nombre insuffisant réduisent l’effet proportionnellement |
| 4 | Acheter et laisser à l’écurie | Acheter le nombre nécessaire aux membres de l’expédition et le laisser à l’écurie |

| Moyen de transport | Prix | Terrains favorables (multiplicateur d’allure) |
| --- | --- | --- |
| Porteurs | 25 (salaire) | Jungle 1,3 · Forêt 1,25 |
| Ânes | 60 | Montagne 1,5 · Prairie et steppe 1,4 |
| Chevaux | 180 | Steppe 2,4 · Prairie 2,2 |
| Chariots | 450 | Prairie 2,8 · Steppe 2,6 |
| Chameaux | 160 | Désert 3,0 |
| Lamas | 45 | Montagne 2,4 · Neige 1,9 |
| Éléphants | 1,200 | Jungle 2,2 · Forêt 2,0 |
| Traîneaux à rennes | 90 | Toundra 3,0 · Neige 2,8 · Glace 2,6 |
| Yaks | 80 | Neige 2,4 · Montagne 2,2 |

Les montures proposées dépendent de la culture de la ville et de l’année.

### Restaurant · Demeure

| Bâtiments | Bouton | Fonction |
| --- | --- | --- |
| Restaurant | Voir le menu | Un repas par jour et par ville. Qualité 1/2/3 : fatigue −6/−8/−10, vitalité +1/+2/+3, discipline +2/+3/+4 |
| Demeure | Se reposer | Trois jours passent ; vitalité à 100, fatigue à 0 |
| Demeure | Écrire le journal de bord (sauvegarder) | Sauvegarde |
| Demeure | Coffre-fort | Déposer et retirer. Intérêt mensuel : 0,3 % |
| Demeure | Réserve | Déposer sans occuper l’inventaire, sauf preuves de découvertes non encore rapportées ou annoncées. Filtrer par type ; « Tout déposer » exclut équipement porté, objets épinglés et instruments de navigation |
| Demeure | Retraite | Retraite |
| Demeure | Organiser un bal | Avec un titre de noblesse, une fois tous les 90 jours. Coût : 3 000 + 1 500 pièces par rang de noblesse. Rapporte de la renommée sociale |
| Demeure | Préparer une débutante | Fille de 15 à 17 ans. Robes à 2 000, 6 000 ou 15 000 pièces. Le statut de fleur de la société facilite les demandes de mariage à la cour pour ses 18 ans |

**Bals** — Un noble peut donner un bal chez lui. Les beautés de la « Galerie des beautés » de Louis Ier et des archiduchesses Habsbourg y viennent avant leur époque : Marie-Thérèse, Marie-Antoinette, Marie de Bavière, Auguste de Toscane, Caroline von Holnstein, Amalie von Schintling, Friederike von Gumppenberg, Alexandra de Danemark, Lola Montez, Jane Digby, Marianna Florenzi et Hélène Sedlmayr.

- Une invitée approche l’amiral ou son fils adulte. Danse, récits maritimes, politique et études, musique : choisir ses goûts augmente fortement l’affection. Vous pouvez aussi lui présenter votre fils.
- À 100 d’affection, elle demande le mariage : épouse principale pour un amiral célibataire, seconde épouse avec maison dans sa région pour un amiral marié, ou fiancée du fils, qui sera son épouse s’il hérite. Dot royale : 40 000 pièces ; noble : 15 000.
- Jalousie : chaque invitée a une rivale qui réagit à vos attentions. Avec la jalousie viennent médisances (renommée sociale −), dénonciations (confiance du souverain −), verres renversés (affection de la rivale −) et bouderies. Votre épouse peut aussi être jalouse.
- Politique : favoriser une invitée donne +2 de confiance à son souverain ; mariage +20 ; refus d’une demande −10 ; mariage avec elle −10 auprès du pays de sa rivale.
- La sorcière non invitée : Griselda du Chardon fait irruption. L’inviter à danser, lui présenter des excuses et une place d’honneur, ou l’impressionner l’épée à la main peut la faire rejoindre l’équipage et l’assemblée des sorcières du bord. La chasser avec les gardes gâche le bal.


**Enfants** — Retrouvez-les dans « Famille » chez vous, éduquez-les, jouez avec eux et embarquez-les comme apprentis.

- **Potentiel inné** — Le plafond de chaque attribut est tiré au sort : valeur initiale +6 à +26, davantage avec un talent inné. La progression est bonne avant ce plafond et devient rare une fois atteint. La même éducation donne donc des résultats différents.
- **Compétences** — Un précepteur ne garantit pas un progrès annuel. Les niveaux élevés sont plus difficiles, l’intelligence facilite l’apprentissage ; avant l’âge adulte de 16 ans, la limite est 2. Le niveau 3 s’acquiert ensuite en cabine ou à la guilde.
- **Années heureuses ou difficiles**, de 6 à 15 ans : une bonne année ajoute +1 à un attribut indépendamment de son potentiel ; une année difficile (fièvre, errance) supprime la croissance spontanée de l’année.
- **Langues et talents de la mère** — Un enfant vivant avec sa mère peut apprendre chaque année une langue et une compétence, jusqu’au niveau maternel. Une ancienne serveuse parle couramment la langue locale et moyennement la langue véhiculaire, avec un ou deux talents de niveau 1–2 parmi éloquence, cuisine, musique et comptabilité. Une ancienne navigatrice transmet ses propres connaissances. Un enfant embarqué n’apprend pas auprès de sa mère.
- **Naviguer ensemble** — Les fils adultes et filles non mariées peuvent devenir navigateurs via Famille → Embarquer ensemble. Affectez-les aux cabines, aux rôles ou au commandement d’un navire comme les compagnons. Leur salaire est réduit de moitié et leur loyauté dépend du lien avec leur père. Un apprenti devient automatiquement navigateur à 16 ans. Les compétences et langues apprises restent acquises. Le laisser à la maison ou le congédier le fait rentrer ; il pourra rembarquer.
- **Indépendance des fils après trente ans** — Un fils non embarqué de plus de trente ans peut partir lors d’une visite au foyer, selon son meilleur attribut : capitaine marchand, universitaire, chevalier ou marchand de port. Donnez-lui un pécule, votre bénédiction, ou proposez-lui votre navire. Sans visite, il part à 33 ans en laissant une lettre. Il peut toujours **hériter** et revenir à cette occasion. Son épouse transmet une lettre annuelle ; vous pouvez le rappeler à bord.
- **Succession** — Un fils embarqué quitte son poste pour devenir amiral. Ses frères déjà à bord y restent comme navigateurs de la fratrie.

### Musée royal — Dons

Les missions royales du musée, de la galerie ou de la ménagerie font construire ces établissements dans la ville du souverain. Visitez les collections et **offrez** de nouveaux objets.

![Faire un don au musée](guide/p27_museum)

| # | Colonne | Signification |
| --- | --- | --- |
| 1 | Informations | L’objet quitte l’inventaire et rejoint l’exposition |
| 2 | Reliques découvertes | Peuvent être données au musée |
| 3 | Chefs-d’œuvre | Peintures et sculptures produites dans les ateliers : musée ou galerie |
| 4 | Prix | Valeur de l’objet, sans paiement |

- Chaque objet, ou chaque espèce animale, donne +75 de renommée sociale et +1 de confiance du souverain. La ménagerie accepte les espèces extraordinaires nouvellement découvertes.

## Navigation

### Écran maritime — Barre supérieure et panneaux

![Écran de navigation](guide/p30_sea)

| # | Bouton | Fonction |
| --- | --- | --- |
| 1 | Latitude · Longitude | Latitude visible avec un astrolabe, un sextant ou arpentage 2 ; longitude avec un sextant, sinon « ? » |
| 2 | Navigation · Vivres · Eau potable · Équipage · Fatigue | Jours depuis le départ et réserves restantes |
| 3 | Contrat | Jours restants ; ✓ si l’objectif est trouvé |
| 4 | Ligne d’état | Action actuelle, vent contraire, arrivée estimée et réserves en jours, nom de la mer et vitesse |
| 5 | Petite carte marine | 40° de longitude autour du navire. Cliquez pour ouvrir la carte |
| 6 | Indicateur de vent | Direction, force ●1–5, vent arrière/de travers/contraire et nuages |

### Écran maritime — Boutons inférieurs

![Écran de navigation](guide/p30_sea)

| # | Bouton | Fonction |
| --- | --- | --- |
| 7 | Arrêter / Partir | Affaler les voiles et s’arrêter ; le trajet reste mémorisé et reprend avec Partir |
| 8 | Explorer | Uniquement à l’arrêt. Une journée pour examiner largement les environs |
| 9 | ×0.5 ×1 ×2 ×4 | Vitesse du temps. À ×1, un jour dure 1,25 seconde réelle |
| 10 | Entrer au port de ○○ | Port connu à moins de 0,55° |
| 11 | Débarquer | Terre à moins de 0,4° et au moins 5 marins ; tout l’équipage devient l’expédition |
| 12 | Pêcher | Pêche (plus loin) |
| 13 | Carte marine | Fenêtre de carte marine (M) |
| 14 | Carnet | Carnet de navigation |
| 15 | Suivi de la souris | Activer/désactiver (Maj) |
| 16 | ＋ − | Agrandir/réduire ; la molette fonctionne aussi |
| 17 | Paramètres | Fenêtre des paramètres |

Même à l’arrêt, le temps passe : jours, consommation de vivres et d’eau, mouvements des autres navires.

### Commandes en mer

| Touche | Fonction |
| --- | --- |
| ↑ ↓ ← → | La proue tourne vers cette direction, puis le navire continue tout droit au relâchement ; deux touches donnent une diagonale |
| Space | Arrêter. À l’arrêt près d’un port : entrer |
| Enter | Entrer au port |
| Pavé numérique 1–9 | Huit directions ; 5 arrête le navire |
| ` · 1 · 2 · 3 | Vitesses ×0,5 · ×1 · ×2 · ×4 |
| M · L · F | Carte marine · Débarquer · Pêcher |
| ＋ − | Agrandir · Réduire |
| Shift | Activer/désactiver le suivi de la souris |
| Clic droit | Effacer la destination |
| Clic | Mer : aller au point ; ville : rejoindre le port ; ? ou ruine : s’en approcher ; navire : le rejoindre |

- Indicateur du vent : angle entre proue et vent inférieur à 45°, vent arrière ; inférieur à 110°, de travers ; inférieur à 150°, vent contraire oblique ; au-delà, vent contraire.
- Suivre la direction des nuages à ±18° permet de profiter entièrement du bonus de vent arrière nuageux, jusqu’à +8 % selon la mer.

### Carte marine (M)

![Fenêtre de carte marine](guide/p31_chart)

| # | Bouton | Fonction |
| --- | --- | --- |
| 1 | ＋ − | Agrandir/réduire ; molette, glisser et double-clic fonctionnent aussi |
| 2 | Tout | Monde entier |
| 3 | Ici | Recentrer sur la position actuelle |
| 4 | Légende | ⚑ Capitale ; modèles grands/moyens/petits ; coin turquoise : trajet automatique ; soulignement : pays souverain ; losange doré : mécène ; drapeau rouge : mécène sous contrat ; point bleu marine : position actuelle |
| 5 | Ville · Mer | Cliquer sur une ville affiche son résumé et le trajet automatique ; cliquer en mer propose d’aller à ce point |
| 6 | Ligne d’aide | Résumé des commandes |

- **Déblocage de la navigation automatique** : quitter A et entrer directement dans B sans autre escale ouvre la route A–B dans les deux sens.
- Toucher aux flèches, au pavé numérique ou cliquer en mer interrompt la navigation automatique, qui ne peut plus être reprise pendant cette traversée.

### Pirates et autres navires

![Rencontrer des pirates](guide/p32_pirate)

| # | Bouton | Fonction |
| --- | --- | --- |
| 1 | Combattre | Bataille navale |
| 2 | Fuir (environ n %) | Probabilité = 0,35 + (vitesse de votre flotte − vitesse pirate) × 0,5 + navigation × 0,08, limitée à 10–90 %. Échec : bataille navale |
| 3 | Payer le passage | 200 pièces + 8 % de l’or en poche. Fonds insuffisants : combat |
| 4 | Supplier | Possible si or en poche + coffre + valeur de cargaison ne dépassent pas 10 000 ; les pirates vous laissent passer |

- Avec un navire non hostile : nouvelles (indices ou prix), acheter vivres et eau (marchands seulement, 4 pièces le tonneau), ou attaquer. Attaquer marchands et flottes augmente l’infamie.
- Une lettre de marque du palais réduit de 80 % la fréquence des attaques pirates.

### Pirates célèbres · Primes · Pavillons pirates

- Dans chaque mer, des pirates historiques ou légendaires mènent leurs bandes. Ils apparaissent rarement parmi les groupes pirates.
- **Restaurant : avis de recherche** — Affiches des pirates célèbres actifs dans la mer locale. Cliquez pour agrandir portrait, bande, pavillon et prime. Après la victoire sur leur flotte, **encaissez la prime** dans n’importe quel restaurant portuaire.
- **Rumeurs pirates** — Au restaurant, écoutez gratuitement les clients une fois par visite, avec un délai court. Une serveuse rémunérée fournit une rumeur de pirate célèbre avec un délai plus long. Rejoignez les eaux indiquées avant l’échéance pour rencontrer réellement sa flotte. L’objectif est noté dans les tâches du carnet.
- **Pavillons pirates** — Chaque bande a le sien. Sa première défaite vous donne son pavillon dans l’inventaire. Capturer un repaire donne aussi celui de sa bande. Le carnet des repaires indique la collection.
- Vaincre trois pirates célèbres distincts d’une même mer révèle un repaire. Les rumeurs favorisent ceux qui ne sont pas encore comptés.
- **Absorption** — Les survivants d’un pirate célèbre vaincu rejoignent un autre pirate de la même mer, de préférence de la même bande, jusqu’à deux absorptions. Le pirate absorbé ne revient plus. Chaque absorption ajoute un navire, renforce équipage et artillerie, et augmente la prime. L’affiche indique 1/2 bandes absorbées. Sans hôte disponible, le vaincu reforme sa flotte.

### Protection contre la pluie

![Mer sous la pluie](guide/p33_rain)

| # | Colonne | Fonction |
| --- | --- | --- |
| 1 | Ligne d’état | Averse ou pluie torrentielle et mesure actuelle |
| 2 | Protection contre la pluie | Visible seulement sous la pluie ; choisir l’une des trois mesures |

| Mesure | Effet |
| --- | --- |
| Poursuivre le travail sur le pont | Vitesse inchangée (pluie torrentielle : ×0,92). Un peu d’eau recueillie |
| Faire reposer l’équipage à tour de rôle en cabine | Fatigue −1,2, discipline +0,2, vitesse ×0,85 |
| Déployer une toile pour recueillir la pluie | Eau recueillie : 1,2 fois la consommation quotidienne, 2,5 sous pluie torrentielle. Fatigue +0,4, vitesse ×0,95 |

La fatigue due à l’humidité dépend de la mer : à moins de 25° de latitude, une averse réduit même la fatigue de 0,6 ; au-delà de 50°, averse +1,0, pluie torrentielle +2,0.

### Pêche (F)

| Étape | Commande |
| --- | --- |
| Lancer | Appuyer sur Espace ou le bouton au bon moment sur la jauge mobile. Plus de force : eaux plus profondes |
| Attendre | Ferrer quand le flotteur plonge et que « ! » apparaît. Trop tôt, le poisson s’échappe |
| Ramener | Maintenir pour mouliner, relâcher pour laisser filer. La ligne ne se ramène que dans la zone verte de tension, élargie par la manœuvre |

- Trois appâts par jour. Impossible pendant une tempête.
- Les poissons deviennent des vivres, les espèces rares des découvertes. Vous pouvez aussi remonter message en bouteille, huître perlière ou ambre.

## Exploration terrestre

### Écran terrestre

![Exploration terrestre](guide/p40_land)

| # | Bouton | Fonction |
| --- | --- | --- |
| 1 | Exploration · Membres · Frais quotidiens | Frais = (5 + effectif) × coût de la monture, multipliés par 1,5 au désert. Paiement incomplet : fatigue +6 et possibles départs |
| 2 | Terrain · Moyen de transport | Adaptation actuelle du transport au terrain ◎○△× |
| 3 | Partir / Arrêter | Marcher ou s’arrêter ; une journée de marche dure 1,3 seconde réelle |
| 4 | Retour | Revenir au départ, puis remonter à bord ou rentrer en ville |
| 5 | Entrer en ville | Ville à moins de 0,3° |
| 6 | Camper | Menu du camp (page suivante) |
| 7 | Carte marine | Carte des environs sur 60° de longitude |
| 8 | Suivi de la souris | Comme en mer |

- Cliquer au sol fait marcher jusqu’au point. Les flèches maintiennent une direction ; le pavé numérique 1–9 offre huit caps.
- Le ? flou marque une découverte repérée par les éclaireurs ; l’aire se resserre en approchant. Géographie : bleu ciel ; nature : vert ; ruines : orange ; trésor : or ; êtres vivants : rouge ; peuples : violet.
- En fin d’expédition, les montures retournées en ville restent à l’écurie. Au retour au navire, elles sont cédées au village côtier pour 30 % de leur prix.

### Camper

![Menu du camp](guide/p41_camp)

| # | Bouton | Fonction |
| --- | --- | --- |
| 1 | Se reposer (3 jours) | Fatigue −25, davantage avec manœuvre, cuisine et musique |
| 2 | Réparer le navire (2 jours) | Navire visible à moins de 1,2°, endommagé, avec des matériaux disponibles |
| 3 | Chasser (1 jour) | Obtenir des vivres à portée de vue du navire ; risque d’affronter une harde |
| 4 | Chercher de l’eau (1 jour) | Chercher de l’eau à portée de vue du navire ; quantité selon le terrain |
| 5 | Reconnaître les environs (2 jours) | Révéler largement la carte et examiner les alentours ; découverte possible d’un raccourci |
| 6 | Cueillir des plantes médicinales (1 jour) | En cas de réussite, moins de fièvre pendant 12 jours et fatigue −8 |

## Combat

### Bataille navale

![Bataille navale](guide/p50_battle)

| # | Bouton | Fonction |
| --- | --- | --- |
| 1 | Alliés · Ennemis | Nombre de navires et de marins |
| 2 | Vent · Champ de bataille | Vent et lieu du combat |
| 3 | Ordres de la flotte | Touches 1–7 (tableau ci-dessous) |
| 4 | Notre navire amiral | Navire n° 1 ; sa perte entraîne la défaite |
| 5 | Navire amiral ennemi | Navire n° 1 ; le couler ou le capturer donne la victoire |
| 6 | Pause | P. Les ordres restent disponibles en pause |
| 7 | ×1 ×2 ×3 | Vitesse du combat (+/−), conservée pour la prochaine bataille |
| 8 | Abordage | B. Approcher tout près et monter à bord |
| 9 | Retraite | Toute la flotte se retire par le bord du champ de bataille |

### Ordres de flotte (1–7)

| Touche | Avec des navires d’appui | Navire amiral seul |
| --- | --- | --- |
| 1 | Suivre : derrière le navire amiral, tirer sur sa cible | Manuel |
| 2 | En arc : envelopper en demi-cercle autour du navire amiral | (désactivé) |
| 3 | Attaque concentrée : se rapprocher d’un même ennemi | Assaut |
| 4 | Canons : combattre à la limite de portée | Canons |
| 5 | Escorte : protéger les abords du navire amiral | (désactivé) |
| 6 | Libre : chaque navire attaque l’ennemi le plus proche | Auto |
| 7 | Repli : seul ce navire quitte le combat | Retraite |

- Les flèches gouvernent le navire amiral ; cliquer en mer déplace, cliquer un ennemi l’attaque. Les canons tirent automatiquement sur les ennemis dans leur secteur latéral.
- Cliquer sur un allié ou utiliser Tab sélectionne un navire qui recevra seul les ordres.
- Clic droit : envoyer le navire sélectionné, ou le navire amiral par défaut, à cet endroit et lui faire tenir position. Clic droit sur un ennemi : le cibler.
- Les ennemis répartissent leurs cibles, évitent nos bordées en passant vers proue ou poupe et présentent leur batterie chargée pendant le rechargement de l’autre. Ils abordent les navires très endommagés ; les pirates peuvent fuir après la perte de leur navire amiral.
- Deux navires alliés entourant un ennemi : dégâts des canons +20 % ; trois ou davantage : +35 %.
- Si notre navire amiral est perdu, la moitié de la cargaison est jetée et le navire suivant prend sa place.

### Duels

![Duel — Choisir une posture](guide/p51_duel)

| # | Colonne | Signification |
| --- | --- | --- |
| 1 | Vitalité · Élan | L’élan accumulé permet les techniques |
| 2 | Rapport des coups | Estoc → taille → frappe → estoc ; la flèche indique le coup vaincu |
| 3 | Postures (touches 1–4) | Assaut résolu, attaque puissante, capture vivante ou protection : effets indiqués sur les cartes |
| 4 | Prochain coup | 0 automatique · 1 taille · 2 estoc · 3 frappe |
| 5 | Techniques | Le nombre indique le coût en élan ; usage unique signifie une seule fois |
| 6 | Pause · Accélérer · Reculer | Espace · — · Échap. La posture de protection garantit le repli ; les autres donnent 60 % de réussite |

### Duel — Échange

![Duel pendant un échange](guide/p52_duel_fight)

| # | Colonne | Signification |
| --- | --- | --- |
| 1 | Échange | Numéro de l’échange actuel |
| 2 | Échange précédent | Coups choisis et rapport de force |
| 3 | Prochain coup | Coup favorable : précision +15 points et dégâts ×1,35 ; défavorable : dégâts ×0,75 |
| 4 | Techniques | Coup mortel (50), initiative (15), flanc (25), capture (20), retraite feinte (15), arme secrète (unique), appât (15), changement (unique), persuasion (30), feinte (15), intimidation (20), attaque ultime (100) |

- Élan : subir un coup +10, toucher +4, parer +6.
- Certains duels permettent de choisir le second comme représentant. En bataille navale, un second vaincu est blessé pour 30 jours.

### Combat terrestre

![Combat terrestre — Composition](guide/p42_landwar)

| # | Colonne | Signification |
| --- | --- | --- |
| 1 | Emplacements des unités | Cliquer pour choisir infanterie, arquebusiers, cavalerie ou artillerie : garde de l’amiral et jusqu’à 5 unités |
| 2 | Garde de l’amiral | Sa défaite entraîne la vôtre |
| 3 | Chef ennemi ★ | Le vaincre donne la victoire |
| 4 | Engager le combat | Commencer la bataille |
| 5 | Éviter | Retraite ; en cas d’échec, l’ennemi frappe l’arrière |

### Combat terrestre — Ordres

| Touche | Ordre | Effet |
| --- | --- | --- |
| 1 | Attaque | Toutes les unités attaquent ; cliquer une unité ennemie fixe la cible |
| 2 | Défense | Dégâts reçus ×0,5 ; riposte des unités de mêlée |
| 3 | Embuscade | Réussite selon le terrain, favorisée par forêt, jungle et montagne. Dégâts à tous les ennemis et immobilisation pendant un tour |
| 4 | Piège | Inflige de lourds dégâts au prochain ennemi qui charge |
| 5 | Tir de précision | Élimine 50 % des hommes du chef ennemi |
| 6 | Obus explosif | Artillerie et obus requis ; dégâts à tous les ennemis |

- Les ordres 3–6 sont utilisables une fois chacun par bataille. Le mode automatique répète les attaques.
- Unités : infanterie contre une unité ; arquebusiers contre les trois du premier rang ; cavalerie jusqu’à l’arrière et au chef, avec chevaux, chameaux ou éléphants ; artillerie contre tous, avec canons et animaux ou chariots de transport, une seule unité.
- Passer sous 20 % de l’effectif initial entraîne aussi la défaite. Parmi les hommes tombés, 25 % + médecine × 15 % reviennent vivants.

## Compagnons et cabines

### Affecter les officiers

![Affecter les officiers](guide/p60_roles)

| # | Colonne | Fonction |
| --- | --- | --- |
| 1 | Cabines du navire amiral | Affecter un compagnon à chaque pièce (page suivante) |
| 2 | Affectation automatique | Affecter selon leurs aptitudes les compagnons sans rôle fixé à la taverne, dans les cabines et les autres navires. Effectifs en attente à droite |
| 3 | Équipages des autres navires | Capitaine, timonier, pont, guetteur et cabines par navire, affectés automatiquement |
| 4 | Nom du compagnon | Cliquer pour choisir un rôle sur le navire amiral : second, navigateur, arpenteur, interprète, comptable, aucun rôle ou congédiement |
| 5 | Poste actuel | Cabine du second, pont ou capitaine d’un navire. Fond bleu : affectation à un autre bâtiment |
| 6 | Fond rouge : en attente | Compagnon sans poste : loyauté −2 par mois |

### Rôles et compétences

| Rôle | Compétence utilisée |
| --- | --- |
| Second | Escrime · Artillerie · Tir · Médecine · Construction navale · Sciences · Comptabilité · Éloquence · Théologie · Histoire · Orfèvrerie |
| Navigateur | Navigation · Manœuvre · Cuisine · Musique |
| Arpenteur | Arpentage · Histoire · Dessin |
| Interprétariat | Langues connues par cette personne |
| Comptable | Comptabilité |
| Capitaine d’un autre navire | Navigation, artillerie, escrime et construction navale sur son seul navire |
| Timonier, pont, guetteur et cabines des autres navires | Aucun effet technique ; évite seulement la perte de loyauté |

- Les compétences de l’amiral s’appliquent toujours. Pour une compétence commune, seul le meilleur niveau est retenu.
- À 40 de loyauté ou moins, efficacité ×0,75 ; à 20 ou moins, ×0,5. Sans poste, loyauté −2 par mois.

### Postes des autres navires

- Chaque bâtiment hors navire amiral possède quatre postes : **capitaine, timonier, pont et guetteur**, plus un nombre de cabines lié à sa taille.
- Les affectations sont **automatiques** : capitaine selon navigation, artillerie, escrime, construction navale et force ; timonier selon navigation et manœuvre ; pont selon manœuvre et escrime ; guetteur selon arpentage et histoire. Si les compagnons manquent, ils sont répartis équitablement.
- Le capitaine gouverne son navire avec les effets du tableau. Timonier, pont, guetteur et cabines n’apportent pas d’effet à la flotte : ces postes empêchent seulement la baisse de loyauté.
- Réaffectations à l’arrivée en ville, au départ, chaque mois, au recrutement, au changement de navire amiral et après une bataille navale. Les cabines vides du navire amiral sont complétées sans déplacer celles déjà occupées.
- L’affectation automatique respecte les rôles fixés à la taverne sur le navire amiral : second, navigateur, arpenteur, interprète et comptable.

### Cabines du navire amiral

![Cabines du navire amiral](guide/p61_cabin)

| # | Colonne | Signification |
| --- | --- | --- |
| 1 | Cabines · Compagnons · Salaires | De 2 à 16 cabines selon la taille du navire. Le nombre en attente indique les compagnons sans poste |
| 2 | Affectation automatique | Installer d’abord les compagnons sans rôle de taverne possédant les talents adaptés ; inclut les autres navires |
| 3 | Portraits | Postes fixes : cabine du capitaine pour l’amiral, du second, timonerie pour le navigateur, vigie pour l’arpenteur et pont |
| 4 | Chiffres bleus | Puissance de la pièce = 1 + niveau de compétence adapté, réduite par une faible loyauté |
| 5 | Poste vide | Cliquer pour affecter quelqu’un ; le glisser-déposer fonctionne aussi |
| 6 | Carte de cabine | Choisir la fonction d’une cabine vide au chantier naval, avec l’aménagement des cabines |
| 7 | Liste des compagnons | Cliquer pour affecter. Compagnons en attente en rouge en tête de liste ; ceux des autres navires en bleu |
| 8 | Aptitudes appliquées à la flotte | Niveaux de compétences ●●● et effets des cabines selon l’affectation ; ▲▼ lors d’un changement |
| 9 | Autres navires | Capitaine, timonier, pont, guetteur et nombre de cabines de chaque navire, plus bas dans la liste |

### Types de cabines et effets

| Postes fixes | Effet par point de puissance |
| --- | --- |
| Vigie | Distance de repérage +0,12° ; vitesse de cartographie +6 % |
| Timonerie | Fatigue quotidienne −0,03 |
| Pont | Discipline +0,04 ; manœuvre et escrime |
| Cabine du second | Chaque mois payé, loyauté +1 aux compagnons sous 70 |

| Cabines | Compétences | Effet par point de puissance |
| --- | --- | --- |
| Salle de cartographie | Arpentage · Dessin | Portée de cartographie +0,15° ; vitesse +10 % |
| Cuisine du bord | Cuisine | Fatigue quotidienne −0,05 |
| Restaurant | Cuisine · Éloquence | Fatigue −0,04 ; discipline +0,03 |
| Bureau de comptabilité | Comptabilité | Marchandage +3 points, salaires −2 % (maximum −50 %) |
| Chapelle | Théologie | Discipline +0,06 |
| Infirmerie | Médecine · Sciences | Propagation du scorbut −7 % (maximum 60 %) |
| Salle de loisirs | Musique | Discipline +0,05 |
| Salle de voilure | Navigation · Manœuvre | Vitesse +1 % (maximum 8 %) |
| Atelier de réparation navale | Joseon | Réparation quotidienne +0,1 |
| Élevage du bord | Sciences | Vivres quotidiens +0,12 |
| Salle d’artillerie | Artillerie | Tirs de canon |
| Quartier des fusiliers marins | Escrime · Tir | Abordage +4 % |
| Ateliers de peinture · Sculpture | Dessin · Orfèvrerie | Produire tableaux et sculptures |
| Salle de musique | Musique | Fatigue −0,07 |
| Salle d’état-major | Manœuvre · Histoire · Arpentage | Stratagèmes terrestres : réussite +3 points, dégâts +6 % |
| Cabine d’interprétariat | — | Les langues de l’occupant servent à l’interprétation |

**Pièces voisines** — Les cartes des cabines sont disposées par rangées de six. Les voisines du haut, du bas, de gauche et de droite unissent leurs forces ; pas en diagonale.

- **Ensemble musical** — Dès deux musiciens dans des salles de musique voisines : duo, trio à trois, quatuor à quatre, groupe à cinq ou six, grand ensemble à partir de sept. Effectifs, musique et éloquence améliorent la réduction quotidienne de fatigue, la discipline et la part du prix due à la mode lors de ventes en ville (jusqu’à +75 %). Le nom de l’ensemble apparaît sur la carte.
- **Repas bien chaud** — Cuisine et réfectoire voisins permettent de servir avant refroidissement : effets de fatigue, discipline et spécialités des deux pièces ×1,25 ; multiplicateur du menu de cuisine +0,25.

Les puissances des pièces identiques s’additionnent jusqu’à 8.

## Attributs · Compétences · Langue

Les aptitudes de l’amiral reposent sur trois choses : **attributs** innés, **compétences** apprises et **langues** comprises et parlées. Ce chapitre explique leurs usages plutôt que leurs chiffres.

### Les quatre attributs

Les quatre attributs sont **vitalité, intelligence, force et charisme**, visibles en jauges dans l’onglet Amiral. La vitalité est parfois appelée puissance sur les fiches de taverne et lors de l’éducation des enfants.

- **Au départ** — La jeunesse favorise vitalité et force ; l’âge, intelligence et charisme. Le métier ajoute un petit bonus adapté et le signe de naissance renforce un attribut. Un âge élevé donne davantage de points à répartir.
- **Au fil de la vie** — L’**expérience** des actions accomplies les augmente progressivement. De **grands événements**, comme un titre, un mariage ou un tour du monde, peuvent aussi les faire progresser.
- **Âge** — La vitalité augmente légèrement dans la jeunesse ; après l’âge mûr, vitalité et force diminuent chaque année. Les aventures tardives s’appuient sur intelligence et charisme.
- **Attributs des compagnons** — Ils possèdent les mêmes quatre attributs. Ceux-ci interviennent dans les duels délégués, l’abordage des navires qu’ils commandent et leur aide lors des rapports. Ils influencent aussi caractère et manière de parler.
- **Recrutement** — Chaque navigateur a ses préférences ; un attribut qu’il apprécie rend son recrutement plus facile.

### Vitalité · Intelligence

**Vitalité** — Résister

- Augmente l’endurance en duel. Chez les compagnons, peut aussi réduire la gravité des blessures.
- Permet de boire davantage à la taverne sans s’effondrer ivre.
- Augmente le salaire des petits travaux à l’auberge.
- Progresse par gastronomie, combats et duels ; diminue légèrement chaque année après l’âge mûr.

**Intelligence** — Apprendre

- Détermine **combien de compétences et de langues** peuvent être apprises, à la création et à la guilde.
- Une forte intelligence donne des points de compétences supplémentaires à la création, avec un bonus de plus au niveau le plus élevé.
- Améliore l’étude des compétences et langues à la guilde, ainsi que l’apprentissage de la langue locale pendant les travaux d’auberge.
- Favorise en duel retraites feintes, appâts et feintes, tout en aidant à déjouer les ruses ennemies.
- Une intelligence très élevée permet de récupérer quelques hommes tombés supplémentaires après un combat terrestre.
- Aux échecs avec un enfant à la maison, vos intelligences s’opposent.
- Progresse par commerce, persuasion, société et première lecture d’un livre.

### Force · Charisme

**Force** — Combattre

- Renforce les duels : toucher plus souvent, frapper plus fort et prendre l’initiative.
- Améliore les techniques décisives : coup mortel, possible plus tôt avec une force très élevée, capture et intimidation.
- La **force du capitaine compagnon** détermine l’attaque d’abordage de son propre navire. Le navire amiral utilise l’arme portée par l’amiral.
- Favorise l’intimidation au recouvrement des dettes et l’argument d’un ennemi commun en diplomatie.
- Progresse par combats et duels ; diminue légèrement chaque année après l’âge mûr.

**Charisme** — Gagner les cœurs

- Facilite les négociations avec les mécènes, la persuasion au sujet d’une découverte hors de leurs goûts et les traités avec les cours étrangères.
- Améliore le marchandage au comptoir et au marché.
- Favorise le recouvrement à l’amiable et l’apaisement verbal des meneurs de mutinerie.
- L’aide personnelle de l’amiral améliore rapports et annonces. Un très fort charisme agit davantage sur un mécène de sexe opposé.
- Facilite la persuasion en duel pour faire baisser les armes, et renforce l’intimidation.
- Progresse par persuasion, société et commerce, ainsi que lors d’un anoblissement ou d’un mariage.

### Expérience et progression

Chaque tâche accomplie apporte de l’**expérience** à son domaine, répartie selon les attributs associés.

| Expérience | Sources | Attributs développés |
| --- | --- | --- |
| Persuasion | Persuader et rassurer un mécène, négocier avec la garnison, calmer une mutinerie, recouvrer une dette par la parole, traiter à la cour, persuader en duel et aider au rapport | Charisme · Intelligence |
| Transactions | Acheter et vendre au comptoir, davantage avec un grand bénéfice ; réussir un marchandage | Intelligence · Charisme |
| Combat | Combats sur terre et en mer : davantage en victoire et contre un ennemi puissant | Force · Vitalité · Intelligence |
| Duels | Duels personnellement menés par l’amiral ; aucun gain si un compagnon le remplace | Force · Vitalité |
| Gastronomie | Repas au restaurant ; double pour une première dégustation | Vitalité · Charisme · Intelligence |
| Société | Chaque gain de renommée sociale | Charisme · Intelligence |

- Les échecs enseignent aussi un peu : persuasion manquée et combat perdu rapportent de l’expérience.
- **Plus un attribut est élevé, plus gagner un point devient difficile.** Le milieu de l’échelle arrive vite, mais les valeurs hautes peuvent demander des années ou des décennies.
- Des plafonds quotidiens et annuels limitent l’expérience de chaque attribut : répéter une seule action ne permet pas de progresser sans fin. Même toute une vie suffit rarement à atteindre 100 par l’expérience seule.
- Les **grands événements** font aussi progresser : anoblissement, premier mariage, chevalerie anglaise (charisme) ; princesse disparue sauvée et grande victoire navale (force) ; refuge d’Elizabeth (intelligence) ; récit de naufrage et tour du monde (vitalité et intelligence). Les attributs déjà très hauts reçoivent de l’expérience plutôt qu’un point direct.
- Les progrès sont notifiés et inscrits au journal. Dans Amiral → Expérience et progression, consultez l’expérience par domaine et la distance au prochain point.

### Compétences — Niveaux et usages

Les 17 compétences vont de **0 à 3** : ◇◇◇ → ◆◆◆.

- **Niveau retenu** — Le **meilleur niveau** s’applique à la flotte parmi l’amiral, un compagnon dans un rôle approprié (second, navigateur, arpenteur, comptable) et l’occupant d’une cabine utilisant cette compétence.
- **Présence à bord suffisante** — Cuisine, musique, dessin et orfèvrerie fonctionnent généralement même sans rôle précis. Pour prévenir le scorbut, la médecine de toute personne embarquée convient également.
- **Compétences propres à chaque navire** — Canons, abordage, dégâts des tempêtes et réparations des autres navires utilisent seulement les talents de leur capitaine.
- **Faible loyauté** — Un compagnon n’emploie pas tout son talent. Pendant une blessure, il n’en emploie que la moitié.

**Apprendre les compétences**

- **Création** — Dépenser les points pour améliorer les compétences initiales du métier. L’intelligence limite leur nombre.
- **Guilde : entraînement** — Argent et temps permettent un niveau à la fois. Une intelligence élevée aide, les niveaux élevés compliquent la réussite. Un échec coûte quand même argent et jours.
- **Compagnons** — Les années dans une cabine enseignent sa spécialité : éloquence chez le second, navigation en timonerie, arpentage en vigie. Compétence principale ★ : +1/+2/+3 après 3/9/27 ans ; secondaire ☆ : 1,2 fois plus lentement, après 3,6/10,8/32,4 ans. Exemple : fusiliers marins, escrime ★ et tir ☆. Plafond : 3.
- **Enfants** — Enseignement au foyer et apprentissage embarqué, jusqu’au niveau de la flotte de l’amiral. Avant 16 ans, plafond de 2 ; l’intelligence facilite l’apprentissage, les niveaux élevés le ralentissent. Ils apprennent aussi de leur mère présente. Adultes embarqués, ils progressent en cabine comme les compagnons.
- Les livres n’augmentent pas les compétences. Un ouvrage savant exige en revanche quelqu’un qui connaît sa discipline.

**Combinaisons de compétences de niveau 3 — Aptitudes cachées**

L’amiral doit maîtriser personnellement trois compétences compatibles au niveau 3. Les niveaux effectifs des compagnons ne suffisent pas. Plusieurs combinaisons peuvent coexister, avec des plafonds par domaine pour préserver l’équilibre avec talents, cabines et équipement.

| Aptitudes cachées | Compétences requises | Effet |
| --- | --- | --- |
| Amiral invincible | Escrime · Tir · Artillerie | Dégâts terrestres +10 % |
| Expert de la survie | Navigation · Manœuvre · Médecine | Frais terrestres −15 %, gain de fatigue −10 % |
| Mafia | Éloquence · Comptabilité · Escrime | Marchandage et recouvrement +6 points |
| Naissance d’une sainte | Théologie · Médecine · Musique | Maladies terrestres −15 %, baisse de discipline −10 % |
| Grand navigateur | Navigation · Manœuvre · Arpentage | Vitesse de navigation +5 % |
| Commandant de la flotte cuirassée | Artillerie · Construction navale · Manœuvre | Dégâts des canons +6 %, réparations +10 % |
| Commandant des fusiliers marins | Escrime · Tir · Manœuvre | Dégâts terrestres +5 %, dégâts alliés reçus −8 % |
| Chasseur de tempêtes | Navigation · Construction navale · Sciences | Dégâts des tempêtes −15 %, vitesse +2 % |
| Grand marchand | Comptabilité · Éloquence · Arpentage | Prix d’achat −2 %, prix de vente +2 % |
| Érudit des trésors | Histoire · Orfèvrerie · Arpentage | Valeur et renommée des découvertes +6 % |
| Esprit de la Renaissance | Histoire · Sciences · Dessin | Valeur et renommée des découvertes +5 % |
| Médecin éminent | Médecine · Sciences · Cuisine | Maladies terrestres −20 %, gain de fatigue −5 % |
| Idole des marins | Musique · Éloquence · Théologie | Baisse de discipline −15 % |
| Diplomate royal | Éloquence · Histoire · Théologie | Marchandage et recouvrement +4 points, prix de vente +1 % |
| Savant universel | Histoire · Sciences · Théologie | Valeur et renommée des découvertes +4 %, maladies terrestres −5 % |
| Grand maître | Orfèvrerie · Dessin · Histoire | Valeur et renommée des découvertes +4 %, prix de vente +1 % |
| Loup de mer | Navigation · Escrime · Artillerie | Vitesse +2 %, abordage +8 % |
| Tireur infaillible | Tir · Artillerie · Arpentage | Précision des canons +5 %, dégâts +4 % |
| Maître de la logistique | Comptabilité · Manœuvre · Cuisine | Consommation de vivres et d’eau −8 %, frais terrestres −8 % |
| Roi des chantiers | Construction navale · Orfèvrerie · Sciences | Réparations +15 %, dégâts des tempêtes −5 % |

Plafonds cumulés : vitesse +8 %, canons +10 %, abordage +8 %, valeur et renommée des découvertes +15 %, réparations en mer +20 %. Réductions des tempêtes, frais terrestres et baisse de discipline : maximum 20–25 % chacune.

### Compétences — Navires et mer (1)

**Navigation** — Navigateur, salle de voilure ; sur les autres bâtiments, leur capitaine

- Réduit la fatigue quotidienne en mer.
- Réduit les pertes de coque, de marins et de vivres dans les tempêtes, sans les éviter. La navigation du navire amiral aide aussi un peu les autres bâtiments.
- Une bonne navigation du capitaine accélère son navire et réduit les pertes de vitesse en louvoyant.
- Facilite la fuite, l’évitement des icebergs et hauts-fonds, et le repérage des signes d’un raz-de-marée.
- Sans personne connaissant la navigation, le second s’oppose au départ. Requise pour certains ouvrages de navigation.

**Manœuvre** — Navigateur, pont, voilure et état-major

- Ralentit la baisse de discipline. À plusieurs navires, aide à remorquer le plus lent et à conserver la formation.
- Accélère la marche, réduit la fatigue terrestre et améliore le repos au camp. Réduit les coûts du soleil et des tempêtes de sable, et protège mieux des blizzards et marais.
- Réduit les dégâts des catastrophes, accroît les prises dans les bancs de poissons et facilite les touches à la pêche.
- En salle d’état-major, favorise embuscades, pièges et tirs de précision terrestres.

### Compétences — Navires et mer (2)

**Arpentage** — Arpenteur, cartographie, vigie et état-major

- **Dès le niveau 2, la latitude apparaît en mer** ; la longitude nécessite toujours un sextant.
- Étend la détection des ports inconnus, la zone cartographiée et la portée de la vigie, ainsi que la reconnaissance terrestre.
- Facilite les découvertes maritimes sans indice, la recherche de ports en suivant les oiseaux et les anciens sentiers de montagne. Davantage d’eau au camp.
- Aide aux embuscades, pièges et signes de catastrophe. Un haut niveau resserre la localisation des cartes au trésor avec davantage de preuves.
- Le plan d’expédition avertit si personne ne connaît l’arpentage. Requis pour certains livres savants.

**Construction navale** — Second, atelier de réparation ; sur les autres bâtiments, leur capitaine

- Répare en mer avec des matériaux ; impossible sans eux. L’atelier améliore les réparations du navire amiral.
- Améliore les réparations au camp à terre et lors des événements de naufrage.
- Avec la langue locale, révèle dans le carnet l’existence et le niveau d’un chantier dans une ville encore non visitée.

### Compétences — Combat

**Escrime** — Second, pont, fusiliers marins ; sur les autres bâtiments, leur capitaine

- Renforce l’abordage ; les quartiers des fusiliers marins du navire amiral l’améliorent davantage.
- Duel : l’amiral emploie **son escrime personnelle**, sans addition des compagnons. Meilleurs coups, critiques, initiative et lecture adverse. Un représentant emploie son propre niveau ; la relève choisit le plus fort.
- Combat terrestre : renforce infanterie, cavalerie et garde. Au niveau 3, cavalerie lourde. Escrime, tir et artillerie tous à 3 donnent une garde invincible.
- Augmente légèrement la chasse, aide face au vaisseau fantôme et sert à intimider les débiteurs.

**Artillerie** — Second, salle d’artillerie ; sur les autres navires, leur capitaine

- Rechargement plus rapide et meilleure précision en mer. La salle d’artillerie ajoute de la puissance au navire amiral.
- Renforce l’artillerie terrestre ; au niveau 3, elle devient artillerie à canons.

**Tir** — Second, quartiers des fusiliers marins

- Ne s’applique pas aux batailles navales : sert au combat terrestre et à la chasse.
- Renforce les arquebusiers, devenus mousquetaires au niveau 3, et favorise le tir de précision.
- En duel, l’arme secrète devient un pistolet au lieu d’une dague.
- Accroît les vivres obtenus en chasse et lors des rencontres de bisons.

### Compétences — Prendre soin des marins

**Médecine** — Second, infirmerie ; pour le scorbut, toute personne à bord

- Retarde le scorbut et sa propagation, davantage avec une infirmerie. Prévient aussi les fièvres maritimes.
- Réduit les pertes dues aux fièvres terrestres, aide à trouver les plantes et à résister aux blizzards.
- Réduit les dégâts des catastrophes et relève une partie des hommes tombés après bataille. Requise pour certains livres et événements légendaires.

**Cuisine** — Toute personne à bord

- Les repas du bord et du camp réduisent la fatigue, y compris sous la pluie. Le souper après la chasse est plus nourrissant.
- Permet d’apaiser une mutinerie par un festin ; cuisine ou musique suffit. Déclenche aussi des festins en mer.
- Reconnaît et accroît la valeur des découvertes alimentaires, comme épices et cultures.
- Le cuisinier prépare les plats de sa région selon son talent, réduisant fatigue et améliorant discipline. Un plat du pays de l’amiral est particulièrement apprécié.

**Musique** — Toute personne à bord

- Chants et instruments soutiennent la discipline. Davantage de chants de marins et meilleur repos au camp.
- Permet les festins d’apaisement en cas de mutinerie, comme la cuisine.
- Accroît la valeur des découvertes culturelles, chants, danses et rites, et facilite le contact sur place.
- La salle de loisirs favorise la discipline, celle de musique réduit la fatigue. Les salles musicales voisines forment duo, trio, quatuor, groupe ou grand ensemble.

**Théologie** — Second, chapelle

- Maintient la discipline en mer, renforcée par la chapelle.
- Les dons à l’église donnent davantage de renommée ; les prières y améliorent la discipline.
- Aide à rester ferme face au vaisseau fantôme et aux sirènes.
- Requise pour lire les ouvrages de théologie.

### Compétences — Relations et commerce

**Éloquence** — Second, réfectoire et cabine du second

- **Requise** pour tenter de convaincre un mécène d’une découverte hors de ses goûts.
- Favorise les contrats et réduit les concessions pour obtenir une avance ou un délai. Les niveaux élevés donnent de meilleures conditions.
- Aide à fléchir l’intendant sans renommée suffisante et à présenter un témoin quand les preuves sont faibles. Donne un ton assuré aux rapports et annonces.
- Négociations portuaires moins coûteuses et plus efficaces ; facilite aussi l’entrée clandestine.
- Facilite les indices obtenus auprès des autochtones et la confiance gagnée par les cadeaux.
- Sert à calmer les meneurs, persuader en duel, retenir compagnons ou épouses, apaiser les disputes conjugales, recouvrer à l’amiable et entendre parler de cartes au trésor.
- Avec la langue locale et une bonne éloquence, permet aussi de connaître le dirigeant d’une ville non visitée.

**Comptabilité** — Second, comptable, bureau de comptabilité

- Améliore réussite, réduction et nombre de marchandages au comptoir. Un comptable permet une tentative supplémentaire.
- **Requise** pour proposer de marchander au marché.
- Équilibre le chargement et augmente la charge supportée par les navires.
- **Niveau 3** : accès au marché noir des grands ports ; chaque transaction y augmente l’infamie.
- Avec la langue locale, révèle spécialités et prospérité des villes non visitées.
- Un **comptable** améliore fortement le marchandage, permet une négociation contractuelle de plus et augmente l’avance. Son bureau réduit les salaires.

### Compétences — Études et découvertes (1)

**Histoire** — Second, arpenteur, état-major

- Étend la recherche terrestre et facilite les découvertes sans indice. Les éclaireurs voient plus loin.
- Aide à reconnaître les catastrophes à venir ; dès 2, meilleure lecture de celles consignées dans les anciens récits.
- Révèle les dirigeants des villes non visitées.
- Requise pour les ouvrages historiques ; certains manuscrits exigent le niveau 2.

**Sciences** — Second, infirmerie, élevage

- Retardent le scorbut, préviennent les fièvres maritimes et aident à trouver les plantes médicinales.
- Étendent la recherche biologique et naturelle, et la détection des signes de catastrophe.
- Favorisent les poissons rares et éliminent une mauvaise réponse à l’énigme du Sphinx.
- L’élevage produit des vivres. Requises pour les livres scientifiques.

### Compétences — Études et découvertes (2)

**Dessin** — Toute personne à bord, cartographie, atelier de peinture

- Augmente la valeur de toutes les découvertes : renommée, récompenses de rapport et gratifications de dénomination.
- Détermine la **qualité des preuves** : planche précise pour un bon dessinateur, esquisse pour un novice, témoignage oral sans dessinateur, ce qui peut susciter le doute. Un artiste recruté plus tard peut refaire les dessins et améliorer leur qualité.
- Dessiner baleines et cascades dans l’album rapporte de la renommée. Les contrefaçons offertes sont moins facilement découvertes.
- L’occupant de l’atelier peint des œuvres chargées à bord.

**Orfèvrerie** — Toute personne à bord, atelier de sculpture

- Accroît fortement la valeur des trésors, ruines et découvertes culturelles, un peu celle des autres, ainsi que le prix de vente des reliques.
- Permet de recueillir plus d’objets précieux dans les trésors et ruines sans relique, et améliore les preuves.
- Les contrefaçons sont moins détectées. Les bijoux offerts aux serveuses et compagnons ont davantage d’effet.
- L’atelier produit des sculptures. Certains événements légendaires exigent cette compétence.

### Langues — Comprendre

16 langues ou familles : espagnol, portugais, romanes, germaniques, slaves et grec, arabe, persan, chinois, hindi, ouïghour, autochtones d’Afrique, d’Amérique centrale et du Sud, d’Asie du Sud-Est, d’Asie orientale, coréen et autochtones d’Amérique du Nord. Niveaux : **aucun, notions, moyen, courant**.

- **Langue locale** — Chaque ville a sa langue. Les points de la barre supérieure indiquent le niveau du groupe. Dans les ports portugais ou fréquentés par leurs marchands, le portugais permet aussi de communiquer.
- **Dialogues** — Si l’amiral connaît mal la langue, les mots incompris apparaissent en caractères étrangers. Un meilleur niveau révèle davantage de mots ; au niveau courant, tout est compris.
- **Interprétation** — Si un second, interprète ou occupant de cabine d’interprétariat connaît mieux la langue, un encadré traduit sous le dialogue. S’il la maîtrise peu, seule une partie est rendue avec une compréhension approximative ou fragmentaire.
- **Autochtones** — Même sans langue commune, les gestes permettent un peu de communication.
- **Niveau retenu** — Meilleur niveau parmi l’amiral, le second, l’interprète et les cabines d’interprétariat. Les autres rôles et capitaines ne comptent pas ; à la bibliothèque, tous les compagnons lisent ensemble. Un **chef interprète**, ci-dessous, exploite toutefois toutes les langues du navire amiral.

### Langues — Obstacles et avantages

**Impossible sans aucune connaissance**

- Marchander au comptoir ou au marché ; les achats et ventes restent possibles
- Écouter les rumeurs commerciales, renseignements contractuels, destinations et histoires de taverne
- Recouvrer une dette et négocier avec le chef de garde
- Audience auprès d’un mécène ; l’intendant refuse l’accès
- Recruter à la taverne ; il faut une langue commune
- Connaître les spécialités et dirigeants des villes non visitées dans le carnet
- Lire un livre si personne n’en connaît la langue

**Avantages d’un bon niveau**

- Meilleurs marchandages, négociations aux portes, recouvrements et pourparlers diplomatiques.
- Entrées clandestines facilitées, davantage encore avec un compagnon dont c’est la langue maternelle.
- Les recrues accordent davantage de confiance initiale. Sans maîtrise courante, elles ne s’ouvrent pas encore complètement.
- Lire davantage d’un livre. Avec un niveau amélioré, le relire donne accès aux passages manquants.
- Le plan d’expédition avertit de prendre un interprète si personne ne connaît la langue de destination.

### Langues — Apprentissage et interprètes

**Apprendre les langues**

1. **Création** — Langue maternelle courante, langue ibérique voisine moyenne. Les points restants améliorent les autres langues ; l’intelligence en limite le nombre.
2. **Guilde : étude des langues** — Apprendre la langue locale et celles des environs, un niveau à la fois contre argent et jours. L’intelligence facilite l’étude ; les niveaux élevés sont plus difficiles.
3. **Auberge : petits travaux** — Cuisine et coupe de bois enseignent la langue locale à l’oreille. Une bonne intelligence accélère le progrès, mais la renommée baisse chaque jour et la durée est limitée.
4. **Vie à bord** — Apprentissage quotidien des langues maternelles des compagnons : plus rapide avec le second, plus lent avec les autres. Les compagnons apprennent aussi la langue de l’amiral et celles des autres.

**Employer des interprètes**

- Le rôle d’**interprète** met ses langues au service de la flotte, sans utiliser ses compétences techniques.
- Le **second** fournit à la fois ses langues et ses compétences.
- Créer plusieurs **cabines d’interprétariat** permet plusieurs interprètes. Pour parcourir différentes mers, diversifiez les langues de l’équipage.
- **Chef interprète** — Placer l’interprète désigné dans une cabine d’interprétariat lui permet de rassembler dans un registre les langues de l’amiral et de tous les compagnons du navire amiral. Il consulte ceux qui savent et rapporte leur explication ; il apprend plus vite que les autres. Registre dans le carnet de l’amiral.
- Les cuisiniers servent leurs plats d’origine : un équipage aux langues variées apporte aussi une table plus diverse.

## Découvertes et rapports

### Fenêtre de découverte

![Nouvelle découverte](guide/p62_disc)

| # | Colonne | Signification |
| --- | --- | --- |
| 1 | Dessin | Découvertes |
| 2 | Nom · Étiquettes | Catégorie · Région · Valeur |
| 3 | Description | Récit de la découverte |
| 4 | Renommée | Renommée reçue immédiatement sur place |
| 5 | OK | Fermer |

Une relique obtenue apparaît avec la découverte. Rapportée au mécène, elle sert de preuve et lui est remise ; annoncée vous-même au port, elle vous appartient.

### Rapporter ou annoncer ?

|  | **Rapport** au mécène, palais ou demeure | **Annonce** au port |
| --- | --- | --- |
| Gains | Récompense + renommée + confiance | Renommée : valeur de découverte × 0,9 |
| Relique | Remise comme preuve | Propriété de l’amiral |
| Sans preuve | Récompense ×0,55–0,8 ; renommée ×0,8 | Renommée ×0,8 |
| Après l’échéance | Récompense ×0,35–0,7 ; renommée ×0,7 | — |
| Attention | Sans contrat, les rapports suivants au même mécène la même année rapportent moins | Annoncer une découverte sous contrat fait échouer celui-ci |

- **Qualité des preuves** : objet réel ×1,05 ; planche précise ×1,05 avec dessin 2 ou plus ; carte ×1 ; esquisse ×0,95 avec dessin 1 ; témoignage oral ×0,9. Esquisse et oral peuvent susciter les soupçons.
- **Rapports et annonces groupés** — À partir de deux découvertes prêtes, l’option de rapport groupé apparaît dans les propositions d’expédition. Au port, plusieurs découvertes peuvent être cochées pour une annonce commune.
- **40 îles de villégiature**, catégorie Nature : approcher Koh Samui, Maldives, Bali, Seychelles, Santorin, Madère, Jeju, Tahiti, Bora-Bora, Maurice, etc. Le repos à la découverte réduit la fatigue de 25 et augmente la discipline de 8 ; l’émerveillement des autres découvertes naturelles donne −16 et +2.
- **Filtres et tri** — Catégories en haut des propositions, rapports groupés et annonces : toutes, géographie, nature, ruines, trésors, êtres vivants, peuples et marchandises. La sélection de tout ce qui est visible respecte le filtre. Tri par valeur, catégorie, nom ou découverte récente, conservé à la réouverture.
- **Épingler les objets** — Dans inventaire, réserve du foyer et vente du marché, cliquez sur l’épingle. Les objets épinglés sont exclus des sélections globales de vente et de dépôt, et disposent d’un filtre dédié. Vendre ou déposer conserve la position de défilement.
- **Si un rival annonce d’abord** — Vous pouvez encore trouver la découverte, mais le prestige de première découverte lui reste et vos gains diminuent. Contrat déjà conclu et indice restent valables jusqu’à l’échéance.

## Compagnies à charte et actions

### Fondation des compagnies

Des compagnies munies d’une charte royale apparaissent selon les époques. Leur fondation est annoncée et un bâtiment ouvre dans les rues de leur siège.

| Compagnie | Fondation | Siège | Monopoles |
| --- | --- | --- | --- |
| Casa da Índia portugaise | 1501 | Lisbonne | Poivre · Cannelle · Gingembre |
| Casa de Contratación espagnole | 1503 | Séville | Argent · Or · Teintures |
| Compagnie de Moscovie | 1555 | Londres | Fourrures · Chanvre |
| Compagnie du Levant | 1592 | Londres | Soie grège · Tapis |
| Compagnie anglaise des Indes orientales | 1600 | Londres | Cotonnades · Chintz · Thé |
| Compagnie unie des Indes orientales | 1602 | Amsterdam | Muscade · Girofle · Cannelle |
| Compagnie néerlandaise des Indes occidentales | 1621 | Amsterdam | Sucre · Fourrures |
| Compagnie française des Indes orientales | 1664 | Nantes | Café · Chintz |

- **Siège** — Registre des membres (adhésion et promotion), missions, livraison des monopoles et guichet d’actions
- **Comptoirs** dans les villes d’outre-mer de la compagnie : entrepôt, commandes de courtage et missions
- **Bourses** — Anvers de 1531 à 1585, Londres dès 1571, Amsterdam dès 1602 : actions de toutes les compagnies

### Devenir membre

Adhérez au registre du siège en versant une contribution, avec au moins 200 de renommée totale. 80 % reviennent sous forme d’actions. **Une seule compagnie à la fois** ; après un départ, aucune adhésion pendant un an.

| Avantage | Fonction |
| --- | --- |
| Entrepôt de compagnie | Achats au comptoir à 60 % du prix ordinaire, dans le quota du rang ; renouvellement tous les 60 jours |
| Livraison des monopoles | Au siège, prix du marché ×1,25–1,4. **Les livraisons importantes font baisser le prix**, qui revient en un ou deux mois |
| Commandes de courtage | Chaîne reliant comptoirs et grands ports. Les primes s’accumulent à chaque maillon ; chaîne complète : ×1,5 |
| Missions de compagnie | Lutte contre la contrebande, grande flotte de retour, construction de comptoir, capture d’un rival appartenant alors à une **nation ennemie** |
| Douanes | Les non-membres transportant un monopole de la compagnie sont fouillés à leur arrivée au port du siège |

La contribution permet de passer de membre à capitaine, directeur puis gouverneur. Quotas, prix de livraison et récompenses augmentent.

### Actions · Contributions fondatrices

- Le cours varie chaque mois ; les **dividendes sont versés automatiquement en janvier**. Retour et naufrage des flottes, grands événements et missions de l’amiral influencent le cours.
- **Plafond d’investissement** — Somme des prix d’achat des actions limitée à **1 million de pièces d’or**. Les ventes libèrent ce montant. Maximum 3 000 actions par compagnie.
- **Souscription fondatrice** — Les contributions aux événements de Londres (1600), Amsterdam (1602 et 1621) et Paris (1664) deviennent des actions. Pendant la souscription historique : valeur nominale de 500 pièces l’action ; ensuite : cours du jour.
- **Fondateurs** — Avoir souscrit dans les délais et conserver toutes les actions reçues permet d’adhérer sans nouvelle contribution dans les **10 ans suivant la fondation**.
- Le premier règlement est réparti par action détenue ce jour-là : compagnie anglaise en 1604, néerlandaise des Indes orientales en 1610, des Indes occidentales en 1629.
- Les confidences du courtier annoncent des nouvelles à venir, sans être toujours justes.

## Questions fréquentes

### En cas de blocage

| Question | Réponse |
| --- | --- |
| Pourquoi la longitude affiche-t-elle « ? » en mer ? | Il faut un sextant. La latitude apparaît avec astrolabe, sextant ou arpentage 2. Le marché d’origine vend toujours boussole et sextant |
| Pourquoi un clic sur le port ne lance-t-il pas la navigation automatique ? | Il faut d’abord relier directement les deux ports sans autre escale pour ouvrir la route |
| Pourquoi ne puis-je pas rencontrer un mécène ? | Renommée insuffisante. Demandez de petits travaux à l’intendant pour gagner renommée et confiance |
| Pourquoi ne puis-je pas appareiller ? | Moins de 5 marins, ou moins d’un tiers de l’équipage minimal, ou moins de 2 jours de vivres ou d’eau |
| Pourquoi le livre est-il rouge ? | Pas encore publié, volumes précédents non déchiffrés, langue ou savoir insuffisant, ou région encore inconnue |
| Pourquoi des caractères étrangers apparaissent-ils dans les dialogues ? | Ce sont les mots que votre niveau de langue ne permet pas de comprendre. Apprenez à l’auberge ou à la guilde, ou affectez un bon locuteur à l’interprétariat ; voir le chapitre des attributs, compétences et langues |
| Comment améliorer les attributs ? | Progressivement par persuasion, commerce, combats, duels, gastronomie et société ; aussi par grands événements comme titre ou mariage. La progression ralentit aux valeurs hautes ; voir Expérience et progression |
| Pourquoi ne puis-je pas sauvegarder ? | Avec les règles strictes, seulement à l’auberge d’une ville de votre nation. Vérifiez aussi que la sauvegarde automatique est activée |
| Je ne sais pas quoi faire | Consultez les activités en ville et l’onglet Découvertes du carnet |

Bonne chance, amiral. Vers des mers lointaines !
