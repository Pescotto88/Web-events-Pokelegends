// js/discord-auth.js

const DISCORD_CLIENT_ID = '1565485622703947886';
const REDIRECT_URI = window.location.origin;

// 1. Redirect to Discord OAuth login
export function loginWithDiscord() {
  const discordAuthUrl = `https://discord.com/oauth2/authorize?client_id=${DISCORD_CLIENT_ID}&response_type=token&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=identify`;
  window.location.href = discordAuthUrl;
}

// 2. Parse token from URL fragment after Discord redirects back
export function checkDiscordSession() {
  const fragment = new URLSearchParams(window.location.hash.slice(1));
  const accessToken = fragment.get('access_token');

  if (accessToken) {
    localStorage.setItem('pl_discord_token', accessToken);
    window.history.replaceState({}, document.title, window.location.pathname);
  }

  return localStorage.getItem('pl_discord_token');
}

// 3. Fetch Discord profile data (User ID, Username, Avatar)
export async function getDiscordUser() {
  checkDiscordSession();
  const token = localStorage.getItem('pl_discord_token');
  if (!token) return null;

  try {
    const res = await fetch('https://discord.com/api/users/@me', {
      headers: { authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Token expired');
    return await res.json();
  } catch (err) {
    localStorage.removeItem('pl_discord_token');
    return null;
  }
}

// 4. Logout helper
export function logoutDiscord() {
  localStorage.removeItem('pl_discord_token');
  window.location.reload();
}
