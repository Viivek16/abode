// Low-level Google Sheets REST client, authenticated with the service account.
// SERVER ONLY — pulls secrets from env and must never be imported into client code.
import { JWT } from "google-auth-library";

const SHEET_ID = process.env.GOOGLE_SHEET_ID!;

let jwt: JWT | null = null;
function auth(): JWT {
  if (!jwt) {
    const raw = process.env.GOOGLE_PRIVATE_KEY || "";
    jwt = new JWT({
      email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      key: raw.includes("\\n") ? raw.replace(/\\n/g, "\n") : raw,
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });
  }
  return jwt;
}

async function api(path: string, init?: RequestInit): Promise<unknown> {
  const { token } = await auth().getAccessToken();
  if (!token) throw new Error("Google Sheets auth failed");
  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}${path}`,
    {
      ...init,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        ...init?.headers,
      },
    },
  );
  if (!res.ok) throw new Error(`Sheets ${res.status}: ${await res.text()}`);
  return res.json();
}

export type TabMeta = { sheetId: number; title: string };

export async function getTabs(): Promise<TabMeta[]> {
  const j = (await api(`?fields=sheets(properties(sheetId,title))`)) as {
    sheets?: { properties: { sheetId: number; title: string } }[];
  };
  return (j.sheets ?? []).map((s) => ({
    sheetId: s.properties.sheetId,
    title: s.properties.title,
  }));
}

export async function getValues(range: string): Promise<string[][]> {
  const j = (await api(`/values/${encodeURIComponent(range)}`)) as {
    values?: string[][];
  };
  return j.values ?? [];
}

export async function updateValues(
  range: string,
  values: (string | number)[][],
): Promise<void> {
  await api(`/values/${encodeURIComponent(range)}?valueInputOption=USER_ENTERED`, {
    method: "PUT",
    body: JSON.stringify({ values }),
  });
}

export async function duplicateTab(
  sourceSheetId: number,
  newTitle: string,
): Promise<TabMeta> {
  const j = (await api(`:batchUpdate`, {
    method: "POST",
    body: JSON.stringify({
      requests: [{ duplicateSheet: { sourceSheetId, newSheetName: newTitle } }],
    }),
  })) as { replies: { duplicateSheet: { properties: TabMeta } }[] };
  return j.replies[0].duplicateSheet.properties;
}

// Rename an existing tab.
export async function renameTab(sheetId: number, newTitle: string): Promise<void> {
  await api(`:batchUpdate`, {
    method: "POST",
    body: JSON.stringify({
      requests: [
        {
          updateSheetProperties: {
            properties: { sheetId, title: newTitle },
            fields: "title",
          },
        },
      ],
    }),
  });
}

// Insert one blank row directly after 1-based row `afterRow` (Sheets auto-adjusts
// the surrounding SUM/formula ranges so inserting inside the ledger is safe).
export async function insertRowAfter(
  sheetId: number,
  afterRow: number,
): Promise<void> {
  await api(`:batchUpdate`, {
    method: "POST",
    body: JSON.stringify({
      requests: [
        {
          insertDimension: {
            range: {
              sheetId,
              dimension: "ROWS",
              startIndex: afterRow, // 0-based index == 1-based row after
              endIndex: afterRow + 1,
            },
            inheritFromBefore: true,
          },
        },
      ],
    }),
  });
}
