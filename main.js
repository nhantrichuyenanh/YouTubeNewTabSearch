(() => {
  "use strict";

  let currentUrl = window.location.href;
  let buttonAdded = false;
  let isProcessingClick = false;
  let clickDebounceTimer = null;

  let pollIntervalId = null;

  const pollForSearchButton = () => {
    // single poll interval only
    if (buttonAdded || pollIntervalId) return;

    const tryFind = () => {
      const searchButton =
        document.getElementById("search-icon-legacy") ||
        document.getElementById("search-btn") ||
        document.querySelector('input[name="search_query"]');

      if (searchButton) {
        console.log("Search button found:", searchButton);
        clearInterval(pollIntervalId);
        pollIntervalId = null;
        addNewTabButton(searchButton);
        buttonAdded = true;
      }
    };

    // try immediately, then periodically (short interval)
    tryFind();
    pollIntervalId = setInterval(tryFind, 300);
  };

  // create and insert a new button to open the search results in a new tab
  const addNewTabButton = (searchButton) => {
    try {
      if (!searchButton) {
        console.error("Cannot add new tab button: Search button not found.");
        return;
      }

      // prevent duplicates
      let newTabButton = document.getElementById("button-newTab");
      if (newTabButton) {
        console.log("Button already exists, not adding again.");
        return;
      }

      const searchInput = document.querySelector('input[name="search_query"]');
      if (!searchInput) {
        console.error("Search input not found.");
        return;
      }

      newTabButton = document.createElement("div");
      newTabButton.id = "button-newTab";
      newTabButton.setAttribute("aria-label", "Open search results in a new tab");

      // styling
      Object.assign(newTabButton.style, {
        display: "flex", // will be toggled immediately below
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

      // click visual feedback
      newTabButton.addEventListener("mousedown", () => {
        newTabButton.style.transform = "scale(0.95)";
      });
      newTabButton.addEventListener("mouseup", () => {
        newTabButton.style.transform = "scale(1)";
      });

      insertAfter(newTabButton, searchButton);

      // svg icon
      newTabButton.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 25" style="width: 75%; height: 75%;">
          <g>
            <path style="fill: currentColor" d="M18.8,13.7c-0.2,0-0.4,0.2-0.4,0.4v6.2H3.6V5.8h6.3c0.2,0,0.4-0.2,0.4-0.4S10.1,5,9.9,5H3.2C3,5,2.8,5.2,2.8,5.4v15.3c0,0.2,0.2,0.4,0.4,0.4h15.6c0.2,0,0.4-0.2,0.4-0.4v-6.6C19.2,13.9,19.1,13.7,18.8,13.7z"></path>
            <path style="fill: currentColor" d="M20.8,2.8h-6.7c-0.2,0-0.4,0.2-0.4,0.4s0.2,0.4,0.4,0.4h5.7L8.3,15.1c-0.2,0.2-0.2,0.4,0,0.6c0.1,0.1,0.2,0.1,0.3,0.1s0.2,0,0.3-0.1L20.4,4.3V10c0,0.2,0.2,0.4,0.4,0.4s0.4-0.2,0.4-0.4V3.3C21.2,3,21,2.8,20.8,2.8z"></path>
          </g>
        </svg>
      `;

      // show button only when there's text in the search input
      const setVisibility = () => {
        const hasText = !!(searchInput.value && searchInput.value.trim());
        newTabButton.style.display = hasText ? "flex" : "none";
        // keep aria-hidden in sync for accessibility
        newTabButton.setAttribute("aria-hidden", !hasText);
      };

      // initialize visibility based on current input value
      setVisibility();

      // listen for live changes to the search input
      const inputListener = () => {
        setVisibility();
      };
      searchInput.addEventListener("input", inputListener);

      // add debounced click handler
      newTabButton.addEventListener("click", () => {
        if (isProcessingClick) {
          console.log("Click already in progress, ignoring.");
          return;
        }

        if (clickDebounceTimer) {
          clearTimeout(clickDebounceTimer);
        }
        isProcessingClick = true;

        const queryTerm = searchInput.value.trim();
        if (queryTerm) {
          const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(queryTerm)}`;
          console.log(`Opening new tab with query: "${queryTerm}"`);
          browser.runtime.sendMessage({ url, timestamp: Date.now() });

          clickDebounceTimer = setTimeout(() => {
            isProcessingClick = false;
          }, 500);
        } else {
          console.warn("No search query entered");
          isProcessingClick = false;
        }
      });

      // store listener so it can be removed if you later remove the button (optional)
      newTabButton._cleanup = () => {
        try {
          searchInput.removeEventListener("input", inputListener);
        } catch (e) {
        }
      };
    } catch (error) {
      console.error("Error in addNewTabButton:", error);
      buttonAdded = false;
    }
  };

  const insertAfter = (newNode, referenceNode) => {
    if (!referenceNode || !referenceNode.parentNode) {
      console.error("Cannot insert after: Reference node missing.");
      return;
    }
    referenceNode.parentNode.insertBefore(newNode, referenceNode.nextSibling);
  };

  // reset state when URL changes
  const resetState = () => {
    buttonAdded = false;
    isProcessingClick = false;
    if (clickDebounceTimer) {
      clearTimeout(clickDebounceTimer);
      clickDebounceTimer = null;
    }
  };

  // use MutationObserver to detect DOM changes
  const setupMutationObserver = () => {
    // only observe the header area where search elements typically are
    const targetNode = document.querySelector('ytd-masthead') || document.body;
    if (!targetNode) return;

    const observer = new MutationObserver((mutations) => {
      if (!buttonAdded) {
        pollForSearchButton();
      }
    });

    observer.observe(targetNode, {
      childList: true,
      subtree: true
    });

    console.log("MutationObserver set up to detect DOM changes");
  };

  // re-run when URL changes
  const observeUrlChanges = () => {
    // helper to call when SPA navigation occurs
    const handleNav = () => {
      if (currentUrl !== window.location.href) {
        console.log("URL changed, rechecking for search button...");
        currentUrl = window.location.href;
        // remove existing button (and cleanup event listeners)
        const existingButton = document.getElementById("button-newTab");
        if (existingButton) {
          if (typeof existingButton._cleanup === "function") {
            existingButton._cleanup();
          }
          existingButton.remove();
        }
        resetState();
        pollForSearchButton();
      }
    };

    // override pushState/replaceState to detect SPA changes
    (function() {
      const origPush = history.pushState;
      const origReplace = history.replaceState;
      history.pushState = function(...args) {
        const res = origPush.apply(this, args);
        handleNav();
        return res;
      };
      history.replaceState = function(...args) {
        const res = origReplace.apply(this, args);
        handleNav();
        return res;
      };
      window.addEventListener("popstate", handleNav, { passive: true });
    })();
  };

  // clean up any existing buttons on script (re)load
  const cleanUpExistingButtons = () => {
    const existingButton = document.getElementById("button-newTab");
    if (existingButton) {
      existingButton.remove();
    }
    resetState();
  };

  // initialize
  cleanUpExistingButtons();
  observeUrlChanges();
  pollForSearchButton();
  setupMutationObserver();
})();