# hotel-management-system

## Overview

Hotel management portal that supports both client-facing self-service pages and an admin dashboard. The front-end lives under `frontend/` (vanilla HTML/CSS/JS) and communicates with a REST API. Two backend implementations are currently checked in: the original Node.js service (`backend/`) and a PHP scaffold (`backend_php/`) that mirrors the same endpoints so you can deploy with XAMPP.

## Repository Structure

- `frontend/` – static pages for guests (booking, feedback, etc.) and administrators (room / staff / inventory management).
- `backend/` – Express server, MySQL connector, and the full set of controllers in JavaScript.
- `backend_php/` – PHP 8+ rewrite of the API entry points (`public/index.php` + controllers) designed to run on Apache.
- `hotel_data.sql` – MySQL schema and seed data for rooms, guests, bookings, and supporting tables.

## Database Setup

1. Install MySQL (bundled with XAMPP or standalone).
2. Create a database (default name `hotel_data`).
3. Import `hotel_data.sql` to recreate tables and sample rows.
4. Update credentials in either `backend/.env` (Node) or environment variables for the PHP connector (`DB_HOST`, `DB_USER`, `DB_PASS`, `DB_NAME`, `DB_PORT`). The PHP connector will try to reuse `backend/.env` if it exists.

## Running the PHP Backend with XAMPP

1. Move/clone this repo into `C:/xampp/htdocs/hotel_management`.
2. Ensure Apache and MySQL are running via the XAMPP control panel.
3. Confirm Apache allows `.htaccess` overrides (`AllowOverride All`) so `backend_php/public/.htaccess` can redirect `/api` routes.
4. Visit `http://localhost/hotel_management/backend_php/public/api/rooms/available` to verify the API responds.
5. Open the UI at `http://localhost/hotel_management/frontend/index.html`. Adjust any `fetch` calls to point to `http://localhost/hotel_management/backend_php/public/api/...` if needed.

## Running the Node Backend (optional)

1. Install dependencies: `cd backend` then `npm install`.
2. Start the development server: `npm run dev` (expects `backend/.env` to be populated like `DB_HOST=localhost`, `DB_USER=root`, etc.).
3. Front-end pages can then call the same routes at `http://localhost:5000/api/...`.

## Core API Endpoints

Both backends expose identical endpoints, for example:

- `POST /api/auth/client/register`
- `POST /api/auth/client/login`
- `POST /api/auth/admin/login`
- `POST /api/bookings/client`
- `GET /api/bookings/client/my/{guestId}`
- `GET /api/bookings/admin/all`
- `PUT /api/bookings/admin/status/{bookingId}`
- `GET /api/rooms/available`
- Admin CRUD under `/api/rooms/admin/...`

Additional controllers (inventory, housekeeping, staff, etc.) follow the same pattern and can be ported to PHP as needed.

## Next Steps / TODO

- Add authentication middleware (JWT or session-based) for admin/client dashboards.
- Hash passwords instead of storing plain text (both Node and PHP versions currently mirror the legacy behavior).
- Implement the remaining PHP controllers (`inventory`, `staff`, `service`, etc.) to reach feature parity with the Node backend.
