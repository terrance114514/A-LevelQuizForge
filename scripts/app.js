(function () {
  function getEl(id) {
    return document.getElementById(id);
  }

  function fillSelect(select, items) {
    select.innerHTML = "";
    items.forEach((item) => {
      const opt = document.createElement("option");
      opt.value = item;
      opt.textContent = item;
      select.appendChild(opt);
    });
  }

  function buildHome() {
    const gradeEl = getEl("grade");
    if (!gradeEl) return;

    const boardEl = getEl("board");
    const subjectEl = getEl("subject");
    const paperEl = getEl("paper");

    const data = window.CURRICULUM_DATA;
    fillSelect(gradeEl, data.grades);
    fillSelect(boardEl, Object.keys(data.boards));

    function refreshSubjects() {
      const board = boardEl.value;
      const subjects = Object.keys(data.boards[board]);
      fillSelect(subjectEl, subjects);
      refreshPapers();
    }

    function refreshPapers() {
      const board = boardEl.value;
      const subject = subjectEl.value;
      const papers = data.boards[board][subject] || [];
      fillSelect(paperEl, papers);
    }

    boardEl.addEventListener("change", refreshSubjects);
    subjectEl.addEventListener("change", refreshPapers);

    refreshSubjects();

    const packSelection = () => {
      const payload = {
        grade: gradeEl.value,
        board: boardEl.value,
        subject: subjectEl.value,
        paper: paperEl.value,
      };
      localStorage.setItem("alevel.selection", JSON.stringify(payload));
      return payload;
    };

    getEl("goGenerate").addEventListener("click", () => {
      packSelection();
      location.href = "pages/generate.html";
    });

    getEl("goAnalysis").addEventListener("click", () => {
      packSelection();
      location.href = "pages/analysis.html";
    });
  }

  window.ALevelApp = { fillSelect };
  buildHome();
})();
