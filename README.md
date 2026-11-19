# SalesPulse — Sales & Marketing Analytics Dashboard

A responsive analytics dashboard built for the **Module 12 — Analytics Dashboard** assignment.

## Features

- **Four KPIs:** Total Revenue, Total Orders, Average Order Value, Total Customers
- **Monthly revenue:** Interactive line/area chart
- **Category revenue:** Interactive bar chart
- **Regional revenue:** Comparison with share of total revenue
- **Filters:** Region, product category, start date, end date
- **Transactions:** Searchable, paginated table
- **CSV export:** Download the currently filtered orders
- **Responsive layout:** Desktop, tablet and mobile
- **Empty states:** Handles date ranges and filters with no results

## Tech stack

React 18 · Vite 6 · Tailwind CSS 3 · Recharts 2 · Lucide React · CSV

## Dataset

`src/data/orders.csv` contains **520 deterministic synthetic orders** with exactly these required fields:

`Order ID, Order Date, Customer ID, Product Category, Region, Sales Amount`

All records are **fictional sample data** and not actual business figures. Dates are 2025–2026; prices are displayed in Indian rupees (INR).

### KPI formulas

- Total Revenue = sum of `Sales Amount` across filtered orders.
- Total Orders = count of filtered orders.
- Average Order Value = Total Revenue / Total Orders (0 if no orders).
- Total Customers = distinct `Customer ID` count across filtered orders.

All charts and the dashboard KPIs use the *same filtered dataset*. The transactions search affects only the table, while the dashboard filters affect everything, including CSV export.

## Run locally

Requires Node.js 20 or newer and npm.

```bash
npm install
npm run dev
```

Open the local URL displayed in your terminal (usually `http://localhost:5173`).

To test the production bundle:

```bash
npm run build
npm run preview
```

## Deploy to Vercel

1. Push this project to a GitHub repository.
2. In Vercel, choose **Add New → Project**, then import your GitHub repository.
3. Framework Preset: **Vite**; Build Command: `npm run build`; Output Directory: `dist`.
4. Deploy and verify your Vercel URL.
5. Test region/category/date filtering, export, chart tooltips, table search and pagination on the live site.

The application is client-side and requires **no API keys or backend**.

## Plan → Build → Debug → Deploy

1. **Plan:** Define KPI formulas, sample dataset, responsive design, charts and filters.
2. **Build:** Implement React UI, CSV integration, metrics, visualizations, filtering and table.
3. **Debug:** Verify totals manually, test each filter and empty state, review mobile layout.
4. **Deploy:** Push to GitHub and publish through Vercel.

## Submission checklist

- [ ] GitHub repository is accessible to instructor
- [ ] Public Vercel deployment works
- [ ] Filters and metrics work in production
- [ ] Retrospective (three questions) completed
- [ ] One concrete improvement included
- [ ] Final ~200-word synthesis written after both projects
