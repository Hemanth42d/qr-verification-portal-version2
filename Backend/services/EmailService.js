import nodemailer from "nodemailer";
import path from "path";

class EmailService {
  constructor() {
    this.transporter = null;
  }

  _getTransporter() {
    if (this.transporter) return this.transporter;

    this.transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });

    return this.transporter;
  }

  async sendCertificateEmail(certificate) {
    const transporter = this._getTransporter();
    const verifyUrl = `${process.env.FRONTEND_URL}/verify/${certificate.certificateId}`;

    const htmlBody = `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"></head>
      <body style="margin: 0; padding: 0; background: #f5f5f5; font-family: 'Google Sans', Roboto, Arial, sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background: #f5f5f5; padding: 40px 20px;">
          <tr><td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background: #ffffff; border-radius: 8px; overflow: hidden;">

              <!-- Google colored top bar -->
              <tr>
                <td style="height: 4px; background: linear-gradient(90deg, #4285F4 25%, #EA4335 25%, #EA4335 50%, #FBBC04 50%, #FBBC04 75%, #34A853 75%);">
                </td>
              </tr>

              <!-- Logo -->
              <tr>
                <td style="padding: 28px 40px 16px;" align="center">
                  <img src="cid:gdglogo" alt="GDG on Campus - Mohan Babu University" style="width: 100%; max-width: 520px; height: auto;" />
                </td>
              </tr>

              <!-- Divider -->
              <tr><td style="padding: 0 40px;"><div style="border-top: 1px solid #e8eaed;"></div></td></tr>

              <!-- Body -->
              <tr>
                <td style="padding: 28px 40px;">
                  <p style="color: #202124; font-size: 15px; line-height: 1.6; margin: 0 0 16px;">
                    Dear <strong>${certificate.participantName}</strong>,
                  </p>
                  <p style="color: #5f6368; font-size: 14px; line-height: 1.7; margin: 0 0 24px;">
                    Thank you for participating in <strong style="color: #202124;">${certificate.eventName}</strong>. Your certificate of participation has been generated successfully.
                  </p>

                  <!-- Event details -->
                  <table width="100%" cellpadding="0" cellspacing="0" style="background: #f8f9fa; border-radius: 8px; border: 1px solid #e8eaed;">
                    <tr><td style="padding: 20px 24px;">
                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td style="padding: 4px 0; color: #5f6368; font-size: 13px;">Event</td>
                          <td style="padding: 4px 0; color: #202124; font-size: 13px; font-weight: 500; text-align: right;">${certificate.eventName}</td>
                        </tr>
                        <tr>
                          <td style="padding: 4px 0; color: #5f6368; font-size: 13px;">Date</td>
                          <td style="padding: 4px 0; color: #202124; font-size: 13px; font-weight: 500; text-align: right;">${certificate.eventDate}</td>
                        </tr>
                        <tr>
                          <td style="padding: 4px 0; color: #5f6368; font-size: 13px;">Venue</td>
                          <td style="padding: 4px 0; color: #202124; font-size: 13px; font-weight: 500; text-align: right;">${certificate.venue}</td>
                        </tr>
                      </table>
                    </td></tr>
                  </table>

                  <!-- Certificate ID -->
                  <div style="margin: 24px 0; text-align: center;">
                    <p style="color: #5f6368; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 8px;">Your Certificate ID</p>
                    <div style="background: #e8f0fe; border: 1px solid #d2e3fc; border-radius: 8px; padding: 14px 20px; display: inline-block;">
                      <span style="color: #1967d2; font-size: 16px; font-family: 'Roboto Mono', monospace; font-weight: 500; letter-spacing: 0.5px;">${certificate.certificateId}</span>
                    </div>
                  </div>

                  <p style="color: #5f6368; font-size: 14px; line-height: 1.6; margin: 0 0 24px; text-align: center;">
                    Visit our portal to verify and download your certificate.
                  </p>

                  <!-- CTA Button -->
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr><td align="center">
                      <a href="${verifyUrl}" style="background: #1a73e8; color: #ffffff; padding: 12px 32px; border-radius: 4px; text-decoration: none; font-size: 14px; font-weight: 500; display: inline-block;">
                        Verify &amp; Download Certificate
                      </a>
                    </td></tr>
                  </table>
                </td>
              </tr>

              <!-- Divider -->
              <tr><td style="padding: 0 40px;"><div style="border-top: 1px solid #e8eaed;"></div></td></tr>

              <!-- Footer -->
              <tr>
                <td style="padding: 24px 40px 32px;">
                  <p style="color: #5f6368; font-size: 13px; line-height: 1.6; margin: 0 0 4px;">
                    Warm regards,
                  </p>
                  <p style="color: #202124; font-size: 14px; font-weight: 500; margin: 0 0 2px;">
                    M.Venkata Hemanth
                  </p>
                  <p style="color: #5f6368; font-size: 12px; margin: 0;">
                    Organizer, GDG on Campus — Mohan Babu University
                  </p>
                </td>
              </tr>

              <!-- Bottom bar -->
              <tr>
                <td style="background: #f8f9fa; padding: 16px 40px; border-top: 1px solid #e8eaed;">
                  <p style="color: #9aa0a6; font-size: 11px; margin: 0; text-align: center;">
                    This is an automated email from the GDG on Campus Certificate Portal.
                  </p>
                </td>
              </tr>

            </table>
          </td></tr>
        </table>
      </body>
      </html>
    `;

    const publicDir = path.resolve("../Frontend/qr-verify/public");

    await transporter.sendMail({
      from: `"GDG on Campus" <${process.env.GMAIL_USER}>`,
      to: certificate.email,
      subject: `Your Certificate — ${certificate.eventName} | GDG on Campus`,
      html: htmlBody,
      attachments: [
        {
          filename: "gdg-logo.png",
          path: path.join(publicDir, "Google Developer Group On Campus Mohan Babu University (2).png"),
          cid: "gdglogo",
        },
      ],
    });
  }
}

export default new EmailService();
