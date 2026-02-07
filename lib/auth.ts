import { cookies } from 'next/headers';
import { db } from '@/lib/db';
import { users, verificationTokens, chatMessages } from '@/db/schema';
import { eq, and, gt, count } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { FREE_MESSAGE_LIMIT } from './constants';

const AUTH_COOKIE_NAME = 'chat-auth';
const AUTH_COOKIE_MAX_AGE = 30 * 24 * 60 * 60; // 30 days

export interface AuthenticatedUser {
    id: string;
    email: string;
    isAuthenticated: true;
}

export interface UnauthenticatedUser {
    isAuthenticated: false;
}

export type User = AuthenticatedUser | UnauthenticatedUser;

export async function getAuthenticatedUser(): Promise<User> {
    try {
        const cookieStore = await cookies();
        const authToken = cookieStore.get(AUTH_COOKIE_NAME)?.value;

        if (!authToken) {
            return { isAuthenticated: false };
        }

        // Verify the token exists and is valid
        const user = await db.select()
            .from(users)
            .where(eq(users.id, authToken))
            .limit(1);

        if (user.length === 0) {
            return { isAuthenticated: false };
        }

        return {
            id: user[0].id,
            email: user[0].email,
            isAuthenticated: true
        };
    } catch (error) {
        console.error('Error getting authenticated user:', error);
        return { isAuthenticated: false };
    }
}

export async function createUser(email: string): Promise<string> {
    try {
        // Check if user already exists
        const existingUser = await db.select()
            .from(users)
            .where(eq(users.email, email))
            .limit(1);

        if (existingUser.length > 0) {
            return existingUser[0].id;
        }

        // Create new user
        const newUser = await db.insert(users).values({
            email,
            emailVerified: new Date()
        }).returning({ id: users.id });

        return newUser[0].id;
    } catch (error) {
        console.error('Error creating user:', error);
        throw new Error('Failed to create user');
    }
}

export async function createVerificationToken(email: string): Promise<string> {
    try {
        const token = uuidv4();
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

        await db.insert(verificationTokens).values({
            token,
            email,
            expiresAt
        });

        return token;
    } catch (error) {
        console.error('Error creating verification token:', error);
        throw new Error('Failed to create verification token');
    }
}

export async function verifyToken(token: string): Promise<string | null> {
    try {
        const now = new Date();

        // Atomic check-and-mark: UPDATE ... WHERE used = false RETURNING email
        // This prevents TOCTOU race conditions where the same token could be used twice
        const result = await db.update(verificationTokens)
            .set({ used: true })
            .where(
                and(
                    eq(verificationTokens.token, token),
                    eq(verificationTokens.used, false),
                    gt(verificationTokens.expiresAt, now)
                )
            )
            .returning({ email: verificationTokens.email });

        if (result.length === 0) {
            return null;
        }

        return result[0].email;
    } catch (error) {
        console.error('Error verifying token:', error);
        return null;
    }
}

export async function setAuthCookie(userId: string): Promise<void> {
    try {
        const cookieStore = await cookies();
        cookieStore.set(AUTH_COOKIE_NAME, userId, {
            maxAge: AUTH_COOKIE_MAX_AGE,
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/'
        });
    } catch (error) {
        console.error('Error setting auth cookie:', error);
        throw new Error('Failed to set authentication cookie');
    }
}

export async function clearAuthCookie(): Promise<void> {
    try {
        const cookieStore = await cookies();
        cookieStore.delete(AUTH_COOKIE_NAME);
    } catch (error) {
        console.error('Error clearing auth cookie:', error);
    }
}

export async function getMessageCount(sessionId: string): Promise<number> {
    try {
        const result = await db
            .select({ count: count() })
            .from(chatMessages)
            .where(
                and(
                    eq(chatMessages.sessionId, sessionId),
                    eq(chatMessages.role, 'user')
                )
            );

        return result[0]?.count || 0;
    } catch (error) {
        console.error('Error getting message count:', error);
        // Return the limit on error to prevent free message bypass when DB is unavailable
        return FREE_MESSAGE_LIMIT;
    }
}
