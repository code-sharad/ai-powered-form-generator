AI-Powered Form Generator

A full-stack application to generate, build, publish, and collect submissions for forms using AI assistance.

## Demo Video
![demo](https://github.com/user-attachments/assets/a2a804a1-ef37-4e73-bf58-8cf289511be3)


### Tech Stack
- Frontend: Next.js 15, TypeScript, Tailwind CSS, shadcn/ui, Recharts
- Backend: Bun/Node, TypeScript, Express
- Auth: JWT auth flow (client store + API)
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
NEXT_PUBLIC_API_BASE_URL=http://localhost:4000
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=<your-cloud-name>
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=<optional-if-used>
```

Backend `backend/.env`
```
PORT=8080
JWT_SECRET=<strong-secret>
MONGODB_URI=<your-mongodb-connection-string>

# Cloudinary (if server-side signing is used)
CLOUDINARY_CLOUD_NAME=<your-cloud-name>
CLOUDINARY_API_KEY=<your-api-key>
CLOUDINARY_API_SECRET=<your-api-secret>
```

Frontend will be available at `http://localhost:3000` and backend at `http://localhost:8080`.


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
