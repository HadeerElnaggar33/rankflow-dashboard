import { useState, useEffect, useRef } from "react";

const SUPABASE_URL = "https://iuuyrdfreaumgoprocjr.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml1dXlyZGZyZWF1bWdvcHJvY2pyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg5NzQzNjksImV4cCI6MjA5NDU1MDM2OX0.IAHuIt_7Te6GQlougMz8b4_6FpcsuYbA9Y-DIFvEOQk";
const STATUS = { TODO: "todo", IN_PROGRESS: "in_progress", DONE: "done" };
const H = { "apikey": SUPABASE_KEY, "Authorization": `Bearer ${SUPABASE_KEY}`, "Content-Type": "application/json", "Prefer": "return=representation" };

async function sb(path, method = "GET", body = null) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, { method, headers: H, body: body ? JSON.stringify(body) : null });
  if (!res.ok) { console.error(await res.text()); return null; }
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

function today() { return new Date().toISOString().split("T")[0]; }
function formatDate(d) {
  if (!d) return "—";
  return new Date(d + "T00:00:00").toLocaleDateString("ar-EG", { day: "numeric", month: "short" });
}
function timeAgo(ts) {
  const diff = Math.floor((Date.now() - new Date(ts)) / 1000);
  if (diff < 60) return "الآن";
  if (diff < 3600) return `منذ ${Math.floor(diff / 60)} د`;
  if (diff < 86400) return `منذ ${Math.floor(diff / 3600)} س`;
  return `منذ ${Math.floor(diff / 86400)} يوم`;
}

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const fn = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, []);
  return isMobile;
}

