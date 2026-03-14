(function () {
  var STORAGE_SELECTION = "alevel_selection";
  var STORAGE_MOCK = "alevel_mock_config";

  function byId(id) {
    return document.getElementById(id);
  }

  function getData() {
    if (!window.EXAM_DATA) {
      throw new Error("EXAM_DATA is not loaded.");
    }
    return window.EXAM_DATA;
  }

  function parseQuery() {
    var params = {};
    var searchParams = new URLSearchParams(window.location.search);
    searchParams.forEach(function (value, key) {
      params[key] = value;
    });
    return params;
  }

  function toQueryString(obj) {
    var params = new URLSearchParams();
    Object.keys(obj).forEach(function (key) {
      if (obj[key] !== undefined && obj[key] !== null && obj[key] !== "") {
        params.set(key, obj[key]);
      }
    });
    return params.toString();
  }

  function saveJSON(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function readJSON(key) {
    var raw = localStorage.getItem(key);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch (err) {
      return null;
    }
  }

  function setError(id, message) {
    var el = byId(id);
    if (!el) return;
    el.textContent = message || "";
  }

  function fillSelect(select, options, placeholder) {
    select.innerHTML = "";
    var ph = document.createElement("option");
    ph.value = "";
    ph.textContent = placeholder || "Please select";
    select.appendChild(ph);
    options.forEach(function (item) {
      var option = document.createElement("option");
      option.value = item;
      option.textContent = item;
      select.appendChild(option);
    });
  }

  function initHomePage() {
    var data = getData();
    var gradeSelect = byId("grade");
    var boardSelect = byId("board");
    var subjectSelect = byId("subject");
    var paperSelect = byId("paper");
    var goAnalysisBtn = byId("goAnalysis");
    var goMockBtn = byId("goMock");

    fillSelect(gradeSelect, data.grades, "Choose grade");
    fillSelect(boardSelect, Object.keys(data.boards), "Choose exam board");

    function refreshSubjects() {
      var board = boardSelect.value;
      var subjects = board ? Object.keys(data.boards[board]) : [];
      fillSelect(subjectSelect, subjects, "Choose subject");
      fillSelect(paperSelect, [], "Choose paper");
    }

    function refreshPapers() {
      var board = boardSelect.value;
      var subject = subjectSelect.value;
      var papers = board && subject ? data.boards[board][subject] : [];
      fillSelect(paperSelect, papers || [], "Choose paper");
    }

    boardSelect.addEventListener("change", refreshSubjects);
    subjectSelect.addEventListener("change", refreshPapers);

    goAnalysisBtn.addEventListener("click", function () {
      window.location.href = "analysis.html";
    });

    goMockBtn.addEventListener("click", function () {
      var selection = {
        grade: gradeSelect.value,
        board: boardSelect.value,
        subject: subjectSelect.value,
        paper: paperSelect.value
      };
      if (!selection.grade || !selection.board || !selection.subject || !selection.paper) {
        setError("homeError", "Please complete grade, board, subject and paper first.");
        return;
      }
      setError("homeError", "");
      saveJSON(STORAGE_SELECTION, selection);
      window.location.href = "mock-config.html?" + toQueryString(selection);
    });

    var cache = readJSON(STORAGE_SELECTION);
    if (cache) {
      gradeSelect.value = cache.grade || "";
      boardSelect.value = cache.board || "";
      refreshSubjects();
      subjectSelect.value = cache.subject || "";
      refreshPapers();
      paperSelect.value = cache.paper || "";
    }
  }

  function initAnalysisPage() {
    var form = byId("analysisForm");
    var result = byId("analysisResult");
    var backBtn = byId("backHomeFromAnalysis");

    function analyze(input) {
      var combined = (input.studentAnswer + " " + input.correctAnswer).toLowerCase();
      var errorType = "Concept misunderstanding";
      if (combined.indexOf("sign") >= 0 || combined.indexOf("-") >= 0) {
        errorType = "Calculation accuracy issue";
      } else if (combined.indexOf("define") >= 0 || combined.indexOf("assume") >= 0) {
        errorType = "Question interpretation issue";
      }

      var knowledge = ["Core concept", "Method selection", "Final checking"];
      if (input.questionText.toLowerCase().indexOf("differentiat") >= 0) {
        knowledge = ["Calculus", "Derivative rules", "Algebra simplification"];
      } else if (input.questionText.toLowerCase().indexOf("trigon") >= 0) {
        knowledge = ["Trigonometry identities", "Equation solving", "Angle domain"];
      }

      return {
        errorType: errorType,
        knowledgePoints: knowledge,
        suggestions: [
          "Write a 3-step solving template before calculation.",
          "Keep one line for substitution checks to reduce careless mistakes.",
          "Create a 15-minute review loop for similar questions."
        ],
        nextPractice: "Practice 5 medium-level questions on the same topic, then 2 mixed-topic questions."
      };
    }

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      var questionText = byId("questionText").value.trim();
      var studentAnswer = byId("studentAnswer").value.trim();
      var correctAnswer = byId("correctAnswer").value.trim();
      var selfReason = byId("selfReason").value.trim();

      if (!questionText || !studentAnswer || !correctAnswer) {
        setError("analysisError", "Please fill all required fields.");
        result.innerHTML = "";
        return;
      }

      setError("analysisError", "");
      var output = analyze({
        questionText: questionText,
        studentAnswer: studentAnswer,
        correctAnswer: correctAnswer,
        selfReason: selfReason
      });

      result.innerHTML =
        '<div class="result-card">' +
        "<h3>Analysis Result (Demo)</h3>" +
        "<p><strong>Error Type:</strong> " + output.errorType + "</p>" +
        "<p><strong>Knowledge Points:</strong> " + output.knowledgePoints.join(", ") + "</p>" +
        "<p><strong>Improvement Suggestions:</strong></p>" +
        "<ul>" +
        output.suggestions.map(function (item) { return "<li>" + item + "</li>"; }).join("") +
        "</ul>" +
        "<p><strong>Next Practice Direction:</strong> " + output.nextPractice + "</p>" +
        "</div>";
    });

    backBtn.addEventListener("click", function () {
      window.location.href = "index.html";
    });
  }

  function initMockConfigPage() {
    var params = parseQuery();
    var fromCache = readJSON(STORAGE_SELECTION) || {};
    var selection = {
      grade: params.grade || fromCache.grade || "",
      board: params.board || fromCache.board || "",
      subject: params.subject || fromCache.subject || "",
      paper: params.paper || fromCache.paper || ""
    };

    byId("selectedGrade").textContent = selection.grade || "-";
    byId("selectedBoard").textContent = selection.board || "-";
    byId("selectedSubject").textContent = selection.subject || "-";
    byId("selectedPaper").textContent = selection.paper || "-";

    var knowledgeContainer = byId("knowledgePoints");
    var data = getData();
    var kps = data.knowledgePoints[selection.subject] || data.knowledgePoints.Mathematics;
    knowledgeContainer.innerHTML = "";

    kps.forEach(function (item, index) {
      var id = "kp_" + index;
      var label = document.createElement("label");
      label.className = "tag";
      label.setAttribute("for", id);

      var checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.value = item;
      checkbox.id = id;

      checkbox.addEventListener("change", function () {
        if (checkbox.checked) {
          label.classList.add("active");
        } else {
          label.classList.remove("active");
        }
      });

      label.appendChild(checkbox);
      label.appendChild(document.createTextNode(item));
      knowledgeContainer.appendChild(label);
    });

    var form = byId("mockConfigForm");
    form.addEventListener("submit", function (event) {
      event.preventDefault();

      if (!selection.grade || !selection.board || !selection.subject || !selection.paper) {
        setError("mockConfigError", "Missing source selection. Please return home and choose exam info.");
        return;
      }

      var count = byId("questionCount").value;
      var level = byId("difficulty").value;
      var qType = byId("questionType").value;
      var duration = byId("duration").value;
      var checked = Array.from(knowledgeContainer.querySelectorAll("input:checked")).map(function (item) {
        return item.value;
      });

      if (!count || !level || !qType || !duration) {
        setError("mockConfigError", "Please complete all required options.");
        return;
      }
      if (!checked.length) {
        setError("mockConfigError", "Please select at least one knowledge point.");
        return;
      }
      setError("mockConfigError", "");

      var payload = {
        grade: selection.grade,
        board: selection.board,
        subject: selection.subject,
        paper: selection.paper,
        count: count,
        level: level,
        knowledge: checked.join(", "),
        questionType: qType,
        duration: duration
      };

      saveJSON(STORAGE_MOCK, payload);
      window.location.href = "mock-result.html?" + toQueryString(payload);
    });

    byId("backHomeFromConfig").addEventListener("click", function () {
      window.location.href = "index.html";
    });
  }

  function initMockResultPage() {
    var params = parseQuery();
    var fromCache = readJSON(STORAGE_MOCK) || {};
    var result = {
      grade: params.grade || fromCache.grade || "-",
      board: params.board || fromCache.board || "-",
      subject: params.subject || fromCache.subject || "-",
      paper: params.paper || fromCache.paper || "-",
      count: params.count || fromCache.count || "-",
      level: params.level || fromCache.level || "-",
      knowledge: params.knowledge || fromCache.knowledge || "-",
      questionType: params.questionType || fromCache.questionType || "-",
      duration: params.duration || fromCache.duration || "-"
    };

    var list = byId("mockSummary");
    var fields = [
      ["Grade", result.grade],
      ["Exam Board", result.board],
      ["Subject", result.subject],
      ["Paper", result.paper],
      ["Question Count", result.count],
      ["Difficulty", result.level],
      ["Knowledge Points", result.knowledge],
      ["Question Type", result.questionType],
      ["Duration (mins)", result.duration]
    ];
    list.innerHTML = fields
      .map(function (pair) {
        return "<li><strong>" + pair[0] + ":</strong> " + pair[1] + "</li>";
      })
      .join("");

    var questionSection = byId("generatedQuestions");
    var answerSection = byId("answerKey");

    function shuffle(arr) {
      var copy = arr.slice();
      for (var i = copy.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var temp = copy[i];
        copy[i] = copy[j];
        copy[j] = temp;
      }
      return copy;
    }

    function pickQuestions(config) {
      var data = getData();
      var bank = (data.questionBank && data.questionBank[config.subject]) ? data.questionBank[config.subject] : [];
      var targetCount = parseInt(config.count, 10);
      if (!bank.length || isNaN(targetCount) || targetCount <= 0) return [];

      var selectedTopics = String(config.knowledge)
        .split(",")
        .map(function (item) { return item.trim(); })
        .filter(function (item) { return item.length > 0; });

      var desiredType = config.questionType;
      var desiredLevel = config.level;

      var strictPool = bank.filter(function (q) {
        var typeOk = desiredType === "Mixed" ? true : q.type === desiredType;
        var levelOk = desiredLevel === "Mixed" ? true : q.difficulty === desiredLevel;
        var topicOk = selectedTopics.length ? selectedTopics.indexOf(q.topic) >= 0 : true;
        var paperOk = config.paper ? q.paper === config.paper : true;
        return typeOk && levelOk && topicOk && paperOk;
      });

      var mediumPool = bank.filter(function (q) {
        var topicOk = selectedTopics.length ? selectedTopics.indexOf(q.topic) >= 0 : true;
        var paperOk = config.paper ? q.paper === config.paper : true;
        return topicOk && paperOk;
      });

      var broadPool = bank.filter(function (q) {
        return config.paper ? q.paper === config.paper : true;
      });

      var picked = [];
      var used = {};

      function pushFrom(pool) {
        var items = shuffle(pool);
        for (var i = 0; i < items.length && picked.length < targetCount; i++) {
          if (!used[items[i].id]) {
            picked.push(items[i]);
            used[items[i].id] = true;
          }
        }
      }

      pushFrom(strictPool);
      if (picked.length < targetCount) pushFrom(mediumPool);
      if (picked.length < targetCount) pushFrom(broadPool);
      if (picked.length < targetCount) pushFrom(bank);

      return picked.slice(0, targetCount);
    }

    var generated = pickQuestions(result);
    if (!generated.length) {
      questionSection.innerHTML = "<p class='hint'>No question bank available for this configuration yet.</p>";
      answerSection.innerHTML = "";
    } else {
      questionSection.innerHTML = generated
        .map(function (q, idx) {
          return (
            '<article class="q-card">' +
            "<h3>Q" + (idx + 1) + ". " + q.topic + " (" + q.marks + " marks)</h3>" +
            '<p class="q-meta">Paper: ' + q.paper + ' | Difficulty: ' + q.difficulty + ' | Type: ' + q.type + "</p>" +
            "<p>" + q.question + "</p>" +
            "</article>"
          );
        })
        .join("");

      answerSection.innerHTML = generated
        .map(function (q, idx) {
          return (
            '<article class="a-card">' +
            "<h4>Q" + (idx + 1) + " Answer</h4>" +
            "<p>" + q.answer + "</p>" +
            "</article>"
          );
        })
        .join("");
    }

    byId("backConfig").addEventListener("click", function () {
      window.location.href = "mock-config.html";
    });
    byId("backHomeFromResult").addEventListener("click", function () {
      window.location.href = "index.html";
    });
  }

  function boot() {
    var page = document.body.getAttribute("data-page");
    if (page === "home") initHomePage();
    if (page === "analysis") initAnalysisPage();
    if (page === "mock-config") initMockConfigPage();
    if (page === "mock-result") initMockResultPage();
  }

  document.addEventListener("DOMContentLoaded", boot);
})();
