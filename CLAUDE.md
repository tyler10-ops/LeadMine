# Claude Project Instructions

## Project Name
Realtor AI Lead Follow-Up Platform

## High-Level Goal
Build a revenue-generating SaaS where realtors receive leads and AI agents handle calling, qualification, follow-up, and appointment booking.

## Product Vision
- Treat AI agents as measurable assets
- Focus on direct revenue impact for realtors
- Prioritize simplicity, trust, and transparency

## Core Features
- Lead intake from multiple sources
- AI agent calling and follow-up
- Qualification summaries
- Appointment booking and human handoff
- Performance dashboards and logs
- Market intelligence indicators relevant to real estate

## Design Principles
- Professional, clean, financial-dashboard aesthetic
- Minimal animations
- Data-forward UI
- No gimmicks or unnecessary complexity

## Architecture Guidelines
- Modular components
- Clear separation between UI, logic, and integrations
- Mock data allowed where APIs are not yet connected
- Structure system so real integrations (Twilio, CRM, calendar) can be added later

## Coding Conventions

- Use TypeScript for all logic and UI components
- Use camelCase for variables and functions
- Use PascalCase for React components
- One component = one responsibility
- Keep UI components free of business logic
- Place API calls and integrations in a dedicated services layer
- Use clear, descriptive names over abbreviations
- Avoid deeply nested logic
- Prefer readability and maintainability over cleverness

## AI Agent Behavior
- Sound professional, calm, and helpful
- Never aggressive or pushy
- Always attempt to qualify before handing off
- Log all interactions clearly

## What NOT to Do
- Do not over-engineer
- Do not add features without clear revenue justification
- Do not introduce flashy UI elements
- Do not break existing working flows

## Output Expectations
- When making changes, explain what was modified and why
- Highlight any incomplete or placeholder logic
- Call out potential risks or missing requirements

## Target User
- Solo realtors
- Small teams
- Brokerages focused on inbound and outbound lead conversion

## Success Definition
- Leads are contacted automatically
- Appointments are booked without human follow-up
- Realtors can clearly see ROI in the dashboard
