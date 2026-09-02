(function () {
  "use strict";

  const STORAGE_KEY = "yojijukugo-learned-v1";

  const els = {
    card: document.getElementById("card"),
    cardInner: document.getElementById("card-inner"),
    kanji: document.getElementById("card-kanji"),
    kanjiSmall: document.getElementById("card-kanji-small"),
    reading: document.getElementById("card-reading"),
    meaning: document.getElementById("card-meaning"),
    learnedBadge: document.getElementById("learned-badge"),
    prevBtn: document.getElementById("prev-btn"),
    nextBtn: document.getElementById("next-btn"),
    learnedBtn: document.getElementById("learned-btn"),
    unlearnedBtn: document.getElementById("unlearned-btn"),
    shuffleBtn: document.getElementById("shuffle-btn"),
    listBtn: document.getElementById("list-btn"),
    filterCheckbox: document.getElementById("filter-unlearned"),
    progressText: document.getElementById("progress-text"),
    positionText: document.getElementById("position-text"),
    progressFill: document.getElementById("progress-fill"),
    emptyMessage: document.getElementById("empty-message"),
    cardArea: document.querySelector(".card-area"),
    controlsBottom: document.querySelector(".controls-bottom"),
    listModal: document.getElementById("list-modal"),
    closeModalBtn: document.getElementById("close-modal-btn"),
    searchInput: document.getElementById("search-input"),
    idiomList: document.getElementById("idiom-list"),
  };

  let learned = loadLearned();
  let order = YOJIJUKUGO_DATA.map((_, i) => i);
  let visibleOrder = order.slice();
  let currentPos = 0;

  function loadLearned() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? new Set(JSON.parse(raw)) : new Set();
    } catch (e) {
      return new Set();
    }
  }

  function saveLearned() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...learned]));
    } catch (e) {
      /* localStorage unavailable; progress won't persist */
    }
  }

  function isLearned(index) {
    return learned.has(YOJIJUKUGO_DATA[index].kanji);
  }

  function recomputeVisibleOrder() {
    const onlyUnlearned = els.filterCheckbox.checked;
    visibleOrder = order.filter((i) => !onlyUnlearned || !isLearned(i));
    if (currentPos >= visibleOrder.length) currentPos = 0;
  }

  function currentIndex() {
    return visibleOrder[currentPos];
  }

  function render() {
    recomputeVisibleOrder();

    const total = YOJIJUKUGO_DATA.length;
    const learnedCount = learned.size;
    els.progressText.textContent = `${learnedCount} / ${total} 覚えた`;
    els.progressFill.style.width = `${(learnedCount / total) * 100}%`;

    if (visibleOrder.length === 0) {
      els.emptyMessage.hidden = false;
      els.cardArea.style.display = "none";
      els.controlsBottom.style.display = "none";
      els.positionText.textContent = `0 / 0`;
      return;
    }

    els.emptyMessage.hidden = true;
    els.cardArea.style.display = "";
    els.controlsBottom.style.display = "";

    const idx = currentIndex();
    const item = YOJIJUKUGO_DATA[idx];

    els.card.classList.remove("is-flipped");
    els.kanji.textContent = item.kanji;
    els.kanjiSmall.textContent = item.kanji;
    els.reading.textContent = item.reading;
    els.meaning.textContent = item.meaning;
    els.learnedBadge.hidden = !isLearned(idx);
    els.positionText.textContent = `${currentPos + 1} / ${visibleOrder.length}`;
  }

  function goTo(pos) {
    if (visibleOrder.length === 0) return;
    currentPos = (pos + visibleOrder.length) % visibleOrder.length;
    render();
  }

  function next() { goTo(currentPos + 1); }
  function prev() { goTo(currentPos - 1); }

  function flip() {
    if (visibleOrder.length === 0) return;
    els.card.classList.toggle("is-flipped");
  }

  function markLearned(isLearnedFlag) {
    if (visibleOrder.length === 0) return;
    const idx = currentIndex();
    const kanji = YOJIJUKUGO_DATA[idx].kanji;
    if (isLearnedFlag) {
      learned.add(kanji);
    } else {
      learned.delete(kanji);
    }
    saveLearned();
    next();
  }

  function shuffle() {
    for (let i = order.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [order[i], order[j]] = [order[j], order[i]];
    }
    currentPos = 0;
    render();
  }

  function openList() {
    els.listModal.hidden = false;
    els.searchInput.value = "";
    renderList("");
    els.searchInput.focus();
  }

  function closeList() {
    els.listModal.hidden = true;
  }

  function renderList(query) {
    const q = query.trim().toLowerCase();
    els.idiomList.innerHTML = "";
    YOJIJUKUGO_DATA.forEach((item, idx) => {
      const haystack = `${item.kanji}${item.reading}${item.meaning}`.toLowerCase();
      if (q && !haystack.includes(q)) return;

      const li = document.createElement("li");
      li.innerHTML = `
        <div class="item-main">
          <span class="item-kanji">${item.kanji}</span>
          <span class="item-reading">${item.reading}</span>
        </div>
        <span class="item-check">${isLearned(idx) ? "✓" : ""}</span>
      `;
      li.addEventListener("click", () => {
        const pos = visibleOrder.indexOf(idx);
        if (pos !== -1) {
          currentPos = pos;
        } else {
          els.filterCheckbox.checked = false;
          recomputeVisibleOrder();
          currentPos = visibleOrder.indexOf(idx);
        }
        render();
        closeList();
      });
      els.idiomList.appendChild(li);
    });
  }

  els.card.addEventListener("click", flip);
  els.card.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      flip();
    }
  });

  els.prevBtn.addEventListener("click", prev);
  els.nextBtn.addEventListener("click", next);
  els.learnedBtn.addEventListener("click", () => markLearned(true));
  els.unlearnedBtn.addEventListener("click", () => markLearned(false));
  els.shuffleBtn.addEventListener("click", shuffle);
  els.filterCheckbox.addEventListener("change", () => {
    currentPos = 0;
    render();
  });

  els.listBtn.addEventListener("click", openList);
  els.closeModalBtn.addEventListener("click", closeList);
  els.listModal.addEventListener("click", (e) => {
    if (e.target === els.listModal) closeList();
  });
  els.searchInput.addEventListener("input", (e) => renderList(e.target.value));

  document.addEventListener("keydown", (e) => {
    if (!els.listModal.hidden) return;
    if (e.key === "ArrowRight") next();
    if (e.key === "ArrowLeft") prev();
  });

  render();
})();
