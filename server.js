const express = require('express');
const fs = require('fs');
const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
const DATA_FILE = 'data.json';

// Charger la base de données
let DB = { joueurs: {}, matchs: [] };
if (fs.existsSync(DATA_FILE)) {
  DB = JSON.parse(fs.readFileSync(DATA_FILE));
}

app.post('/predict', (req, res) => {
  const { j1, j2, competition } = req.body;

  const statsJ1 = calculerStats(j1, competition);
  const statsJ2 = calculerStats(j2, competition);
  const h2h = calculerH2H(j1, j2);

  // ALGO V9.3
  let scoreJ1 = statsJ1.forme * 0.45 + statsJ1.site * 0.20 + h2h.j1 * 0.25 + 5;
  let scoreJ2 = statsJ2.forme * 0.45 + statsJ2.site * 0.20 + h2h.j2 * 0.25 + 5;

  const vainqueur = scoreJ1 > scoreJ2? j1 : j2;
  const fiabilite = 55 + Math.abs(scoreJ1 - scoreJ2); // Base 55%

  res.json({
    competition,
    match: `${j1} vs ${j2}`,
    vainqueur,
    score_pred: scoreJ1 > scoreJ2? "3-1" : "1-3",
    fiabilite: Math.min(92, Math.round(fiabilite)),
    detail: `${j1}: Forme ${statsJ1.forme}% Site ${statsJ1.site}% | ${j2}: Forme ${statsJ2.forme}% Site ${statsJ2.site}%`,
    h2h: `${h2h.j1}V - ${h2h.j2}V`,
    source: "Algo V9.3 Indépendant"
  });
});

// FONCTIONS DE CALCUL
function calculerStats(nom, site) {
  if (!DB.joueurs[nom]) return { forme: 50, site: 50 }; // Inconnu = 50%

  const matchs = DB.joueurs[nom].matchs;
  const derniers10 = matchs.slice(-10);
  const victoires = derniers10.filter(m => m.gagne).length;
  const forme = (victoires / derniers10.length) * 100 || 50;

  const surSite = matchs.filter(m => m.site === site);
  const victoiresSite = surSite.filter(m => m.gagne).length;
  const perfSite = (victoiresSite / surSite.length) * 100 || 50;

  return { forme: Math.round(forme), site: Math.round(perfSite) };
}

function calculerH2H(j1, j2) {
  const confrontations = DB.matchs.filter(m =>
    (m.j1 === j1 && m.j2 === j2) || (m.j1 === j2 && m.j2 === j1)
  );
  const vJ1 = confrontations.filter(m => m.vainqueur === j1).length;
  const vJ2 = confrontations.filter(m => m.vainqueur === j2).length;
  return { j1: vJ1, j2: vJ2 };
}

app.listen(PORT, () => console.log(`Luna V9.3 Server Indépendant lancé`));
