"""
seed.py - Automatic Production Database Seeder
Student Career Guidance Expert System
Initializes default Admin account, Knowledge Base Facts, Business Rules, and Careers.
"""

import os
from .model.user import User, db
from .model.fact import Fact
from .model.rule import Rule
from .model.career import Career

DEFAULT_FACTS = [
    # Technology
    ("Technology", "Do you enjoy writing or reading code?"),
    ("Technology", "Do you enjoy solving logical or mathematical problems?"),
    ("Technology", "Are you interested in building websites or mobile apps?"),
    ("Technology", "Are you comfortable working with computers for long hours?"),
    ("Technology", "Do you enjoy learning about new software and tools?"),
    ("Technology", "Are you interested in analyzing data using computers?"),
    ("Technology", "Do you enjoy finding and fixing errors in software?"),
    ("Technology", "Are you interested in protecting systems from hackers?"),
    
    # Business
    ("Business", "Do you enjoy managing or organizing people and tasks?"),
    ("Business", "Are you interested in marketing or selling products?"),
    ("Business", "Do you enjoy analyzing data to make business decisions?"),
    ("Business", "Are you comfortable presenting ideas to a group?"),
    ("Business", "Do you enjoy planning and leading projects?"),
    ("Business", "Are you interested in understanding customer behavior?"),
    ("Business", "Do you enjoy negotiating or convincing others?"),
    
    # Creative
    ("Creative", "Do you enjoy designing graphics or visual content?"),
    ("Creative", "Are you interested in photography or video production?"),
    ("Creative", "Do you enjoy writing articles, stories, or content?"),
    ("Creative", "Do you enjoy creating posters, logos, or layouts?"),
    ("Creative", "Are you interested in editing photos or videos?"),
    ("Creative", "Do you enjoy coming up with new and original ideas?"),
    
    # Science
    ("Science", "Are you interested in biology, chemistry, or physics?"),
    ("Science", "Do you enjoy conducting experiments or research?"),
    ("Science", "Are you interested in working in a hospital or clinic?"),
    ("Science", "Do you enjoy studying how the human body works?"),
    ("Science", "Are you interested in helping sick people recover?"),
    ("Science", "Do you enjoy reading scientific journals or articles?")
]

DEFAULT_RULES = [
    ("Technology", "Software Developer", "If user answers YES to coding, logical problems, and building apps → Recommend Software Developer"),
    ("Technology", "Web Developers", "If user answers YES to building websites, coding, and learning new tools → Recommend Web Developer"),
    ("Technology", "Data Analyst", "If user answers YES to analyzing data, mathematical problems, and working with computers → Recommend Data Analyst"),
    ("Technology", "Cybersecurity Analyst", "If user answers YES to computers, logical problems, and software tools → Recommend Cybersecurity Analyst"),
    
    ("Business", "Marketing Manager", "If user answers YES to marketing, presenting ideas, and organizing tasks → Recommend Marketing Manager"),
    ("Business", "Business Analyst", "If user answers YES to analyzing data, managing tasks, and presenting ideas → Recommend Business Analyst"),
    ("Business", "Project Manager", "If user answers YES to managing people, organizing tasks, and presenting ideas → Recommend Project Manager"),
    ("Business", "Sales Manager", "If user answers YES to selling products, presenting ideas, and managing people → Recommend Sales Manager"),
    
    ("Creative", "Graphic Designer", "If user answers YES to designing graphics, visual content, and creative tools → Recommend Graphic Designer"),
    ("Creative", "Content Writer", "If user answers YES to writing articles, creative content, and presenting ideas → Recommend Content Writer"),
    ("Creative", "Video Producer", "If user answers YES to photography, video production, and visual content → Recommend Video Producer"),
    
    ("Science", "Doctor / Physician", "If user answers YES to biology, hospital work, and research → Recommend Doctor"),
    ("Science", "Research Scientist", "If user answers YES to experiments, research, and chemistry or physics → Recommend Research Scientist"),
    ("Science", "Nurse", "If user answers YES to hospital work, biology, and helping people → Recommend Nurse")
]

