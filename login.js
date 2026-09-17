const SUPABASE_URL = "https://riirajoptvdcosrvpoug.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJpaXJham9wdHZkY29zcnZwb3VnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk1NjY0NTcsImV4cCI6MjEwNTE0MjQ1N30.xq2i26iv3RW9w89XmIUodMxjq3eJPg7z2USvByxUjP8";

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const form = document.getElementById("formLogin");
const btn = document.getElementById("btnEntrar");
const statusMsg = document.getElementById("statusMsg");

/* Si ya hay sesión iniciada, no mostrar el login: ir directo al sistema */
supabaseClient.auth.getSession().then(({ data: { session } }) => {
  if (session) window.location.href = "index.html";
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  btn.disabled = true;
  statusMsg.textContent = "Entrando…";
  statusMsg.className = "status-msg";

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  const { error } = await supabaseClient.auth.signInWithPassword({ email, password });

  btn.disabled = false;

  if (error) {
    statusMsg.textContent = "Correo o contraseña incorrectos.";
    statusMsg.className = "status-msg err";
    return;
  }

  window.location.href = "index.html";
});
