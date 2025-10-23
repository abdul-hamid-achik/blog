import { Resend } from 'resend';
import { env } from '@/env.mjs';

const resend = new Resend(env.RESEND_API_KEY);

export async function sendMagicLinkEmail(email: string, token: string) {
    const magicLink = `${env.NEXT_PUBLIC_APP_URL}/api/auth/verify?token=${token}`;

    try {
        const { data, error } = await resend.emails.send({
            from: 'Chat Assistant <noreply@abdulachik.dev>',
            to: [email],
            subject: 'Verify your email to continue chatting',
            html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Verify Your Email</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; border-radius: 12px; text-align: center; margin-bottom: 30px;">
            <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 600;">Welcome to the Chat!</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">Verify your email to continue our conversation</p>
          </div>
          
          <div style="background: #f8f9fa; padding: 30px; border-radius: 8px; margin-bottom: 30px;">
            <p style="margin: 0 0 20px 0; font-size: 16px; color: #555;">
              Hi there! 👋
            </p>
            <p style="margin: 0 0 20px 0; font-size: 16px; color: #555;">
              You've reached the limit of free messages in our chat. To continue our conversation, please verify your email address by clicking the button below:
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${magicLink}" 
                 style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);">
                Verify Email & Continue Chat
              </a>
            </div>
            
            <p style="margin: 20px 0 0 0; font-size: 14px; color: #888; text-align: center;">
              This link will expire in 1 hour for security reasons.
            </p>
          </div>
          
          <div style="text-align: center; color: #888; font-size: 14px;">
            <p style="margin: 0;">
              If the button doesn't work, copy and paste this link into your browser:
            </p>
            <p style="margin: 10px 0 0 0; word-break: break-all; background: #f1f3f4; padding: 10px; border-radius: 4px; font-family: monospace;">
              ${magicLink}
            </p>
          </div>
          
          <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; color: #888; font-size: 12px;">
            <p style="margin: 0;">
              This email was sent because you requested to continue chatting on abdulachik.dev
            </p>
          </div>
        </body>
        </html>
      `,
        });

        if (error) {
            console.error('Error sending magic link email:', error);
            throw new Error('Failed to send verification email');
        }

        return data;
    } catch (error) {
        console.error('Error in sendMagicLinkEmail:', error);
        throw new Error('Failed to send verification email');
    }
}
