import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { PrismaService } from 'src/prisma/prisma.service';

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
        await this.transporter.sendMail({
            from: process.env.SMTP_USER,
            to: email,
            subject: 'Подтверждение почты SPOT',
            html: `
                <h2>Подтверждение почты</h2>
                <p>Ваш код подтверждения:</p>
                <h1>${code}</h1>
                <p>Код действует 10 минут.</p>
            `,
        });
    }
}