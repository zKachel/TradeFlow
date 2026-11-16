/**
 * Datenbank- und Rechtetests (Row Level Security).
 * Läuft komplett lokal mit PGlite (echte Postgres-Engine), keine Supabase-Verbindung nötig.
 * Schwerpunkt: Negativtests – Nutzer A darf Daten von Nutzer B weder lesen noch ändern.
 */
import { beforeAll, describe, expect, it } from "vitest";
import { asAnon, asUser, createTestDb, createUser, type Db } from "./db-harness";

let db: Db;
const u = {} as Record<"kundeA" | "kundeB" | "inhaberA" | "inhaberB" | "bueroA" | "mitarbeiterA" | "fremd", string>;
let companyA: string;
let companyB: string;
let jobA: string;
let requestA: string;

const uuid = () => crypto.randomUUID();

const requestRow = (over: Record<string, unknown> = {}) => ({
  client_request_id: uuid(),
  category_id: "maler",
  title: "Wohnzimmer streichen",
  description: "Zwei Wände und die Decke sollen neu gestrichen werden.",
  postal_code: "26169",
  city: "Friesoythe",
  urgency: "flexibel",
  details: { flaeche: 40, bereich: "innen" },
  ...over,
});

async function insertRequest(userId: string, over: Record<string, unknown> = {}) {
  const r = requestRow(over);
  return asUser(db, userId, (tx) =>
    tx.query<{ id: string }>(
      `insert into public.customer_requests
         (client_request_id, category_id, title, description, postal_code, city, urgency, details ${"customer_id" in over ? ", customer_id" : ""})
       values ($1,$2,$3,$4,$5,$6,$7,$8 ${"customer_id" in over ? ", $9" : ""}) returning id`,
      [
        r.client_request_id,
        r.category_id,
        r.title,
        r.description,
        r.postal_code,
        r.city,
        r.urgency,
        JSON.stringify(r.details),
        ...("customer_id" in over ? [over.customer_id] : []),
      ],
    ),
  );
}

async function createCompany(userId: string, name: string) {
  const r = await asUser(db, userId, (tx) =>
    tx.query<{ id: string }>(
      "select public.create_company($1, '26169', 'Friesoythe', 30, array['maler','bodenbelaege']) as id",
      [name],
    ),
  );
  return r.rows[0].id;
}

beforeAll(async () => {
  db = await createTestDb();
  u.kundeA = await createUser(db, "kunde-a@test.de", { account_type: "kunde", display_name: "Kunde A" });
  u.kundeB = await createUser(db, "kunde-b@test.de", { account_type: "kunde", display_name: "Kunde B" });
  u.inhaberA = await createUser(db, "inhaber-a@test.de", { account_type: "betrieb", display_name: "Inhaber A" });
  u.inhaberB = await createUser(db, "inhaber-b@test.de", { account_type: "betrieb", display_name: "Inhaber B" });
  u.bueroA = await createUser(db, "buero-a@test.de", { account_type: "betrieb" });
  u.mitarbeiterA = await createUser(db, "ma-a@test.de", { account_type: "betrieb" });
  u.fremd = await createUser(db, "fremd@test.de", { account_type: "admin" });

  companyA = await createCompany(u.inhaberA, "Malerei A");
  companyB = await createCompany(u.inhaberB, "Boden B");
  // Einladungen kommen in Sprint 3 – hier direkt als Systemnutzer anlegen.
  await db.query("insert into public.company_memberships values ($1,$2,'buero'), ($1,$3,'mitarbeiter')", [
    companyA,
    u.bueroA,
    u.mitarbeiterA,
  ]);

  const job = await asUser(db, u.inhaberA, (tx) =>
    tx.query<{ id: string }>(
      `insert into public.company_jobs (company_id, title, customer_name, location, category_id)
       values ($1, 'Flur streichen', 'Fam. Muster', '26169 Friesoythe', 'maler') returning id`,
      [companyA],
    ),
  );
  jobA = job.rows[0].id;
  requestA = (await insertRequest(u.kundeA)).rows[0].id;
});