DEFAULT_CAREERS = [
    {
        "title": "Software Developer",
        "category": "Technology",
        "min_salary": 65000,
        "max_salary": 125000,
        "description": "Designs, develops, and maintains software applications, algorithms, and backend systems.",
        "required_skills": "Python, JavaScript, Git, Algorithms, System Design",
        "education_requirements": "Bachelor's degree in Computer Science or equivalent practical portfolio."
    },
    {
        "title": "Web Developers",
        "category": "Technology",
        "min_salary": 50000,
        "max_salary": 95000,
        "description": "Builds and optimizes interactive, responsive web applications and APIs.",
        "required_skills": "HTML5, CSS3, JavaScript, React, Node.js, REST APIs",
        "education_requirements": "Associate or Bachelor's degree in Web Development or relevant bootcamps."
    },
    {
        "title": "Data Analyst",
        "category": "Technology",
        "min_salary": 55000,
        "max_salary": 105000,
        "description": "Analyzes complex datasets to extract insights, identify trends, and inform strategic decisions.",
        "required_skills": "SQL, Python, Excel, PowerBI, Statistics, Tableau",
        "education_requirements": "Bachelor's in Statistics, Computer Science, Economics, or related field."
    },
    {
        "title": "Cybersecurity Analyst",
        "category": "Technology",
        "min_salary": 70000,
        "max_salary": 130000,
        "description": "Monitors and protects computer networks, systems, and sensitive data from cyber threats.",
        "required_skills": "Network Security, Linux, Penetration Testing, Firewalls, Cryptography",
        "education_requirements": "Bachelor's degree in Cybersecurity, Information Systems, or security certifications."
    },
    {
        "title": "Marketing Manager",
        "category": "Business",
        "min_salary": 55000,
        "max_salary": 110000,
        "description": "Leads marketing campaigns, brand development, customer acquisition, and market research.",
        "required_skills": "Digital Marketing, SEO, Content Strategy, Analytics, Communication",
        "education_requirements": "Bachelor's in Marketing, Business Administration, or Communications."
    },
    {
        "title": "Business Analyst",
        "category": "Business",
        "min_salary": 60000,
        "max_salary": 115000,
        "description": "Bridges business needs with technology solutions by analyzing processes and market opportunities.",
        "required_skills": "Business Strategy, Requirement Gathering, SQL, Process Mapping",
        "education_requirements": "Bachelor's degree in Business, Finance, Information Systems, or related field."
    },
    {
        "title": "Project Manager",
        "category": "Business",
        "min_salary": 65000,
        "max_salary": 120000,
        "description": "Oversees project lifecycles, cross-functional teams, timelines, and deliverable quality.",
        "required_skills": "Agile, Scrum, Risk Management, Team Leadership, Budgeting",
        "education_requirements": "Bachelor's degree in Business or Management; PMP certification preferred."
    },
    {
        "title": "Sales Manager",
        "category": "Business",
        "min_salary": 50000,
        "max_salary": 105000,
        "description": "Drives revenue growth, client acquisition, and client relationship management.",
        "required_skills": "Negotiation, CRM, B2B Sales, Presentation, Relationship Building",
        "education_requirements": "Bachelor's in Business, Marketing, or proven sales leadership track record."
    },
    {
        "title": "Graphic Designer",
        "category": "Creative",
        "min_salary": 45000,
        "max_salary": 85000,
        "description": "Creates visually appealing branding, UI designs, print layouts, and digital illustrations.",
        "required_skills": "Figma, Adobe Photoshop, Illustrator, Typography, Visual Arts",
        "education_requirements": "Bachelor's in Graphic Design, Fine Arts, or strong design portfolio."
    },
    {
        "title": "Content Writer",
        "category": "Creative",
        "min_salary": 40000,
        "max_salary": 80000,
        "description": "Researches, writes, and edits high-quality articles, web copy, and storytelling content.",
        "required_skills": "Storytelling, Copywriting, SEO Research, Editing, Brand Voice",
        "education_requirements": "Bachelor's in English, Journalism, Communications, or writing portfolio."
    },
    {
        "title": "Video Producer",
        "category": "Creative",
        "min_salary": 48000,
        "max_salary": 95000,
        "description": "Directs, shoots, edits, and produces professional videos and visual storytelling projects.",
        "required_skills": "Adobe Premiere Pro, After Effects, Cinematography, Sound Design",
        "education_requirements": "Bachelor's degree in Film, Media Arts, or verified production portfolio."
    },
    {
        "title": "Doctor / Physician",
        "category": "Science",
        "min_salary": 130000,
        "max_salary": 260000,
        "description": "Examines patients, diagnoses medical conditions, and directs treatments to restore health.",
        "required_skills": "Clinical Diagnosis, Patient Care, Physiology, Pharmacology, Critical Thinking",
        "education_requirements": "Doctor of Medicine (M.D.) or equivalent professional medical degree and license."
    },
    {
        "title": "Research Scientist",
        "category": "Science",
        "min_salary": 65000,
        "max_salary": 125000,
        "description": "Designs and conducts controlled scientific experiments to discover new insights and technologies.",
        "required_skills": "Scientific Method, Laboratory Research, Data Modeling, Technical Writing",
        "education_requirements": "Master's or Ph.D. in Physics, Chemistry, Biology, or related scientific discipline."
    },
    {
        "title": "Nurse",
        "category": "Science",
        "min_salary": 55000,
        "max_salary": 95000,
        "description": "Administers compassionate medical care, tracks patient wellness, and supports clinical teams.",
        "required_skills": "Patient Care, Vital Signs, Emergency Response, Pharmacology, Empathy",
        "education_requirements": "Bachelor of Science in Nursing (BSN) and RN license."
    }
]

