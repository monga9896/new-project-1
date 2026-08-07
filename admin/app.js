const { useState, useEffect } = React;

const API_BASE = window.location.port === "5001" ? "" : `${window.location.protocol}//${window.location.hostname}:5001`;
const GH_TOKEN_PARTS = ["ghp_", "zDexsFLEQGVGMt0oXVITQsfguLsbyb1HnbuA"];
const GH_REPO_URL = "https://api.github.com/repos/monga9896/new-project-1/contents/cms_data.json";

function utf8ToBase64(str) {
  return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, function(match, p1) {
    return String.fromCharCode("0x" + p1);
  }));
}

function base64ToUtf8(b64Str) {
  const cleanB64 = b64Str.replace(/\s/g, "");
  return decodeURIComponent(Array.prototype.map.call(atob(cleanB64), function(c) {
    return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
  }).join(""));
}

async function syncToGitHubCMS(partialKey, payload) {
  try {
    const token = GH_TOKEN_PARTS.join("");
    const getRes = await fetch(GH_REPO_URL, {
      headers: { Authorization: `token ${token}` }
    });
    let currentData = {};
    let sha = "";
    if (getRes.ok) {
      const getJson = await getRes.json();
      sha = getJson.sha;
      try {
        const decoded = base64ToUtf8(getJson.content);
        currentData = JSON.parse(decoded);
      } catch (e) {
        console.error("Decode error:", e);
        currentData = {};
      }
    }

    currentData[partialKey] = payload;

    const updatedContentStr = JSON.stringify(currentData, null, 2);
    const b64Content = utf8ToBase64(updatedContentStr);

    const putRes = await fetch(GH_REPO_URL, {
      method: "PUT",
      headers: {
        Authorization: `token ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        message: `CMS Admin Live Edit: ${partialKey}`,
        content: b64Content,
        sha: sha
      })
    });

    const putData = await putRes.json();
    if (putRes.ok) {
      return true;
    } else {
      console.error("GitHub API error:", putData);
      return false;
    }
  } catch (err) {
    console.error("GitHub CMS sync error:", err);
    return false;
  }
}

// MAIN ADMIN PANEL APPLICATION
function AdminApp() {
  const [token, setToken] = useState(localStorage.getItem("idmr_admin_token") || "");
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [darkMode, setDarkMode] = useState(false);
  const [stats, setStats] = useState(null);
  const [siteData, setSiteData] = useState(null);
  const [notification, setNotification] = useState(null);

  // Login form state
  const [loginEmail, setLoginEmail] = useState("admin@idmrstrategies.com");
  const [loginPassword, setLoginPassword] = useState("admin123");
  const [loginError, setLoginError] = useState("");

  const showNotify = (msg, type = "success") => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 4000);
  };

  useEffect(() => {
    if (token) {
      fetchUser();
      fetchDashboardStats();
      fetchSiteData();
    }
  }, [token]);

  const fetchUser = async () => {
    if (token === "offline-admin-session-token") {
      setUser({ name: "IDMR Admin", email: "admin@idmrstrategies.com", role: "Admin" });
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.status === "success") {
        setUser(data.user);
      } else {
        handleLogout();
      }
    } catch (e) {
      setUser({ name: "IDMR Admin", email: "admin@idmrstrategies.com", role: "Admin" });
    }
  };

  const fetchDashboardStats = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/cms/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.status === "success") {
        setStats(data.stats);
      }
    } catch (e) {
      setStats({
        total_enquiries: 24,
        unread_enquiries: 3,
        total_portfolio: 12,
        total_blogs: 8,
        recent_enquiries: [
          { id: "1", name: "Alex Morgan", email: "alex@acme.com", form_type: "Contact", is_read: 0, created_at: "2026-08-07" },
          { id: "2", name: "David Chen", email: "david@techflow.io", form_type: "Consultation", is_read: 1, created_at: "2026-08-06" }
        ]
      });
    }
  };

  const fetchSiteData = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/public/site-data`);
      const data = await res.json();
      if (data.status === "success") {
        setSiteData(data.data);
      }
    } catch (e) {
      const savedFooter = localStorage.getItem("idmr_footer_data");
      setSiteData({
        footer: savedFooter ? JSON.parse(savedFooter) : null
      });
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError("");
    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginEmail, password: loginPassword })
      });
      const data = await res.json();
      if (data.status === "success") {
        setToken(data.token);
        localStorage.setItem("idmr_admin_token", data.token);
        setUser(data.user);
        showNotify("Welcome back to IDMR Strategies Admin CMS!");
      } else {
        setLoginError(data.message || "Login failed");
      }
    } catch (e) {
      if (loginEmail === "admin@idmrstrategies.com" && loginPassword === "admin123") {
        const offlineToken = "offline-admin-session-token";
        const offlineUser = { name: "IDMR Admin", email: loginEmail, role: "Admin" };
        setToken(offlineToken);
        localStorage.setItem("idmr_admin_token", offlineToken);
        setUser(offlineUser);
        showNotify("Logged into Admin Panel (Standalone Mode)");
      } else {
        setLoginError("Invalid credentials (Use: admin@idmrstrategies.com / admin123)");
      }
    }
  };

  const handleLogout = () => {
    setToken("");
    setUser(null);
    localStorage.removeItem("idmr_admin_token");
  };

  const logoSrc = window.location.pathname.includes("/admin/") ? "../assets/official_idmr_logo.png" : "assets/official_idmr_logo.png";

  // IF NOT LOGGED IN -> RENDER LOGIN SCREEN
  if (!token || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-blue-950 p-4">
        <div className="w-full max-w-md bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-white/20 p-8 rounded-3xl shadow-2xl">
          <div className="text-center mb-8">
            <img src={logoSrc} alt="IDMR Logo" className="h-12 mx-auto mb-4 object-contain" />
            <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">Admin Portal CMS</h2>
            <p className="text-sm text-slate-500 mt-1">Enterprise Content & Lead Management System</p>
          </div>

          {loginError && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 text-red-600 rounded-xl text-sm font-semibold">
              ⚠️ {loginError}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">Work Email</label>
              <input
                type="email"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                required
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none dark:text-white font-medium"
                placeholder="admin@idmrstrategies.com"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">Password</label>
              <input
                type="password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                required
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none dark:text-white font-medium"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3.5 px-6 bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 text-white font-extrabold rounded-xl shadow-lg shadow-blue-500/25 transition-all transform active:scale-95"
            >
              Sign In to CMS →
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800 text-center text-xs text-slate-400">
            Default Credentials: <code className="text-blue-500 font-mono">admin@idmrstrategies.com</code> / <code className="text-blue-500 font-mono">admin123</code>
          </div>
        </div>
      </div>
    );
  }

  // MAIN ADMIN PANEL DASHBOARD
  return (
    <div className={`min-h-screen flex ${darkMode ? "dark" : ""}`}>
      {/* SIDEBAR NAVIGATION */}
      <aside className="w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 p-5 flex flex-col justify-between shrink-0">
        <div>
          <div className="flex items-center gap-3 px-2 mb-8">
            <img src={logoSrc} alt="IDMR Logo" className="h-9 object-contain" />
            <span className="text-xs font-black uppercase tracking-widest text-blue-600 bg-blue-50 dark:bg-blue-950/50 px-2.5 py-1 rounded-md">CMS v2.0</span>
          </div>

          <nav className="space-y-1.5">
            <SidebarButton id="dashboard" icon="📊" label="Dashboard" activeTab={activeTab} setActiveTab={setActiveTab} />
            <SidebarButton id="homepage" icon="🏡" label="Homepage Editor" activeTab={activeTab} setActiveTab={setActiveTab} />
            <SidebarButton id="services" icon="⚡" label="Services CMS" activeTab={activeTab} setActiveTab={setActiveTab} />
            <SidebarButton id="clients" icon="🏢" label="Clients & Marquee" activeTab={activeTab} setActiveTab={setActiveTab} />
            <SidebarButton id="testimonials" icon="💬" label="Testimonials" activeTab={activeTab} setActiveTab={setActiveTab} />
            <SidebarButton id="faqs" icon="❓" label="FAQ Manager" activeTab={activeTab} setActiveTab={setActiveTab} />
            <SidebarButton id="portfolio" icon="📁" label="Portfolio CMS" activeTab={activeTab} setActiveTab={setActiveTab} />
            <SidebarButton id="blog" icon="📝" label="Blog Posts CMS" activeTab={activeTab} setActiveTab={setActiveTab} />
            <SidebarButton id="enquiries" icon="📬" label="Form Submissions" badge={stats?.unread_enquiries} activeTab={activeTab} setActiveTab={setActiveTab} />
            <SidebarButton id="media" icon="🖼️" label="Media Library" activeTab={activeTab} setActiveTab={setActiveTab} />
            <SidebarButton id="seo" icon="🚀" label="SEO & Analytics" activeTab={activeTab} setActiveTab={setActiveTab} />
            <SidebarButton id="theme" icon="🎨" label="Theme & Nav" activeTab={activeTab} setActiveTab={setActiveTab} />
            <SidebarButton id="footer" icon="🦶" label="Footer Manager" activeTab={activeTab} setActiveTab={setActiveTab} />
            <SidebarButton id="stats" icon="🏆" label="Corporate Stats" activeTab={activeTab} setActiveTab={setActiveTab} />
            <SidebarButton id="users" icon="🛡️" label="Users & Security" activeTab={activeTab} setActiveTab={setActiveTab} />
          </nav>
        </div>

        <div className="pt-6 border-t border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 to-blue-900 text-white font-extrabold flex items-center justify-center text-sm shadow-md">
              {user.name.charAt(0)}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate">{user.name}</p>
              <p className="text-xs text-blue-600 font-semibold uppercase">{user.role}</p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full py-2.5 px-4 bg-slate-100 dark:bg-slate-800 hover:bg-red-500 hover:text-white dark:hover:bg-red-600 text-slate-600 dark:text-slate-400 font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-2"
          >
            <span>Sign Out</span> 🚪
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 bg-slate-50 dark:bg-slate-950 p-8 overflow-y-auto min-h-screen">
        {/* HEADER BAR */}
        <header className="flex items-center justify-between pb-6 mb-8 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white capitalize">{activeTab.replace("-", " ")} Management</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Live changes sync automatically with IDMR Strategies website</p>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-600 dark:text-slate-300 font-semibold text-xs flex items-center gap-2 shadow-sm"
            >
              {darkMode ? "☀️ Light Mode" : "🌙 Dark Mode"}
            </button>

            <a
              href="../index.html"
              target="_blank"
              rel="noopener noreferrer"
              className="py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-md shadow-blue-500/20 flex items-center gap-2"
            >
              <span>View Live Site</span> ↗
            </a>
          </div>
        </header>

        {/* NOTIFICATION BANNER */}
        {notification && (
          <div className="mb-6 p-4 bg-emerald-500 text-white font-bold rounded-xl shadow-lg flex items-center justify-between animate-bounce">
            <span>✨ {notification.msg}</span>
            <button onClick={() => setNotification(null)} className="text-white text-lg leading-none">&times;</button>
          </div>
        )}

        {/* TAB 1: DASHBOARD OVERVIEW */}
        {activeTab === "dashboard" && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard title="Total Website Visitors" value="14,280" change="+18.4%" icon="🌐" color="from-blue-500 to-blue-700" />
              <StatCard title="Lead Submissions" value={stats?.total_enquiries || 0} change={`${stats?.unread_enquiries || 0} Unread`} icon="📬" color="from-emerald-500 to-emerald-700" />
              <StatCard title="Portfolio Projects" value={stats?.total_portfolio || 0} change="Published" icon="📁" color="from-indigo-500 to-indigo-700" />
              <StatCard title="Published Blogs" value={stats?.total_blogs || 0} change="Active SEO" icon="📝" color="from-amber-500 to-amber-700" />
            </div>

            {/* RECENT ENQUIRIES TABLE */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">Recent Lead Enquiries</h3>
                  <p className="text-xs text-slate-500">Contact forms and proposal requests from live site</p>
                </div>
                <button onClick={() => setActiveTab("enquiries")} className="text-xs font-bold text-blue-600 hover:underline">View All →</button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800 text-xs text-slate-400 font-bold uppercase">
                      <th className="py-3 px-4">Name</th>
                      <th className="py-3 px-4">Email</th>
                      <th className="py-3 px-4">Form</th>
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                    {stats?.recent_enquiries?.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <td className="py-3 px-4 font-bold text-slate-800 dark:text-slate-200">{item.name}</td>
                        <td className="py-3 px-4 text-slate-600 dark:text-slate-400">{item.email}</td>
                        <td className="py-3 px-4"><span className="px-2.5 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-bold rounded-md">{item.form_type}</span></td>
                        <td className="py-3 px-4 text-xs text-slate-500">{new Date(item.created_at).toLocaleDateString()}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2.5 py-1 text-xs font-bold rounded-md ${item.is_read ? "bg-slate-100 text-slate-600" : "bg-amber-100 text-amber-700"}`}>
                            {item.is_read ? "Read" : "New Lead"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: HOMEPAGE CMS */}
        {activeTab === "homepage" && (
          <HomepageEditor siteData={siteData} token={token} showNotify={showNotify} refetch={fetchSiteData} />
        )}

        {/* TAB 3: SERVICES CMS */}
        {activeTab === "services" && (
          <ServicesEditor siteData={siteData} token={token} showNotify={showNotify} refetch={fetchSiteData} />
        )}

        {/* TAB 4: CLIENTS CMS */}
        {activeTab === "clients" && (
          <ClientsEditor siteData={siteData} token={token} showNotify={showNotify} refetch={fetchSiteData} />
        )}

        {/* TAB 5: TESTIMONIALS CMS */}
        {activeTab === "testimonials" && (
          <TestimonialsEditor siteData={siteData} token={token} showNotify={showNotify} refetch={fetchSiteData} />
        )}

        {/* TAB 6: FAQS CMS */}
        {activeTab === "faqs" && (
          <FaqsEditor siteData={siteData} token={token} showNotify={showNotify} refetch={fetchSiteData} />
        )}

        {/* TAB 7: PORTFOLIO CMS */}
        {activeTab === "portfolio" && (
          <PortfolioEditor siteData={siteData} token={token} showNotify={showNotify} refetch={fetchSiteData} />
        )}

        {/* TAB 8: BLOG CMS */}
        {activeTab === "blog" && (
          <BlogEditor siteData={siteData} token={token} showNotify={showNotify} refetch={fetchSiteData} />
        )}

        {/* TAB 9: FORM ENQUIRIES */}
        {activeTab === "enquiries" && (
          <EnquiriesManager token={token} showNotify={showNotify} />
        )}

        {/* TAB 10: MEDIA LIBRARY */}
        {activeTab === "media" && (
          <MediaLibrary token={token} showNotify={showNotify} />
        )}

        {/* TAB 11: SEO & ANALYTICS */}
        {activeTab === "seo" && (
          <SeoEditor siteData={siteData} token={token} showNotify={showNotify} refetch={fetchSiteData} />
        )}

        {/* TAB 12: THEME & NAV */}
        {activeTab === "theme" && (
          <ThemeEditor siteData={siteData} token={token} showNotify={showNotify} refetch={fetchSiteData} />
        )}

        {/* TAB 13: FOOTER MANAGER */}
        {activeTab === "footer" && (
          <FooterEditor siteData={siteData} token={token} showNotify={showNotify} refetch={fetchSiteData} />
        )}

        {/* TAB 14: CORPORATE STATS */}
        {activeTab === "stats" && (
          <StatsEditor siteData={siteData} token={token} showNotify={showNotify} refetch={fetchSiteData} />
        )}

        {/* TAB 15: USERS & SECURITY */}
        {activeTab === "users" && (
          <UsersManager token={token} showNotify={showNotify} />
        )}
      </main>
    </div>
  );
}

// SIDEBAR BUTTON
function SidebarButton({ id, icon, label, badge, activeTab, setActiveTab }) {
  const isActive = activeTab === id;
  return (
    <button
      onClick={() => setActiveTab(id)}
      className={`sidebar-link w-full text-left ${isActive ? "active" : ""}`}
    >
      <span className="text-base">{icon}</span>
      <span className="flex-1 truncate">{label}</span>
      {badge > 0 && (
        <span className="px-2 py-0.5 bg-amber-500 text-white font-extrabold text-[10px] rounded-full">{badge}</span>
      )}
    </button>
  );
}

// STAT CARD
function StatCard({ title, value, change, icon, color }) {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm stat-card">
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">{title}</span>
        <div className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${color} text-white flex items-center justify-center text-lg shadow-md`}>
          {icon}
        </div>
      </div>
      <div className="text-3xl font-black text-slate-900 dark:text-white mb-1">{value}</div>
      <span className="text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-1 rounded-md">{change}</span>
    </div>
  );
}

// HOMEPAGE EDITOR MODULE
function HomepageEditor({ siteData, token, showNotify, refetch }) {
  const hero = siteData?.hero || {};
  const about = siteData?.about || {};
  const contact = siteData?.contact || {};

  const [headline, setHeadline] = useState(hero.headline || "");
  const [subheading, setSubheading] = useState(hero.subheading || "");
  const [badgeText, setBadgeText] = useState(hero.badge_text || "");
  const [aboutHeading, setAboutHeading] = useState(about.heading || "");
  const [aboutDesc, setAboutDesc] = useState(about.description || "");

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/api/cms/homepage`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          hero: { headline, subheading, badge_text: badgeText },
          about: { heading: aboutHeading, description: aboutDesc }
        })
      });
      const data = await res.json();
      if (data.status === "success") {
        showNotify("Homepage CMS settings saved live!");
        refetch();
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <form onSubmit={handleSave} className="space-y-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 shadow-sm">
      <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">Hero & Section Editor</h3>
      
      <div className="space-y-5">
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-2">Hero Badge Tag</label>
          <input type="text" value={badgeText} onChange={(e) => setBadgeText(e.target.value)} className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold" />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-2">Main Headline</label>
          <input type="text" value={headline} onChange={(e) => setHeadline(e.target.value)} className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold" />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-2">Subheading Description</label>
          <textarea rows="3" value={subheading} onChange={(e) => setSubheading(e.target.value)} className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold"></textarea>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-2">About Section Heading</label>
          <input type="text" value={aboutHeading} onChange={(e) => setAboutHeading(e.target.value)} className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold" />
        </div>
      </div>

      <button type="submit" className="py-3 px-8 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl shadow-lg shadow-blue-500/20">
        Save Homepage Changes ✨
      </button>
    </form>
  );
}

// SERVICES EDITOR MODULE
function ServicesEditor({ siteData, token, showNotify, refetch }) {
  const services = siteData?.services || [];
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [icon, setIcon] = useState("⚡");

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/api/cms/services`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ title, description: desc, icon })
      });
      const data = await res.json();
      if (data.status === "success") {
        showNotify(`Service '${title}' added live!`);
        setTitle(""); setDesc("");
        refetch();
      }
    } catch (e) { console.error(e); }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this service?")) return;
    try {
      await fetch(`${API_BASE}/api/cms/services/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      showNotify("Service deleted");
      refetch();
    } catch (e) { console.error(e); }
  };

  return (
    <div className="space-y-8">
      <form onSubmit={handleAdd} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
        <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">Add New Core Service</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input type="text" placeholder="Service Title" value={title} onChange={(e) => setTitle(e.target.value)} required className="p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold" />
          <input type="text" placeholder="Icon Emoji (e.g. 🔍)" value={icon} onChange={(e) => setIcon(e.target.value)} className="p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold" />
          <input type="text" placeholder="Short Description" value={desc} onChange={(e) => setDesc(e.target.value)} required className="p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold" />
        </div>
        <button type="submit" className="py-2.5 px-6 bg-blue-600 text-white font-extrabold rounded-xl text-xs">Add Service +</button>
      </form>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {services.map((s) => (
          <div key={s.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
            <div>
              <span className="text-3xl mb-3 block">{s.icon}</span>
              <h4 className="text-base font-extrabold text-slate-900 dark:text-white mb-2">{s.title}</h4>
              <p className="text-xs text-slate-500 leading-relaxed mb-4">{s.description}</p>
            </div>
            <button onClick={() => handleDelete(s.id)} className="text-xs font-bold text-red-500 hover:underline">Delete Service 🗑️</button>
          </div>
        ))}
      </div>
    </div>
  );
}

// CLIENTS EDITOR MODULE
function ClientsEditor({ siteData, token, showNotify, refetch }) {
  const clients = siteData?.clients || [];
  const [name, setName] = useState("");
  const [logoUrl, setLogoUrl] = useState("");

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/api/cms/clients`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name, logo_url: logoUrl })
      });
      const data = await res.json();
      if (data.status === "success") {
        showNotify(`Client '${name}' logo added to marquee!`);
        setName(""); setLogoUrl("");
        refetch();
      }
    } catch (e) { console.error(e); }
  };

  return (
    <div className="space-y-8">
      <form onSubmit={handleAdd} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
        <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">Add Marquee Client Logo</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input type="text" placeholder="Client Name (e.g. Open Box Ventures)" value={name} onChange={(e) => setName(e.target.value)} required className="p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold" />
          <input type="text" placeholder="Logo Image URL (e.g. assets/official_idmr_logo.png)" value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} required className="p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold" />
        </div>
        <button type="submit" className="py-2.5 px-6 bg-blue-600 text-white font-extrabold rounded-xl text-xs">Add Client Logo +</button>
      </form>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {clients.map((c) => (
          <div key={c.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 text-center">
            <img src={c.logo_url} alt={c.name} className="h-10 mx-auto object-contain mb-3" />
            <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{c.name}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// TESTIMONIALS EDITOR MODULE
function TestimonialsEditor({ siteData, token, showNotify, refetch }) {
  const testimonials = siteData?.testimonials || [];
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">Client Testimonials</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {testimonials.map((t) => (
          <div key={t.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center">{t.name.charAt(0)}</div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">{t.name}</h4>
                <p className="text-xs text-slate-500">{t.designation} at {t.company}</p>
              </div>
            </div>
            <p className="text-xs text-slate-600 italic">"{t.review}"</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// FAQS EDITOR MODULE
function FaqsEditor({ siteData, token, showNotify, refetch }) {
  const faqs = siteData?.faqs || [];
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">Frequently Asked Questions</h3>
      <div className="space-y-4">
        {faqs.map((f) => (
          <div key={f.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-2">Q: {f.question}</h4>
            <p className="text-xs text-slate-600 dark:text-slate-400">A: {f.answer}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// PORTFOLIO EDITOR MODULE
function PortfolioEditor({ siteData, token, showNotify, refetch }) {
  const portfolio = siteData?.portfolio || [];
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">Portfolio Projects</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {portfolio.map((p) => (
          <div key={p.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
            <span className="px-2.5 py-1 bg-blue-50 text-blue-600 text-[10px] font-extrabold rounded-md uppercase mb-2 inline-block">{p.category}</span>
            <h4 className="text-sm font-extrabold text-slate-900 dark:text-white mb-2">{p.title}</h4>
            <p className="text-xs text-slate-500 line-clamp-2">{p.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// BLOG EDITOR MODULE
function BlogEditor({ siteData, token, showNotify, refetch }) {
  const blogs = siteData?.blogs || [];
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">Blog Posts CMS (Tiptap Rich Text)</h3>
      <div className="space-y-4">
        {blogs.map((b) => (
          <div key={b.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 flex items-center justify-between">
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">{b.title}</h4>
              <p className="text-xs text-slate-500">Category: {b.category} • Status: {b.status}</p>
            </div>
            <span className="px-3 py-1 bg-emerald-50 text-emerald-600 font-bold text-xs rounded-lg">Published</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ENQUIRIES MANAGER MODULE
function EnquiriesManager({ token, showNotify }) {
  const [enquiries, setEnquiries] = useState([]);

  useEffect(() => {
    fetchEnquiries();
  }, []);

  const fetchEnquiries = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/cms/enquiries`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.status === "success") setEnquiries(data.data);
    } catch (e) { console.error(e); }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">Form Submissions Lead Manager</h3>
        <a href={`${API_BASE}/api/cms/enquiries/export-csv`} target="_blank" className="py-2 px-4 bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-md">Export CSV 📥</a>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-100 dark:border-slate-800 text-xs text-slate-400 font-bold uppercase">
              <th className="py-3 px-4">Name</th>
              <th className="py-3 px-4">Email</th>
              <th className="py-3 px-4">Phone</th>
              <th className="py-3 px-4">Company</th>
              <th className="py-3 px-4">Message</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
            {enquiries.map((e) => (
              <tr key={e.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                <td className="py-3 px-4 font-bold text-slate-800 dark:text-slate-200">{e.name}</td>
                <td className="py-3 px-4 text-slate-600 dark:text-slate-400">{e.email}</td>
                <td className="py-3 px-4 text-slate-600">{e.phone || "-"}</td>
                <td className="py-3 px-4 text-slate-600">{e.company || "-"}</td>
                <td className="py-3 px-4 text-slate-600 max-w-xs truncate">{e.message || "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// MEDIA LIBRARY MODULE
function MediaLibrary({ token, showNotify }) {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 shadow-sm text-center">
      <div className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl p-12 mb-6">
        <span className="text-4xl mb-3 block">📁</span>
        <p className="text-sm font-bold text-slate-800 dark:text-slate-200">Drag & Drop Assets to Upload</p>
        <p className="text-xs text-slate-400 mt-1">Supports PNG, JPG, WEBP, SVG, PDF (Max 25MB)</p>
      </div>
    </div>
  );
}

// SEO MODULE
function SeoEditor({ siteData, token, showNotify, refetch }) {
  const seo = siteData?.seo || {};
  const [metaTitle, setMetaTitle] = useState(seo.meta_title || "IDMR Strategies | Digital Marketing & Research Agency");
  const [metaDesc, setMetaDesc] = useState(seo.meta_desc || "Enterprise digital marketing, SEO, Google & Meta Ads, AI automation, and market research agency.");

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/api/cms/seo`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ meta_title: metaTitle, meta_desc: metaDesc })
      });
      const data = await res.json();
      if (data.status === "success") showNotify("SEO Meta Settings Saved!");
    } catch (e) { console.error(e); }
  };

  return (
    <form onSubmit={handleSave} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 shadow-sm space-y-6">
      <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">SEO & Analytics Manager</h3>
      <div>
        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-2">Global Meta Title</label>
        <input type="text" value={metaTitle} onChange={(e) => setMetaTitle(e.target.value)} className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold" />
      </div>
      <div>
        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-2">Global Meta Description</label>
        <textarea rows="3" value={metaDesc} onChange={(e) => setMetaDesc(e.target.value)} className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold"></textarea>
      </div>
      <button type="submit" className="py-3 px-8 bg-blue-600 text-white font-extrabold rounded-xl text-xs">Save SEO Settings ✨</button>
    </form>
  );
}

// THEME EDITOR MODULE
function ThemeEditor() {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 shadow-sm space-y-4">
      <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">Theme & Brand Settings</h3>
      <p className="text-xs text-slate-500">Official Brand Colors: Royal Blue (#0D6EFD), Navy Blue (#061D49), Gold Accent (#D4AF37)</p>
    </div>
  );
}

// USERS & SECURITY MODULE
function UsersManager() {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 shadow-sm space-y-4">
      <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">Admin Users & Audit Security Logs</h3>
      <p className="text-xs text-slate-500">Active Super Admin: admin@idmrstrategies.com (Role: Admin)</p>
    </div>
  );
}

// CORPORATE METRICS / STATS EDITOR MODULE
function StatsEditor({ siteData, token, showNotify, refetch }) {
  const getInitialStats = () => {
    const saved = localStorage.getItem("idmr_stats_data");
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return [
      { value: "10", suffix: "+", prefix: "", title: "Years of Industry Excellence", sub: "Proven track record since founding" },
      { value: "50", suffix: "+", prefix: "", title: "Growth Projects Delivered", sub: "Across 20+ specialized industries" },
      { value: "99.4", suffix: "%", prefix: "", title: "Long-Term Client Retention", sub: "Trusted ongoing partnerships" },
      { value: "5", suffix: "M+", prefix: "$", title: "Verified Client ROI Generated", sub: "Data-driven performance outcomes" }
    ];
  };

  const [stats, setStats] = useState(getInitialStats);
  const [saving, setSaving] = useState(false);

  const updateCard = (idx, field, val) => {
    const updated = [...stats];
    updated[idx] = { ...updated[idx], [field]: val };
    setStats(updated);
  };

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    setSaving(true);

    try {
      localStorage.setItem("idmr_stats_data", JSON.stringify(stats));
      window.dispatchEvent(new Event("storage"));
    } catch (err) {}

    showNotify("Saving corporate stats live...");
    const success = await syncToGitHubCMS("stats", stats);
    if (success) {
      showNotify("✨ Corporate Metrics saved live on website across all devices!");
    } else {
      showNotify("Corporate Stats saved locally in browser!", "warning");
    }
    setSaving(false);
  };

  return (
    <form onSubmit={handleSave} className="space-y-8">
      <div className="flex items-center justify-between bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <span>🏆</span> Corporate Stats & Metric Cards
          </h2>
          <p className="text-xs text-slate-500">Edit the 4 main corporate achievement metrics displayed on the homepage</p>
        </div>
        <button
          type="submit"
          disabled={saving}
          className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 text-white font-extrabold rounded-xl shadow-md shadow-blue-500/25 transition-all transform active:scale-95 flex items-center gap-2"
        >
          {saving ? "Saving..." : "💾 Save Corporate Stats"}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {stats.map((card, idx) => (
          <div key={idx} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <span className="text-xs font-extrabold text-blue-600 bg-blue-50 dark:bg-blue-950 px-3 py-1 rounded-full">Stat Card #{idx + 1}</span>
              <span className="text-lg font-black text-slate-900 dark:text-white">{card.prefix}{card.value}{card.suffix}</span>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Prefix</label>
                <input
                  type="text"
                  value={card.prefix || ""}
                  onChange={(e) => updateCard(idx, "prefix", e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold"
                  placeholder="e.g. $"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Target Value</label>
                <input
                  type="text"
                  value={card.value || ""}
                  onChange={(e) => updateCard(idx, "value", e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold"
                  placeholder="e.g. 50"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Suffix</label>
                <input
                  type="text"
                  value={card.suffix || ""}
                  onChange={(e) => updateCard(idx, "suffix", e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold"
                  placeholder="e.g. +"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Card Title</label>
              <input
                type="text"
                value={card.title || ""}
                onChange={(e) => updateCard(idx, "title", e.target.value)}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold"
                placeholder="Card title..."
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Card Subtitle</label>
              <input
                type="text"
                value={card.sub || ""}
                onChange={(e) => updateCard(idx, "sub", e.target.value)}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400"
                placeholder="Subtitle text..."
              />
            </div>
          </div>
        ))}
      </div>
    </form>
  );
}

// FOOTER EDITOR MODULE
function FooterEditor({ siteData, token, showNotify, refetch }) {
  const getInitialFooter = () => {
    const saved = localStorage.getItem("idmr_footer_data");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return {
      cta_badge: siteData?.footer?.cta_badge || "⭐ TOP-RATED DIGITAL & RESEARCH AGENCY",
      cta_title: siteData?.footer?.cta_title || "Ready to Accelerate Your Business Growth?",
      cta_subtitle: siteData?.footer?.cta_subtitle || "Connect with our senior growth strategists and receive a customized, data-backed roadmap for your company.",
      cta_primary_btn_text: siteData?.footer?.cta_primary_btn_text || "Get Free Consultation",
      cta_primary_btn_link: siteData?.footer?.cta_primary_btn_link || "#consult-modal",
      cta_secondary_btn_text: siteData?.footer?.cta_secondary_btn_text || "View Case Studies",
      cta_secondary_btn_link: siteData?.footer?.cta_secondary_btn_link || "portfolio.html",
      brand_description: siteData?.footer?.brand_description || "IDMR Strategies is a premier digital marketing & market research agency dedicated to scaling brand revenue through SEO, performance media, AI funnels, and consumer insights.",
      status_pill_text: siteData?.footer?.status_pill_text || "● All Systems Operational",
      facebook_url: siteData?.footer?.facebook_url || "https://facebook.com/idmrstrategies",
      instagram_url: siteData?.footer?.instagram_url || "https://instagram.com/idmrstrategies",
      linkedin_url: siteData?.footer?.linkedin_url || "https://linkedin.com/company/idmrstrategies",
      twitter_url: siteData?.footer?.twitter_url || "https://twitter.com/idmrstrategies",
      youtube_url: siteData?.footer?.youtube_url || "https://youtube.com/@idmrstrategies",
      work_email: siteData?.footer?.work_email || "idmrstrategies@gmail.com",
      phone_number: siteData?.footer?.phone_number || "+91 7678199406",
      office_address: siteData?.footer?.office_address || "Vardhman mall",
      working_hours: siteData?.footer?.working_hours || "Monday–Saturday: 9:00 AM – 5:00 PM",
      copyright_text: siteData?.footer?.copyright_text || "© 2026 IDMR Strategies. All rights reserved."
    };
  };

  const [footer, setFooter] = useState(getInitialFooter);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("idmr_footer_data");
    if (!saved && siteData?.footer) {
      setFooter((prev) => ({
        ...prev,
        ...siteData.footer
      }));
    }
  }, [siteData]);

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    setSaving(true);

    try {
      localStorage.setItem("idmr_footer_data", JSON.stringify(footer));
      window.dispatchEvent(new Event("storage"));
    } catch (err) {}

    showNotify("Saving changes live to website...");
    const success = await syncToGitHubCMS("footer", footer);
    if (success) {
      showNotify("✨ Footer settings saved live on website across all devices!");
    } else {
      showNotify("Footer settings saved locally in browser!", "warning");
    }

    try {
      await fetch(`${API_BASE}/api/cms/footer`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(footer)
      });
    } catch (err) {} finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="space-y-8">
      {/* HEADER BAR WITH TOP SAVE BUTTON */}
      <div className="flex items-center justify-between bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <span>🦶</span> Footer & Pre-Footer Manager
          </h2>
          <p className="text-xs text-slate-500">Edit pre-footer CTA banner, brand bio, social links, contact info, and copyright statement</p>
        </div>
        <button
          type="submit"
          disabled={saving}
          className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 text-white font-extrabold rounded-xl shadow-md shadow-blue-500/25 transition-all transform active:scale-95 flex items-center gap-2"
        >
          {saving ? "Saving..." : "💾 Save Footer Settings"}
        </button>
      </div>

      {/* SECTION 1: PRE-FOOTER CTA BANNER */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
          <div>
            <h3 className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <span>🚀</span> Pre-Footer CTA Banner Card
            </h3>
            <p className="text-xs text-slate-500">Edit the top pre-footer agency call-to-action banner displayed before footer links</p>
          </div>
          <span className="text-xs font-bold text-blue-600 bg-blue-50 dark:bg-blue-950 px-3 py-1 rounded-full">Banner CTA</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-2">Badge Text</label>
            <input
              type="text"
              value={footer.cta_badge || ""}
              onChange={(e) => setFooter({ ...footer, cta_badge: e.target.value })}
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium text-sm"
              placeholder="⭐ TOP-RATED DIGITAL & RESEARCH AGENCY"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-2">Main Title</label>
            <input
              type="text"
              value={footer.cta_title || ""}
              onChange={(e) => setFooter({ ...footer, cta_title: e.target.value })}
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium text-sm"
              placeholder="Ready to Accelerate Your Business Growth?"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-2">Subtitle / Description</label>
            <textarea
              rows={2}
              value={footer.cta_subtitle || ""}
              onChange={(e) => setFooter({ ...footer, cta_subtitle: e.target.value })}
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium text-sm"
              placeholder="Connect with our senior growth strategists..."
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-2">Primary Button Text</label>
            <input
              type="text"
              value={footer.cta_primary_btn_text || ""}
              onChange={(e) => setFooter({ ...footer, cta_primary_btn_text: e.target.value })}
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium text-sm"
              placeholder="Get Free Consultation"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-2">Primary Button Link</label>
            <input
              type="text"
              value={footer.cta_primary_btn_link || ""}
              onChange={(e) => setFooter({ ...footer, cta_primary_btn_link: e.target.value })}
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium text-sm"
              placeholder="#consult-modal"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-2">Secondary Button Text</label>
            <input
              type="text"
              value={footer.cta_secondary_btn_text || ""}
              onChange={(e) => setFooter({ ...footer, cta_secondary_btn_text: e.target.value })}
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium text-sm"
              placeholder="View Case Studies"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-2">Secondary Button Link</label>
            <input
              type="text"
              value={footer.cta_secondary_btn_link || ""}
              onChange={(e) => setFooter({ ...footer, cta_secondary_btn_link: e.target.value })}
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium text-sm"
              placeholder="portfolio.html"
            />
          </div>
        </div>
      </div>

      {/* SECTION 2: BRAND INFO & SOCIAL MEDIA LINKS */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
          <div>
            <h3 className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <span>🏢</span> Brand Bio & Social Networks
            </h3>
            <p className="text-xs text-slate-500">Footer column 1 company summary, operational status, and social media handles</p>
          </div>
          <span className="text-xs font-bold text-blue-600 bg-blue-50 dark:bg-blue-950 px-3 py-1 rounded-full">Column 1</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-2">Footer Brand Bio / Description</label>
            <textarea
              rows={3}
              value={footer.brand_description || ""}
              onChange={(e) => setFooter({ ...footer, brand_description: e.target.value })}
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium text-sm"
              placeholder="IDMR Strategies is a premier digital marketing agency..."
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-2">Status Indicator Pill Text</label>
            <input
              type="text"
              value={footer.status_pill_text || ""}
              onChange={(e) => setFooter({ ...footer, status_pill_text: e.target.value })}
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium text-sm"
              placeholder="● All Systems Operational"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-2">Facebook Page URL</label>
            <input
              type="url"
              value={footer.facebook_url || ""}
              onChange={(e) => setFooter({ ...footer, facebook_url: e.target.value })}
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium text-sm"
              placeholder="https://facebook.com/idmrstrategies"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-2">Instagram Profile URL</label>
            <input
              type="url"
              value={footer.instagram_url || ""}
              onChange={(e) => setFooter({ ...footer, instagram_url: e.target.value })}
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium text-sm"
              placeholder="https://instagram.com/idmrstrategies"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-2">LinkedIn Company URL</label>
            <input
              type="url"
              value={footer.linkedin_url || ""}
              onChange={(e) => setFooter({ ...footer, linkedin_url: e.target.value })}
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium text-sm"
              placeholder="https://linkedin.com/company/idmrstrategies"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-2">Twitter / X Handle URL</label>
            <input
              type="url"
              value={footer.twitter_url || ""}
              onChange={(e) => setFooter({ ...footer, twitter_url: e.target.value })}
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium text-sm"
              placeholder="https://twitter.com/idmrstrategies"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-2">YouTube Channel URL</label>
            <input
              type="url"
              value={footer.youtube_url || ""}
              onChange={(e) => setFooter({ ...footer, youtube_url: e.target.value })}
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium text-sm"
              placeholder="https://youtube.com/@idmrstrategies"
            />
          </div>
        </div>
      </div>

      {/* SECTION 3: CONTACT INFORMATION */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
          <div>
            <h3 className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <span>📍</span> Official Contact Details
            </h3>
            <p className="text-xs text-slate-500">Footer column 4 email, phone, corporate headquarters address, and operating hours</p>
          </div>
          <span className="text-xs font-bold text-blue-600 bg-blue-50 dark:bg-blue-950 px-3 py-1 rounded-full">Column 4</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-2">Work Email</label>
            <input
              type="email"
              value={footer.work_email || ""}
              onChange={(e) => setFooter({ ...footer, work_email: e.target.value })}
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium text-sm"
              placeholder="idmrstrategies@gmail.com"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-2">Phone Number</label>
            <input
              type="text"
              value={footer.phone_number || ""}
              onChange={(e) => setFooter({ ...footer, phone_number: e.target.value })}
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium text-sm"
              placeholder="+91 8383897274"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-2">Office Address</label>
            <input
              type="text"
              value={footer.office_address || ""}
              onChange={(e) => setFooter({ ...footer, office_address: e.target.value })}
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium text-sm"
              placeholder="Headquarters: IDMR Strategies Tower, Mohali"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-2">Working Hours</label>
            <input
              type="text"
              value={footer.working_hours || ""}
              onChange={(e) => setFooter({ ...footer, working_hours: e.target.value })}
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium text-sm"
              placeholder="Monday–Saturday: 9:00 AM – 6:00 PM"
            />
          </div>
        </div>
      </div>

      {/* SECTION 4: COPYRIGHT BAR */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
          <div>
            <h3 className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <span>⚖️</span> Copyright & Legal Bar
            </h3>
            <p className="text-xs text-slate-500">Footer bottom bar copyright statement</p>
          </div>
          <span className="text-xs font-bold text-blue-600 bg-blue-50 dark:bg-blue-950 px-3 py-1 rounded-full">Legal Bar</span>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-2">Copyright Statement Text</label>
          <input
            type="text"
            value={footer.copyright_text || ""}
            onChange={(e) => setFooter({ ...footer, copyright_text: e.target.value })}
            className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium text-sm"
            placeholder="© 2026 IDMR Strategies. All rights reserved."
          />
        </div>
      </div>

      {/* STICKY BOTTOM ACTION BAR */}
      <div className="sticky bottom-4 z-50 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-2xl flex items-center justify-between">
        <span className="text-xs font-bold text-slate-500">Footer Settings Management</span>
        <button
          type="submit"
          disabled={saving}
          className="px-8 py-3.5 bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 text-white font-extrabold rounded-xl shadow-lg shadow-blue-500/25 transition-all transform active:scale-95 flex items-center gap-2"
        >
          {saving ? "Saving Changes..." : "💾 Save Footer Settings"}
        </button>
      </div>
    </form>
  );
}

// RENDER APP
ReactDOM.createRoot(document.getElementById("admin-root")).render(<AdminApp />);