describe("Profile", () => {
  it("werden bei der Registrierung mit Kontotyp angelegt", async () => {
    const r = await db.query<{ id: string; account_type: string; display_name: string }>(
      "select id, account_type, display_name from public.profiles order by display_name",
    );
    const byId = Object.fromEntries(r.rows.map((x) => [x.id, x]));
    expect(byId[u.kundeA].account_type).toBe("kunde");
    expect(byId[u.inhaberA].account_type).toBe("betrieb");
    // Unbekannter Kontotyp (z. B. "admin") wird NICHT übernommen
    expect(byId[u.fremd].account_type).toBe("kunde");
    // Ohne Namen: Teil der E-Mail-Adresse
    expect(byId[u.bueroA].display_name).toBe("buero-a");
  });

  it("sind nur für den Eigentümer sichtbar", async () => {
    const r = await asUser(db, u.kundeA, (tx) => tx.query("select id from public.profiles"));
    expect(r.rows).toEqual([{ id: u.kundeA }]);
  });

  it("Kontotyp kann nicht selbst geändert werden", async () => {
    await expect(
      asUser(db, u.kundeA, (tx) => tx.query("update public.profiles set account_type = 'betrieb' where id = $1", [u.kundeA])),
    ).rejects.toThrow(/permission denied/);
  });

  it("Name kann selbst geändert werden, fremde Profile nicht", async () => {
    await asUser(db, u.kundeA, (tx) => tx.query("update public.profiles set display_name = 'Anna' where id = $1", [u.kundeA]));
    const other = await asUser(db, u.kundeA, (tx) =>
      tx.query("update public.profiles set display_name = 'Gehackt' where id = $1", [u.kundeB]),
    );
    expect(other.affectedRows).toBe(0);
    const b = await db.query<{ display_name: string }>("select display_name from public.profiles where id = $1", [u.kundeB]);
    expect(b.rows[0].display_name).toBe("Kunde B");
  });
});

describe("Firmen", () => {
  it("Kundenkonten können keine Firma anlegen", async () => {
    await expect(
      asUser(db, u.kundeA, (tx) => tx.query("select public.create_company('X GmbH','26169','Friesoythe',30,'{}')")),
    ).rejects.toThrow(/Nur Betriebskonten/);
  });

  it("ein Konto kann nur eine Firma anlegen", async () => {
    await expect(createCompany(u.inhaberA, "Zweite Firma")).rejects.toThrow(/bereits zu einer Firma/);
  });

  it("Inhaber wird automatisch Mitglied mit Rolle inhaber", async () => {
    const r = await db.query<{ role: string }>(
      "select role from public.company_memberships where company_id = $1 and user_id = $2",
      [companyA, u.inhaberA],
    );
    expect(r.rows[0].role).toBe("inhaber");
  });

  it("fremde Firmen sind unsichtbar", async () => {
    const r = await asUser(db, u.inhaberB, (tx) => tx.query<{ id: string }>("select id from public.companies"));
    expect(r.rows.map((x) => x.id)).toEqual([companyB]);
    const k = await asUser(db, u.kundeA, (tx) => tx.query("select id from public.companies"));
    expect(k.rows).toHaveLength(0);
  });

  it("fremde Firmen können nicht geändert werden", async () => {
    const r = await asUser(db, u.inhaberB, (tx) =>
      tx.query("update public.companies set name = 'Übernommen' where id = $1", [companyA]),
    );
    expect(r.affectedRows).toBe(0);
  });

  it("Büro darf Firmendaten nicht ändern, Inhaber schon", async () => {
    const buero = await asUser(db, u.bueroA, (tx) =>
      tx.query("update public.companies set name = 'Büro-Name' where id = $1", [companyA]),
    );
    expect(buero.affectedRows).toBe(0);
    const owner = await asUser(db, u.inhaberA, (tx) =>
      tx.query("update public.companies set name = 'Malerei A GmbH' where id = $1", [companyA]),
    );
    expect(owner.affectedRows).toBe(1);
  });

  it("Verifizierungsstatus kann nicht selbst gesetzt werden", async () => {
    await expect(
      asUser(db, u.inhaberA, (tx) =>
        tx.query("update public.companies set verification_status = 'verifiziert' where id = $1", [companyA]),
      ),
    ).rejects.toThrow(/permission denied/);
  });

  it("niemand kann sich selbst in eine fremde Firma eintragen", async () => {
    await expect(
      asUser(db, u.inhaberB, (tx) =>
        tx.query("insert into public.company_memberships values ($1,$2,'inhaber')", [companyA, u.inhaberB]),
      ),
    ).rejects.toThrow(/permission denied/);
    await expect(
      asUser(db, u.mitarbeiterA, (tx) =>
        tx.query("update public.company_memberships set role = 'inhaber' where user_id = $1", [u.mitarbeiterA]),
      ),
    ).rejects.toThrow(/permission denied/);
  });
});

