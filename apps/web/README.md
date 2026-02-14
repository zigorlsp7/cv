# Web App (Next.js)

Frontend workspace for the CV platform template.

## Scripts

- `npm run dev -w web` - Start Next.js dev server
- `npm run build -w web` - Production build
- `npm run start -w web` - Run built app
- `npm run lint -w web` - Lint source files
- `npm run typecheck -w web` - TypeScript type checking
- `npm run test:smoke -w web` - Playwright smoke tests

## Environment Variables

- `NEXT_PUBLIC_API_BASE_URL` - API base URL used by server-side pages
- `NEXT_PUBLIC_RUM_ENABLED` - Enable browser RUM emission (`true`/`false`)
- `NEXT_PUBLIC_RUM_ENDPOINT` - Optional explicit RUM ingest URL (defaults to `${NEXT_PUBLIC_API_BASE_URL}/v1/rum/events` when not set)
- `NEXT_PUBLIC_RELEASE` - Optional release tag attached to RUM events

## Quality Gates in CI

- Lint + typecheck + build
- Playwright smoke (`/` and `/health`)
- API contract drift gate (generated contract file must be up to date)

## Notes

- This workspace intentionally stays minimal until business UI starts.
- RUM capture is designed as near-future instrumentation and can stay disabled while UI is still skeletal.


## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
