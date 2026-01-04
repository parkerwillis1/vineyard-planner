# Bottling Management - Release Notes (v1.0)

**Release Date**: January 2, 2026
**Module**: Production (Professional Tier)

---

## What's New in Bottling Management

We're excited to release the first version of our comprehensive bottling workflow, designed to help you manage wine bottling runs from lot selection through completion.

### Key Features

**Smart Lot Selection with Readiness Scoring**
- Automatically calculates readiness scores (0-100) for each wine lot based on volume, aging time, lab analysis, and production status
- Visual readiness indicators show at a glance which lots are ready for bottling
- Click any readiness score to see a detailed breakdown of what makes a lot ready or blocked

**Actionable Blocker Guidance**
- When a lot isn't quite ready, we show you exactly what's missing (low volume, missing ABV, needs lab test, etc.)
- Quick "Fix It" buttons take you directly to the relevant page to resolve each blocker
- Clear status badges distinguish between "Ready", "Nearly Ready", and "Not Ready" lots

**Accurate Aging Tracking**
- Displays aging duration in months based on the most reliable date source available
- Shows "Aging start unknown" when data is incomplete, rather than displaying misleading dates
- Aging information is used to help you identify lots that have aged long enough for bottling

**Flexible Lot Filtering & Grouping**
- Filter by varietal, vintage, status, or search by lot name
- Group lots by varietal, vintage, status, or container type
- Sort by name, volume, readiness score, or aging duration
- Pagination keeps large lot lists manageable (20 lots per page)

**Complete Bottling Run Workflow**
- **Step 0**: Select the wine lot you want to bottle
- **Step 1**: Set up run details (bottles to produce, bottle size, loss %, SKU, labels)
- **Step 2**: Review and validate your plan before starting
- **Step 3**: Execute the bottling run with real-time progress tracking and QC checkpoints
- **Step 4**: Complete the run and automatically update inventory

**Draft Run Management**
- Bottling runs auto-save as drafts while you work
- Resume incomplete runs right where you left off
- Choose to continue your saved draft or start fresh when returning to a lot
- Drafts are automatically cleaned up when you start a new run

**Production Safeguards**
- Volume deductions from wine lots happen only when runs are completed (not during setup)
- Idempotent completion prevents duplicate inventory records if network issues cause retries
- Clear error messages with retry options for network failures
- Status validation ensures runs follow the correct workflow (draft → active → completed)

---

## Technical Improvements

**Performance Optimizations**
- Efficient database queries avoid N+1 performance issues
- Dirty checking ensures auto-save only triggers when data actually changes
- Pagination and memoization keep the UI responsive even with 100+ lots

**Data Integrity & Security**
- Row-level security policies ensure users can only access their own bottling data
- Database constraints enforce valid status transitions
- Ownership validation on all data operations

---

## Coming Soon (Future Versions)

We've intentionally kept this release focused on core bottling workflow. Here's what's on the roadmap:

- Wine Analysis pages (currently placeholder)
- Lot Transfers & Container management pages
- Lot Detail & Edit pages
- Bulk status updates for lots
- Server-side filtering for very large lot inventories (200+ lots)
- Barrel assignment tracking for aging calculations

---

## Getting Started

1. Navigate to **Production** → **Bottling Management**
2. Select a wine lot from the "Select Lot" step (lots with readiness scores above 70 are typically ready)
3. Click the readiness score badge to see what makes each lot ready or blocked
4. Use "Fix It" buttons to quickly resolve any blockers
5. Once you've selected your lot, click "Continue" to set up your bottling run
6. Follow the guided workflow through setup, validation, execution, and completion

---

## Need Help?

- Visit `/docs/production` for detailed documentation
- Check out the FAQ at `/docs/faq`
- Bottling runs auto-save, so you can safely close the page and resume later

---

**Thank you for using Trellis!** We're committed to building tools that make winery production management straightforward and efficient.
