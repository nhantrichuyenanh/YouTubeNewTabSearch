(() => {
  "use strict";
  let currentUrl = window.location.href;
  let buttonAdded = false;
  let isProcessingClick = false;
  let clickDebounceTimer = null;
  let pollIntervalId = null;
  let options = {
    urlFormat: 'search',
    debounceMs: 500,
    tabBehavior: 'background'
  };

  const loadOptions = async () => {
    try {
      const result = await browser.storage.sync.get(options);
      options = { ...options, ...result };
    } catch (error) {
    }
  };

  const generateSearchUrl = (query) => {
    if (options.urlFormat === 'hashtag') {
      return `https://www.youtube.com/hashtag/${encodeURIComponent(query.trim().split(/\s+/)[0])}`;
    } else {
      return `https://www.youtube.com/results?search_query=${encodeURIComponent(query).replace(/%20/g, '+')}`;
    }
  };

  const pollForSearchButton = () => {
    if (buttonAdded || pollIntervalId) return;
    const tryFind = () => {
      const searchButton =
        document.getElementById("search-icon-legacy") ||
        document.getElementById("search-btn") ||
        document.querySelector('input[name="search_query"]');

      if (searchButton) {
        clearInterval(pollIntervalId);
        pollIntervalId = null;
        addNewTabButton(searchButton);
        buttonAdded = true;
      }
    };

    tryFind();
    pollIntervalId = setInterval(tryFind, 300);
  };

  const addNewTabButton = (searchButton) => {
    try {
      if (!searchButton) return;
      let newTabButton = document.getElementById("button-newTab");
      if (newTabButton) return;
      const searchInput = document.querySelector('input[name="search_query"]');
      if (!searchInput) return;
      newTabButton = document.createElement("div");
      newTabButton.id = "button-newTab";
      newTabButton.setAttribute("aria-label", "Open search results in a new tab");

      Object.assign(newTabButton.style, {
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        width: "30px",
        height: "30px",
        flexShrink: "0",
        border: "1px solid var(--ytd-searchbox-legacy-button-border-color)",
        borderRadius: "5px",
        marginLeft: "5px",
        backgroundColor: "var(--ytd-searchbox-legacy-button-color)",
        cursor: "pointer",
        transition: "background-color 0.2s ease, box-shadow 0.2s ease, transform 0.1s ease"
      });

      newTabButton.addEventListener("mousedown", () => { newTabButton.style.transform = "scale(0.95)"; });
      newTabButton.addEventListener("mouseup", () => { newTabButton.style.transform = "scale(1)"; });
      insertAfter(newTabButton, searchButton);

      newTabButton.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 25" style="width: 75%; height: 75%;">
          <g>
            <path style="fill: currentColor" d="M18.8,13.7c-0.2,0-0.4,0.2-0.4,0.4v6.2H3.6V5.8h6.3c0.2,0,0.4-0.2,0.4-0.4S10.1,5,9.9,5H3.2C3,5,2.8,5.2,2.8,5.4v15.3c0,0.2,0.2,0.4,0.4,0.4h15.6c0.2,0,0.4-0.2,0.4-0.4v-6.6C19.2,13.9,19.1,13.7,18.8,13.7z"></path>
            <path style="fill: currentColor" d="M20.8,2.8h-6.7c-0.2,0-0.4,0.2-0.4,0.4s0.2,0.4,0.4,0.4h5.7L8.3,15.1c-0.2,0.2-0.2,0.4,0,0.6c0.1,0.1,0.2,0.1,0.3,0.1s0.2,0,0.3-0.1L20.4,4.3V10c0,0.2,0.2,0.4,0.4,0.4s0.4-0.2,0.4-0.4V3.3C21.2,3,21,2.8,20.8,2.8z"></path>
          </g>
        </svg>
      `;

      const setVisibility = () => {
        const hasText = !!(searchInput.value && searchInput.value.trim());
        newTabButton.style.display = hasText ? "flex" : "none";
        newTabButton.setAttribute("aria-hidden", !hasText);
      };

      setVisibility();
      const inputListener = () => setVisibility();
      searchInput.addEventListener("input", inputListener);

      newTabButton.addEventListener("click", () => {
        if (isProcessingClick) return;
        if (clickDebounceTimer) clearTimeout(clickDebounceTimer);
        isProcessingClick = true;
        const queryTerm = searchInput.value.trim();
        if (queryTerm) {
          const url = generateSearchUrl(queryTerm);
          browser.runtime.sendMessage({
            url,
            timestamp: Date.now(),
            tabBehavior: options.tabBehavior
          });
          clickDebounceTimer = setTimeout(() => { isProcessingClick = false; }, options.debounceMs);
        } else {
          isProcessingClick = false;
        }
      });

      newTabButton._cleanup = () => {
        try { searchInput.removeEventListener("input", inputListener); } catch (e) {}
      };
    } catch (error) {
      buttonAdded = false;
    }
  };

  const clickToSearch = () => {
    const SUG_SELECTOR = '[role="option"], .ytSuggestionComponentText';
    function getSuggestionText(el) {
      if (!el) return '';
      const aria = el.getAttribute && el.getAttribute('aria-label');
      if (aria && aria.trim()) return aria.trim();
      return (el.innerText || el.textContent || '').trim();
    }

    function openSuggestionInNewTab(el) {
      const q = getSuggestionText(el);
      if (!q) return;
      const url = generateSearchUrl(q);
      browser.runtime.sendMessage({
        url,
        timestamp: Date.now(),
        tabBehavior: options.tabBehavior
      });
    }

    function onClick(e) {
      if (e.button !== 0) return;
      if (!(e.ctrlKey || e.metaKey)) return;
      const opt = e.target.closest(SUG_SELECTOR);
      if (!opt) return;
      e.preventDefault();
      e.stopImmediatePropagation();
      openSuggestionInNewTab(opt);
    }

    function onAuxClick(e) {
      if (e.button !== 1) return;
      const opt = e.target.closest(SUG_SELECTOR);
      if (!opt) return;
      e.preventDefault();
      e.stopImmediatePropagation();
      openSuggestionInNewTab(opt);
    }

    function onMouseDown(e) {
      const isMiddle = e.button === 1;
      const isCtrlLeft = e.button === 0 && (e.ctrlKey || e.metaKey);
      if (!isMiddle && !isCtrlLeft) return;
      const opt = e.target.closest(SUG_SELECTOR);
      if (!opt) return;
      e.preventDefault();
      e.stopImmediatePropagation();
    }

    document.removeEventListener('click', onClick, true);
    document.removeEventListener('auxclick', onAuxClick, true);
    document.removeEventListener('mousedown', onMouseDown, true);
    document.addEventListener('click', onClick, true);
    document.addEventListener('auxclick', onAuxClick, true);
    document.addEventListener('mousedown', onMouseDown, true);
  };

  const insertAfter = (newNode, referenceNode) => {
    if (!referenceNode || !referenceNode.parentNode) return;
    referenceNode.parentNode.insertBefore(newNode, referenceNode.nextSibling);
  };

  const resetState = () => {
    buttonAdded = false;
    isProcessingClick = false;
    if (clickDebounceTimer) { clearTimeout(clickDebounceTimer); clickDebounceTimer = null; }
  };

  const setupMutationObserver = () => {
    const targetNode = document.querySelector('ytd-masthead') || document.body;
    if (!targetNode) return;
    const observer = new MutationObserver((mutations) => {
      if (!buttonAdded) pollForSearchButton();
    });
    observer.observe(targetNode, { childList: true, subtree: true });
  };

  const observeUrlChanges = () => {
    const handleNav = () => {
      if (currentUrl !== window.location.href) {
        currentUrl = window.location.href;
        const existingButton = document.getElementById("button-newTab");
        if (existingButton) {
          if (typeof existingButton._cleanup === "function") existingButton._cleanup();
          existingButton.remove();
        }
        resetState();
        pollForSearchButton();
        clickToSearch();
      }
    };
    (function() {
      const origPush = history.pushState;
      const origReplace = history.replaceState;
      history.pushState = function(...args) { const res = origPush.apply(this, args); handleNav(); return res; };
      history.replaceState = function(...args) { const res = origReplace.apply(this, args); handleNav(); return res; };
      window.addEventListener("popstate", handleNav, { passive: true });
    })();
  };

  const cleanUpExistingButtons = () => {
    const existingButton = document.getElementById("button-newTab");
    if (existingButton) existingButton.remove();
    resetState();
  };

  browser.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'sync') loadOptions();
  });

  const initialize = async () => {
    await loadOptions();
    cleanUpExistingButtons();
    observeUrlChanges();
    pollForSearchButton();
    setupMutationObserver();
    clickToSearch();
  };
  initialize();
})();
