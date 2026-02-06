import { NextResponse } from "next/server";
import {
  getAllData,
  saveJour,
  deleteJour,
  addTypologie,
  updateTypologie,
  deleteTypologie,
  importData,
} from "@/lib/database";
import type { JourData, Typologie, AppData } from "@/lib/types";

export async function GET() {
  try {
    const data = getAllData();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching data:", error);
    return NextResponse.json(
      { error: "Failed to fetch data" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, data } = body;

    switch (action) {
      case "saveJour":
        saveJour(data as JourData);
        break;

      case "deleteJour":
        deleteJour(data as string);
        break;

      case "addTypologie":
        const newId = crypto.randomUUID();
        const typologies = getAllData().typologies;
        const maxOrdre = Math.max(0, ...typologies.map((t) => t.ordre));
        addTypologie({ ...data, id: newId, ordre: maxOrdre + 1 } as Typologie);
        break;

      case "updateTypologie":
        updateTypologie(data as Typologie);
        break;

      case "deleteTypologie":
        deleteTypologie(data as string);
        break;

      case "reorderTypologies":
        const reordered = data as Typologie[];
        reordered.forEach((typo, index) => {
          updateTypologie({ ...typo, ordre: index + 1 });
        });
        break;

      case "importData":
        importData(data as AppData);
        break;

      default:
        return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }

    const updatedData = getAllData();
    return NextResponse.json(updatedData);
  } catch (error) {
    console.error("Error updating data:", error);
    return NextResponse.json(
      { error: "Failed to update data" },
      { status: 500 },
    );
  }
}
