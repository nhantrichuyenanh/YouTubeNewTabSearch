(() => {
  "use strict";
  const processedMessages = new Map();

  const openTabNextToActive = async (url, activeTabIndex, windowId, isActive = false, messageId) => {
    try {
      if (processedMessages.has(messageId)) {
        return;
      }
      processedMessages.set(messageId, true);
      if (processedMessages.size > 50) {
        const oldestKey = Array.from(processedMessages.keys())[0];
        processedMessages.delete(oldestKey);
      }

      const tabsInWindow = await browser.tabs.query({ windowId });
      let nextIndex = activeTabIndex + 1;
      if (nextIndex > tabsInWindow.length) nextIndex = tabsInWindow.length;
      await browser.tabs.create({ url, active: isActive, index: nextIndex, windowId });
    } catch (error) {
      try {
        await browser.tabs.create({ url, active: isActive });
      } catch (fallbackError) {
      }
    }
  };

  browser.runtime.onMessage.addListener((message, sender) => {
    if (message.url) {
      try {
        const messageId = `${message.url}-${message.timestamp || Date.now()}`;
        const behavior = message.tabBehavior || 'background';
        const isActive = behavior === 'foreground';

        if (sender && sender.tab && typeof sender.tab.index === "number") {
          const winId = sender.tab.windowId;
          return openTabNextToActive(message.url, sender.tab.index, winId, isActive, messageId);
        } else {
          return browser.tabs.create({ url: message.url, active: isActive });
        }
      } catch (error) {
        return Promise.reject(error);
      }
    }
  });
})();