// Pixly Phase 1 — Messaging utilities
// Handles communication between content scripts, background, and side panel

import { MESSAGE_TYPES } from './constants.js'

/**
 * Send a message from content script to background
 */
export function sendToBackground(type, payload = {}) {
  return chrome.runtime.sendMessage({ type, ...payload })
}

/**
 * Send a message to the side panel
 */
export function sendToSidePanel(type, payload = {}) {
  return chrome.runtime.sendMessage({ type, ...payload })
}

/**
 * Send a message to a specific tab's content script
 */
export function sendToTab(tabId, type, payload = {}) {
  return chrome.tabs.sendMessage(tabId, { type, ...payload })
}

/**
 * Listen for messages from background / content scripts
 * Returns a cleanup function to remove the listener
 */
export function onMessage(type, handler) {
  const listener = (message, sender, sendResponse) => {
    if (message.type === type) {
      const result = handler(message, sender)
      // Support both sync and async handlers
      if (result instanceof Promise) {
        result.then(sendResponse).catch(() => sendResponse({ error: true }))
        return true // keep the message channel open for async response
      }
      sendResponse(result)
    }
  }

  chrome.runtime.onMessage.addListener(listener)
  return () => chrome.runtime.onMessage.removeListener(listener)
}

/**
 * Listen for messages and respond asynchronously
 */
export function onMessageAsync(type, handler) {
  const listener = (message, sender, sendResponse) => {
    if (message.type === type) {
      handler(message, sender)
        .then(sendResponse)
        .catch((err) => sendResponse({ error: err.message }))
      return true // keeps sendResponse channel open for async
    }
  }

  chrome.runtime.onMessage.addListener(listener)
  return () => chrome.runtime.onMessage.removeListener(listener)
}

export { MESSAGE_TYPES }
