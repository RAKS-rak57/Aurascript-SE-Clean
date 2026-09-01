import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(request) {
  try {
    const { email, role = 'Editor' } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const { GMAIL_USER, GMAIL_PASS } = process.env;

    if (!GMAIL_USER || !GMAIL_PASS) {
      return NextResponse.json({ error: "Email credentials not configured in backend" }, { status: 500 });
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: GMAIL_USER,
        pass: GMAIL_PASS,
      },
    });

    const mailOptions = {
      from: `"AuraScript" <${GMAIL_USER}>`,
      to: email,
      subject: `Invitation to collaborate on AuraScript (Role: ${role})`,
      html: `
        <div style="font-family: sans-serif; padding: 20px; background: #0f1115; color: #fff; border-radius: 8px;">
          <h2 style="color: #818cf8;">AuraScript Collaboration Invite</h2>
          <p>You have been invited to collaborate on a screenplay.</p>
          <p><strong>Assigned Role:</strong> ${role}</p>
          <a href="http://localhost:3000" style="display: inline-block; padding: 10px 20px; background: #818cf8; color: #fff; text-decoration: none; border-radius: 6px; margin-top: 20px;">
            Open Workspace
          </a>
          <p style="margin-top: 30px; font-size: 12px; color: #666;">This is an automated message from your local AuraScript environment.</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);

    return NextResponse.json({ success: true, message: "Invitation sent successfully!" });

  } catch (error) {
    console.error("Email Error:", error);
    return NextResponse.json({ error: "Failed to send email. Check console for details." }, { status: 500 });
  }
}
