import { google } from "googleapis";
import { PassThrough } from "stream";

class GoogleDriveService {
  constructor() {
    this.drive = null;
    this.folderCache = new Map();
  }

  _getDrive() {
    if (this.drive) return this.drive;

    const {
      GOOGLE_DRIVE_CLIENT_ID,
      GOOGLE_DRIVE_CLIENT_SECRET,
      GOOGLE_DRIVE_REFRESH_TOKEN,
    } = process.env;

    if (!GOOGLE_DRIVE_CLIENT_ID || !GOOGLE_DRIVE_CLIENT_SECRET || !GOOGLE_DRIVE_REFRESH_TOKEN) {
      throw new Error(
        "Google Drive OAuth2 not configured. Set GOOGLE_DRIVE_CLIENT_ID, GOOGLE_DRIVE_CLIENT_SECRET, and GOOGLE_DRIVE_REFRESH_TOKEN in .env"
      );
    }

    const auth = new google.auth.OAuth2(
      GOOGLE_DRIVE_CLIENT_ID,
      GOOGLE_DRIVE_CLIENT_SECRET,
      "http://localhost:5000/callback"
    );
    auth.setCredentials({ refresh_token: GOOGLE_DRIVE_REFRESH_TOKEN });

    this.drive = google.drive({ version: "v3", auth });
    return this.drive;
  }

  async _findOrCreateFolder(name, parentId) {
    const cacheKey = `${name}:${parentId}`;
    if (this.folderCache.has(cacheKey)) return this.folderCache.get(cacheKey);

    const drive = this._getDrive();
    const query = `name='${name}' and mimeType='application/vnd.google-apps.folder' and '${parentId}' in parents and trashed=false`;

    const res = await drive.files.list({ q: query, fields: "files(id, name)" });

    if (res.data.files.length > 0) {
      this.folderCache.set(cacheKey, res.data.files[0].id);
      return res.data.files[0].id;
    }

    const folder = await drive.files.create({
      resource: { name, mimeType: "application/vnd.google-apps.folder", parents: [parentId] },
      fields: "id",
    });

    this.folderCache.set(cacheKey, folder.data.id);
    return folder.data.id;
  }

  async uploadCertificate(pdfBuffer, certificateId, eventName) {
    const rootFolderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
    if (!rootFolderId) throw new Error("GOOGLE_DRIVE_FOLDER_ID is not set in .env");

    const drive = this._getDrive();
    const certFolderId = await this._findOrCreateFolder("Certificates", rootFolderId);
    const eventFolderId = await this._findOrCreateFolder(eventName, certFolderId);

    const buf = Buffer.isBuffer(pdfBuffer) ? pdfBuffer : Buffer.from(pdfBuffer);
    const bufferStream = new PassThrough();
    bufferStream.end(buf);

    const file = await drive.files.create({
      resource: { name: `${certificateId}.pdf`, parents: [eventFolderId] },
      media: { mimeType: "application/pdf", body: bufferStream },
      fields: "id",
    });

    await drive.permissions.create({
      fileId: file.data.id,
      resource: { role: "reader", type: "anyone" },
    });

    return {
      driveFileId: file.data.id,
      driveLink: `https://drive.google.com/uc?export=download&id=${file.data.id}`,
    };
  }
}

export default new GoogleDriveService();
