# Penta Minds API

Backend foundation for the Penta Minds team member, admin authentication, image upload, health monitoring, Supabase, and Cloudinary workflows.

## Local Setup

1. Install Node.js 18 or newer.
2. Install dependencies:

```bash
npm install
```

3. Copy `.env.example` to `.env` and fill every required value.
4. Generate `ADMIN_PASSWORD_HASH` with a SHA-256 hash of the admin password:

```bash
node -e "const crypto=require('crypto'); console.log(crypto.createHash('sha256').update(process.argv[1]).digest('hex'))" "replace-with-password"
```

5. Generate `JWT_SECRET`:

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

6. Start the API:

```bash
npm run dev
```

## Environment Variables

`SUPABASE_URL` Supabase project URL.

`SUPABASE_SERVICE_ROLE_KEY` Supabase service role key used by the backend only.

`CLOUDINARY_CLOUD_NAME` Cloudinary cloud name.

`CLOUDINARY_API_KEY` Cloudinary API key.

`CLOUDINARY_API_SECRET` Cloudinary API secret.

`ADMIN_PASSWORD_HASH` SHA-256 hex hash of the admin password.

`JWT_SECRET` Secret used to sign admin JWTs.

`JWT_EXPIRES_IN` JWT lifetime. Defaults to `24h`.

`PORT` Local port. Defaults to `3000`.

`NODE_ENV` Runtime environment.

`ALLOWED_ORIGINS` Comma-separated frontend origins. Leave empty for local API testing without browser CORS restrictions.

## API Endpoints

`GET /api/health`

Returns API status and timestamp.

`POST /api/admin/login`

Body:

```json
{
  "password": "admin-password"
}
```

Returns a bearer token for protected admin endpoints.

`GET /api/team-members`

Returns all team members ordered by `display_order` and `member_name`.

`GET /api/team-members/:slug`

Returns one team member by slug.

`POST /api/upload/team-member-image`

Protected by `Authorization: Bearer <token>`. Accepts multipart form data with `member_slug` and `image`. Supported image types are JPEG, PNG, and WebP up to 5 MB.

`DELETE /api/team-members/:slug/image`

Protected by `Authorization: Bearer <token>`. Deletes the Cloudinary image when a public id exists and clears the stored image fields in Supabase.

## Supabase Assumptions

The service expects a `team_members` table with these columns:

`id`, `member_slug`, `member_name`, `role`, `bio`, `image_url`, `image_public_id`, `linkedin_url`, `initials`, `is_associate`, `display_order`, `created_at`, `updated_at`.

The backend uses the service role key and must only run in trusted server environments.

## Deployment

1. Create a Vercel project for this backend repository.
2. Add every variable from `.env.example` in Vercel Project Settings.
3. Set `ALLOWED_ORIGINS` to the production frontend origins.
4. Deploy the `development` branch for preview validation.
5. Merge to `main` only after API checks pass.

## Testing

Run syntax checks:

```bash
npm run check
```

Manual smoke test:

```bash
curl http://localhost:3000/api/health
```

Authentication test:

```bash
curl -X POST http://localhost:3000/api/admin/login \
  -H "Content-Type: application/json" \
  -d "{\"password\":\"replace-with-password\"}"
```

Upload test:

```bash
curl -X POST http://localhost:3000/api/upload/team-member-image \
  -H "Authorization: Bearer replace-with-token" \
  -F "member_slug=example-member" \
  -F "image=@avatar.png"
```

## Deployment Checklist

- Environment variables are set in Vercel.
- Supabase `team_members` table exists with required columns.
- Supabase service role key is stored only in backend deployment settings.
- Cloudinary credentials are valid and image uploads use secure URLs.
- `ALLOWED_ORIGINS` includes production frontend origins.
- `/api/health` returns `status: ok` after deployment.
- Admin login returns a JWT with the expected expiration.
- Image upload updates `image_url` and `image_public_id` in Supabase.

## Testing Checklist

- `npm install` completes.
- `npm run check` passes.
- `GET /api/health` returns `200`.
- `GET /api/team-members` returns `{ "success": true, "data": [...] }`.
- `POST /api/admin/login` rejects bad passwords.
- `POST /api/admin/login` returns a token for the correct password.
- Protected routes reject missing or invalid bearer tokens.
- `POST /api/upload/team-member-image` rejects invalid file types and oversized files.
- Successful upload stores a Cloudinary secure URL in Supabase.
- `DELETE /api/team-members/:slug/image` clears stored image fields.
