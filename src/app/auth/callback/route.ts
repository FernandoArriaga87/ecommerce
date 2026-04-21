import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';

// Only accept same-origin relative paths. Anything else (absolute URLs,
// protocol-relative "//evil.com", backslashes IE-style) would let an attacker
// craft a login link that lands the user on a phishing site.
function safeNext(raw: string | null): string {
  if (!raw) return '/profile';
  if (!raw.startsWith('/')) return '/profile';
  if (raw.startsWith('//') || raw.startsWith('/\\')) return '/profile';
  return raw;
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = safeNext(searchParams.get('next') ?? searchParams.get('returnUrl'));

  try {
    if (code) {
      const supabase = await createClient();
      const { data: { user }, error } = await supabase.auth.exchangeCodeForSession(code);
      
      if (!error && user) {
        // Sync with Prisma DB
        // Check by ID first
        let existingUser = await prisma.user.findUnique({
          where: { id: user.id },
        });

        // If not found by ID, check by Email (could be a guest checkout user)
        if (!existingUser && user.email) {
          existingUser = await prisma.user.findUnique({
            where: { email: user.email },
          });

          if (existingUser) {
            // If user exists by email but has different ID, update the ID to match Supabase
            // Note: In some DBs you can't update the primary key. 
            // If that fails, we'll just continue and use the existing user record if possible,
            // but for Supabase auth, the ID must match the Supabase user id.
            try {
              await prisma.user.update({
                where: { email: user.email },
                data: { id: user.id }
              });
            } catch (updateError) {
              console.error("Could not update user ID, might be due to PK constraints:", updateError);
            }
          }
        }

        let needsCompletion = false;

        if (!existingUser) {
          await prisma.user.create({
            data: {
              id: user.id,
              email: user.email!,
              name: user.user_metadata.full_name || user.user_metadata.name || 'Google User',
            },
          });
          needsCompletion = true;
        } else {
          const checkUser = await prisma.user.findUnique({
            where: { id: user.id },
            include: { addresses: true }
          });
          if (checkUser && (!checkUser.phone || checkUser.addresses.length === 0)) {
            needsCompletion = true;
          }
        }

        const forwardedHost = request.headers.get('x-forwarded-host');
        const isLocalEnv = process.env.NODE_ENV === 'development';
        
        let finalPath = next;
        if (needsCompletion) {
          finalPath = `/complete-profile?returnUrl=${encodeURIComponent(next)}`;
        }

        let redirectUrl = isLocalEnv ? `${origin}${finalPath}` : (forwardedHost ? `https://${forwardedHost}${finalPath}` : `${origin}${finalPath}`);
        
        return NextResponse.redirect(redirectUrl);
      }
    }
  } catch (err) {
    console.error('Unhandled error in auth callback:', err);
  }

  // return the user to an error page or login with error param
  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}
