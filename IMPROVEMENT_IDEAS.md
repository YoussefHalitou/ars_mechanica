# LIS White-Label — Improvement Ideas

> Brainstormed on 11 Feb 2026. Prioritize based on customer feedback and business impact.

---

## 🚀 Product

### 1. Mobile-First Field App
Tradespeople work on-site, not at a desk. A **mobile PWA** (or native app) for field workers would cover:
- Clock in/out from the job site
- Upload photos for inspections / Abnahmen
- Fill Morningplan checklists on-the-go
- GPS-based time tracking & route logging

### 2. Customer-Facing Portal
A portal where the **end-customer** (the person hiring the trades company) can:
- Track project status ("Your kitchen renovation is 60% done")
- View & digitally sign Abnahmen
- Receive and pay invoices online
- Leave feedback / ratings

### 3. Automated Quoting (Angebotserstellung)
Combine service + material catalogs to **generate professional PDF quotes** directly from the system. This is often the #1 pain point for trades companies.

### 4. AI-Powered Nachkalkulation Insights
Layer AI/ML on top of existing Nachkalkulation data to surface patterns:
- "Projects with team sizes > 4 average 15% cost overruns"
- "Material waste on painting jobs is 20% higher than scaffolding"
- Predictive margin estimates for new quotes before work begins

### 5. Integrations (DACH Ecosystem)
German trades companies depend on specific tools:
- **DATEV** export — near-mandatory for accountants
- **lexoffice / sevDesk** — invoicing & bookkeeping
- **Google Calendar** sync — Morningplan → team calendars
- **WhatsApp Business API** — crew notifications & updates

---

## 🛠️ Technical

### 6. Migrate Dashboard from Streamlit to Next.js
Streamlit is great for prototyping but limited for production SaaS (no granular auth, limited UI customization, slower on complex views). The Next.js marketing site already exists — extend it with a full **Next.js dashboard** behind authentication. The `(dashboard)` route and React Query setup are a natural starting point.

### 7. Role-Based Access Control (RBAC)
Implement granular permissions per user role:
| Role | Access Level |
|------|-------------|
| **Meister / Owner** | Full access to everything |
| **Teamleiter** | Project-level access, team management |
| **Mitarbeiter** | Own timesheets, checklists, tasks only |
| **Bürokraft** | Invoicing, reporting, admin |

### 8. Offline-First Capability
Construction sites often have poor or no connectivity. An **offline-capable PWA** with background sync would be a major differentiator — let field workers log time, fill checklists, and take photos even without signal.

### 9. Webhook / Event System
Add an internal event bus so tenants can react to system events:
- Project completed → notify accountant
- Checklist signed → trigger Abnahme workflow
- Time entry submitted → update Nachkalkulation
- Enables future third-party integrations and automations

---

## 📣 Marketing

### 10. Industry-Specific Landing Pages
Create dedicated pages per industry with tailored copy, screenshots, and testimonials:
- `/fuer-umzugsunternehmen` (Movers)
- `/fuer-maler` (Painters)
- `/fuer-geruestbauer` (Scaffolders)

Huge for **SEO** (long-tail keywords) and **conversion** (prospects see their exact use case).

### 11. Interactive Demo / Sandbox
Let prospects **try a live demo without sign-up** — a read-only sandbox pre-filled with sample data. More convincing than any feature list or sales pitch.

### 12. ROI Calculator
A simple interactive calculator on the marketing site:
- "How many employees?" / "How many projects per month?"
- → "You could save **X hours/month** and **€Y** with LIS."

Trades companies are practical people — show them the numbers.

---

## 💰 Business Model

### 13. Tiered Pricing by Maturity
| Tier | Includes |
|------|----------|
| **Starter** | Services + Materials + Basic Timekeeping |
| **Professional** | + Morningplan + Nachkalkulation + Inspections |
| **Enterprise** | + API access + Full white-labeling + DATEV export |

### 14. Onboarding-as-a-Service
Trades companies aren't always tech-savvy. Offer **white-glove onboarding** as a paid add-on:
- Data migration from spreadsheets
- Team training sessions
- Custom configuration setup
- Reduces churn and increases perceived value
