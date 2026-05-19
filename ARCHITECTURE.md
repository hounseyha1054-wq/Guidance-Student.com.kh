# System Architecture

## User Flow Diagram

```
┌─────────────┐
│   Visitor   │
└──────┬──────┘
       │
       ▼
┌──────────────────────────┐
│   Login Page (/login)    │
│                          │
│ Select: Admin or Student │
└──────┬───────────────────┘
       │
       ├─────────────────────┬──────────────────────┐
       │                     │                      │
       ▼                     ▼                      ▼
  ┌─────────────┐    ┌──────────────┐    ┌────────────────┐
  │ Valid Admin?│    │Valid Student?│    │ Wrong Role?    │
  └──┬──────┬──┘    └──┬────────┬──┘    └────────────────┘
     │      │          │        │              │
     Yes    No         Yes      No            Error
     │      │          │        │          (Show Error)
     │      │          │        │              │
     ▼      ▼          ▼        ▼              ▼
  ┌────────────────────────────────────────────────┐
  │            Session Created                     │
  │      (user_id, username, is_admin)            │
  └────┬───────────────────────┬───────────────────┘
       │                       │
       ▼ is_admin=1            ▼ is_admin=0
  ┌─────────────────────┐  ┌─────────────────┐
  │ /admin/dashboard    │  │ /dashboard      │
  └─────────────────────┘  └─────────────────┘
```

