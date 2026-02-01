# Admin Dashboard - Project Description

## Overview
The Al-Aqd Admin Dashboard is a comprehensive management interface designed to oversee and control the Al-Aqd mobile platform (`@al-aqd`). It provides administrators with tools to manage users, content, orders, and system settings in a centralized, secure environment.

## Design Philosophy
- **Aesthetics**: Clean, modern, professional, with extensive use of white space.
- **Theme**: Light mode only.
- **Responsiveness**: Mandatory full responsiveness across devices.
- **Components**: Modular, reusable components (no hardcoding).
- **Style**: No gradients; flat, high-contrast, legible design.

## Core Features (Based on Structure)
1.  **Dashboard Overview**: High-level metrics and insights.
2.  **User Management**: Detailed user lists, profiles, and role management.
3.  **Content Management**: Creation, editing, and categorization of platform content.
4.  **Orders & Transactions**: Tracking orders and transaction history.
5.  **Analytics & Reports**: Visual data representation and report generation.
6.  **Notifications**: System-wide notification management and history.
7.  **System Settings**: General configuration, security, and integrations.
8.  **Support & Logs**: Ticket management and system activity logs.

## Technical Stack
- **Framework**: Next.js (App Router)
- **State Management**: Redux Toolkit (configured)
- **Styling**: Tailwind CSS (recommended for utility-first approach)
- **Language**: TypeScript
- **Configuration**: Centralized via `config/` (colors, fonts, assets)

## Context
This dashboard serves as the backend interface for the Al-Aqd mobile application, adhering to the same branding and domain rules but optimized for desktop administration workflows.
