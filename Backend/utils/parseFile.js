import XLSX from "xlsx";

/**
 * Parse CSV or XLSX buffer into array of participant objects
 * Expected columns: participantName, email, eventName, eventDate, venue
 */
export function parseParticipantFile(buffer, mimetype, originalname) {
  const isXlsx =
    mimetype === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
    originalname?.endsWith(".xlsx");

  const isCSV = mimetype === "text/csv" || mimetype === "application/vnd.ms-excel" || originalname?.endsWith(".csv");

  let rows;

  if (isXlsx || isCSV) {
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: "" });
  } else {
    throw new Error("Unsupported file format. Use CSV or XLSX.");
  }

  if (!rows || rows.length === 0) {
    throw new Error("File is empty or has no data rows");
  }

  // Normalize column names (case-insensitive, trim)
  const normalized = rows.map((row, idx) => {
    const normalized = {};
    for (const [key, value] of Object.entries(row)) {
      normalized[key.trim().toLowerCase()] = String(value).trim();
    }

    const participant = {
      participantName: normalized.participantname || normalized.name || normalized.participant_name || "",
      email: normalized.email || normalized.mail || "",
      eventName: normalized.eventname || normalized.event_name || normalized.event || "",
      eventDate: normalized.eventdate || normalized.event_date || normalized.date || "",
      venue: normalized.venue || normalized.location || "",
      certificateId: normalized.certificateid || normalized.certificate_id || normalized.id || "",
    };

    if (!participant.participantName || !participant.email) {
      throw new Error(`Row ${idx + 2}: participantName and email are required`);
    }

    return participant;
  });

  return normalized;
}