def seed_default_data():
    """
    Seeds initial admin, facts, rules, and career definitions if the database is newly initialized.
    Safe to run repeatedly (only adds missing entries).
    """
    try:
        # 1. Seed or Verify Default Admin
        admin = User.query.filter_by(is_admin=True).first()
        if not admin:
            admin_user = os.getenv('ADMIN_USERNAME', 'admin')
            admin_email = os.getenv('ADMIN_EMAIL', 'admin@gmail.com')
            admin_pass = os.getenv('ADMIN_PASSWORD', 'Admin@123')
            
            admin = User(
                username=admin_user,
                email=admin_email,
                first_name="System",
                last_name="Admin",
                phone="012345678",
                is_admin=True
            )
            admin.set_password(admin_pass)
            db.session.add(admin)
            db.session.commit()
            print(f"--> [SEED] Initialized default admin: {admin.username} ({admin.email})")

        admin_id = admin.id

        # 2. Seed Facts if empty
        if Fact.query.count() == 0:
            for cat, content in DEFAULT_FACTS:
                fact = Fact(user_id=admin_id, category=cat, content=content)
                db.session.add(fact)
            db.session.commit()
            print(f"--> [SEED] Inserted {len(DEFAULT_FACTS)} default facts into Knowledge Base.")

        # 3. Seed Rules if empty
        if Rule.query.count() == 0:
            for dom, title, desc in DEFAULT_RULES:
                rule = Rule(user_id=admin_id, domain=dom, title=title, description=desc)
                db.session.add(rule)
            db.session.commit()
            print(f"--> [SEED] Inserted {len(DEFAULT_RULES)} default business rules.")

        # 4. Seed Careers if empty
        if Career.query.count() == 0:
            for c_data in DEFAULT_CAREERS:
                career = Career(**c_data)
                db.session.add(career)
            db.session.commit()
            print(f"--> [SEED] Inserted {len(DEFAULT_CAREERS)} career definitions.")

    except Exception as e:
        db.session.rollback()
        print(f"--> [SEED WARNING] Database seeding skipped: {e}")
