This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

z2t8c1% npx prisma init --db --output ../app/generated/prisma

Loaded Prisma config from prisma.config.ts.

This will create a project for you on console.prisma.io and requires you to be authenticated.
✔ Would you like to authenticate? Yes
Let's set up your Prisma Postgres database!
✔ Select your region: ap-southeast-1 - Asia Pacific (Singapore)
✔ Enter a project name: ft_transcendence
✔ Success! Your Prisma Postgres database is ready ✅

We found an existing schema.prisma file in your current project directory.

--- Database URL ---

Connect Prisma ORM to your Prisma Postgres database with this URL:

postgres://b8940316cf59bbd0f789d5c24424ea823f8045342c574c28b3a78ea5c60b049e:sk_zz0KyyS5SMibJ-WEtOvB9@db.prisma.io:5432/postgres?sslmode=require

--- Next steps ---

Go to https://pris.ly/ppg-init for detailed instructions.

1. Install the Postgres adapter
npm install @prisma/adapter-pg

...and add it to your Prisma Client instance:

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "./generated/prisma/client";

const connectionString = `${process.env.DATABASE_URL}`;

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

2. Apply migrations
Run the following command to create and apply a migration:
npx prisma migrate dev

3. Manage your data
View and edit your data locally by running this command:
npx prisma studio
...or online in Console:
https://console.prisma.io/bm5ah32t2mck4fwkntpi1wp0/cmj19fnad003kzqfngkrqh2wm/cmj19fnad003gzqfndov5bphx/studio

4. Send queries from your app
If you already have an existing app with Prisma ORM, you can now run it and it will send queries against your newly created Prisma Postgres instance.

5. Learn more
For more info, visit the Prisma Postgres docs: https://pris.ly/ppg-docs
