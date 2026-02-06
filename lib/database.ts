import Database from "better-sqlite3";
import { join } from "path";
import type { AppData, JourData, Typologie } from "./types";

const DB_PATH = join(process.cwd(), "data", "frequentation.db");

let db: Database.Database | null = null;

function getDb() {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma("journal_mode = WAL");
    initDatabase();
  }
  return db;
}

function initDatabase() {
  const db = getDb();

  // Table typologies
  db.exec(`
    CREATE TABLE IF NOT EXISTS typologies (
      id TEXT PRIMARY KEY,
      nom TEXT NOT NULL,
      couleur TEXT NOT NULL,
      actif INTEGER NOT NULL DEFAULT 1,
      ordre INTEGER NOT NULL,
      famille TEXT
    )
  `);

  // Table jours
  db.exec(`
    CREATE TABLE IF NOT EXISTS jours (
      date TEXT PRIMARY KEY,
      total_visites INTEGER NOT NULL,
      override_total INTEGER NOT NULL DEFAULT 0,
      note TEXT,
      estimee INTEGER NOT NULL DEFAULT 0,
      derniere_maj TEXT NOT NULL
    )
  `);

  // Table comptages (liaison jours-typologies)
  db.exec(`
    CREATE TABLE IF NOT EXISTS comptages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      typologie_id TEXT NOT NULL,
      count INTEGER NOT NULL,
      FOREIGN KEY (date) REFERENCES jours(date) ON DELETE CASCADE,
      FOREIGN KEY (typologie_id) REFERENCES typologies(id) ON DELETE CASCADE,
      UNIQUE(date, typologie_id)
    )
  `);

  // Vérifier si la DB est vide et insérer les données par défaut
  const typologiesCount = db
    .prepare("SELECT COUNT(*) as count FROM typologies")
    .get() as { count: number };
  if (typologiesCount.count === 0) {
    insertDefaultData();
  }
}

function insertDefaultData() {
  const db = getDb();

  const defaultTypologies = [
    {
      id: "1",
      nom: "Fablab",
      couleur: "#10b981",
      actif: 1,
      ordre: 1,
      famille: "Numérique",
    },
    {
      id: "2",
      nom: "Céramiste",
      couleur: "#3b82f6",
      actif: 1,
      ordre: 2,
      famille: "Créatif",
    },
    {
      id: "3",
      nom: "Atelier couture",
      couleur: "#f59e0b",
      actif: 1,
      ordre: 3,
      famille: "Créatif",
    },
    {
      id: "4",
      nom: "Visiteur",
      couleur: "#8b5cf6",
      actif: 1,
      ordre: 4,
      famille: "Accueil",
    },
    {
      id: "5",
      nom: "Coworking",
      couleur: "#ec4899",
      actif: 1,
      ordre: 5,
      famille: "Numérique",
    },
  ];

  const insertTypo = db.prepare(`
    INSERT INTO typologies (id, nom, couleur, actif, ordre, famille)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  for (const typo of defaultTypologies) {
    insertTypo.run(
      typo.id,
      typo.nom,
      typo.couleur,
      typo.actif,
      typo.ordre,
      typo.famille,
    );
  }
}

// CRUD Operations

export function getAllData(): AppData {
  const db = getDb();

  const typologies = db
    .prepare(
      `
    SELECT * FROM typologies ORDER BY ordre
  `,
    )
    .all() as any[];

  const jours = db
    .prepare(
      `
    SELECT * FROM jours ORDER BY date DESC
  `,
    )
    .all() as any[];

  const comptages = db
    .prepare(
      `
    SELECT * FROM comptages
  `,
    )
    .all() as any[];

  // Reconstituer les données
  const joursData: JourData[] = jours.map((jour) => {
    const typologiesCount = comptages
      .filter((c) => c.date === jour.date)
      .map((c) => ({
        typologie_id: c.typologie_id,
        count: c.count,
      }));

    return {
      date: jour.date,
      total_visites: jour.total_visites,
      override_total: Boolean(jour.override_total),
      typologies: typologiesCount,
      note: jour.note || "",
      estimee: Boolean(jour.estimee),
      derniere_maj: jour.derniere_maj,
    };
  });

  const typologiesData: Typologie[] = typologies.map((t) => ({
    id: t.id,
    nom: t.nom,
    couleur: t.couleur,
    actif: Boolean(t.actif),
    ordre: t.ordre,
    famille: t.famille || undefined,
  }));

  return {
    jours: joursData,
    typologies: typologiesData,
    version: 1,
  };
}

export function saveJour(jour: JourData) {
  const db = getDb();

  const insertJour = db.prepare(`
    INSERT OR REPLACE INTO jours (date, total_visites, override_total, note, estimee, derniere_maj)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const deleteComptages = db.prepare(`DELETE FROM comptages WHERE date = ?`);
  const insertComptage = db.prepare(`
    INSERT INTO comptages (date, typologie_id, count)
    VALUES (?, ?, ?)
  `);

  db.transaction(() => {
    insertJour.run(
      jour.date,
      jour.total_visites,
      jour.override_total ? 1 : 0,
      jour.note,
      jour.estimee ? 1 : 0,
      jour.derniere_maj,
    );

    deleteComptages.run(jour.date);

    for (const typo of jour.typologies) {
      insertComptage.run(jour.date, typo.typologie_id, typo.count);
    }
  })();
}

export function deleteJour(date: string) {
  const db = getDb();
  db.prepare("DELETE FROM jours WHERE date = ?").run(date);
}

export function addTypologie(typologie: Typologie) {
  const db = getDb();
  db.prepare(
    `
    INSERT INTO typologies (id, nom, couleur, actif, ordre, famille)
    VALUES (?, ?, ?, ?, ?, ?)
  `,
  ).run(
    typologie.id,
    typologie.nom,
    typologie.couleur,
    typologie.actif ? 1 : 0,
    typologie.ordre,
    typologie.famille || null,
  );
}

export function updateTypologie(typologie: Typologie) {
  const db = getDb();
  db.prepare(
    `
    UPDATE typologies
    SET nom = ?, couleur = ?, actif = ?, ordre = ?, famille = ?
    WHERE id = ?
  `,
  ).run(
    typologie.nom,
    typologie.couleur,
    typologie.actif ? 1 : 0,
    typologie.ordre,
    typologie.famille || null,
    typologie.id,
  );
}

export function deleteTypologie(id: string) {
  const db = getDb();
  db.prepare("DELETE FROM typologies WHERE id = ?").run(id);
}

export function importData(data: AppData) {
  const db = getDb();

  db.transaction(() => {
    // Vider les tables
    db.exec("DELETE FROM comptages");
    db.exec("DELETE FROM jours");
    db.exec("DELETE FROM typologies");

    // Insérer les typologies
    for (const typo of data.typologies) {
      addTypologie(typo);
    }

    // Insérer les jours
    for (const jour of data.jours) {
      saveJour(jour);
    }
  })();
}

export function closeDb() {
  if (db) {
    db.close();
    db = null;
  }
}
