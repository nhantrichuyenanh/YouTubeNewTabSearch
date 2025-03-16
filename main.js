(() => {
  "use strict";

  let currentUrl = window.location.href;

  // poll for the search button periodically
  const pollForSearchButton = () => {
    const intervalId = setInterval(() => {
      const searchButton =
        document.getElementById("search-icon-legacy") ||
        document.getElementById("search-btn") ||
        document.querySelector('input[name="search_query"]');

      if (searchButton) {
        console.log("Search button found:", searchButton);
        clearInterval(intervalId);
        addNewTabButton(searchButton);
      } else {
        console.warn("Search button not found yet...");
      }
    }, 50);
  };

  // create and insert a new button to open the search results in a new tab
  const addNewTabButton = (searchButton) => {
    try {
      if (!searchButton) {
        console.error("Cannot add new tab button: Search button not found.");
        return;
      }

      let newTabButton = document.getElementById("button-newTab");
      const searchInput = document.querySelector('input[name="search_query"]');

      if (!newTabButton) {
        newTabButton = document.createElement("div");
        newTabButton.id = "button-newTab";
        newTabButton.setAttribute("aria-label", "Open search results in a new tab");

        // styling
        Object.assign(newTabButton.style, {
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          width: "30px",
          height: "30px",
          border: "1px solid var(--ytd-searchbox-legacy-button-border-color)",
          borderRadius: "5px",
          marginLeft: "5px",
          backgroundColor: "var(--ytd-searchbox-legacy-button-color)",
          cursor: "pointer",
          transition: "background-color 0.2s ease, box-shadow 0.2s ease, transform 0.1s ease"
        });

        // click effect
        newTabButton.addEventListener("mousedown", () => {
          newTabButton.style.transform = "scale(0.95)";
        });

        newTabButton.addEventListener("mouseup", () => {
          newTabButton.style.transform = "scale(1)";
        });

        insertAfter(newTabButton, searchButton);
      }

      newTabButton.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 25" style="width: 75%; height: 75%;">
          <g>
            <path style="fill: var(--ytd-searchbox-legacy-button-icon-color);" d="M18.8,13.7c-0.2,0-0.4,0.2-0.4,0.4v6.2H3.6V5.8h6.3c0.2,0,0.4-0.2,0.4-0.4S10.1,5,9.9,5H3.2C3,5,2.8,5.2,2.8,5.4v15.3c0,0.2,0.2,0.4,0.4,0.4h15.6c0.2,0,0.4-0.2,0.4-0.4v-6.6C19.2,13.9,19.1,13.7,18.8,13.7z"></path>
            <path style="fill: var(--ytd-searchbox-legacy-button-icon-color);" d="M20.8,2.8h-6.7c-0.2,0-0.4,0.2-0.4,0.4s0.2,0.4,0.4,0.4h5.7L8.3,15.1c-0.2,0.2-0.2,0.4,0,0.6c0.1,0.1,0.2,0.1,0.3,0.1s0.2,0,0.3-0.1L20.4,4.3V10c0,0.2,0.2,0.4,0.4,0.4s0.4-0.2,0.4-0.4V3.3C21.2,3,21,2.8,20.8,2.8z"></path>
          </g>
        </svg>
      `;

      newTabButton.addEventListener("click", () => {
        if (!searchInput) {
          console.error("Search input not found");
          return;
        }

        const queryTerm = searchInput.value.trim();
        if (queryTerm) {
          const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(queryTerm)}`;
          chrome.runtime.sendMessage({ url });
          console.log(`Opening new tab with query: "${queryTerm}"`);
        } else {
          console.warn("No search query entered");
        }
      });
    } catch (error) {
      console.error("Error in addNewTabButton:", error);
    }
  };

  // helper: insert a node after a reference node
  const insertAfter = (newNode, referenceNode) => {
    if (!referenceNode || !referenceNode.parentNode) {
      console.error("Cannot insert after: Reference node missing.");
      return;
    }
    referenceNode.parentNode.insertBefore(newNode, referenceNode.nextSibling);
  };

  // re-run when the URL changes (simple polling)
  const observeUrlChanges = () => {
    setInterval(() => {
      if (currentUrl !== window.location.href) {
        console.log("URL changed, rechecking for search button...");
        currentUrl = window.location.href;
        pollForSearchButton();
      }
    }, 500);
  };

  observeUrlChanges();
  pollForSearchButton();
})();