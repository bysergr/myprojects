# MyProjects

MyProjects is a bilingual portfolio platform for developers. Create a polished public profile, organize your projects, share your work with a unique URL, and let visitors discover and interact with your portfolio.

The application is available in English and Spanish and includes an authenticated dashboard for managing profiles and projects.

## Features

- **Developer profiles** — Add a username, bio, avatar, banner, social links, and custom links.
- **Project portfolios** — Create, edit, publish, and organize projects with descriptions, technologies, images, live demos, and repository links.
- **Public profile URLs** — Share a profile at `/{locale}/{username}` and project pages at `/{locale}/{username}/{slug}`.
- **GitHub import** — Browse a public GitHub user's repositories and import them into a portfolio.
- **AI-assisted project details** — Optionally generate a project title, description, technology list, and live URL with Vertex AI and Gemini.
- **Community engagement** — Track project views and allow authenticated visitors to like and comment on published projects.
- **Authentication** — Sign in with email/password or Google through Firebase Authentication.
- **Image uploads** — Store profile, banner, badge, and project images in Firebase Storage.
- **Internationalization** — English (`en`) and Spanish (`es`) routes powered by `next-intl`.
- **SEO-ready pages** — Dynamic metadata and Open Graph images for profiles and projects.

## Tech stack

- [Next.js](https://nextjs.org/) 16 with the App Router
- [React](https://react.dev/) 19 and TypeScript
- [Tailwind CSS](https://tailwindcss.com/) 4, Radix UI, and Lucide icons
- [Firebase Authentication](https://firebase.google.com/docs/auth), Firebase Admin SDK, and Firebase Storage
- [PostgreSQL](https://www.postgresql.org/) with [Prisma](https://www.prisma.io/)
- [next-intl](https://next-intl.dev/) for localization
- Vertex AI / Gemini for optional AI-assisted project content

## Requirements

- Node.js **20.9 or later**
- npm
- A PostgreSQL database
- A Firebase project with Authentication enabled
- Git

Google Cloud / Vertex AI credentials are only required if you want to use the AI project-description generator.

## Quick start

### 1. Install dependencies

```bash
git clone https://github.com/bysergr/myprojects.git
cd myprojects
npm install
```

### 2. Configure environment variables

Create a `.env` file in the project root:

```dotenv
# Firebase client
NEXT_PUBLIC_FIREBASE_API_KEY="your-api-key"
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="your-project.firebaseapp.com"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="your-project-id"
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="your-project.appspot.com"
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="your-messaging-sender-id"
NEXT_PUBLIC_FIREBASE_APP_ID="your-app-id"

# Firebase Admin SDK
FIREBASE_PROJECT_ID="your-project-id"
FIREBASE_CLIENT_EMAIL="firebase-adminsdk-xxx@your-project.iam.gserviceaccount.com"
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# PostgreSQL
DATABASE_URL="postgresql://user:password@localhost:5432/projects_nodi?schema=public"
```

Keep the literal `\n` characters in `FIREBASE_PRIVATE_KEY`. Never commit `.env` files or service-account credentials.

### 3. Generate the Prisma client and migrate the database

```bash
npx prisma generate
npx prisma migrate dev --name init
```

### 4. Start the development server

```bash
npm run dev
```

Open [http://localhost:3000/en](http://localhost:3000/en) or [http://localhost:3000/es](http://localhost:3000/es).

For Firebase project creation, provider configuration, Storage CORS, database setup, and troubleshooting, see the detailed [SETUP.md](SETUP.md) guide.

## Optional AI configuration

The project-description generator uses Gemini through Vertex AI. Add these variables to `.env` if you want to enable it:

```dotenv
GOOGLE_CLOUD_PROJECT_ID="your-google-cloud-project-id"
GOOGLE_CLOUD_LOCATION="us-central1"
GOOGLE_CLOUD_CLIENT_EMAIL="your-service-account@your-project.iam.gserviceaccount.com"
GOOGLE_CLOUD_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

The service account must be allowed to access Vertex AI in the configured Google Cloud project. The feature can be left unconfigured if AI-assisted project content is not needed.

## Using the application

1. Open `/en/signup` or `/es/signup` and create an account with email/password or Google.
2. Complete your profile from the dashboard, including your username and public links.
3. Add projects manually or import public repositories from GitHub.
4. Add descriptions, technologies, demo links, repository links, and project images.
5. Publish projects when they are ready to appear on your public profile.
6. Share your profile URL with recruiters, clients, or the developer community.

Useful routes:

| Route | Purpose |
| --- | --- |
| `/en` or `/es` | Landing page |
| `/en/signup` or `/es/signup` | Create an account |
| `/en/login` or `/es/login` | Sign in |
| `/en/dashboard` or `/es/dashboard` | Dashboard overview |
| `/en/dashboard/profile` or `/es/dashboard/profile` | Edit profile |
| `/en/dashboard/projects` or `/es/dashboard/projects` | Manage projects |
| `/en/{username}` or `/es/{username}` | Public profile |
| `/en/{username}/{slug}` or `/es/{username}/{slug}` | Public project page |

## Available scripts

```bash
npm run dev       # Start the development server
npm run build     # Create a production build
npm start         # Start the production server
npm run lint      # Run ESLint
npx prisma studio # Open the database browser
```

## Project structure

```text
app/
├── [locale]/              # Localized pages and layouts
├── api/                   # API routes for users, projects, uploads, and engagement
└── globals.css            # Global styles
components/               # UI, landing-page, auth, dashboard, and project components
i18n/                     # next-intl navigation and request configuration
lib/                      # Firebase, Prisma, storage, slug, and utility helpers
messages/                 # English and Spanish translation messages
prisma/                   # PostgreSQL schema and migrations
public/                   # Static assets
```

## Production deployment

Create a production build locally before deploying:

```bash
npm run build
npm start
```

When deploying, configure all required environment variables in the hosting provider, apply the Prisma migrations to the production database, and add the production domain to Firebase Authentication and Storage settings. [Vercel](https://vercel.com/) is a natural deployment option for this Next.js application, but any platform that supports Next.js and the required backend services can be used.

## Contributing

1. Fork the repository and create a feature branch.
2. Install dependencies and configure the local services described above.
3. Make focused changes with clear commit messages.
4. Run `npm run lint` and `npm run build` before opening a pull request.
5. Include a short description of the change and any required environment or migration updates.

## License

No license file is currently included in this repository. Unless a license is added, the project should be treated as all rights reserved.
