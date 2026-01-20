/// <reference types="chrome" />

/**
 * Background service worker for gen-md Chrome extension
 */

// Handle extension installation
chrome.runtime.onInstalled.addListener(() => {
  console.log("gen-md extension installed");
});

// Handle messages from content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "GET_GEN_MD_INFO") {
    // Could be used to fetch additional info or perform background tasks
    sendResponse({ success: true });
  }

  if (message.type === "COPY_TO_CLIPBOARD") {
    // Handle clipboard operations in background
    navigator.clipboard
      .writeText(message.text)
      .then(() => {
        sendResponse({ success: true });
      })
      .catch((error) => {
        sendResponse({ success: false, error: error.message });
      });
    return true; // Keep message channel open for async response
  }
});

// Update badge when on .gen.md files
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete" && tab.url) {
    if (tab.url.includes(".gen.md")) {
      chrome.action.setBadgeText({ text: "✓", tabId });
      chrome.action.setBadgeBackgroundColor({ color: "#4CAF50", tabId });
    } else {
      chrome.action.setBadgeText({ text: "", tabId });
    }
  }
});
