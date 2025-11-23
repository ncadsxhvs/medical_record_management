# Product Requirements Document
## Google Sheets to Display Card Converter

**Version:** 1.0  
**Date:** November 2025  
**Status:** Draft

---

## Overview

A simple program that reads data from Google Sheets and converts it into visual display cards.

## Problem Statement

Users have structured data in Google Sheets but need to present it as visual cards for presentations, websites, or print materials. Manual card creation is time-consuming and hard to maintain when data changes.

## Goals

- Connect to Google Sheets and read data
- Generate visual display cards from spreadsheet rows
- Support basic customization (colors, fonts, layout)
- Export cards in common formats (PNG, PDF, HTML)

## User Stories

1. As a user, I want to connect my Google Sheet so that I can use my existing data
2. As a user, I want to map columns to card fields so that data appears in the right places
3. As a user, I want to choose a card template so that my cards look professional
4. As a user, I want to export my cards so that I can use them elsewhere

## Features

### Core Features
- Google Sheets authentication via OAuth
- Column to field mapping interface
- Card template selection (3-5 templates)
- Real-time card preview
- Export as PNG, PDF, or HTML

### Nice to Have
- Custom template creation
- Batch processing for large datasets
- Image support from URLs
- Card animations or transitions

## Technical Requirements

**Framework:**
- Next.js (React framework with server-side rendering)
- App Router for modern routing
- Server Actions for API integration
- Responsive design with Tailwind CSS

**Backend/API:**
- Next.js API routes for Google Sheets integration
- Google Sheets API v4
- Image generation library (HTML2Canvas or Puppeteer)
- PDF generation (jsPDF or Puppeteer)

**Authentication:**
- NextAuth.js for Google OAuth 2.0
- Read-only Google Sheets scope

## User Flow

1. User authenticates with Google
2. User selects a Google Sheet and range
3. User maps columns to card fields
4. User selects or customizes card template
5. System generates preview of cards
6. User exports cards in desired format

## Success Metrics

- Time to first card: < 2 minutes
- Card generation speed: < 5 seconds for 100 rows
- User satisfaction: 4+ stars average rating

## Timeline

- **Phase 1 (2 weeks):** Google Sheets integration + basic card display
- **Phase 2 (2 weeks):** Template system + customization
- **Phase 3 (1 week):** Export functionality
- **Phase 4 (1 week):** Testing + polish

## Assumptions

- Users have Google accounts
- Data is structured with headers in first row
- Maximum 1,000 rows per session
- Desktop browser usage for creation

## Out of Scope

- Real-time collaboration
- Advanced data transformations
- Integration with other spreadsheet tools (Excel, Numbers)
- Mobile app version