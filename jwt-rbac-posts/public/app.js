let token = null;
let user = null;

const $ = (id) => document.getElementById(id);

async function api(url, options = {}) {
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
}

async function login(role) {
  const username = $("username").value.trim();
  const password = $("password").value;
  const err = $("login-error");
  err.hidden = true;
  try {
    const data = await api("/api/login", {
      method: "POST",
      body: JSON.stringify({ username, password, role }),
    });
    token = data.token;
    user = data.user;
    showApp();
  } catch (e) {
    err.textContent = e.message;
    err.hidden = false;
  }
}

function showApp() {
  $("login-view").hidden = true;
  $("app-view").hidden = false;
  $("welcome").textContent = `Welcome, ${user.username}`;
  $("role-badge").textContent = user.role;
  const isAdmin = user.role === "admin";
  $("create-form").hidden = !isAdmin;
  $("access-note").textContent = isAdmin
    ? "You can create, edit and delete posts."
    : "Read-only access";
  loadPosts();
}

function logout() {
  token = null;
  user = null;
  $("password").value = "";
  $("posts").innerHTML = "";
  $("app-view").hidden = true;
  $("login-view").hidden = false;
}

async function loadPosts() {
  const { posts, total } = await api("/api/posts");
  $("total").textContent = total;
  const isAdmin = user.role === "admin";
  $("posts").innerHTML = "";
  posts.forEach((p) => {
    const el = document.createElement("article");
    el.className = "card post";
    const title = document.createElement("h3");
    title.textContent = p.title;
    const body = document.createElement("p");
    body.textContent = p.body;
    el.append(title, body);

    if (isAdmin) {
      const row = document.createElement("div");
      row.className = "row";

      const edit = document.createElement("button");
      edit.className = "btn";
      edit.textContent = "Edit Post";
      edit.onclick = async () => {
        const newTitle = prompt("New title", p.title);
        if (newTitle === null) return;
        const newBody = prompt("New body", p.body);
        if (newBody === null) return;
        await api(`/api/posts/${p.id}`, {
          method: "PUT",
          body: JSON.stringify({ title: newTitle, body: newBody }),
        });
        loadPosts();
      };

      const del = document.createElement("button");
      del.className = "btn danger";
      del.textContent = "Delete Post";
      del.onclick = async () => {
        await api(`/api/posts/${p.id}`, { method: "DELETE" });
        loadPosts();
      };

      row.append(edit, del);
      el.append(row);
    } else {
      const note = document.createElement("span");
      note.className = "badge";
      note.textContent = "Read-only access";
      el.append(note);
    }
    $("posts").append(el);
  });
}

$("login-admin").onclick = () => login("admin");
$("login-viewer").onclick = () => login("viewer");
$("logout").onclick = logout;
$("create-form").onsubmit = async (e) => {
  e.preventDefault();
  try {
    await api("/api/posts", {
      method: "POST",
      body: JSON.stringify({ title: $("new-title").value, body: $("new-body").value }),
    });
    $("new-title").value = "";
    $("new-body").value = "";
    loadPosts();
  } catch (err) {
    alert(err.message);
  }
};
