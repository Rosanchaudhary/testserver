const terminal = document.getElementById("terminal");
const input = document.getElementById("input");

const commands = {
  help: `
Available commands:
  about        → Who am I
  experience   → Work history
  projects     → Selected projects
  skills       → Technical stack
  clear        → Clear terminal
`,

  about: `
👋 Hi, I'm Roshan Chaudhary

A passionate MERN Stack Developer with a love for
clean architecture, performance, and terminal aesthetics.

I enjoy building scalable apps, creative UIs,
and system-like experiences on the web.
`,

  experience: `
💼 Experience

• MERN Stack Developer — 2 Companies
  Duration: 3+ Years
  - Built full-stack web applications
  - REST APIs, dashboards, admin panels
  - Performance optimization & deployment

• Freelance Developer — 2 Years
  - Client-based MERN projects
  - Custom web apps & portfolios
  - End-to-end development
`,

  skills: `
🛠 Skills

Frontend:
  React, Next.js, Tailwind CSS, Framer Motion

Backend:
  Node.js, Express, MongoDB, REST APIs

Tools:
  Git, Docker, Linux, Nginx, Vercel

Other:
  Clean Architecture, UI/UX, Performance
`,

  projects: `
📂 Projects

01. Terminal Portfolio (Arch Linux Inspired)
02. MERN E-Commerce Platform
03. Real-time Chat Application (Socket.io)
04. Admin Dashboard (React + Charts)
05. Authentication System (JWT + OAuth)
06. Freelance Client Websites
07. CMS for Content Creators
08. Task Management App
09. API Service for Mobile Apps
10. Personal Design Experiments
`
};

let currentCommand = "";
let typing = false;

function print(text) {
  terminal.innerHTML += text + "\n";
  terminal.scrollTop = terminal.scrollHeight;
}

function execute(cmd) {
  print(`roshan@archlinux ~$ ${cmd}`);
  input.textContent = "";

  if (cmd === "clear") {
    terminal.innerHTML = "";
    return;
  }

  print(commands[cmd] || "Command not found. Type 'help'");
}

document.addEventListener("keydown", (e) => {
  if (typing) return;

  if (e.key === "Enter") {
    execute(currentCommand.trim());
    currentCommand = "";
  } else if (e.key === "Backspace") {
    currentCommand = currentCommand.slice(0, -1);
    input.textContent = currentCommand;
  } else if (e.key.length === 1) {
    currentCommand += e.key;
    input.textContent = currentCommand;
  }
});

// Intro
print("Welcome to Arch Linux Terminal Portfolio");
print("Type 'help' to get started.\n");
