import { parseGenMd, extractInputBlock } from "./parser";
import { getGitHubContext, fetchRawContent, isGenMdFile } from "./github";

/**
 * Create and inject the gen-md info panel into the page
 */
function createInfoPanel(
  frontmatter: Record<string, unknown>,
  body: string
): HTMLElement {
  const panel = document.createElement("div");
  panel.className = "gen-md-panel";

  const header = document.createElement("div");
  header.className = "gen-md-panel-header";
  header.innerHTML = `
    <span class="gen-md-logo">📄 gen-md</span>
    <button class="gen-md-close" title="Close">×</button>
  `;
  panel.appendChild(header);

  const content = document.createElement("div");
  content.className = "gen-md-panel-content";

  // Show frontmatter info
  if (frontmatter.name) {
    content.innerHTML += `<div class="gen-md-field"><strong>Name:</strong> ${frontmatter.name}</div>`;
  }
  if (frontmatter.description) {
    content.innerHTML += `<div class="gen-md-field"><strong>Description:</strong> ${frontmatter.description}</div>`;
  }
  if (frontmatter.output) {
    content.innerHTML += `<div class="gen-md-field"><strong>Output:</strong> <code>${frontmatter.output}</code></div>`;
  }

  // Show skills
  if (Array.isArray(frontmatter.skills) && frontmatter.skills.length > 0) {
    const skillsList = frontmatter.skills
      .map((s) => `<span class="gen-md-tag">${s}</span>`)
      .join("");
    content.innerHTML += `<div class="gen-md-field"><strong>Skills:</strong> ${skillsList}</div>`;
  }

  // Show context files
  if (Array.isArray(frontmatter.context) && frontmatter.context.length > 0) {
    const contextList = frontmatter.context
      .map((c) => `<span class="gen-md-tag">${c}</span>`)
      .join("");
    content.innerHTML += `<div class="gen-md-field"><strong>Context:</strong> ${contextList}</div>`;
  }

  // Show input block if present
  const inputBlock = extractInputBlock(body);
  if (inputBlock) {
    content.innerHTML += `
      <div class="gen-md-field">
        <strong>Input Block:</strong>
        <pre class="gen-md-input">${escapeHtml(inputBlock.slice(0, 500))}${inputBlock.length > 500 ? "..." : ""}</pre>
      </div>
    `;
  }

  panel.appendChild(content);

  // Add copy button
  const actions = document.createElement("div");
  actions.className = "gen-md-panel-actions";
  actions.innerHTML = `
    <button class="gen-md-copy-btn" title="Copy to clipboard">📋 Copy</button>
  `;
  panel.appendChild(actions);

  // Wire up close button
  header.querySelector(".gen-md-close")?.addEventListener("click", () => {
    panel.remove();
  });

  // Wire up copy button
  actions.querySelector(".gen-md-copy-btn")?.addEventListener("click", () => {
    const text = JSON.stringify(frontmatter, null, 2);
    navigator.clipboard.writeText(text).then(() => {
      const btn = actions.querySelector(".gen-md-copy-btn");
      if (btn) {
        btn.textContent = "✓ Copied!";
        setTimeout(() => {
          btn.textContent = "📋 Copy";
        }, 2000);
      }
    });
  });

  return panel;
}

/**
 * Escape HTML special characters
 */
function escapeHtml(text: string): string {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Add badge to .gen.md file links in file listings
 */
function addBadgesToFileLinks(): void {
  const links = document.querySelectorAll(
    'a[href*=".gen.md"]'
  ) as NodeListOf<HTMLAnchorElement>;

  links.forEach((link) => {
    // Skip if already badged
    if (link.querySelector(".gen-md-badge")) return;

    const badge = document.createElement("span");
    badge.className = "gen-md-badge";
    badge.textContent = "gen-md";
    badge.title = "gen-md configuration file";
    link.appendChild(badge);
  });
}

/**
 * Initialize content script
 */
async function init(): Promise<void> {
  // Add badges to file listings
  addBadgesToFileLinks();

  // If viewing a .gen.md file, show the info panel
  if (isGenMdFile()) {
    const context = getGitHubContext();
    if (!context) return;

    try {
      const content = await fetchRawContent(
        context.owner,
        context.repo,
        context.branch,
        context.path
      );

      const parsed = parseGenMd(content);
      const panel = createInfoPanel(parsed.frontmatter, parsed.body);

      // Insert panel before the file content
      const fileContent = document.querySelector(".Box-body");
      if (fileContent) {
        fileContent.parentElement?.insertBefore(panel, fileContent);
      }
    } catch (error) {
      console.error("gen-md: Failed to parse file", error);
    }
  }
}

// Run on page load
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}

// Re-run on GitHub navigation (SPA)
const observer = new MutationObserver(() => {
  addBadgesToFileLinks();
});

observer.observe(document.body, {
  childList: true,
  subtree: true,
});
