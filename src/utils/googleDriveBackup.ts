export interface GoogleUserProfile {
  email: string;
  name: string;
  picture?: string;
  accessToken: string;
  expiresAt: number;
}

export interface LedgerBackupPayload {
  version: number;
  exportedAt: string;
  people: unknown[];
  accounts: unknown[];
  groups: unknown[];
  transactions: unknown[];
}

const BACKUP_FILE_NAME = 'voice-ledger-backup.json';
const DRIVE_SCOPES =
  'https://www.googleapis.com/auth/drive.appdata https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email';

interface TokenResponse {
  access_token?: string;
  expires_in?: number;
  error?: string;
  error_description?: string;
}

interface GoogleAccountsOAuth2 {
  initTokenClient: (config: {
    client_id: string;
    scope: string;
    callback: (resp: TokenResponse) => void;
    error_callback?: (err: { type: string; message?: string }) => void;
  }) => {
    requestAccessToken: (overrideConfig?: { prompt?: string }) => void;
  };
  revoke?: (token: string, done?: () => void) => void;
}

let gsiScriptPromise: Promise<void> | null = null;

export function loadGoogleIdentityScript(): Promise<void> {
  if (
    typeof window !== 'undefined' &&
    (window as unknown as { google?: { accounts?: { oauth2?: GoogleAccountsOAuth2 } } })
      .google?.accounts?.oauth2
  ) {
    return Promise.resolve();
  }
  if (gsiScriptPromise) return gsiScriptPromise;

  gsiScriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => {
      gsiScriptPromise = null;
      reject(new Error('Failed to load Google Sign-In script.'));
    };
    document.head.appendChild(script);
  });

  return gsiScriptPromise;
}

export async function signInWithGoogle(clientId: string): Promise<GoogleUserProfile> {
  if (!clientId.trim()) {
    throw new Error('Google OAuth Client ID is required.');
  }

  await loadGoogleIdentityScript();

  const oauth2 = (
    window as unknown as { google?: { accounts?: { oauth2?: GoogleAccountsOAuth2 } } }
  ).google?.accounts?.oauth2;

  if (!oauth2) {
    throw new Error('Google OAuth2 client failed to initialize.');
  }

  const tokenResp = await new Promise<TokenResponse>((resolve, reject) => {
    const client = oauth2.initTokenClient({
      client_id: clientId.trim(),
      scope: DRIVE_SCOPES,
      callback: (resp) => {
        if (resp.error || !resp.access_token) {
          reject(new Error(resp.error_description || resp.error || 'Google sign-in cancelled.'));
        } else {
          resolve(resp);
        }
      },
      error_callback: (err) => {
        reject(new Error(err.message || err.type || 'Google sign-in failed.'));
      },
    });
    client.requestAccessToken({ prompt: 'consent' });
  });

  const accessToken = tokenResp.access_token!;
  const expiresIn = tokenResp.expires_in || 3500;

  const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!userInfoRes.ok) {
    throw new Error('Signed in, but could not fetch Google profile info.');
  }

  const profile = await userInfoRes.json();

  return {
    email: profile.email || '',
    name: profile.name || profile.email || 'Google User',
    picture: profile.picture,
    accessToken,
    expiresAt: Date.now() + expiresIn * 1000,
  };
}

export function signOutGoogle(accessToken?: string): void {
  const oauth2 = (
    window as unknown as { google?: { accounts?: { oauth2?: GoogleAccountsOAuth2 } } }
  ).google?.accounts?.oauth2;
  if (accessToken && oauth2?.revoke) {
    try {
      oauth2.revoke(accessToken);
    } catch {
      // ignore revoke errors
    }
  }
}

async function findBackupFileId(accessToken: string): Promise<string | null> {
  const query = encodeURIComponent(`name='${BACKUP_FILE_NAME}' and trashed=false`);
  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files?spaces=appDataFolder&q=${query}&fields=files(id,name,modifiedTime)`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Google Drive query failed (${res.status}): ${text.slice(0, 140)}`);
  }
  const data = await res.json();
  return data?.files?.[0]?.id || null;
}

export async function backupToGoogleDrive(
  accessToken: string,
  payload: LedgerBackupPayload
): Promise<{ modifiedTime: string }> {
  const existingFileId = await findBackupFileId(accessToken);
  const boundary = 'voice_ledger_boundary_987654321';

  const metadata = existingFileId
    ? { name: BACKUP_FILE_NAME, mimeType: 'application/json' }
    : {
        name: BACKUP_FILE_NAME,
        parents: ['appDataFolder'],
        mimeType: 'application/json',
      };

  const multipartBody =
    `--${boundary}\r\n` +
    `Content-Type: application/json; charset=UTF-8\r\n\r\n` +
    `${JSON.stringify(metadata)}\r\n` +
    `--${boundary}\r\n` +
    `Content-Type: application/json\r\n\r\n` +
    `${JSON.stringify(payload)}\r\n` +
    `--${boundary}--`;

  const url = existingFileId
    ? `https://www.googleapis.com/upload/drive/v3/files/${existingFileId}?uploadType=multipart&fields=id,modifiedTime`
    : `https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,modifiedTime`;

  const res = await fetch(url, {
    method: existingFileId ? 'PATCH' : 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': `multipart/related; boundary=${boundary}`,
    },
    body: multipartBody,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Google Drive backup failed (${res.status}): ${text.slice(0, 140)}`);
  }

  const data = await res.json();
  return { modifiedTime: data.modifiedTime || new Date().toISOString() };
}

export async function restoreFromGoogleDrive(
  accessToken: string
): Promise<LedgerBackupPayload | null> {
  const fileId = await findBackupFileId(accessToken);
  if (!fileId) {
    return null;
  }

  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  if (!res.ok) {
    throw new Error(`Failed to download backup from Google Drive (${res.status}).`);
  }

  return (await res.json()) as LedgerBackupPayload;
}
