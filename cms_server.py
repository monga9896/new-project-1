#!/usr/bin/env python3
"""
IDMR Strategies - Full-Stack CMS Server
Provides REST API endpoints for Admin Panel (CMS) and Live Website Dynamic Content.
Powered by Python 3 & SQLite.
"""

import os
import sys
import json
import sqlite3
import hashlib
import uuid
import time
from urllib.parse import parse_qs, urlparse
from http.server import HTTPServer, BaseHTTPRequestHandler

DB_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "idmr_cms.db")
UPLOADS_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "uploads")
os.makedirs(UPLOADS_DIR, exist_ok=True)

# Helper: DB Connection
def get_db():
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    return conn

# Hash helper
def hash_password(password):
    return hashlib.sha256(password.encode("utf-8")).hexdigest()

# Initialize Database Schema
def init_db():
    conn = get_db()
    cursor = conn.cursor()

    # Users table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        name TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'Admin',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )""")

    # Active Sessions
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS sessions (
        token TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )""")

    # Hero Settings
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS hero_settings (
        id INTEGER PRIMARY KEY DEFAULT 1,
        headline TEXT,
        subheading TEXT,
        cta_primary_text TEXT,
        cta_primary_link TEXT,
        cta_secondary_text TEXT,
        cta_secondary_link TEXT,
        badge_text TEXT,
        stats_json TEXT
    )""")

    # About Settings
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS about_settings (
        id INTEGER PRIMARY KEY DEFAULT 1,
        heading TEXT,
        description TEXT,
        mission TEXT,
        vision TEXT,
        values_json TEXT
    )""")

    # Services
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS services (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        icon TEXT,
        image_url TEXT,
        description TEXT,
        display_order INTEGER DEFAULT 0
    )""")

    # Clients (Marquee Logos)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS clients (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        logo_url TEXT NOT NULL,
        display_order INTEGER DEFAULT 0,
        is_active INTEGER DEFAULT 1
    )""")

    # Testimonials
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS testimonials (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        company TEXT,
        designation TEXT,
        review TEXT NOT NULL,
        rating INTEGER DEFAULT 5,
        photo_url TEXT,
        video_url TEXT,
        is_featured INTEGER DEFAULT 0
    )""")

    # FAQs
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS faqs (
        id TEXT PRIMARY KEY,
        question TEXT NOT NULL,
        answer TEXT NOT NULL,
        category TEXT DEFAULT 'General',
        display_order INTEGER DEFAULT 0
    )""")

    # Why Choose Us Cards
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS why_us_cards (
        id TEXT PRIMARY KEY,
        icon TEXT,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        display_order INTEGER DEFAULT 0
    )""")

    # Portfolio Projects
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS portfolio_projects (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        slug TEXT UNIQUE NOT NULL,
        category TEXT,
        client_name TEXT,
        industry TEXT,
        description TEXT,
        technologies TEXT,
        gallery_json TEXT,
        before_after_json TEXT,
        video_url TEXT,
        meta_title TEXT,
        meta_desc TEXT,
        is_featured INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )""")

    # Blog Posts
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS blog_posts (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        slug TEXT UNIQUE NOT NULL,
        content_html TEXT,
        featured_image TEXT,
        category TEXT,
        tags TEXT,
        status TEXT DEFAULT 'Published',
        publish_date TEXT,
        meta_title TEXT,
        meta_desc TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )""")

    # Form Submissions (Leads)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS form_submissions (
        id TEXT PRIMARY KEY,
        form_type TEXT DEFAULT 'Contact',
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        phone TEXT,
        company TEXT,
        service_required TEXT,
        budget TEXT,
        message TEXT,
        is_read INTEGER DEFAULT 0,
        reply_notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )""")

    # Media Library
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS media_files (
        id TEXT PRIMARY KEY,
        filename TEXT NOT NULL,
        file_url TEXT NOT NULL,
        mime_type TEXT,
        file_size INTEGER,
        alt_text TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )""")

    # Contact Info
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS contact_info (
        id INTEGER PRIMARY KEY DEFAULT 1,
        address TEXT,
        phone TEXT,
        email TEXT,
        working_hours TEXT,
        google_maps_url TEXT,
        whatsapp_number TEXT
    )""")

    # SEO Settings
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS seo_settings (
        id INTEGER PRIMARY KEY DEFAULT 1,
        meta_title TEXT,
        meta_desc TEXT,
        keywords TEXT,
        og_image TEXT,
        ga_id TEXT,
        gtm_id TEXT,
        meta_pixel_id TEXT,
        robots_txt TEXT,
        sitemap_xml TEXT
    )""")

    # Theme Settings
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS theme_settings (
        id INTEGER PRIMARY KEY DEFAULT 1,
        logo_url TEXT,
        favicon_url TEXT,
        primary_color TEXT,
        nav_links_json TEXT,
        footer_links_json TEXT
    )""")

    # Footer Settings (Pre-footer CTA, brand info, social links, contact info, legal text)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS footer_settings (
        id INTEGER PRIMARY KEY DEFAULT 1,
        cta_badge TEXT,
        cta_title TEXT,
        cta_subtitle TEXT,
        cta_primary_btn_text TEXT,
        cta_primary_btn_link TEXT,
        cta_secondary_btn_text TEXT,
        cta_secondary_btn_link TEXT,
        brand_description TEXT,
        status_pill_text TEXT,
        facebook_url TEXT,
        instagram_url TEXT,
        linkedin_url TEXT,
        twitter_url TEXT,
        youtube_url TEXT,
        work_email TEXT,
        phone_number TEXT,
        office_address TEXT,
        working_hours TEXT,
        copyright_text TEXT
    )""")

    cursor.execute("SELECT COUNT(*) FROM footer_settings")
    if cursor.fetchone()[0] == 0:
        cursor.execute("""
        INSERT INTO footer_settings (
            id, cta_badge, cta_title, cta_subtitle, cta_primary_btn_text, cta_primary_btn_link,
            cta_secondary_btn_text, cta_secondary_btn_link, brand_description, status_pill_text,
            facebook_url, instagram_url, linkedin_url, twitter_url, youtube_url,
            work_email, phone_number, office_address, working_hours, copyright_text
        ) VALUES (
            1,
            '⭐ TOP-RATED DIGITAL & RESEARCH AGENCY',
            'Ready to Accelerate Your Business Growth?',
            'Connect with our senior growth strategists and receive a customized, data-backed roadmap for your company.',
            'Get Free Consultation',
            '#consult-modal',
            'View Case Studies',
            'portfolio.html',
            'IDMR Strategies is a premier digital marketing & market research agency dedicated to scaling brand revenue through SEO, performance media, AI funnels, and consumer insights.',
            '● All Systems Operational',
            'https://facebook.com/idmrstrategies',
            'https://instagram.com/idmrstrategies',
            'https://linkedin.com/company/idmrstrategies',
            'https://twitter.com/idmrstrategies',
            'https://youtube.com/@idmrstrategies',
            'idmrstrategies@gmail.com',
            '+91 8383897274',
            'Headquarters: IDMR Strategies Tower, Digital Hub, Mohali, Punjab',
            'Monday–Saturday: 9:00 AM – 6:00 PM',
            '© 2026 IDMR Strategies. All rights reserved.'
        )""")

    # Audit Logs
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS audit_logs (
        id TEXT PRIMARY KEY,
        user_email TEXT,
        action TEXT NOT NULL,
        details TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )""")

    # Seed Admin User if not exists
    cursor.execute("SELECT COUNT(*) FROM users")
    if cursor.fetchone()[0] == 0:
        admin_id = str(uuid.uuid4())
        cursor.execute(
            "INSERT INTO users (id, email, password_hash, name, role) VALUES (?, ?, ?, ?, ?)",
            (admin_id, "admin@idmrstrategies.com", hash_password("admin123"), "IDMR Admin", "Admin")
        )

    # Seed Default Content if empty
    cursor.execute("SELECT COUNT(*) FROM hero_settings")
    if cursor.fetchone()[0] == 0:
        cursor.execute("""
        INSERT INTO hero_settings (id, headline, subheading, cta_primary_text, cta_primary_link, cta_secondary_text, cta_secondary_link, badge_text, stats_json)
        VALUES (1, 'Accelerate Business Growth with Data-Driven Digital Marketing', 
        'We help enterprise brands & fast-growing startups scale revenue through SEO, Google & Meta Ads, AI Funnels, Web Engineering, and Market Research.',
        'Get Free Consultation', '#contact', 'Explore Case Studies', 'portfolio.html', '⭐ TOP RATED DIGITAL & RESEARCH AGENCY',
        '[{"label":"Client ROAS Average","value":"4.8x"},{"label":"Revenue Generated","value":"$45M+"},{"label":"Global Projects","value":"350+"},{"label":"Retention Rate","value":"98%"}]')
        """)

    cursor.execute("SELECT COUNT(*) FROM contact_info")
    if cursor.fetchone()[0] == 0:
        cursor.execute("""
        INSERT INTO contact_info (id, address, phone, email, working_hours, google_maps_url, whatsapp_number)
        VALUES (1, 'Mohali, Punjab, India', '+91 8383897274', 'idmrstrategies@gmail.com', 'Monday–Saturday: 9:00 AM – 6:00 PM', 'https://maps.google.com/?q=Mohali,Punjab,India', '+918383897274')
        """)

    # Seed Initial Services if empty
    cursor.execute("SELECT COUNT(*) FROM services")
    if cursor.fetchone()[0] == 0:
        initial_services = [
            ("s1", "Search Engine Optimization", "🔍", "assets/service_seo.jpg", "Technical & content-driven SEO strategy to dominate high-intent organic search keywords.", 1),
            ("s2", "Google & Meta Paid Ads", "📈", "assets/service_ads.jpg", "Precision-targeted search & social advertising campaigns engineered for maximum ROAS.", 2),
            ("s3", "Website Engineering & UX", "💻", "assets/service_web.jpg", "High-performance, ultra-fast websites designed to convert visitors into loyal clients.", 3),
            ("s4", "AI & Funnel Automation", "🤖", "assets/service_ai.jpg", "Smart lead nurture funnels, chatbots, and automated workflows powered by AI.", 4),
            ("s5", "Market & Competitor Research", "📊", "assets/service_research.jpg", "Data-rich market intelligence, consumer behavior insights, and strategic positioning.", 5),
            ("s6", "Corporate Branding & Strategy", "✨", "assets/service_branding.jpg", "Elevating corporate identity, brand messaging, and authority with premium positioning.", 6)
        ]
        cursor.executemany("INSERT INTO services (id, title, icon, image_url, description, display_order) VALUES (?, ?, ?, ?, ?, ?)", initial_services)

    # Seed Initial FAQs if empty
    cursor.execute("SELECT COUNT(*) FROM faqs")
    if cursor.fetchone()[0] == 0:
        initial_faqs = [
            ("f1", "How fast can we expect results from performance marketing campaigns?", "Our Google & Meta ad campaigns usually start generating qualified leads within 48 to 72 hours of launch.", "Ads", 1),
            ("f2", "Do you customize packages according to company size?", "Yes! We design tailored strategies for startups, SMBs, and enterprise corporations.", "General", 2),
            ("f3", "What makes IDMR Strategies different from traditional agencies?", "We combine deep market research and AI automation with performance creative for data-backed growth.", "General", 3),
            ("f4", "Will I get a dedicated strategy and account manager?", "Absolutely. Every client is assigned a senior marketing strategist and account manager.", "Support", 4)
        ]
        cursor.executemany("INSERT INTO faqs (id, question, answer, category, display_order) VALUES (?, ?, ?, ?, ?)", initial_faqs)

    conn.commit()
    conn.close()

# Log audit action
def log_audit(user_email, action, details=""):
    try:
        conn = get_db()
        conn.cursor().execute(
            "INSERT INTO audit_logs (id, user_email, action, details) VALUES (?, ?, ?, ?)",
            (str(uuid.uuid4()), user_email, action, details)
        )
        conn.commit()
        conn.close()
    except Exception as e:
        print("Audit log error:", e)

# HTTP Request Handler for API & CMS
class CMSRequestHandler(BaseHTTPRequestHandler):
    
    def send_cors_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_cors_headers()
        self.end_headers()

    def send_json(self, data, code=200):
        self.send_response(code)
        self.send_cors_headers()
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(json.dumps(data).encode("utf-8"))

    def get_auth_token(self):
        auth_header = self.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            return auth_header.split(" ")[1]
        return None

    def verify_auth(self):
        token = self.get_auth_token()
        if not token:
            return None
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("SELECT u.* FROM users u JOIN sessions s ON u.id = s.user_id WHERE s.token = ?", (token,))
        user = cursor.fetchone()
        conn.close()
        return dict(user) if user else None

    def parse_json_body(self):
        content_length = int(self.headers.get("Content-Length", 0))
        if content_length == 0:
            return {}
        body = self.rfile.read(content_length).decode("utf-8")
        try:
            return json.loads(body)
        except Exception:
            return {}

    # MAIN ROUTER
    def do_GET(self):
        parsed = urlparse(self.path)
        path = parsed.path

        # 1. PUBLIC SITE DATA ENDPOINT
        if path == "/api/public/site-data":
            conn = get_db()
            c = conn.cursor()

            c.execute("SELECT * FROM hero_settings WHERE id = 1")
            hero = dict(c.fetchone() or {})
            if hero.get("stats_json"):
                try: hero["stats"] = json.loads(hero["stats_json"])
                except: hero["stats"] = []

            c.execute("SELECT * FROM about_settings WHERE id = 1")
            about = dict(c.fetchone() or {})
            if about.get("values_json"):
                try: about["values"] = json.loads(about["values_json"])
                except: about["values"] = []

            c.execute("SELECT * FROM services ORDER BY display_order ASC")
            services = [dict(r) for r in c.fetchall()]

            c.execute("SELECT * FROM clients WHERE is_active = 1 ORDER BY display_order ASC")
            clients = [dict(r) for r in c.fetchall()]

            c.execute("SELECT * FROM testimonials ORDER BY is_featured DESC")
            testimonials = [dict(r) for r in c.fetchall()]

            c.execute("SELECT * FROM faqs ORDER BY display_order ASC")
            faqs = [dict(r) for r in c.fetchall()]

            c.execute("SELECT * FROM why_us_cards ORDER BY display_order ASC")
            why_us = [dict(r) for r in c.fetchall()]

            c.execute("SELECT * FROM portfolio_projects ORDER BY is_featured DESC, created_at DESC")
            portfolio = [dict(r) for r in c.fetchall()]

            c.execute("SELECT * FROM blog_posts WHERE status = 'Published' ORDER BY created_at DESC")
            blogs = [dict(r) for r in c.fetchall()]

            c.execute("SELECT * FROM contact_info WHERE id = 1")
            contact = dict(c.fetchone() or {})

            c.execute("SELECT * FROM seo_settings WHERE id = 1")
            seo = dict(c.fetchone() or {})

            c.execute("SELECT * FROM theme_settings WHERE id = 1")
            theme = dict(c.fetchone() or {})

            c.execute("SELECT * FROM footer_settings WHERE id = 1")
            footer = dict(c.fetchone() or {})

            conn.close()

            self.send_json({
                "status": "success",
                "data": {
                    "hero": hero,
                    "about": about,
                    "services": services,
                    "clients": clients,
                    "testimonials": testimonials,
                    "faqs": faqs,
                    "why_us": why_us,
                    "portfolio": portfolio,
                    "blogs": blogs,
                    "contact": contact,
                    "seo": seo,
                    "theme": theme,
                    "footer": footer
                }
            })
            return

        # GET FOOTER SETTINGS (/api/cms/footer)
        if path == "/api/cms/footer":
            user = self.verify_auth()
            if not user:
                self.send_json({"status": "error", "message": "Unauthorized"}, 401)
                return
            conn = get_db()
            c = conn.cursor()
            c.execute("SELECT * FROM footer_settings WHERE id = 1")
            footer = dict(c.fetchone() or {})
            conn.close()
            self.send_json({"status": "success", "footer": footer})
            return

        # 2. AUTH CHECK (/api/auth/me)
        if path == "/api/auth/me":
            user = self.verify_auth()
            if user:
                user.pop("password_hash", None)
                self.send_json({"status": "success", "user": user})
            else:
                self.send_json({"status": "error", "message": "Unauthorized"}, 401)
            return

        # 3. DASHBOARD STATS
        if path == "/api/cms/stats":
            user = self.verify_auth()
            if not user:
                self.send_json({"status": "error", "message": "Unauthorized"}, 401)
                return

            conn = get_db()
            c = conn.cursor()
            c.execute("SELECT COUNT(*) FROM form_submissions")
            total_enquiries = c.fetchone()[0]
            c.execute("SELECT COUNT(*) FROM form_submissions WHERE is_read = 0")
            unread_enquiries = c.fetchone()[0]
            c.execute("SELECT COUNT(*) FROM portfolio_projects")
            total_portfolio = c.fetchone()[0]
            c.execute("SELECT COUNT(*) FROM blog_posts")
            total_blogs = c.fetchone()[0]
            c.execute("SELECT COUNT(*) FROM services")
            total_services = c.fetchone()[0]
            c.execute("SELECT COUNT(*) FROM clients")
            total_clients = c.fetchone()[0]
            c.execute("SELECT COUNT(*) FROM testimonials")
            total_testimonials = c.fetchone()[0]

            c.execute("SELECT * FROM form_submissions ORDER BY created_at DESC LIMIT 5")
            recent_enquiries = [dict(r) for r in c.fetchall()]

            c.execute("SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 6")
            recent_activities = [dict(r) for r in c.fetchall()]
            conn.close()

            self.send_json({
                "status": "success",
                "stats": {
                    "total_enquiries": total_enquiries,
                    "unread_enquiries": unread_enquiries,
                    "total_portfolio": total_portfolio,
                    "total_blogs": total_blogs,
                    "total_services": total_services,
                    "total_clients": total_clients,
                    "total_testimonials": total_testimonials,
                    "website_visitors": 14280,
                    "recent_enquiries": recent_enquiries,
                    "recent_activities": recent_activities
                }
            })
            return

        # 4. ENQUIRIES CSV EXPORT
        if path == "/api/cms/enquiries/export-csv":
            user = self.verify_auth()
            if not user:
                self.send_json({"status": "error", "message": "Unauthorized"}, 401)
                return
            conn = get_db()
            c = conn.cursor()
            c.execute("SELECT * FROM form_submissions ORDER BY created_at DESC")
            rows = c.fetchall()
            conn.close()

            csv_lines = ["ID,Form Type,Name,Email,Phone,Company,Service,Budget,Message,Date"]
            for r in rows:
                csv_lines.append(f'"{r["id"]}","{r["form_type"]}","{r["name"]}","{r["email"]}","{r["phone"]}","{r["company"]}","{r["service_required"]}","{r["budget"]}","{r["message"]}","{r["created_at"]}"')

            csv_data = "\n".join(csv_lines)
            self.send_response(200)
            self.send_cors_headers()
            self.send_header("Content-Type", "text/csv")
            self.send_header("Content-Disposition", 'attachment; filename="idmr_enquiries.csv"')
            self.end_headers()
            self.wfile.write(csv_data.encode("utf-8"))
            return

        # 5. CMS LIST GETTERS
        if path.startswith("/api/cms/"):
            user = self.verify_auth()
            if not user:
                self.send_json({"status": "error", "message": "Unauthorized"}, 401)
                return

            table = path.replace("/api/cms/", "").split("/")[0]
            valid_tables = {
                "services": "services",
                "clients": "clients",
                "testimonials": "testimonials",
                "faqs": "faqs",
                "portfolio": "portfolio_projects",
                "blog": "blog_posts",
                "enquiries": "form_submissions",
                "media": "media_files",
                "users": "users",
                "why-us": "why_us_cards",
                "audit-logs": "audit_logs"
            }
            
            if table in valid_tables:
                conn = get_db()
                c = conn.cursor()
                t_name = valid_tables[table]
                c.execute(f"SELECT * FROM {t_name}")
                items = [dict(r) for r in c.fetchall()]
                conn.close()
                self.send_json({"status": "success", "data": items})
                return

        self.send_json({"status": "error", "message": "Endpoint not found"}, 404)

    def do_POST(self):
        path = urlparse(self.path).path
        body = self.parse_json_body()

        # 1. LOGIN ENDPOINT
        if path == "/api/auth/login":
            email = body.get("email", "").strip()
            password = body.get("password", "")
            if not email or not password:
                self.send_json({"status": "error", "message": "Email and password required"}, 400)
                return

            conn = get_db()
            c = conn.cursor()
            c.execute("SELECT * FROM users WHERE email = ?", (email,))
            user = c.fetchone()

            if user and user["password_hash"] == hash_password(password):
                token = str(uuid.uuid4())
                c.execute("INSERT INTO sessions (token, user_id) VALUES (?, ?)", (token, user["id"]))
                conn.commit()
                conn.close()

                log_audit(email, "LOGIN_SUCCESS", "Logged into admin panel")
                user_dict = dict(user)
                user_dict.pop("password_hash", None)
                self.send_json({"status": "success", "token": token, "user": user_dict})
            else:
                conn.close()
                log_audit(email, "LOGIN_FAILED", "Invalid credentials")
                self.send_json({"status": "error", "message": "Invalid credentials"}, 401)
            return

        # 2. PUBLIC FORM SUBMISSION
        if path == "/api/public/submit-form":
            name = body.get("name", "").strip()
            email = body.get("email", "").strip()
            if not name or not email:
                self.send_json({"status": "error", "message": "Name and email are required"}, 400)
                return

            lead_id = str(uuid.uuid4())
            conn = get_db()
            c = conn.cursor()
            c.execute("""
            INSERT INTO form_submissions (id, form_type, name, email, phone, company, service_required, budget, message)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                lead_id,
                body.get("form_type", "Contact"),
                name,
                email,
                body.get("phone", ""),
                body.get("company", ""),
                body.get("service_required", ""),
                body.get("budget", ""),
                body.get("message", "")
            ))
            conn.commit()
            conn.close()
            self.send_json({"status": "success", "message": "Submission received successfully"})
            return

        # AUTH GUARD FOR ALL OTHER POST REQUESTS
        user = self.verify_auth()
        if not user:
            self.send_json({"status": "error", "message": "Unauthorized"}, 401)
            return

        # 3. SAVE HERO & HOMEPAGE
        if path == "/api/cms/homepage":
            hero = body.get("hero", {})
            about = body.get("about", {})
            contact = body.get("contact", {})

            conn = get_db()
            c = conn.cursor()

            if hero:
                c.execute("""
                UPDATE hero_settings SET 
                    headline = ?, subheading = ?, cta_primary_text = ?, cta_primary_link = ?,
                    cta_secondary_text = ?, cta_secondary_link = ?, badge_text = ?, stats_json = ?
                WHERE id = 1
                """, (
                    hero.get("headline"), hero.get("subheading"), hero.get("cta_primary_text"), hero.get("cta_primary_link"),
                    hero.get("cta_secondary_text"), hero.get("cta_secondary_link"), hero.get("badge_text"),
                    json.dumps(hero.get("stats", []))
                ))

            if about:
                c.execute("""
                UPDATE about_settings SET
                    heading = ?, description = ?, mission = ?, vision = ?, values_json = ?
                WHERE id = 1
                """, (
                    about.get("heading"), about.get("description"), about.get("mission"), about.get("vision"),
                    json.dumps(about.get("values", []))
                ))

            if contact:
                c.execute("""
                UPDATE contact_info SET
                    address = ?, phone = ?, email = ?, working_hours = ?, google_maps_url = ?, whatsapp_number = ?
                WHERE id = 1
                """, (
                    contact.get("address"), contact.get("phone"), contact.get("email"), contact.get("working_hours"),
                    contact.get("google_maps_url"), contact.get("whatsapp_number")
                ))

            conn.commit()
            conn.close()
            log_audit(user["email"], "UPDATE_HOMEPAGE", "Updated homepage settings")
            self.send_json({"status": "success", "message": "Homepage updated"})
            return

        # 4. ADD SERVICE
        if path == "/api/cms/services":
            srv_id = str(uuid.uuid4())
            conn = get_db()
            c = conn.cursor()
            c.execute("""
            INSERT INTO services (id, title, icon, image_url, description, display_order)
            VALUES (?, ?, ?, ?, ?, ?)
            """, (srv_id, body.get("title"), body.get("icon", "⚡"), body.get("image_url"), body.get("description"), body.get("display_order", 0)))
            conn.commit()
            conn.close()
            log_audit(user["email"], "ADD_SERVICE", f"Added service: {body.get('title')}")
            self.send_json({"status": "success", "id": srv_id})
            return

        # 5. ADD CLIENT LOGO
        if path == "/api/cms/clients":
            cid = str(uuid.uuid4())
            conn = get_db()
            c = conn.cursor()
            c.execute("""
            INSERT INTO clients (id, name, logo_url, display_order, is_active)
            VALUES (?, ?, ?, ?, ?)
            """, (cid, body.get("name"), body.get("logo_url"), body.get("display_order", 0), 1))
            conn.commit()
            conn.close()
            log_audit(user["email"], "ADD_CLIENT", f"Added client logo: {body.get('name')}")
            self.send_json({"status": "success", "id": cid})
            return

        # 6. ADD TESTIMONIAL
        if path == "/api/cms/testimonials":
            tid = str(uuid.uuid4())
            conn = get_db()
            c = conn.cursor()
            c.execute("""
            INSERT INTO testimonials (id, name, company, designation, review, rating, photo_url, video_url, is_featured)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (tid, body.get("name"), body.get("company"), body.get("designation"), body.get("review"), body.get("rating", 5), body.get("photo_url"), body.get("video_url"), body.get("is_featured", 0)))
            conn.commit()
            conn.close()
            log_audit(user["email"], "ADD_TESTIMONIAL", f"Added testimonial for {body.get('name')}")
            self.send_json({"status": "success", "id": tid})
            return

        # 7. ADD PORTFOLIO PROJECT
        if path == "/api/cms/portfolio":
            pid = str(uuid.uuid4())
            slug = body.get("slug") or body.get("title", "").lower().replace(" ", "-")
            conn = get_db()
            c = conn.cursor()
            c.execute("""
            INSERT INTO portfolio_projects (id, title, slug, category, client_name, industry, description, technologies, gallery_json, before_after_json, video_url, meta_title, meta_desc, is_featured)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                pid, body.get("title"), slug, body.get("category"), body.get("client_name"), body.get("industry"),
                body.get("description"), body.get("technologies"), json.dumps(body.get("gallery", [])),
                json.dumps(body.get("before_after", {})), body.get("video_url"), body.get("meta_title"), body.get("meta_desc"), body.get("is_featured", 0)
            ))
            conn.commit()
            conn.close()
            log_audit(user["email"], "ADD_PORTFOLIO", f"Created portfolio project: {body.get('title')}")
            self.send_json({"status": "success", "id": pid})
            return

        # 8. ADD BLOG POST
        if path == "/api/cms/blog":
            bid = str(uuid.uuid4())
            slug = body.get("slug") or body.get("title", "").lower().replace(" ", "-")
            conn = get_db()
            c = conn.cursor()
            c.execute("""
            INSERT INTO blog_posts (id, title, slug, content_html, featured_image, category, tags, status, publish_date, meta_title, meta_desc)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                bid, body.get("title"), slug, body.get("content_html"), body.get("featured_image"), body.get("category"),
                body.get("tags"), body.get("status", "Published"), body.get("publish_date"), body.get("meta_title"), body.get("meta_desc")
            ))
            conn.commit()
            conn.close()
            log_audit(user["email"], "ADD_BLOG", f"Created blog post: {body.get('title')}")
            self.send_json({"status": "success", "id": bid})
            return

        # 9. SAVE SEO SETTINGS
        if path == "/api/cms/seo":
            conn = get_db()
            c = conn.cursor()
            c.execute("""
            UPDATE seo_settings SET
                meta_title = ?, meta_desc = ?, keywords = ?, og_image = ?,
                ga_id = ?, gtm_id = ?, meta_pixel_id = ?, robots_txt = ?, sitemap_xml = ?
            WHERE id = 1
            """, (
                body.get("meta_title"), body.get("meta_desc"), body.get("keywords"), body.get("og_image"),
                body.get("ga_id"), body.get("gtm_id"), body.get("meta_pixel_id"), body.get("robots_txt"), body.get("sitemap_xml")
            ))
            conn.commit()
            conn.close()
            log_audit(user["email"], "UPDATE_SEO", "Updated global SEO settings")
            self.send_json({"status": "success", "message": "SEO settings saved"})
            return

        # 10. SAVE FOOTER SETTINGS (/api/cms/footer)
        if path == "/api/cms/footer":
            conn = get_db()
            c = conn.cursor()
            c.execute("""
            UPDATE footer_settings SET
                cta_badge = ?, cta_title = ?, cta_subtitle = ?,
                cta_primary_btn_text = ?, cta_primary_btn_link = ?,
                cta_secondary_btn_text = ?, cta_secondary_btn_link = ?,
                brand_description = ?, status_pill_text = ?,
                facebook_url = ?, instagram_url = ?, linkedin_url = ?, twitter_url = ?, youtube_url = ?,
                work_email = ?, phone_number = ?, office_address = ?, working_hours = ?, copyright_text = ?
            WHERE id = 1
            """, (
                body.get("cta_badge", ""), body.get("cta_title", ""), body.get("cta_subtitle", ""),
                body.get("cta_primary_btn_text", ""), body.get("cta_primary_btn_link", ""),
                body.get("cta_secondary_btn_text", ""), body.get("cta_secondary_btn_link", ""),
                body.get("brand_description", ""), body.get("status_pill_text", ""),
                body.get("facebook_url", ""), body.get("instagram_url", ""), body.get("linkedin_url", ""), body.get("twitter_url", ""), body.get("youtube_url", ""),
                body.get("work_email", ""), body.get("phone_number", ""), body.get("office_address", ""), body.get("working_hours", ""), body.get("copyright_text", "")
            ))
            conn.commit()
            conn.close()
            log_audit(user["email"], "UPDATE_FOOTER", "Updated Footer Settings & Pre-Footer Banner")
            self.send_json({"status": "success", "message": "Footer settings updated successfully!"})
            return

        # 10. CHANGE PASSWORD
        if path == "/api/auth/change-password":
            old_pass = body.get("old_password")
            new_pass = body.get("new_password")
            if hash_password(old_pass) == user["password_hash"]:
                conn = get_db()
                c = conn.cursor()
                c.execute("UPDATE users SET password_hash = ? WHERE id = ?", (hash_password(new_pass), user["id"]))
                conn.commit()
                conn.close()
                log_audit(user["email"], "CHANGE_PASSWORD", "Password updated successfully")
                self.send_json({"status": "success", "message": "Password changed successfully"})
            else:
                self.send_json({"status": "error", "message": "Incorrect current password"}, 400)
            return

        self.send_json({"status": "error", "message": "Action not supported"}, 400)

    def do_DELETE(self):
        user = self.verify_auth()
        if not user:
            self.send_json({"status": "error", "message": "Unauthorized"}, 401)
            return

        parsed = urlparse(self.path)
        parts = [p for p in parsed.path.split("/") if p]
        
        if len(parts) >= 3 and parts[0] == "api" and parts[1] == "cms":
            table = parts[2]
            item_id = parts[3] if len(parts) > 3 else None
            
            valid_tables = {
                "services": "services",
                "clients": "clients",
                "testimonials": "testimonials",
                "faqs": "faqs",
                "portfolio": "portfolio_projects",
                "blog": "blog_posts",
                "enquiries": "form_submissions",
                "media": "media_files"
            }

            if table in valid_tables and item_id:
                t_name = valid_tables[table]
                conn = get_db()
                c = conn.cursor()
                c.execute(f"DELETE FROM {t_name} WHERE id = ?", (item_id,))
                conn.commit()
                conn.close()
                log_audit(user["email"], f"DELETE_{table.upper()}", f"Deleted item ID {item_id}")
                self.send_json({"status": "success", "message": "Item deleted"})
                return

        self.send_json({"status": "error", "message": "Resource not found"}, 404)


def run_server(port=5001):
    init_db()
    server_address = ("", port)
    httpd = HTTPServer(server_address, CMSRequestHandler)
    print(f"🚀 IDMR CMS API Server running at http://127.0.0.1:{port}")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nStopping server...")
        httpd.server_close()

if __name__ == "__main__":
    port = 5001
    if len(sys.argv) > 1:
        try: port = int(sys.argv[1])
        except: pass
    run_server(port)
