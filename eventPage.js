(function () {
    "use strict";

    var openTabRightNextToActiveTab = function (url, activeTabIndex, isActive) {
        if (isActive === undefined) {
            isActive = false;
        }

        // Get the total number of open tabs
        chrome.tabs.query({}, function (tabs) {
            // If the active tab is the last one, the new tab will be created at the end
            var nextTabIndex = activeTabIndex + 1;
            if (nextTabIndex >= tabs.length) {
                nextTabIndex = tabs.length; // Add the new tab at the end if it's the last tab
            }

            chrome.tabs.create({url: url, active: isActive, index: nextTabIndex});
        });
    };

    chrome.runtime.onMessage.addListener(
        function (request, sender, sendResponse) {
            openTabRightNextToActiveTab(request.url, sender.tab.index);
        });
}());
