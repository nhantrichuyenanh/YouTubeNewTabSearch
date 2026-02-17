(() => {
  "use strict";

  const DEFAULT_OPTIONS = {
    urlFormat: 'search',
    debounceMs: 500,
    tabBehavior: 'background',
    clearAfterClick: false,
  };

  const urlSearch = document.getElementById('url-search');
  const urlHashtag = document.getElementById('url-hashtag');
  const tabBackground = document.getElementById('tab-background');
  const tabForeground = document.getElementById('tab-foreground');
  const debounceRange = document.getElementById('debounceRange');
  const debounceValue = document.getElementById('debounceValue');
  const clearAfterClickCheckbox = document.getElementById('clear-after-click');

  let saveTimer = null;

  const loadOptions = async () => {
    try {
      const result = await browser.storage.sync.get(DEFAULT_OPTIONS);
      const opts = Object.assign({}, DEFAULT_OPTIONS, result);

      if (opts.urlFormat === 'hashtag') {
        urlHashtag.checked = true;
      } else {
        urlSearch.checked = true;
      }

      if (opts.tabBehavior === 'foreground') {
        tabForeground.checked = true;
      } else {
        tabBackground.checked = true;
      }

      debounceRange.value = opts.debounceMs;
      debounceValue.textContent = `${opts.debounceMs}ms`;

      clearAfterClickCheckbox.checked = !!opts.clearAfterClick;
    } catch (err) {
    }
  };

  const saveOptions = async (opts) => {
    try {
      await browser.storage.sync.set(opts);
    } catch (err) {
    }
  };

  const persistFromUI = () => {
    const opts = {
      urlFormat: document.querySelector('input[name="urlFormat"]:checked')?.value || DEFAULT_OPTIONS.urlFormat,
      debounceMs: clamp(parseInt(debounceRange.value, 10) || DEFAULT_OPTIONS.debounceMs, 0, 1000),
      tabBehavior: document.querySelector('input[name="tabBehavior"]:checked')?.value || DEFAULT_OPTIONS.tabBehavior,
      clearAfterClick: clearAfterClickCheckbox.checked,
    };
    saveOptions(opts);
  };

  const clamp = (v, a, b) => {
    if (Number.isNaN(v)) return a;
    return Math.min(Math.max(v, a), b);
  };

  const onRadioChange = () => {
    persistFromUI();
  };

  const onRangeInput = () => {
    debounceValue.textContent = `${debounceRange.value}ms`;
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      persistFromUI();
      saveTimer = null;
    }, 300);
  };

  const init = () => {
    loadOptions();

    document.querySelectorAll('input[name="urlFormat"]').forEach(r => r.addEventListener('change', onRadioChange));
    document.querySelectorAll('input[name="tabBehavior"]').forEach(r => r.addEventListener('change', onRadioChange));

    debounceRange.addEventListener('input', onRangeInput);
    clearAfterClickCheckbox.addEventListener('change', onRadioChange);

    browser.storage.onChanged.addListener((changes, area) => {
      if (area === 'sync') {
        loadOptions();
      }
    });
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();