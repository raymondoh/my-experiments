/** @jest-environment node */
import { spawnSync } from 'child_process';

jest.setTimeout(60000);

describe('footer routes', () => {
  const paths = [
    '/services',
    '/how-it-works',
    '/emergency',
    '/join',
    '/pricing',
    '/resources',
    '/about',
    '/contact',
    '/privacy'
  ];

  it('serves footer paths with status 200', () => {
    const script = `
      const next = require('next');
      const { createServer } = require('http');
      const fetch = require('node-fetch');
      (async () => {
        const app = next({ dev: true, dir: '${process.cwd().replace(/\\/g, '\\\\')}' });
        const handle = app.getRequestHandler();
        await app.prepare();
        const server = createServer((req, res) => handle(req, res));
        server.listen(0, async () => {
          const { port } = server.address();
          try {
            const paths = ${JSON.stringify(paths)};
            for (const p of paths) {
              const res = await fetch('http://localhost:' + port + p);
              if (res.status !== 200) { console.error('Non-200 for', p, res.status); process.exit(1); }
            }
            server.close();
            await app.close();
            process.exit(0);
          } catch (err) {
            console.error(err);
            server.close();
            await app.close();
            process.exit(1);
          }
        });
      })();
    `;
    const env = {
      ...process.env,
      AUTH_FIREBASE_PROJECT_ID: 'test',
      AUTH_FIREBASE_CLIENT_EMAIL: 'test',
      AUTH_FIREBASE_PRIVATE_KEY: 'test',
      NEXT_PUBLIC_FIREBASE_API_KEY: 'test',
      NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: 'test',
      NEXT_PUBLIC_FIREBASE_PROJECT_ID: 'test',
      NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: 'test',
      NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: 'test',
      NEXT_PUBLIC_FIREBASE_APP_ID: 'test',
      AUTH_SECRET: 'test',
      STRIPE_SECRET_KEY: 'test',
      STRIPE_WEBHOOK_SECRET: 'test',
      NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: 'test',
      RESEND_API_KEY: 'test',
      EMAIL_FROM: 'test@example.com',
      NEXT_PUBLIC_APP_URL: 'http://localhost',
      STRIPE_PRO_PRICE_ID: 'test',
      STRIPE_PRO_PRICE_ID_YEARLY: 'test',
      STRIPE_BUSINESS_PRICE_ID: 'test',
      STRIPE_BUSINESS_PRICE_ID_YEARLY: 'test'
    };
    const result = spawnSync('node', ['--experimental-vm-modules', '-e', script], {
      encoding: 'utf8',
      env
    });
    if (result.stdout) process.stdout.write(result.stdout);
    if (result.stderr) process.stderr.write(result.stderr);
    expect(result.status).toBe(0);
  });
});