function FilesTab({ projectId }) {
  const [files, setFiles] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [newFile, setNewFile] = useState({ name: "", url: "", type: "sheet" });
  const [loading, setLoading] = useState(true);

  async function loadFiles() {
    const res = await sb(`project_files?project_id=eq.${projectId}&order=created_at.desc`);
    if (res) setFiles(res);
    setLoading(false);
  }
  useEffect(() => { if (projectId) loadFiles(); }, [projectId]);

  async function addFile() {
    if (!newFile.name.trim() || !newFile.url.trim()) return;
    let url = newFile.url.trim();
    if (!url.startsWith("http")) url = "https://" + url;
    await sb("project_files", "POST", { project_id: projectId, name: newFile.name, url, type: newFile.type });
    setNewFile({ name: "", url: "", type: "sheet" });
    setShowAdd(false);
    loadFiles();
  }
  async function deleteFile(id) {
    await sb(`project_files?id=eq.${id}`, "DELETE");
    loadFiles();
  }

  const icons = { sheet: "📊", doc: "📄", other: "🔗" };
  const labels = { sheet: "Google Sheet", doc: "Google Doc", other: "رابط آخر" };
  const inp = { background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.15)", color: "#E2E8F0", padding: "10px 14px", borderRadius: 10, fontSize: 14, direction: "rtl", outline: "none", width: "100%" };

  return (
    <div>
      <div style={{ marginBottom: 16, display: "flex", justifyContent: "flex-end" }}>
        <button onClick={() => setShowAdd(true)} style={{ background: "linear-gradient(135deg,#7C3AED,#3B82F6)", border: "none", color: "#fff", padding: "10px 20px", borderRadius: 10, cursor: "pointer", fontSize: 14, fontWeight: 600 }}>+ إضافة ملف</button>
      </div>
      {loading
        ? <div style={{ textAlign: "center", padding: 40, color: "#6B7280" }}>جاري التحميل...</div>
        : files.length === 0
          ? <div style={{ textAlign: "center", padding: "60px 20px", color: "#4B5563" }}><div style={{ fontSize: 48, marginBottom: 12 }}>📁</div><div style={{ fontSize: 14 }}>لا توجد ملفات بعد</div><div style={{ fontSize: 12, marginTop: 8 }}>أضيفي روابط Google Sheet أو Google Doc</div></div>
          : <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {files.map(f => (
                <div key={f.id} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: "14px 18px", display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                  <div style={{ fontSize: 28 }}>{icons[f.type] || "🔗"}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 3 }}>{f.name}</div>
                    <div style={{ fontSize: 11, color: "#6B7280" }}>{labels[f.type]} · {new Date(f.created_at).toLocaleDateString("ar-EG")}</div>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <a href={f.url} target="_blank" rel="noopener noreferrer" style={{ background: "rgba(124,58,237,0.2)", border: "1px solid rgba(124,58,237,0.4)", color: "#A78BFA", padding: "6px 14px", borderRadius: 8, cursor: "pointer", fontSize: 12, textDecoration: "none" }}>فتح ↗</a>
                    <button onClick={() => deleteFile(f.id)} style={{ background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)", color: "#F87171", padding: "6px 12px", borderRadius: 8, cursor: "pointer", fontSize: 12 }}>🗑</button>
                  </div>
                </div>
              ))}
            </div>
      }
      {showAdd && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }} onClick={e => e.target === e.currentTarget && setShowAdd(false)}>
          <div dir="rtl" style={{ background: "#1E1B3A", border: "1px solid rgba(124,58,237,0.4)", borderRadius: 20, padding: 24, width: "100%", maxWidth: 420, position: "relative" }}>
            <button onClick={() => setShowAdd(false)} style={{ position: "absolute", top: 14, left: 14, background: "none", border: "none", color: "#9CA3AF", cursor: "pointer", fontSize: 20 }}>✕</button>
            <h2 style={{ margin: "0 0 20px", fontSize: 18, fontWeight: 700 }}>إضافة ملف</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <input value={newFile.name} onChange={e => setNewFile(p => ({ ...p, name: e.target.value }))} placeholder="اسم الملف" style={inp} />
              <input value={newFile.url} onChange={e => setNewFile(p => ({ ...p, url: e.target.value }))} placeholder="رابط Google Sheet أو Doc" style={inp} />
              <div>
                <div style={{ fontSize: 12, color: "#9CA3AF", marginBottom: 8 }}>نوع الملف</div>
                <div style={{ display: "flex", gap: 6 }}>
                  {[["sheet","📊 Sheet"],["doc","📄 Doc"],["other","🔗 رابط"]].map(([val, label]) => (
                    <button key={val} onClick={() => setNewFile(p => ({ ...p, type: val }))} style={{ flex: 1, padding: "8px 4px", borderRadius: 8, border: newFile.type === val ? "2px solid #7C3AED" : "1px solid rgba(255,255,255,0.15)", background: newFile.type === val ? "rgba(124,58,237,0.2)" : "transparent", color: newFile.type === val ? "#A78BFA" : "#9CA3AF", cursor: "pointer", fontSize: 12 }}>{label}</button>
                  ))}
                </div>
              </div>
              <button onClick={addFile} style={{ background: "linear-gradient(135deg,#7C3AED,#3B82F6)", border: "none", color: "#fff", padding: 12, borderRadius: 10, cursor: "pointer", fontSize: 15, fontWeight: 700 }}>إضافة</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  const isMobile = useIsMobile();
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [activeProjectId, setActiveProjectId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showNotifs, setShowNotifs] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [showAddProject, setShowAddProject] = useState(false);
  const [showAddTask, setShowAddTask] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [newProject, setNewProject] = useState({ name: "", color: "#7C3AED" });
  const [newTask, setNewTask] = useState({ title: "", assignee: "", deadline: today() });
  const [newMember, setNewMember] = useState("");
  const [activeTab, setActiveTab] = useState("tasks");
  const [activeKanban, setActiveKanban] = useState(STATUS.TODO);
  const [saving, setSaving] = useState(false);
  const pollRef = useRef();
  const colors = ["#7C3AED", "#2563EB", "#059669", "#DC2626", "#D97706", "#DB2777"];
  const inp = { background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.15)", color: "#E2E8F0", padding: "10px 14px", borderRadius: 10, fontSize: 14, direction: "rtl", outline: "none", width: "100%" };

  async function loadAll() {
    const [p, t, m, n] = await Promise.all([
      sb("projects?select=*&order=created_at"),
      sb("tasks?select=*&order=created_at"),
      sb("team_members?select=*&order=created_at"),
      sb("notifications?select=*&order=created_at.desc&limit=20"),
    ]);
    if (p) { setProjects(p); setActiveProjectId(id => id || (p[0]?.id ?? null)); }
    if (t) setTasks(t);
    if (m) setTeamMembers(m);
    if (n) setNotifications(n);
    setLoading(false);
  }

  useEffect(() => {
    loadAll();
    pollRef.current = setInterval(loadAll, 5000);
    return () => clearInterval(pollRef.current);
  }, []);

  const proj = projects.find(p => p.id === activeProjectId);
  const projTasks = tasks.filter(t => t.project_id === activeProjectId);
  const unread = notifications.filter(n => !n.read).length;

  function getMemberStats(name) {
    const all = tasks.filter(t => t.assignee === name);
    return { total: all.length, done: all.filter(t => t.status === STATUS.DONE).length, pending: all.filter(t => t.status !== STATUS.DONE).length };
  }

  async function addProject() {
    if (!newProject.name.trim()) return;
    setSaving(true);
    const res = await sb("projects", "POST", { name: newProject.name, color: newProject.color });
    if (res?.[0]) setActiveProjectId(res[0].id);
    await loadAll();
    setNewProject({ name: "", color: "#7C3AED" });
    setShowAddProject(false);
    setSaving(false);
  }

  async function addTask() {
    if (!newTask.title.trim() || !activeProjectId) return;
    setSaving(true);
    const assignee = newTask.assignee || teamMembers[0]?.name;
    await sb("tasks", "POST", { project_id: activeProjectId, title: newTask.title, assignee, deadline: newTask.deadline || null, status: STATUS.TODO });
    await sb("notifications", "POST", { text: `تم تعيين تاسك '${newTask.title}' لـ ${assignee}`, type: "assign" });
    await loadAll();
    setNewTask({ title: "", assignee: teamMembers[0]?.name || "", deadline: today() });
    setShowAddTask(false);
    setSaving(false);
  }

  async function setTaskStatus(taskId, status, title, assignee) {
    setSaving(true);
    await sb(`tasks?id=eq.${taskId}`, "PATCH", { status });
    if (status === STATUS.DONE) await sb("notifications", "POST", { text: `${assignee} أتم تاسك '${title}'`, type: "done" });
    await loadAll();
    setSaving(false);
  }

  async function deleteTask(taskId) {
    await sb(`tasks?id=eq.${taskId}`, "DELETE");
    await loadAll();
  }

  async function addMember() {
    if (!newMember.trim()) return;
    await sb("team_members", "POST", { name: newMember.trim() });
    await loadAll();
    setNewMember("");
    setShowAddMember(false);
  }

  async function markNotifsRead() {
    setShowNotifs(v => !v);
    if (!showNotifs && unread > 0) {
      await sb("notifications?read=eq.false", "PATCH", { read: true });
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    }
  }

  function selectProject(id) {
    setActiveProjectId(id);
    setShowSidebar(false);
  }

  if (loading) return (
    <div dir="rtl" style={{ minHeight: "100vh", background: "linear-gradient(135deg,#0D0B2A,#1A1040,#0F1D3A)", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 16, color: "#E2E8F0" }}>
      <div style={{ width: 56, height: 56, borderRadius: "50%", background: "linear-gradient(135deg,#7C3AED,#3B82F6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, fontWeight: 700 }}>R</div>
      <div style={{ fontSize: 18, fontWeight: 700, background: "linear-gradient(90deg,#A78BFA,#60A5FA)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Rank Flow Agency</div>
      <div style={{ fontSize: 13, color: "#6B7280" }}>جاري تحميل البيانات...</div>
    </div>
  );

  const SidebarContent = () => (
    <div style={{ padding: "20px 12px", display: "flex", flexDirection: "column", gap: 6, overflowY: "auto", height: "100%" }}>
      <div style={{ fontSize: 11, color: "#6B7280", padding: "0 8px 8px", letterSpacing: 1 }}>المشاريع</div>
      {projects.map(p => (
        <button key={p.id} onClick={() => selectProject(p.id)} style={{ background: p.id === activeProjectId ? "linear-gradient(135deg,rgba(124,58,237,0.3),rgba(59,130,246,0.2))" : "transparent", border: p.id === activeProjectId ? "1px solid rgba(124,58,237,0.5)" : "1px solid transparent", color: p.id === activeProjectId ? "#E2E8F0" : "#9CA3AF", padding: "10px 12px", borderRadius: 10, cursor: "pointer", textAlign: "right", fontSize: 13, fontWeight: p.id === activeProjectId ? 600 : 400, display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: p.color, flexShrink: 0 }}></div>
          <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</span>
          <span style={{ fontSize: 11, background: "rgba(255,255,255,0.1)", borderRadius: 10, padding: "1px 7px", flexShrink: 0 }}>{tasks.filter(t => t.project_id === p.id).length}</span>
        </button>
      ))}
      <button onClick={() => { setShowAddProject(true); setShowSidebar(false); }} style={{ background: "transparent", border: "1px dashed rgba(124,58,237,0.4)", color: "#7C3AED", padding: "8px 12px", borderRadius: 10, cursor: "pointer", fontSize: 13, marginTop: 4 }}>+ مشروع جديد</button>
      <div style={{ marginTop: 20, fontSize: 11, color: "#6B7280", padding: "0 8px 8px", letterSpacing: 1 }}>الفريق</div>
      {teamMembers.map(m => {
        const s = getMemberStats(m.name);
        return (
          <div key={m.id} style={{ padding: "8px 12px", borderRadius: 8, background: "rgba(255,255,255,0.03)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 28, height: 28, borderRadius: "50%", background: "linear-gradient(135deg,#7C3AED,#3B82F6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, flexShrink: 0 }}>{m.name[0]}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{m.name}</div>
                <div style={{ fontSize: 11, color: "#6B7280" }}>{s.pending} متبقي · {s.done} منجز</div>
              </div>
            </div>
          </div>
        );
      })}
      <button onClick={() => { setShowAddMember(true); setShowSidebar(false); }} style={{ background: "transparent", border: "1px dashed rgba(124,58,237,0.4)", color: "#7C3AED", padding: "8px 12px", borderRadius: 10, cursor: "pointer", fontSize: 13, marginTop: 4 }}>+ عضو جديد</button>
    </div>
  );

  return (
    <div dir="rtl" style={{ minHeight: "100vh", background: "linear-gradient(135deg,#0D0B2A 0%,#1A1040 50%,#0F1D3A 100%)", fontFamily: "'Segoe UI', Tahoma, Arial, sans-serif", color: "#E2E8F0", display: "flex", flexDirection: "column" }}>

      <header style={{ background: "rgba(255,255,255,0.05)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(124,58,237,0.3)", padding: isMobile ? "0 12px" : "0 24px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 60, position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {isMobile && (
            <button onClick={() => setShowSidebar(true)} style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(124,58,237,0.3)", color: "#E2E8F0", width: 36, height: 36, borderRadius: 8, cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>☰</button>
          )}
          <div style={{ width: 36, height: 36, borderRadius: "50%", background: "linear-gradient(135deg,#7C3AED,#3B82F6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 700, flexShrink: 0 }}>R</div>
          <div>
            <div style={{ fontSize: isMobile ? 13 : 16, fontWeight: 700, background: "linear-gradient(90deg,#A78BFA,#60A5FA)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Rank Flow Agency</div>
            {!isMobile && <div style={{ fontSize: 11, color: "#9CA3AF" }}>هدير النجار — المؤسسة</div>}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {saving && !isMobile && <span style={{ fontSize: 11, color: "#A78BFA" }}>● حفظ...</span>}
          <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "#10B981" }}>
            <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#10B981", boxShadow: "0 0 5px #10B981" }}></div>
            {!isMobile && "متصل"}
          </div>
          {!isMobile && (
            <button onClick={() => setShowAddProject(true)} style={{ background: "linear-gradient(135deg,#7C3AED,#3B82F6)", border: "none", color: "#fff", padding: "7px 14px", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 600 }}>+ مشروع</button>
          )}
          <div style={{ position: "relative" }}>
            <button onClick={markNotifsRead} style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(124,58,237,0.4)", color: "#E2E8F0", width: 38, height: 38, borderRadius: "50%", cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
              🔔
              {unread > 0 && <span style={{ position: "absolute", top: 1, left: 1, background: "#EF4444", color: "#fff", borderRadius: "50%", width: 15, height: 15, fontSize: 9, display: "flex", alignItems: "center", justifyContent: "center" }}>{unread}</span>}
            </button>
            {showNotifs && (
              <div style={{ position: "fixed", top: 62, left: isMobile ? 8 : "auto", right: isMobile ? 8 : 16, width: isMobile ? "auto" : 310, background: "#1E1B3A", border: "1px solid rgba(124,58,237,0.4)", borderRadius: 12, boxShadow: "0 20px 60px rgba(0,0,0,0.5)", zIndex: 200, overflow: "hidden", maxHeight: 380, overflowY: "auto" }}>
                <div style={{ padding: "12px 16px", borderBottom: "1px solid rgba(255,255,255,0.08)", fontWeight: 700, fontSize: 14, position: "sticky", top: 0, background: "#1E1B3A" }}>الإشعارات</div>
                {notifications.length === 0
                  ? <div style={{ padding: 24, textAlign: "center", color: "#6B7280" }}>لا توجد إشعارات</div>
                  : notifications.map(n => (
                    <div key={n.id} style={{ padding: "10px 16px", borderBottom: "1px solid rgba(255,255,255,0.05)", display: "flex", gap: 10, alignItems: "flex-start", background: n.read ? "transparent" : "rgba(124,58,237,0.08)" }}>
                      <span style={{ fontSize: 16, flexShrink: 0 }}>{n.type === "done" ? "✅" : "📌"}</span>
                      <div>
                        <div style={{ fontSize: 13, lineHeight: 1.4 }}>{n.text}</div>
                        <div style={{ fontSize: 11, color: "#6B7280", marginTop: 2 }}>{timeAgo(n.created_at)}</div>
                      </div>
                    </div>
                  ))
                }
              </div>
            )}
          </div>
          <button onClick={() => setShowReport(true)} style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(124,58,237,0.4)", color: "#A78BFA", padding: isMobile ? "7px 10px" : "7px 14px", borderRadius: 8, cursor: "pointer", fontSize: isMobile ? 16 : 13 }}>
            {isMobile ? "📊" : "📊 تقرير"}
          </button>
        </div>
      </header>

      {isMobile && showSidebar && (
        <>
          <div onClick={() => setShowSidebar(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 150 }} />
          <div style={{ position: "fixed", top: 0, right: 0, bottom: 0, width: 260, background: "#1A1040", borderLeft: "1px solid rgba(124,58,237,0.3)", zIndex: 160, overflowY: "auto" }}>
            <div style={{ padding: "16px 12px", borderBottom: "1px solid rgba(255,255,255,0.08)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontWeight: 700, fontSize: 15 }}>القائمة</span>
              <button onClick={() => setShowSidebar(false)} style={{ background: "none", border: "none", color: "#9CA3AF", cursor: "pointer", fontSize: 20 }}>✕</button>
            </div>
            <SidebarContent />
          </div>
        </>
      )}

      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        {!isMobile && (
          <aside style={{ width: 224, background: "rgba(255,255,255,0.03)", borderLeft: "1px solid rgba(124,58,237,0.2)", overflowY: "auto", flexShrink: 0 }}>
            <SidebarContent />
          </aside>
        )}

        <main style={{ flex: 1, overflowY: "auto", padding: isMobile ? 12 : 24 }}>
          {!proj
            ? <div style={{ textAlign: "center", padding: "80px 20px", color: "#4B5563" }}><div style={{ fontSize: 48, marginBottom: 12 }}>🚀</div><div>اختاري مشروعاً من القائمة</div>{isMobile && <div style={{ fontSize: 13, marginTop: 8, color: "#6B7280" }}>اضغطي ☰ لفتح القائمة</div>}</div>
            : (
              <>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, gap: 10 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                    <div style={{ width: 42, height: 42, borderRadius: 10, background: proj.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>🚀</div>
                    <div style={{ minWidth: 0 }}>
                      <h1 style={{ margin: 0, fontSize: isMobile ? 15 : 20, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{proj.name}</h1>
                      <div style={{ fontSize: 11, color: "#6B7280" }}>{timeAgo(proj.created_at)}</div>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                    {["tasks", "files"].map(tab => (
                      <button key={tab} onClick={() => setActiveTab(tab)} style={{ background: activeTab === tab ? "linear-gradient(135deg,#7C3AED,#3B82F6)" : "rgba(255,255,255,0.06)", border: "none", color: activeTab === tab ? "#fff" : "#9CA3AF", padding: "7px 10px", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: activeTab === tab ? 600 : 400 }}>
                        {tab === "tasks" ? (isMobile ? "📋" : "📋 التاسكات") : (isMobile ? "📁" : "📁 الملفات")}
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2,1fr)" : "repeat(4,1fr)", gap: 10, marginBottom: 16 }}>
                  {[
                    { label: "الكل", value: projTasks.length, icon: "📋", color: "#7C3AED" },
                    { label: "مكتملة", value: projTasks.filter(t => t.status === STATUS.DONE).length, icon: "✅", color: "#10B981" },
                    { label: "جارية", value: projTasks.filter(t => t.status === STATUS.IN_PROGRESS).length, icon: "⚡", color: "#F59E0B" },
                    { label: "جديدة", value: projTasks.filter(t => t.status === STATUS.TODO).length, icon: "🆕", color: "#3B82F6" },
                  ].map(s => (
                    <div key={s.label} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: "12px", borderTop: `3px solid ${s.color}` }}>
                      <div style={{ fontSize: 18, marginBottom: 4 }}>{s.icon}</div>
                      <div style={{ fontSize: 22, fontWeight: 700, color: s.color }}>{s.value}</div>
                      <div style={{ fontSize: 11, color: "#9CA3AF", marginTop: 2 }}>{s.label}</div>
                    </div>
                  ))}
                </div>

                <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3,1fr)", gap: 10, marginBottom: 16 }}>
                  {teamMembers.map(m => {
                    const mt = projTasks.filter(t => t.assignee === m.name);
                    const done = mt.filter(t => t.status === STATUS.DONE).length;
                    const pct = mt.length ? Math.round((done / mt.length) * 100) : 0;
                    return (
                      <div key={m.id} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: 14 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                          <div style={{ width: 32, height: 32, borderRadius: "50%", background: "linear-gradient(135deg,#7C3AED,#3B82F6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, flexShrink: 0 }}>{m.name[0]}</div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 700, fontSize: 14 }}>{m.name}</div>
                            <div style={{ fontSize: 11, color: "#9CA3AF" }}>{done}/{mt.length} تاسك</div>
                          </div>
                          <div style={{ fontSize: 14, fontWeight: 700, color: pct === 100 ? "#10B981" : "#F59E0B" }}>{pct}%</div>
                        </div>
                        <div style={{ background: "rgba(255,255,255,0.08)", borderRadius: 4, height: 5, overflow: "hidden" }}>
                          <div style={{ width: pct + "%", height: "100%", background: pct === 100 ? "#10B981" : "linear-gradient(90deg,#7C3AED,#3B82F6)", borderRadius: 4, transition: "width 0.5s" }}></div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {activeTab === "tasks" && (
                  <>
                    <div style={{ marginBottom: 12, display: "flex", justifyContent: "flex-end" }}>
                      <button onClick={() => { setNewTask({ title: "", assignee: teamMembers[0]?.name || "", deadline: today() }); setShowAddTask(true); }} style={{ background: "linear-gradient(135deg,#7C3AED,#3B82F6)", border: "none", color: "#fff", padding: "9px 18px", borderRadius: 10, cursor: "pointer", fontSize: 14, fontWeight: 600 }}>+ إضافة تاسك</button>
                    </div>

                    {isMobile && (
                      <div style={{ display: "flex", gap: 6, marginBottom: 12, background: "rgba(255,255,255,0.04)", borderRadius: 10, padding: 4 }}>
                        {[[STATUS.TODO,"🆕 جديدة"],[STATUS.IN_PROGRESS,"⚡ جارية"],[STATUS.DONE,"✅ مكتملة"]].map(([col, label]) => (
                          <button key={col} onClick={() => setActiveKanban(col)} style={{ flex: 1, padding: "7px 4px", borderRadius: 8, border: "none", background: activeKanban === col ? "linear-gradient(135deg,#7C3AED,#3B82F6)" : "transparent", color: activeKanban === col ? "#fff" : "#9CA3AF", cursor: "pointer", fontSize: 12, fontWeight: activeKanban === col ? 700 : 400 }}>{label}</button>
                        ))}
                      </div>
                    )}

                    <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3,1fr)", gap: 14 }}>
                      {[STATUS.TODO, STATUS.IN_PROGRESS, STATUS.DONE]
                        .filter(col => !isMobile || col === activeKanban)
                        .map(col => {
                          const colTasks = projTasks.filter(t => t.status === col);
                          const colColors = { [STATUS.TODO]: "#6B7280", [STATUS.IN_PROGRESS]: "#F59E0B", [STATUS.DONE]: "#10B981" };
                          const colLabels = { [STATUS.TODO]: "🆕 جديدة", [STATUS.IN_PROGRESS]: "⚡ جارية", [STATUS.DONE]: "✅ مكتملة" };
                          return (
                            <div key={col} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: 14 }}>
                              {!isMobile && (
                                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                                  <div style={{ width: 10, height: 10, borderRadius: "50%", background: colColors[col] }}></div>
                                  <span style={{ fontWeight: 700, fontSize: 14 }}>{colLabels[col]}</span>
                                  <span style={{ marginRight: "auto", background: "rgba(255,255,255,0.1)", borderRadius: 10, padding: "1px 8px", fontSize: 12 }}>{colTasks.length}</span>
                                </div>
                              )}
                              <div style={{ display: "flex", flexDirection: "column", gap: 10, minHeight: 60 }}>
                                {colTasks.map(task => (
                                  <div key={task.id} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: 14 }}>
                                    <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8, lineHeight: 1.4 }}>{task.title}</div>
                                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6, flexWrap: "wrap" }}>
                                      <div style={{ width: 22, height: 22, borderRadius: "50%", background: "linear-gradient(135deg,#7C3AED,#3B82F6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, flexShrink: 0 }}>{task.assignee[0]}</div>
                                      <span style={{ fontSize: 12, color: "#C4B5FD" }}>{task.assignee}</span>
                                      {task.deadline && <span style={{ fontSize: 11, color: "#9CA3AF", marginRight: "auto" }}>📅 {formatDate(task.deadline)}</span>}
                                    </div>
                                    <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginTop: 8 }}>
                                      {col !== STATUS.TODO && <button onClick={() => setTaskStatus(task.id, STATUS.TODO, task.title, task.assignee)} style={{ fontSize: 11, background: "rgba(107,114,128,0.2)", border: "1px solid rgba(107,114,128,0.4)", color: "#9CA3AF", padding: "3px 9px", borderRadius: 6, cursor: "pointer" }}>جديد</button>}
                                      {col !== STATUS.IN_PROGRESS && <button onClick={() => setTaskStatus(task.id, STATUS.IN_PROGRESS, task.title, task.assignee)} style={{ fontSize: 11, background: "rgba(245,158,11,0.2)", border: "1px solid rgba(245,158,11,0.4)", color: "#F59E0B", padding: "3px 9px", borderRadius: 6, cursor: "pointer" }}>جاري</button>}
                                      {col !== STATUS.DONE && <button onClick={() => setTaskStatus(task.id, STATUS.DONE, task.title, task.assignee)} style={{ fontSize: 11, background: "rgba(16,185,129,0.2)", border: "1px solid rgba(16,185,129,0.4)", color: "#10B981", padding: "3px 9px", borderRadius: 6, cursor: "pointer" }}>مكتمل ✓</button>}
                                      <button onClick={() => deleteTask(task.id)} style={{ fontSize: 11, background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)", color: "#F87171", padding: "3px 9px", borderRadius: 6, cursor: "pointer", marginRight: "auto" }}>🗑</button>
                                    </div>
                                  </div>
                                ))}
                                {colTasks.length === 0 && <div style={{ textAlign: "center", color: "#374151", fontSize: 13, padding: "20px 0" }}>لا توجد تاسكات</div>}
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </>
                )}

                {activeTab === "files" && <FilesTab projectId={activeProjectId} />}
              </>
            )
          }
        </main>
      </div>

      {showAddProject && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }} onClick={e => e.target === e.currentTarget && setShowAddProject(false)}>
          <div dir="rtl" style={{ background: "#1E1B3A", border: "1px solid rgba(124,58,237,0.4)", borderRadius: 20, padding: 24, width: "100%", maxWidth: 400, position: "relative" }}>
            <button onClick={() => setShowAddProject(false)} style={{ position: "absolute", top: 14, left: 14, background: "none", border: "none", color: "#9CA3AF", cursor: "pointer", fontSize: 20 }}>✕</button>
            <h2 style={{ margin: "0 0 20px", fontSize: 18, fontWeight: 700 }}>مشروع جديد</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <input value={newProject.name} onChange={e => setNewProject(p => ({ ...p, name: e.target.value }))} onKeyDown={e => e.key === "Enter" && addProject()} placeholder="اسم المشروع" style={inp} />
              <div>
                <div style={{ fontSize: 12, color: "#9CA3AF", marginBottom: 8 }}>لون المشروع</div>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  {colors.map(c => <button key={c} onClick={() => setNewProject(p => ({ ...p, color: c }))} style={{ width: 30, height: 30, borderRadius: "50%", background: c, border: newProject.color === c ? "3px solid #fff" : "3px solid transparent", cursor: "pointer" }}></button>)}
                </div>
              </div>
              <button onClick={addProject} disabled={saving} style={{ background: "linear-gradient(135deg,#7C3AED,#3B82F6)", border: "none", color: "#fff", padding: 12, borderRadius: 10, cursor: "pointer", fontSize: 15, fontWeight: 700, opacity: saving ? 0.7 : 1 }}>{saving ? "جاري الحفظ..." : "إنشاء المشروع"}</button>
            </div>
          </div>
        </div>
      )}

      {showAddTask && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }} onClick={e => e.target === e.currentTarget && setShowAddTask(false)}>
          <div dir="rtl" style={{ background: "#1E1B3A", border: "1px solid rgba(124,58,237,0.4)", borderRadius: 20, padding: 24, width: "100%", maxWidth: 400, position: "relative" }}>
            <button onClick={() => setShowAddTask(false)} style={{ position: "absolute", top: 14, left: 14, background: "none", border: "none", color: "#9CA3AF", cursor: "pointer", fontSize: 20 }}>✕</button>
            <h2 style={{ margin: "0 0 20px", fontSize: 18, fontWeight: 700 }}>إضافة تاسك</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <input value={newTask.title} onChange={e => setNewTask(t => ({ ...t, title: e.target.value }))} placeholder="عنوان التاسك" style={inp} />
              <div>
                <div style={{ fontSize: 12, color: "#9CA3AF", marginBottom: 6 }}>المسؤول</div>
                <select value={newTask.assignee} onChange={e => setNewTask(t => ({ ...t, assignee: e.target.value }))} style={{ ...inp, background: "#1E1B3A" }}>
                  {teamMembers.map(m => <option key={m.id} value={m.name}>{m.name}</option>)}
                </select>
              </div>
              <div>
                <div style={{ fontSize: 12, color: "#9CA3AF", marginBottom: 6 }}>الديدلاين</div>
                <input type="date" value={newTask.deadline} onChange={e => setNewTask(t => ({ ...t, deadline: e.target.value }))} style={inp} />
              </div>
              <button onClick={addTask} disabled={saving} style={{ background: "linear-gradient(135deg,#7C3AED,#3B82F6)", border: "none", color: "#fff", padding: 12, borderRadius: 10, cursor: "pointer", fontSize: 15, fontWeight: 700, opacity: saving ? 0.7 : 1 }}>{saving ? "جاري الحفظ..." : "إضافة التاسك"}</button>
            </div>
          </div>
        </div>
      )}

      {showAddMember && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }} onClick={e => e.target === e.currentTarget && setShowAddMember(false)}>
          <div dir="rtl" style={{ background: "#1E1B3A", border: "1px solid rgba(124,58,237,0.4)", borderRadius: 20, padding: 24, width: "100%", maxWidth: 340, position: "relative" }}>
            <button onClick={() => setShowAddMember(false)} style={{ position: "absolute", top: 14, left: 14, background: "none", border: "none", color: "#9CA3AF", cursor: "pointer", fontSize: 20 }}>✕</button>
            <h2 style={{ margin: "0 0 20px", fontSize: 18, fontWeight: 700 }}>إضافة عضو فريق</h2>
            <input value={newMember} onChange={e => setNewMember(e.target.value)} onKeyDown={e => e.key === "Enter" && addMember()} placeholder="اسم العضو الجديد" style={{ ...inp, marginBottom: 14 }} />
            <button onClick={addMember} style={{ background: "linear-gradient(135deg,#7C3AED,#3B82F6)", border: "none", color: "#fff", padding: 12, borderRadius: 10, cursor: "pointer", fontSize: 15, fontWeight: 700, width: "100%" }}>إضافة</button>
          </div>
        </div>
      )}

      {showReport && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", zIndex: 300, overflowY: "auto", padding: 16 }} onClick={e => e.target === e.currentTarget && setShowReport(false)}>
          <div dir="rtl" style={{ background: "#1E1B3A", border: "1px solid rgba(124,58,237,0.4)", borderRadius: 20, padding: 24, width: "100%", maxWidth: 600, margin: "auto", position: "relative" }}>
            <button onClick={() => setShowReport(false)} style={{ position: "absolute", top: 14, left: 14, background: "none", border: "none", color: "#9CA3AF", cursor: "pointer", fontSize: 20 }}>✕</button>
            <h2 style={{ margin: "0 0 4px", fontSize: 20, fontWeight: 700 }}>📊 تقرير الشهر</h2>
            <div style={{ fontSize: 13, color: "#9CA3AF", marginBottom: 20 }}>{new Date().toLocaleDateString("ar-EG", { month: "long", year: "numeric" })}</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginBottom: 20 }}>
              {[
                { label: "إجمالي التاسكات", value: tasks.length, color: "#7C3AED" },
                { label: "المكتملة", value: tasks.filter(t => t.status === STATUS.DONE).length, color: "#10B981" },
                { label: "المشاريع", value: projects.length, color: "#3B82F6" },
              ].map(s => (
                <div key={s.label} style={{ background: "rgba(255,255,255,0.05)", borderRadius: 12, padding: 14, textAlign: "center", borderTop: `3px solid ${s.color}` }}>
                  <div style={{ fontSize: 22, fontWeight: 700, color: s.color }}>{s.value}</div>
                  <div style={{ fontSize: 11, color: "#9CA3AF" }}>{s.label}</div>
                </div>
              ))}
            </div>
            {projects.map(p => {
              const pt = tasks.filter(t => t.project_id === p.id);
              const done = pt.filter(t => t.status === STATUS.DONE);
              const pending = pt.filter(t => t.status !== STATUS.DONE);
              return (
                <div key={p.id} style={{ marginBottom: 16, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, overflow: "hidden" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 16px", borderBottom: "1px solid rgba(255,255,255,0.08)", flexWrap: "wrap" }}>
                    <div style={{ width: 10, height: 10, borderRadius: "50%", background: p.color, flexShrink: 0 }}></div>
                    <span style={{ fontWeight: 700, fontSize: 14, flex: 1 }}>{p.name}</span>
                    <div style={{ display: "flex", gap: 6 }}>
                      <span style={{ fontSize: 11, background: "rgba(16,185,129,0.15)", color: "#10B981", border: "1px solid rgba(16,185,129,0.3)", borderRadius: 8, padding: "2px 8px" }}>✅ {done.length}</span>
                      <span style={{ fontSize: 11, background: "rgba(245,158,11,0.15)", color: "#F59E0B", border: "1px solid rgba(245,158,11,0.3)", borderRadius: 8, padding: "2px 8px" }}>⏳ {pending.length}</span>
                    </div>
                  </div>
                  <div style={{ padding: 14 }}>
                    {done.length > 0 && (
                      <div style={{ marginBottom: pending.length > 0 ? 12 : 0 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: "#10B981", marginBottom: 8 }}>التاسكات المكتملة</div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                          {done.map(t => (
                            <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.15)", borderRadius: 10, padding: "8px 12px", flexWrap: "wrap" }}>
                              <span>✅</span>
                              <span style={{ flex: 1, fontSize: 13, fontWeight: 600 }}>{t.title}</span>
                              <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                                <div style={{ width: 16, height: 16, borderRadius: "50%", background: "linear-gradient(135deg,#7C3AED,#3B82F6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 8 }}>{t.assignee[0]}</div>
                                <span style={{ fontSize: 12, color: "#C4B5FD" }}>{t.assignee}</span>
                                {t.deadline && <span style={{ fontSize: 11, color: "#6B7280" }}>· {formatDate(t.deadline)}</span>}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {pending.length > 0 && (
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: "#F59E0B", marginBottom: 8 }}>التاسكات المتبقية</div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                          {pending.map(t => (
                            <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(245,158,11,0.05)", border: "1px solid rgba(245,158,11,0.15)", borderRadius: 10, padding: "8px 12px", flexWrap: "wrap" }}>
                              <span>{t.status === STATUS.IN_PROGRESS ? "⚡" : "🔲"}</span>
                              <span style={{ flex: 1, fontSize: 13, fontWeight: 600 }}>{t.title}</span>
                              <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                                <div style={{ width: 16, height: 16, borderRadius: "50%", background: "linear-gradient(135deg,#7C3AED,#3B82F6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 8 }}>{t.assignee[0]}</div>
                                <span style={{ fontSize: 12, color: "#C4B5FD" }}>{t.assignee}</span>
                                {t.deadline && <span style={{ fontSize: 11, color: "#6B7280" }}>· {formatDate(t.deadline)}</span>}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {pt.length === 0 && <div style={{ textAlign: "center", color: "#4B5563", fontSize: 13 }}>لا توجد تاسكات</div>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
