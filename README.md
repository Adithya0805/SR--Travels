# SR Travels - Taxi Booking PWA & Admin Dashboard

SR Travels is a modern, responsive Progressive Web Application (PWA) built with **Next.js 16**, **TypeScript**, **Tailwind CSS**, and **Supabase**.

## Features
- 🚗 Instant Fare Calculation (One-way, Round-trip, Self-drive, Driver Bata)
- 📍 OSRM & OpenStreetMap Interactive Route Mapping
- 📱 WhatsApp Direct Booking Confirmation
- 🔒 Secured Admin Dashboard (`/admin`) behind Supabase Auth
- 🛡️ Hardened Database Security (Row Level Security & Service Role server route)
- ⏱️ Rate Limiting & Anti-Spam (Upstash Redis, Honeypot, Form Time Validation)

## Directory Structure
The primary project code is located in the `sr-travels/` directory.

- `sr-travels/app`: Next.js pages, API routes, and styling.
- `sr-travels/components`: Reusable UI components & bottom sheets.
- `sr-travels/lib`: Fare calculator, maps utility, and Supabase client.
- `sr-travels/supabase`: Database schema & RLS security policies.

## Vercel Deployment Instructions
1. In Vercel Project Settings, set **Root Directory** to `sr-travels`.
2. Add Environment Variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
