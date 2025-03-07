(function () {
    "use strict";

    var url = window.location.href;

    function execute() {
        var button, findSearchButton;

        findSearchButton = setInterval(function () {
            // Try to find the button using the new selector
            button = document.getElementById('search-icon-legacy') || document.getElementById('search-btn') || document.querySelector('input[name="search_query"]');

            if (button) {
                console.log('Button found:', button);  // Log the button found for debugging
                clearInterval(findSearchButton);
                createNewTabButton(button);
            } else {
                console.log('Button not found yet...');
            }
        }, 50);
    }

    function createNewTabButton(searchButton) {
        // Check if the button exists
        if (!searchButton) {
            console.log('Search button not found!');
            return;
        }

        var newButton, inputSearch;
        
        if (!newTabButtonExists()) {
            inputSearch = searchButton.closest('input[name="search_query"]');
            
            newButton = document.createElement('div');
            newButton.style.cursor = "pointer";
            newButton.style.width = "65px";
            newButton.style.border = "1px solid var(--ytd-searchbox-legacy-button-border-color)";
            newButton.style.borderRadius = "0 2px 2px 0";
            newButton.style.margin = "0";
            newButton.style.textAlign = "center";
            newButton.style.backgroundColor = "var(--ytd-searchbox-legacy-button-color)";

            insertAfter(newButton, searchButton);
        }

        newButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" version="1.1" viewBox="0 0 24 30" enable-background="new 0 0 24 24" xml:space="preserve" style="width: 20px;height: 20px; margin-top: 6px"><g><path style="fill: var(--ytd-searchbox-legacy-button-icon-color);" d="M18.8,13.7c-0.2,0-0.4,0.2-0.4,0.4v6.2H3.6V5.8h6.3c0.2,0,0.4-0.2,0.4-0.4S10.1,5,9.9,5H3.2 C3,5,2.8,5.2,2.8,5.4v15.3c0,0.2,0.2,0.4,0.4,0.4h15.6c0.2,0,0.4-0.2,0.4-0.4v-6.6C19.2,13.9,19.1,13.7,18.8,13.7z"></path><path style="fill: var(--ytd-searchbox-legacy-button-icon-color);" d="M20.8,2.8h-6.7c-0.2,0-0.4,0.2-0.4,0.4s0.2,0.4,0.4,0.4h5.7L8.3,15.1c-0.2,0.2-0.2,0.4,0,0.6 c0.1,0.1,0.2,0.1,0.3,0.1s0.2,0,0.3-0.1L20.4,4.3V10c0,0.2,0.2,0.4,0.4,0.4s0.4-0.2,0.4-0.4V3.3C21.2,3,21,2.8,20.8,2.8z"></path></g></svg>';

        newButton.id = 'button-newTab';
        newButton.addEventListener('click', function () {
            var queryTerm = inputSearch.value;
            chrome.runtime.sendMessage({url: 'https://www.youtube.com/results?search_query=' + queryTerm});
        });
    }

    function insertAfter(newNode, referenceNode) {
        referenceNode.parentNode.insertBefore(newNode, referenceNode.nextSibling);
    }

    function newTabButtonExists() {
        return document.getElementById('button-newTab') !== null;
    }

    function prepareForUrlChanges() {
        setInterval(function () {
            if (url !== window.location.href) {
                url = window.location.href;
                execute();
            }
        }, 500);
    }

    prepareForUrlChanges();
    execute();
})();
