import { Injectable } from "@nestjs/common";
import { join } from "node:path";
import * as React from "react";
import * as nodemailer from "nodemailer";
import { PrismaService } from "src/prisma/prisma.service";
import { render } from "@react-email/render";
import Email from "./templates/Email";

@Injectable()
export class EmailService {
  private readonly transporter: nodemailer.Transporter;

  constructor(private readonly prisma: PrismaService) {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: true,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  async sendVerificationCode(email: string, code: string) {
    const html = await render(
      React.createElement(Email, {
        code,
        logoSrc: "cid:spot-logo",
      }),
    );

    await this.transporter.sendMail({
      from: process.env.SMTP_USER,
      to: email,
      subject: "Подтверждение почты SPOT",
      html,
      attachments: [
        {
          filename: "FullLogo.png",
          path: join(__dirname, "templates", "static", "FullLogo.png"),
          cid: "spot-logo",
        },
      ],
    });
  }
}
