(() => {
  "use strict";

  // track message processing to prevent duplicates
  const processedMessages = new Map();

  // opens a new tab right next to the active tab
  const openTabNextToActive = async (url, activeTabIndex, windowId, isActive = false, messageId) => {
    try {
      if (processedMessages.has(messageId)) {
        console.log(`Message ${messageId} already processed, ignoring duplicate`);
        return;
      }

      processedMessages.set(messageId, true);
      if (processedMessages.size > 50) {
        const oldestKey = Array.from(processedMessages.keys())[0];
        processedMessages.delete(oldestKey);
      }

      // query tabs only in the same window to compute index reliably
      const tabsInWindow = await browser.tabs.query({ windowId });
      let nextIndex = activeTabIndex + 1;
      if (nextIndex > tabsInWindow.length) nextIndex = tabsInWindow.length;

      console.log(`Creating new tab at index ${nextIndex} with URL: ${url}`);
      await browser.tabs.create({ url, active: isActive, index: nextIndex, windowId });
    } catch (error) {
      console.error("Error opening new tab:", error);
      try {
        await browser.tabs.create({ url, active: isActive });
      } catch (fallbackError) {
        console.error("Failed to create tab even with fallback method:", fallbackError);
      }
    }
  };

  // listen for messages with a URL property
  browser.runtime.onMessage.addListener((message, sender) => {
    if (message.url) {
      try {
        const messageId = `${message.url}-${message.timestamp || Date.now()}`;
        console.log(`Processing message with ID: ${messageId}`);

        if (sender && sender.tab && typeof sender.tab.index === "number") {
          const winId = sender.tab.windowId;
          return openTabNextToActive(message.url, sender.tab.index, winId, false, messageId);
        } else {
          console.warn("Sender tab information missing, using fallback method");
          return browser.tabs.create({ url: message.url });
        }
      } catch (error) {
        console.error("Error processing message:", error);
        return Promise.reject(error);
      }
    }
  });
})();