## Application Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Flask Application                    │
│                     (run.py)                            │
└────────┬────────────────────────────────────────────────┘
         │
         ├─────────────────────────────────────────┐
         │                                         │
         ▼                                         ▼
    ┌─────────────┐                        ┌─────────────┐
    │   Routes    │                        │   Models    │
    │ (auth.py)   │                        │ (model/)    │
    └──┬──────┬───┘                        └──┬──┬──┬────┘
       │      │                              │  │  │
       │      │                              │  │  └─ fact.py
       │      │                              │  │
       │      │                              │  └─ rule.py
       │      │                              │
       │      │                              └─ user.py
       │      │                                 activity.py (NEW)
       │      │
       │      ▼
       │  ┌──────────────────────┐
       │  │   API Endpoints      │
       │  ├──────────────────────┤
       │  │ POST /api/activity   │
       │  │ GET /api/activities  │
       │  │ GET /api/admin/*     │
       │  └──────────────────────┘
       │
       ▼
    ┌─────────────────┐
    │  Templates      │
    ├─────────────────┤
    │ login.html      │
    │ register.html   │
    │ dashboard.html  │
    │ admin_dashboard │ (NEW)
    │ manage_facts    │
    │ manage_rules    │
    └─────────────────┘
       │
       ▼
┌──────────────────────────┐
│   SQLAlchemy ORM         │
├──────────────────────────┤
│ Users Table              │
│ UserActivities Table(NEW)│
│ Facts Table              │
│ Rules Table              │
└──────────┬───────────────┘
           │
           ▼
    ┌─────────────────┐
    │ SQLite Database │
    │  (app.db)       │
    └─────────────────┘
```

## Database Relationships

```
┌──────────────────────────────────┐
│          Users                   │
├──────────────────────────────────┤
│ id (PK)                          │
│ username                         │
│ email                            │
│ password_hash                    │
│ is_admin (NEW!)                  │◄──┐
│ recommended_career               │   │
│ secondary_career                 │   │
│ confidence_score                 │   │
│ assessment_completed             │   │
│ last_assessment                  │   │
│ created_at                       │   │
└──────────────────────────────────┘   │
                                       │
                                       │ 1:N
                                       │ Relationship
                                       │
        ┌──────────────────────────────┘
        │
        ▼
┌──────────────────────────────────┐
│    UserActivities (NEW)          │
├──────────────────────────────────┤
│ id (PK)                          │
│ user_id (FK → Users.id)          │
│ activity_type                    │
│ description                      │
│ score                            │
│ duration_seconds                 │
│ metadata                         │
│ created_at                       │
└──────────────────────────────────┘
```

## Role-Based Access Control

```
┌────────────────────────────────────────────────────────┐
│              Authentication System                     │
└────────────────┬─────────────────────────────────────┘
                 │
        ┌────────┴──────────┐
        │                   │
        ▼                   ▼
    ┌──────────┐       ┌──────────┐
    │  Admin   │       │ Student  │
    │ User     │       │ User     │
    │ is_admin │       │ is_admin │
    │   = 1    │       │   = 0    │
    └────┬─────┘       └────┬─────┘
         │                  │
         ▼                  ▼
    Can Access:        Can Access:
    ├─ /admin/       ├─ /dashboard
    │  dashboard     │
    ├─ /api/admin/*  ├─ /api/activity
    │                ├─ /api/activities
    └─ View all      └─ View own
       users &          activities
       activities       only
```

## Activity Tracking Flow

```
┌─────────────────────────────────┐
│     Student on Dashboard        │
└────────────┬────────────────────┘
             │
             ▼
    ┌─────────────────────┐
    │ Log New Activity    │
    │ Form                │
    │ - Type              │
    │ - Description       │
    │ - Score             │
    │ - Duration          │
    └────────┬────────────┘
             │
             │ Submit
             │
             ▼
    ┌─────────────────────┐
    │ POST /api/activity  │
    │ (login_required)    │
    └────────┬────────────┘
             │
             ▼
    ┌─────────────────────┐
    │ Create UserActivity │
    │ Record              │
    │ - user_id           │
    │ - activity_type     │
    │ - description       │
    │ - score             │
    │ - duration_seconds  │
    │ - created_at        │
    └────────┬────────────┘
             │
             ▼
    ┌─────────────────────┐
    │ Save to Database    │
    └────────┬────────────┘
             │
             ▼
    ┌─────────────────────┐
    │ Return Success      │
    │ Response            │
    │ {success: true}     │
    └────────┬────────────┘
             │
             ▼
    ┌─────────────────────┐
    │ Show Toast Message  │
    │ & Refresh Page      │
    └─────────────────────┘
```

## Admin Dashboard Data Flow

```
┌──────────────────────────┐
│   Admin User             │
│   (is_admin = 1)         │
└─────────┬────────────────┘
          │
          ▼
┌──────────────────────────────┐
│ GET /admin/dashboard         │
│ (@admin_required)            │
└─────────┬────────────────────┘
          │
          ▼
┌──────────────────────────────────────┐
│ Query Database:                      │
│ - All Users (is_admin = 0)           │
│ - All UserActivities                 │
│ - Calculate Statistics               │
└─────────┬──────────────────────────┘
          │
          ▼
┌──────────────────────────────────────┐
│ Render admin_dashboard.html:         │
│ - Statistics Cards                   │
│ - Users Table                        │
│ - Activities Table                   │
│ - Filter Controls                    │
└──────────┬───────────────────────────┘
           │
           ▼
┌──────────────────────────────────────┐
│ Admin Can:                           │
│ - See all users                      │
│ - See all activities                 │
│ - Filter by user/type/date           │
│ - Click to see user details          │
│ - View detailed activity history     │
└──────────────────────────────────────┘
```

## Student Dashboard Data Flow

```
┌──────────────────────────┐
│   Student User           │
│   (is_admin = 0)         │
└─────────┬────────────────┘
          │
          ▼
┌──────────────────────────────┐
│ GET /dashboard               │
│ (@login_required)            │
└─────────┬────────────────────┘
          │
          ▼
┌──────────────────────────────────┐
│ Query Database:                  │
│ - Current User Data              │
│ - User's Activities Only         │
│   (WHERE user_id = session.id)   │
│ - Calculate Statistics           │
└─────────┬──────────────────────┘
          │
          ▼
┌──────────────────────────────────────┐
│ Render dashboard.html:               │
│ - Profile Section                    │
│ - Statistics Cards                   │
│ - Activity Form                      │
│ - Activities Table (own only)        │
└──────────┬───────────────────────────┘
           │
           ├─────────────────┬──────────────────┐
           │                 │                  │
           ▼                 ▼                  ▼
    ┌────────────┐   ┌────────────┐   ┌────────────┐
    │   View     │   │   Log New  │   │   View    │
    │  Profile   │   │  Activity  │   │ Activities│
    └────────────┘   └─────┬──────┘   └────────────┘
                           │
                           ▼
                    ┌────────────────┐
                    │ Submit Form    │
                    │ POST /api/     │
                    │ activity       │
                    └─────┬──────────┘
                          │
                          ▼
                    ┌────────────────┐
                    │ Activity Saved │
                    │ Reload Page    │
                    └────────────────┘
```

## File Structure

```
App/
├── __init__.py              (Create app, register blueprints)
├── model/
│   ├── __init__.py
│   ├── user.py              (User model + is_admin field)
│   ├── activity.py          (NEW - UserActivity model)
│   ├── fact.py              (Fact model)
│   └── rule.py              (Rule model)
├── routes/
│   ├── __init__.py
│   ├── auth.py              (Login, dashboard, activities, admin)
│   └── manage.py            (Facts & rules management)
├── static/
│   ├── css/
│   │   ├── auth.css
│   │   └── dashboard.css
│   └── js/
│       ├── auth.js
│       └── dashboard.js
├── templates/
│   ├── login.html           (Updated with role selector)
│   ├── register.html
│   ├── dashboard.html       (Updated with activities)
│   ├── admin_dashboard.html (NEW)
│   ├── manage_facts.html
│   └── manage_rules.html
├── instance/
│   └── app.db               (SQLite database)
├── run.py                   (Entry point)
├── requirements.txt         (Dependencies)
├── SETUP_GUIDE.md           (Setup instructions)
├── IMPLEMENTATION_SUMMARY.md (Overview of changes)
└── QUICK_REFERENCE.md       (Quick reference card)
```

## Key Features Summary

```
┌──────────────────────────────────────────────────────────┐
│                    System Features                       │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  1. Dual Role System                                    │
│     └─ Admin & Student roles with is_admin flag        │
│                                                         │
│  2. Role-Based Login                                    │
│     └─ Separate admin/student login paths              │
│                                                         │
│  3. Activity Tracking                                   │
│     └─ Log & store student activities with metadata    │
│                                                         │
│  4. Admin Dashboard                                     │
│     └─ View all users & activities with filtering      │
│                                                         │
│  5. Student Dashboard                                   │
│     └─ Personal activity stats & logging               │
│                                                         │
│  6. REST APIs                                           │
│     └─ Log activities & retrieve data                  │
│                                                         │
│  7. Data Security                                       │
│     └─ Activities linked to user_id                   │
│     └─ Admin-only routes protected                    │
│                                                         │
└──────────────────────────────────────────────────────────┘
```
