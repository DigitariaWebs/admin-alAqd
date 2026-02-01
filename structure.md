# Admin Dashboard Structure

Based on the provided requirement, the application follows a hierarchical structure mapped to Next.js App Router.

## Directory Structure

```
admin/
├── app/
│   ├── (dashboard)/            # Authenticated layout group
│   │   ├── layout.tsx          # Main dashboard shell (Sidebar + Header)
│   │   ├── page.tsx            # Dashboard Overview
│   │   ├── users/              # User Management
│   │   │   ├── page.tsx        # User List
│   │   │   ├── [id]/           # User Details
│   │   │   └── roles/          # Roles & Permissions
│   │   ├── content/            # Content Management
│   │   │   ├── page.tsx        # Content List
│   │   │   ├── create/         # Create/Edit Content
│   │   │   └── categories/     # Categories
│   │   ├── orders/             # Orders/Transactions
│   │   │   ├── page.tsx        # Orders List
│   │   │   ├── [id]/           # Order Details
│   │   │   └── history/        # Transaction History
│   │   ├── analytics/          # Analytics & Reports
│   │   │   ├── page.tsx        # Charts & Graphs
│   │   │   ├── reports/        # Reports
│   │   │   └── insights/       # Insights
│   │   ├── notifications/      # Notifications
│   │   │   ├── page.tsx        # Send Notification
│   │   │   └── history/        # Notification History
│   │   ├── settings/           # System & Security Settings
│   │   │   ├── page.tsx        # General Settings
│   │   │   ├── security/       # Security Settings
│   │   │   └── integrations/   # Integrations
│   │   └── support/            # Support & Logs
│   │       ├── page.tsx        # Support Tickets
│   │       └── logs/           # System Logs
│   ├── (auth)/                 # Authentication routes
│   │   ├── login/
│   │   └── forgot-password/
│   ├── layout.tsx              # Root layout (Providers)
│   └── globals.css             # Global styles
├── components/
│   ├── ui/                     # Reusable UI atoms (Buttons, Inputs, Cards)
│   ├── layout/                 # Sidebar, Navbar
│   └── shared/                 # Shared components across features
├── config/                     # Configuration files
│   ├── assets.ts
│   ├── colors.ts
│   └── fonts.ts
├── store/                      # Redux setup
│   ├── slices/                 # State slices
│   ├── hooks.ts
│   └── store.ts
└── public/                     # Static assets
```

## Route Map (Visual Hierarchy)

1.  **Dashboard** (Root)
2.  **User Management**
    *   User List
    *   User Details
    *   Roles & Permissions
3.  **Content Management**
    *   Content List
    *   Create/Edit Content
    *   Categories
4.  **Orders/Transactions**
    *   Orders List
    *   Order Details
    *   Transaction History
5.  **Analytics & Reports**
    *   Charts & Graphs
    *   Reports
    *   Insights
6.  **Notifications**
    *   Send Notification
    *   Notification History
7.  **System & Security Settings**
    *   General Settings
    *   Security Settings
    *   Integrations
8.  **Support & Logs**
    *   Support Tickets
    *   System Logs
