# Maisha Kazi

**Youth Skills Work-Order Platform** by [Maisha Community Initiatives](https://maishaprojects.org)

Maisha Kazi connects vetted youth workers in Tanzania to corporate and individual clients through a managed work-order system. Coordinators oversee job assignments, quality control, and CSR reporting — creating dignified employment opportunities for young people while delivering reliable services to businesses.

## About Maisha Community Initiatives

Maisha Community Initiatives is a Tanzania-based community organization dedicated to youth empowerment, skills development, and sustainable livelihoods. Maisha Kazi is the digital backbone of our youth employment program.

**Founded by:**
- **Ernest Moyo** — Co-Founder (PhD Applied Mathematics & Computer Science, Public Health)
- **Mustafa Mhongera** — Co-Founder (Nonprofit Program Management, PhD Candidate Development Studies)
- **Rodden R. Chikonzo** — Co-Founder (Automation & Control Systems Engineer)

## How It Works

| Role | Description |
|------|-------------|
| **Youth Worker** | Browse available jobs, accept assignments, submit proof of completion, track earnings |
| **Coordinator** | Manage youth profiles, assign jobs, verify work quality, generate CSR reports |
| **Corporate Client** | Post service requests, review completed work, access CSR impact reports |

### Service Categories
Car Wash, Cleaning, Gardening, Window Fixing, Handywork, and more.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Vite, Tailwind CSS 4 |
| Backend | Node.js, Express 5 (ESM) |
| Database | PostgreSQL 16, Prisma ORM |
| Auth | JWT with refresh tokens (role-based) |
| State | React Query, React Hook Form, Zod validation |
| Maps | Leaflet / React-Leaflet |
| Charts | Recharts |
| File Uploads | Multer + Sharp (EXIF metadata stripped) |

## Getting Started

### Prerequisites

- Node.js 20+
- Docker & Docker Compose
- Git

### Setup

```bash
# Clone the repository
git clone https://github.com/ernestmoyo/maisha_kazi.git
cd maisha_kazi

# Start PostgreSQL
docker compose up -d

# Server setup
cd server
cp .env.example .env    # Edit with your database credentials
npm install
npx prisma generate
npx prisma db push
npm run seed            # Seed demo data
npm run dev             # Starts on http://localhost:3001

# Client setup (in a new terminal)
cd client
npm install
npm run dev             # Starts on http://localhost:5173
```

### Demo Accounts

After seeding, you can log in with these accounts (password: `password123`):

| Role | Email |
|------|-------|
| Coordinator | coordinator@maishakazi.org |
| Client | coca-cola@demo.com |
| Client | vodacom@demo.com |
| Client | ttcl@demo.com |

## Project Structure

```
maisha_kazi/
├── client/                 # React frontend
│   └── src/
│       ├── components/     # Reusable UI components
│       ├── pages/          # Route pages (Youth, Client, Coordinator dashboards)
│       ├── hooks/          # Custom React hooks
│       ├── api/            # API client & endpoints
│       └── utils/          # Helpers & constants
├── server/                 # Express backend
│   └── src/
│       ├── routes/         # API route handlers
│       ├── middleware/     # Auth, upload, error handling
│       ├── prisma/         # Seed scripts
│       └── generated/      # Prisma client (gitignored)
├── docker-compose.yml      # PostgreSQL dev setup
└── docs/                   # Documentation & SOPs
```

## Environment Variables

Copy `.env.example` to `.env` in the `server/` directory:

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Secret key for access tokens |
| `JWT_REFRESH_SECRET` | Secret key for refresh tokens |
| `PORT` | Server port (default: 3001) |
| `CLIENT_URL` | Frontend URL for CORS (default: http://localhost:5173) |
| `UPLOAD_DIR` | File upload directory |
| `MAX_FILE_SIZE_MB` | Max upload size in MB |

## Contributing

We welcome contributions! Maisha Kazi is open source and community-driven.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/your-feature`)
3. Commit your changes
4. Push to the branch (`git push origin feature/your-feature`)
5. Open a Pull Request

## Contact

- **Email:** info@maishaprojects.org
- **Phone:** +255 718 909 222
- **Website:** [maishaprojects.org](https://maishaprojects.org)

## License

This project is open source and available under the [MIT License](LICENSE).
