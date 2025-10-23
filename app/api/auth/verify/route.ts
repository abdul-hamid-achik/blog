import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, createUser, setAuthCookie } from '@/lib/auth';
import { isProduction } from '@/lib/utils';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const token = searchParams.get('token');

        if (!token) {
            return NextResponse.redirect(new URL('/?error=invalid-token', request.url));
        }

        // Verify the token
        const email = await verifyToken(token);

        if (!email) {
            return NextResponse.redirect(new URL('/?error=invalid-token', request.url));
        }

        // Create or get user
        const userId = await createUser(email);

        // Set authentication cookie
        await setAuthCookie(userId);

        if (!isProduction) {
            console.log(`✅ User ${email} authenticated successfully`);
        }

        // Redirect to home page with success message
        return NextResponse.redirect(new URL('/?verified=true', request.url));

    } catch (error) {
        console.error('Error in magic link verification:', error);
        return NextResponse.redirect(new URL('/?error=verification-failed', request.url));
    }
}
