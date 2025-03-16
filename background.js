(() => {
  "use strict";

  // opens a new tab right next to the active tab.
  const openTabNextToActive = (url, activeTabIndex, isActive = false) => {
    browser.tabs.query({}, (tabs) => {
      let nextIndex = activeTabIndex + 1;
      if (nextIndex >= tabs.length) {
        nextIndex = tabs.length;
      }
      browser.tabs.create({ url, active: isActive, index: nextIndex });
    });
  };

  // listen for messages with a URL property
  browser.runtime.onMessage.addListener((message, sender) => {
    if (message.url) {
      if (sender && sender.tab && typeof sender.tab.index === "number") {
        openTabNextToActive(message.url, sender.tab.index);
      } else {
        // fallback in case sender information is not available
        browser.tabs.create({ url: message.url });
      }
    }
  });
})();