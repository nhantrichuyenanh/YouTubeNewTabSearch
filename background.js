chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.url) {
        chrome.tabs.create({ url: message.url });
    }
});
