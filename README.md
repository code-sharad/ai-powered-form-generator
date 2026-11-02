Formora — AI-Powered Form Generator

A full-stack application to generate, build, publish, and collect submissions for forms using AI assistance.

## Demo Video
![demo](https://github.com/user-attachments/assets/a2a804a1-ef37-4e73-bf58-8cf289511be3)


### Tech Stack
- Frontend: Next.js 15, TypeScript, Tailwind CSS, shadcn/ui, Recharts
- Backend: Bun/Node, TypeScript, Express
- Auth: JWT auth flow (client store + API), password or magic-link email sign-in
- Storage/Uploads: Cloudinary (configurable)



## Monorepo Layout

- `frontend/` Next.js app (dashboard, form builder, public forms)
- `backend/` API server (auth, forms, submissions, upload)



## Prerequisites
- Node.js 18+ (and optionally Bun for backend)
- pnpm or npm (either is fine; project includes lockfiles)
- Cloudinary account (for uploads)



## Setup

1) Clone the repository
```bash
git clone <your-repo-url>
cd ai-powered-form-generator
```

2) Install dependencies
```bash
# Frontend
cd frontend
pnpm install

# Backend
cd ../backend
bun install
```

3) Environment variables

Frontend `frontend/.env`
```
NEXT_PUBLIC_API_URL=http://localhost:8080/api/v1
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=<your-cloud-name>
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=<optional-if-used>
```

Backend `backend/.env`
```
PORT=8080
JWT_SECRET=<strong-secret>
MONGODB_URI=<your-mongodb-connection-string>
GROQ_API_KEY=<your-groq-api-key>

# Magic-link sign-in
FRONTEND_URL=http://localhost:3000
RESEND_API_KEY=<your-resend-api-key>
MAIL_FROM=Formora <you@your-verified-domain>

# Cloudinary (if server-side signing is used)
CLOUDINARY_CLOUD_NAME=<your-cloud-name>
CLOUDINARY_API_KEY=<your-api-key>
CLOUDINARY_API_SECRET=<your-api-secret>
```

Frontend will be available at `http://localhost:3000` and backend at `http://localhost:8080`.


### Email delivery (Resend)

Magic-link sign-in sends through Resend. Create an API key at resend.com and set `RESEND_API_KEY` in `backend/.env`. Set `MAIL_FROM` to an address on a domain you have verified in Resend.

The default sender, `onboarding@resend.dev`, only delivers to the Resend account owner. Every other recipient needs a verified domain.

Set `FRONTEND_URL` to the public address of the frontend. It is the base of every link, and production refuses to build a link without it.

Outside production, a missing key prints the link to the backend console instead of sending mail. In production the request fails until the key is set, and the backend logs the Resend rejection reason when a send is refused.


4) Run Application
```bash
# Frontend
cd frontend
pnpm run dev

# Backend
cd backend
bun dev
```




## Using the App

1) Sign up and log in
   - Use a password, or choose **Email link** and get a one-time sign-in link in your inbox. The link expires in 15 minutes and works once.
   - `FRONTEND_URL` sets the base of the link. The address must match the one people open, or the link points at the wrong host.
   - Outside production, a missing `RESEND_API_KEY` prints the link to the backend console instead of sending mail. Production requires both `FRONTEND_URL` and `RESEND_API_KEY`, and magic-link requests fail until they are set.

2) Create a form via AI prompt
   - From the dashboard, click Create or use the AI prompt bar
   - Edit fields in the builder, preview, and save

3) Publish and share
   - Toggle publish on a form to generate a public URL
   - Copy and share the link; submissions will appear in the dashboard



## Example: Prompt → Form

Prompt:
```
Create a Generic Feedback Form.
```
![alt text](assets/image.png)

Prompt:
```
create form for rspv registration.
```
![alt text](assets/image-1.png)

Prompt:
```
I need a signup form with name, email, age, and profile picture.
```
![alt text](assets/image-2.png)



### Future improvements
- Improve AI form generation accuracy (better prompts, fine-tuning)
- Enhance user interface and experience (forms, dashboard)
- Implement analytics dashboard for form submissions
- OAuth integration (Google, Facebook, etc.)
- CSV/Excel Export - Export submissions in spreadsheet formats

### Limitations
- AI-generated forms may require manual adjustments for accuracy
- No built-in duplication prevention for submissions
