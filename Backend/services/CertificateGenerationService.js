import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import QRCode from "qrcode";
import { v4 as uuidv4 } from "uuid";
import sharp from "sharp";
import env from "../config/env.js";

class CertificateGenerationService {
  async generateCertificate(template, participant, customCertificateId = null) {
    const certificateId = customCertificateId || uuidv4();
    const verifyUrl = `${env.frontendUrl}/verify/${certificateId}`;

    // Generate QR code as PNG buffer
    const qrBuffer = await QRCode.toBuffer(verifyUrl, {
      width: template.qrPosition.size || 100,
      margin: 1,
      color: { dark: "#000000", light: "#ffffff" },
    });

    // Ensure we have a proper Node.js Buffer
    let imageBuffer = Buffer.isBuffer(template.templateImage)
      ? template.templateImage
      : Buffer.from(template.templateImage);

    const imageMime = template.templateMimeType;

    // Get image dimensions
    const metadata = await sharp(imageBuffer).metadata();
    const imgWidth = metadata.width;
    const imgHeight = metadata.height;

    // If JPEG, convert to PNG for pdf-lib compatibility (avoids some JPEG embedding issues)
    if (imageMime === "image/jpeg" || imageMime === "image/jpg") {
      // pdf-lib embedJpg can be finicky, ensure clean buffer
      imageBuffer = await sharp(imageBuffer).jpeg({ quality: 95 }).toBuffer();
    }

    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([imgWidth, imgHeight]);

    // Embed template image
    let embeddedImage;
    if (imageMime === "image/png") {
      embeddedImage = await pdfDoc.embedPng(imageBuffer);
    } else {
      embeddedImage = await pdfDoc.embedJpg(imageBuffer);
    }

    page.drawImage(embeddedImage, { x: 0, y: 0, width: imgWidth, height: imgHeight });

    // Draw participant name
    const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const namePos = template.namePosition;
    const color = this._hexToRgb(namePos.color || "#000000");

    page.drawText(participant.participantName, {
      x: namePos.x,
      y: imgHeight - namePos.y - (namePos.fontSize || 36),
      size: namePos.fontSize || 36,
      font,
      color: rgb(color.r / 255, color.g / 255, color.b / 255),
    });

    // Embed QR code
    const qrImage = await pdfDoc.embedPng(qrBuffer);
    const qrPos = template.qrPosition;
    const qrSize = qrPos.size || 100;

    page.drawImage(qrImage, {
      x: qrPos.x,
      y: imgHeight - qrPos.y - qrSize,
      width: qrSize,
      height: qrSize,
    });

    const pdfBytes = await pdfDoc.save();

    return {
      certificateId,
      pdfBuffer: Buffer.from(pdfBytes),
      participant,
    };
  }

  _hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? { r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16) }
      : { r: 0, g: 0, b: 0 };
  }
}

export default new CertificateGenerationService();
