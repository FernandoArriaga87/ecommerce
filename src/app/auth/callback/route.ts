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

function buildRedirect(request: Request, origin: string, path: string): string {
  const forwardedHost = request.headers.get('x-forwarded-host');
  const isLocalEnv = process.env.NODE_ENV === 'development';
  if (isLocalEnv) return `${origin}${path}`;
  return forwardedHost ? `https://${forwardedHost}${path}` : `${origin}${path}`;
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = safeNext(searchParams.get('next') ?? searchParams.get('returnUrl'));

  // Supabase appends ?error=...&error_description=... when the link is invalid
  // or expired (most often: Gmail prefetched the magic link and consumed the
  // single-use token before the user clicked).
  const errorCode = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');
  if (errorCode) {
    const reason = errorCode === 'access_denied' && errorDescription?.includes('expired')
      ? 'link_expired'
      : errorCode;
    return NextResponse.redirect(
      buildRedirect(request, origin, `/login?error=${encodeURIComponent(reason)}`)
    );
  }

  if (!code) {
    return NextResponse.redirect(
      buildRedirect(request, origin, `/login?error=missing_code`)
    );
  }

  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error || !user) {
      console.error('[auth/callback] exchangeCodeForSession failed:', error?.message);
      return NextResponse.redirect(
        buildRedirect(request, origin, `/login?error=link_expired`)
      );
    }

    // Password recovery flow: the session is now established and the user's
    // next step is to set a new password. Skip the Prisma sync / profile
    // completion detour entirely — the account already exists.
    if (next === '/reset-password') {
      return NextResponse.redirect(buildRedirect(request, origin, '/reset-password'));
    }

    // Sync with Prisma DB. Check by ID first.
    let existingUser = await prisma.user.findUnique({
      where: { id: user.id },
    });

    // If not found by ID, check by Email (could be a guest checkout user).
    if (!existingUser && user.email) {
      existingUser = await prisma.user.findUnique({
        where: { email: user.email },
      });

      if (existingUser) {
        try {
          await prisma.user.update({
            where: { email: user.email },
            data: { id: user.id }
          });
        } catch (updateError) {
          console.error('Could not update user ID, might be due to PK constraints:', updateError);
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

    const finalPath = needsCompletion
      ? `/complete-profile?returnUrl=${encodeURIComponent(next)}`
      : next;

    return NextResponse.redirect(buildRedirect(request, origin, finalPath));
  } catch (err) {
    console.error('Unhandled error in auth callback:', err);
    return NextResponse.redirect(
      buildRedirect(request, origin, `/login?error=auth_callback_failed`)
    );
  }
}
