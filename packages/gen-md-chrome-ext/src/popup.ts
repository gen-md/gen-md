/// <reference types="chrome" />

/**
 * Popup script for gen-md Chrome extension
 */

async function init() {
  const pageStatus = document.getElementById("pageStatus");
  const filesFound = document.getElementById("filesFound");
  const refreshBtn = document.getElementById("refreshBtn");
  const docsBtn = document.getElementById("docsBtn");

  // Get current tab
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  // Check if we're on GitHub
  if (!tab.url?.includes("github.com")) {
    if (pageStatus) {
      pageStatus.textContent = "Not on GitHub";
      pageStatus.classList.add("inactive");
    }
    if (filesFound) {
      filesFound.textContent = "N/A";
      filesFound.classList.add("inactive");
    }
    return;
  }

  // Check if viewing a .gen.md file
  if (tab.url?.includes(".gen.md")) {
    if (pageStatus) {
      pageStatus.textContent = "Viewing .gen.md file";
    }
  } else {
    if (pageStatus) {
      pageStatus.textContent = "On GitHub";
    }
  }

  // Count .gen.md files on page
  try {
    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id! },
      func: () => {
        const links = document.querySelectorAll('a[href*=".gen.md"]');
        return links.length;
      },
    });

    if (filesFound && results[0]?.result !== undefined) {
      filesFound.textContent = results[0].result.toString();
    }
  } catch {
    if (filesFound) {
      filesFound.textContent = "0";
    }
  }

  // Refresh button
  refreshBtn?.addEventListener("click", async () => {
    if (tab.id) {
      await chrome.tabs.reload(tab.id);
      window.close();
    }
  });

  // Docs button
  docsBtn?.addEventListener("click", () => {
    chrome.tabs.create({ url: "https://github.com/your-repo/gen-md#readme" });
  });
}

document.addEventListener("DOMContentLoaded", init);
