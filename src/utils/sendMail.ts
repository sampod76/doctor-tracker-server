import nodemailer from "nodemailer";
import { env } from "../app/config/env";

export type IMailData = {
  company_name?: string;
  title: string;
  senderEmail?: string;
  receiver_email?: string;
  receivers_email?: string;
  subject: string;
  logo?: string;
  logo_to_link?: string;
  button?: {
    button_action_details: string;
    button_text: string;
    button_link: string;
    button_color_code: string;
  };
  dictionary?: {
    date: string;
    address: string;
  };
  body_text: string;
  footer_text?: string;
  data?: {
    otp: string | number;
    reset_link?: string;
    time_out: string | Date;
  };
  htmlContent?: string;
};

const createTransporter = () => {
  return nodemailer.createTransport({
    host: env.SMTP_HOST ?? "smtp.gmail.com",
    port: env.NODE_ENV === "production" ? 465 : 587,
    secure: env.NODE_ENV === "production",
    auth: {
      user: env.SMTP_USER as string,
      pass: env.SMTP_PASS as string,
    },
    tls: {
      rejectUnauthorized: false,
    },
  });
};

const buildHtml = (data: IMailData): string => {
  const {
    title,
    body_text,
    dictionary,
    button,
    footer_text,
  } = data;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; color: #333; }
        .email-container { max-width: 600px; margin: 0 auto; background: #ffffff; padding: 20px; border-radius: 10px; }
        .email-header { text-align: center; padding-bottom: 2px; }
        .email-title { font-size: 24px; color: #333; }
        .email-body { font-size: 16px; line-height: 1.5; color: #555; margin-bottom: 20px; }
        .email-action { text-align: center; margin: 20px 0; }
        .email-button { display: inline-block; padding: 10px 20px; font-size: 16px; color: #ffffff; background-color: ${button?.button_color_code || "#22BC66"}; text-decoration: none; border-radius: 5px; }
        .email-footer { text-align: center; font-size: 14px; color: #777; margin-top: 20px; }
      </style>
    </head>
    <body>
      <div class="email-container">
        <div class="email-header">
          <h1 class="email-title">${title || ""}</h1>
        </div>
        <div class="email-body">
          <p>${body_text}</p>
          ${
            dictionary
              ? `<p><strong>Date:</strong> ${dictionary.date}</p>
                 <p><strong>Address:</strong> ${dictionary.address}</p>`
              : ""
          }
        </div>
        ${
          button?.button_text
            ? `<div class="email-action">
              <p>${button.button_action_details || "Please click the button below:"}</p>
              <a href="${button.button_link}" class="email-button">${button.button_text}</a>
            </div>`
            : ""
        }
        <div class="email-footer">
          <p>${footer_text || "Need help or have questions? Just reply to this email."}</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

/**
 * sendMailHelper — minimal nodemailer wrapper. Configure SMTP via:
 *   SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM
 *
 * If a body field is empty, the rendered HTML falls back to a generic
 * thank-you footer so the message is still readable.
 */
export const sendMailHelper = async (bodyData: IMailData) => {
  const transporter = createTransporter();

  return transporter.sendMail({
    from: bodyData.senderEmail || env.SMTP_FROM,
    subject: bodyData.subject,
    to: bodyData.receiver_email || bodyData.receivers_email?.toString(),
    html: bodyData.htmlContent || buildHtml(bodyData),
  });
};