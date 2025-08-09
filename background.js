(() => {
  "use strict";
  
  // track message processing to prevent duplicates
  const processedMessages = new Map();
  
  // opens a new tab right next to the active tab
  const openTabNextToActive = async (url, activeTabIndex, isActive = false, messageId) => {
    try {
      // check if this message was already processed
      if (processedMessages.has(messageId)) {
        console.log(`Message ${messageId} already processed, ignoring duplicate`);
        return;
      }
      
      // mark as processed before creating tab
      processedMessages.set(messageId, true);
      
      // clean old entries to prevent memory leak (keep last 20 messages)
      if (processedMessages.size > 20) {
        const oldestKey = Array.from(processedMessages.keys())[0];
        processedMessages.delete(oldestKey);
      }
      
      // using async/await with Firefox's promise-based API
      const tabs = await browser.tabs.query({});
      let nextIndex = activeTabIndex + 1;
      
      if (nextIndex >= tabs.length) {
        nextIndex = tabs.length;
      }
      
      console.log(`Creating new tab at index ${nextIndex} with URL: ${url}`);
      await browser.tabs.create({ url, active: isActive, index: nextIndex });
    } catch (error) {
      console.error("Error opening new tab:", error);
      // fallback to simple tab creation
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
        // create a unique ID for this message
        const messageId = `${message.url}-${message.timestamp || Date.now()}`;
        console.log(`Processing message with ID: ${messageId}`);
        
        if (sender && sender.tab && typeof sender.tab.index === "number") {
          return openTabNextToActive(message.url, sender.tab.index, false, messageId);
        } else {
          console.warn("Sender tab information missing, using fallback method");
          // fallback in case sender information is not available
          return browser.tabs.create({ url: message.url });
        }
      } catch (error) {
        console.error("Error processing message:", error);
        return Promise.reject(error);
      }
    }
  });
})();