describe("Firmenaufträge", () => {
  it("Inhaber und Büro sehen die Aufträge der eigenen Firma", async () => {
    for (const id of [u.inhaberA, u.bueroA]) {
      const r = await asUser(db, id, (tx) => tx.query<{ id: string }>("select id from public.company_jobs"));
      expect(r.rows.map((x) => x.id)).toContain(jobA);
    }
  });

  it("andere Firmen, Kunden und (bis Sprint 3) ausführende Mitarbeiter sehen nichts", async () => {
    for (const id of [u.inhaberB, u.kundeA, u.mitarbeiterA]) {
      const r = await asUser(db, id, (tx) => tx.query("select id from public.company_jobs where id = $1", [jobA]));
      expect(r.rows).toHaveLength(0);
    }
  });

  it("fremde Firma kann keine Aufträge in Firma A anlegen", async () => {
    await expect(
      asUser(db, u.inhaberB, (tx) =>
        tx.query(
          `insert into public.company_jobs (company_id, title, customer_name, location, category_id)
           values ($1, 'Fake', 'X Y', 'Irgendwo', 'maler')`,
          [companyA],
        ),
      ),
    ).rejects.toThrow(/row-level security/);
  });

  it("fremde Aufträge können nicht geändert werden", async () => {
    const r = await asUser(db, u.inhaberB, (tx) =>
      tx.query("update public.company_jobs set status = 'storniert' where id = $1", [jobA]),
    );
    expect(r.affectedRows).toBe(0);
  });

  it("Auftrag kann nicht in eine andere Firma verschoben oder gelöscht werden", async () => {
    await expect(
      asUser(db, u.inhaberA, (tx) => tx.query("update public.company_jobs set company_id = $1 where id = $2", [companyB, jobA])),
    ).rejects.toThrow(/permission denied/);
    await expect(
      asUser(db, u.inhaberA, (tx) => tx.query("delete from public.company_jobs where id = $1", [jobA])),
    ).rejects.toThrow(/permission denied/);
  });

  it("Büro kann Status ändern; Statuswechsel wird mit Nutzer protokolliert", async () => {
    await asUser(db, u.bueroA, (tx) => tx.query("update public.company_jobs set status = 'geplant' where id = $1", [jobA]));
    const r = await db.query<{ actor_id: string; old_status: string; new_status: string }>(
      "select actor_id, old_status, new_status from public.audit_events where entity_id = $1 and action = 'status_changed'",
      [jobA],
    );
    expect(r.rows).toEqual([{ actor_id: u.bueroA, old_status: "neu", new_status: "geplant" }]);
  });

  it("Uhrzeit ohne Datum wird abgelehnt", async () => {
    await expect(
      asUser(db, u.inhaberA, (tx) => tx.query("update public.company_jobs set scheduled_time = '08:00' where id = $1", [jobA])),
    ).rejects.toThrow(/check constraint/);
  });

  it("Notizen: eigene Firma ja, fremde Firma nein", async () => {
    await asUser(db, u.inhaberA, (tx) =>
      tx.query("insert into public.job_notes (job_id, body) values ($1, 'Schlüssel beim Nachbarn')", [jobA]),
    );
    await expect(
      asUser(db, u.inhaberB, (tx) => tx.query("insert into public.job_notes (job_id, body) values ($1, 'Spam')", [jobA])),
    ).rejects.toThrow(/row-level security/);
    const seen = await asUser(db, u.inhaberB, (tx) => tx.query("select id from public.job_notes"));
    expect(seen.rows).toHaveLength(0);
  });
});

