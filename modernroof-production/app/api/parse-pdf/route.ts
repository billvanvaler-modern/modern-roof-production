import { NextRequest, NextResponse } from "next/server";
import { parseRoofrText, findRecommendedWastePct, PdfTextItem } from "@/lib/parsePdf";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    const pdfParse = (await import("pdf-parse")).default;

    // Custom pagerender: replicates default text extraction AND captures item coordinates
    const allItems: PdfTextItem[] = [];
    const options = {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      pagerender: async (pageData: any) => {
        const textContent = await pageData.getTextContent();
        let lastY: number | undefined;
        let text = "";
        for (const item of textContent.items) {
          if (lastY === item.transform[5] || lastY === undefined) {
            text += item.str;
          } else {
            text += "\n" + item.str;
          }
          lastY = item.transform[5];
          if (item.str && item.str.trim()) {
            allItems.push({
              str: item.str,
              x: item.transform[4],
              y: item.transform[5],
              width: item.width ?? 0,
            });
          }
        }
        return text;
      },
    };

    const data = await pdfParse(buffer, options);
    const measurements = parseRoofrText(data.text);

    // Override recommendedWastePct using visual X-coordinate matching
    const coordRec = findRecommendedWastePct(allItems, measurements.wasteTable);
    if (coordRec !== undefined) {
      measurements.recommendedWastePct = coordRec;
    }

    return NextResponse.json({ measurements, rawText: data.text });
  } catch (err) {
    console.error("PDF parse error:", err);
    return NextResponse.json(
      { error: "Failed to parse PDF" },
      { status: 500 }
    );
  }
}