describe("Kundenanfragen", () => {
  it("nur der Auftraggeber sieht seine Anfrage – keine andere Person, keine Firma", async () => {
    const own = await asUser(db, u.kundeA, (tx) => tx.query("select id from public.customer_requests"));
    expect(own.rows).toEqual([{ id: requestA }]);
    for (const id of [u.kundeB, u.inhaberA, u.bueroA]) {
      const r = await asUser(db, id, (tx) => tx.query("select id from public.customer_requests"));
      expect(r.rows).toHaveLength(0);
    }
  });

  it("doppelte Einsendung mit derselben Formular-ID wird verhindert", async () => {
    const clientId = uuid();
    await insertRequest(u.kundeB, { client_request_id: clientId });
    await expect(insertRequest(u.kundeB, { client_request_id: clientId })).rejects.toThrow(/duplicate key/);
  });

  it("Anfrage im Namen einer anderen Person ist nicht möglich", async () => {
    await expect(insertRequest(u.kundeB, { customer_id: u.kundeA })).rejects.toThrow(/row-level security|Ungültiger/);
  });

  it("Betriebskonten können keine Kundenanfragen stellen", async () => {
    await expect(insertRequest(u.inhaberA)).rejects.toThrow(/row-level security/);
  });

  it("fremde Anfragen können nicht geändert oder storniert werden", async () => {
    const r = await asUser(db, u.kundeB, (tx) =>
      tx.query("update public.customer_requests set status = 'storniert' where id = $1", [requestA]),
    );
    expect(r.affectedRows).toBe(0);
  });

  it("Kunde darf nur stornieren, nicht selbst vergeben oder freischalten", async () => {
    await expect(
      asUser(db, u.kundeA, (tx) => tx.query("update public.customer_requests set status = 'sichtbar' where id = $1", [requestA])),
    ).rejects.toThrow(/Statuswechsel nicht erlaubt/);
  });

  it("ungültige Daten werden von der Datenbank abgelehnt", async () => {
    await expect(insertRequest(u.kundeB, { postal_code: "123" })).rejects.toThrow(/check constraint/);
    await expect(insertRequest(u.kundeB, { title: "x" })).rejects.toThrow(/check constraint/);
    await expect(insertRequest(u.kundeB, { category_id: "<script>" })).rejects.toThrow(/check constraint/);
  });

  it("anonyme Besucher haben keinerlei Zugriff", async () => {
    for (const t of ["profiles", "companies", "company_jobs", "customer_requests", "request_attachments", "audit_events"]) {
      await expect(asAnon(db, (tx) => tx.query(`select * from public.${t}`))).rejects.toThrow(/permission denied/);
    }
  });

  it("Missbrauchsschutz: höchstens 10 Anfragen in 24 Stunden", async () => {
    const spammer = await createUser(db, "spam@test.de", { account_type: "kunde" });
    for (let i = 0; i < 10; i++) await insertRequest(spammer);
    await expect(insertRequest(spammer)).rejects.toThrow(/Zu viele Anfragen/);
  });
});

describe("Fotos (Metadaten + privater Speicher)", () => {
  const path = (owner: string, req: string) => `${owner}/${req}/${uuid()}.jpg`;

  it("Eigentümer kann Fotos zu eigener Anfrage speichern", async () => {
    const p = path(u.kundeA, requestA);
    await asUser(db, u.kundeA, async (tx) => {
      await tx.query("insert into storage.objects (bucket_id, name) values ('request-photos', $1)", [p]);
      await tx.query(
        "insert into public.request_attachments (request_id, client_file_id, storage_path, mime_type, size_bytes) values ($1,$2,$3,'image/jpeg',1000)",
        [requestA, uuid(), p],
      );
    });
    const r = await asUser(db, u.kundeA, (tx) => tx.query("select name from storage.objects"));
    expect(r.rows).toHaveLength(1);
  });

  it("fremde Personen können weder hochladen noch lesen", async () => {
    await expect(
      asUser(db, u.kundeB, (tx) =>
        tx.query("insert into storage.objects (bucket_id, name) values ('request-photos', $1)", [path(u.kundeA, requestA)]),
      ),
    ).rejects.toThrow(/row-level security/);
    // Eigener Ordner, aber fremde Anfrage
    await expect(
      asUser(db, u.kundeB, (tx) =>
        tx.query("insert into storage.objects (bucket_id, name) values ('request-photos', $1)", [path(u.kundeB, requestA)]),
      ),
    ).rejects.toThrow(/row-level security/);
    for (const id of [u.kundeB, u.inhaberA]) {
      const objs = await asUser(db, id, (tx) => tx.query("select name from storage.objects"));
      expect(objs.rows).toHaveLength(0);
      const meta = await asUser(db, id, (tx) => tx.query("select id from public.request_attachments"));
      expect(meta.rows).toHaveLength(0);
    }
  });

  it("Metadaten zu fremder Anfrage oder mit falschem Pfad werden abgelehnt", async () => {
    await expect(
      asUser(db, u.kundeB, (tx) =>
        tx.query(
          "insert into public.request_attachments (request_id, client_file_id, storage_path, mime_type, size_bytes) values ($1,$2,$3,'image/jpeg',1000)",
          [requestA, uuid(), path(u.kundeB, requestA)],
        ),
      ),
    ).rejects.toThrow(/Keine Berechtigung/);
    await expect(
      asUser(db, u.kundeA, (tx) =>
        tx.query(
          "insert into public.request_attachments (request_id, client_file_id, storage_path, mime_type, size_bytes) values ($1,$2,$3,'image/jpeg',1000)",
          [requestA, uuid(), `${u.kundeB}/${requestA}/x.jpg`],
        ),
      ),
    ).rejects.toThrow(/Ungültiger Speicherpfad/);
  });

  it("nur erlaubte Dateitypen und Größen, höchstens 6 Fotos", async () => {
    await expect(
      asUser(db, u.kundeA, (tx) =>
        tx.query(
          "insert into public.request_attachments (request_id, client_file_id, storage_path, mime_type, size_bytes) values ($1,$2,$3,'image/svg+xml',1000)",
          [requestA, uuid(), path(u.kundeA, requestA)],
        ),
      ),
    ).rejects.toThrow(/check constraint/);
    await expect(
      asUser(db, u.kundeA, (tx) =>
        tx.query(
          "insert into public.request_attachments (request_id, client_file_id, storage_path, mime_type, size_bytes) values ($1,$2,$3,'image/jpeg',99999999)",
          [requestA, uuid(), path(u.kundeA, requestA)],
        ),
      ),
    ).rejects.toThrow(/check constraint/);
    // Bereits 1 vorhanden → 5 weitere erlaubt, das 7. nicht
    for (let i = 0; i < 5; i++) {
      await asUser(db, u.kundeA, (tx) =>
        tx.query(
          "insert into public.request_attachments (request_id, client_file_id, storage_path, mime_type, size_bytes) values ($1,$2,$3,'image/webp',1000)",
          [requestA, uuid(), path(u.kundeA, requestA)],
        ),
      );
    }
    await expect(
      asUser(db, u.kundeA, (tx) =>
        tx.query(
          "insert into public.request_attachments (request_id, client_file_id, storage_path, mime_type, size_bytes) values ($1,$2,$3,'image/webp',1000)",
          [requestA, uuid(), path(u.kundeA, requestA)],
        ),
      ),
    ).rejects.toThrow(/Maximal 6 Fotos/);
  });

  it("Bucket ist privat mit Größen- und Typlimit", async () => {
    const r = await db.query<{ public: boolean; file_size_limit: number; allowed_mime_types: string[] }>(
      "select public, file_size_limit, allowed_mime_types from storage.buckets where id = 'request-photos'",
    );
    expect(r.rows[0].public).toBe(false);
    expect(Number(r.rows[0].file_size_limit)).toBe(5242880);
    expect(r.rows[0].allowed_mime_types).toEqual(["image/jpeg", "image/png", "image/webp"]);
  });
});

describe("Protokoll", () => {
  it("kann nicht direkt beschrieben werden", async () => {
    await expect(
      asUser(db, u.inhaberA, (tx) =>
        tx.query("insert into public.audit_events (entity_type, entity_id, action) values ('x', $1, 'fake')", [uuid()]),
      ),
    ).rejects.toThrow(/permission denied/);
  });

  it("ist nur für Berechtigte lesbar", async () => {
    const a = await asUser(db, u.inhaberA, (tx) => tx.query("select id from public.audit_events where company_id = $1", [companyA]));
    expect(a.rows.length).toBeGreaterThan(0);
    const b = await asUser(db, u.inhaberB, (tx) => tx.query("select id from public.audit_events where company_id = $1", [companyA]));
    expect(b.rows).toHaveLength(0);
    const k = await asUser(db, u.kundeA, (tx) =>
      tx.query<{ entity_type: string }>("select entity_type from public.audit_events"),
    );
    expect(k.rows.every((x) => x.entity_type === "customer_request")).toBe(true);
  });
});
