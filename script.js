// --- यहाँ रैंडम करने वाला नया फंक्शन जोड़ा गया है ---
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

// ग्लोबल वेरिएबल्स
let questions = [];
let currentIndex = 0;
let score = 0;
let timerInterval;
let attemptedCount = 0;

// localStorage से यूजर का नाम सुरक्षित रूप से प्राप्त करें
const userData = JSON.parse(localStorage.getItem("deepStudyUser"));
const userName = userData ? userData.name : "User";

// URL से विषय और टॉपिक प्राप्त करें
const urlParams = new URLSearchParams(window.location.search);
const subject = urlParams.get("subject");
const topic = urlParams.get("topic");

// --- क्विज़ रिज्यूम करने का लॉजिक ---
const savedProgress = JSON.parse(localStorage.getItem('quizProgress'));

if (savedProgress && savedProgress.subject === subject && savedProgress.topic === topic) {
  currentIndex = savedProgress.currentIndex;
  score = savedProgress.score;
  attemptedCount = savedProgress.attemptedCount || 0;
}

// प्रश्नों वाली JSON फ़ाइल को लोड करें
fetch(`subjects/${subject}/${topic}.json`)
  .then(res => {
    if (!res.ok) { throw new Error('Network response was not ok'); }
    return res.json();
  })
  .then(data => {
    let fetchedQuestions = data.questions;
    shuffleArray(fetchedQuestions);
    questions = fetchedQuestions;

    document.getElementById("topic-name").textContent = "📖 " + data.topic;
    showQuestion();
    startTimer();
  })
  .catch(error => {
    console.error('Failed to load quiz:', error);
    document.querySelector(".quiz-container").innerHTML = `<h2>प्रश्न लोड करने में विफल।</h2>`;
  });

// प्रश्न और विकल्प दिखाने वाला फंक्शन
function showQuestion() {
  // नया बदलाव: क्विज़ चलने के दौरान Back बटन को छिपा दें
  document.querySelector('.back-btn').style.display = 'none';

  if (currentIndex >= questions.length) {
    endQuiz();
    return;
  }
  let q = questions[currentIndex];
  document.getElementById("question-box").textContent = `Q${currentIndex + 1}. ${q.question}`;
  let optionsDiv = document.getElementById("options");
  optionsDiv.innerHTML = "";

  q.options.forEach(opt => {
    let btn = document.createElement("button");
    btn.className = "option-btn";
    btn.textContent = opt;
    btn.onclick = () => checkAnswer(btn, q.answer);
    optionsDiv.appendChild(btn);
  });

  const skipBtn = document.createElement("button");
  skipBtn.className = "option-btn skip";
  skipBtn.textContent = "Skip ❓";
  skipBtn.onclick = () => nextQuestion();
  optionsDiv.appendChild(skipBtn);
}

// उत्तर की जाँच करने वाला फंक्शन
function checkAnswer(selectedBtn, correct) {
  attemptedCount++;
  document.querySelectorAll(".option-btn").forEach(btn => {
    btn.disabled = true;
    if (btn.textContent === correct) {
      btn.classList.add("correct");
      if (btn === selectedBtn) {
        score++;
        showMessage();
      }
    } else if (btn === selectedBtn) {
      btn.classList.add("wrong", "shake");
    }
  });

  setTimeout(() => {
    nextQuestion();
  }, 800);
}

// अगला प्रश्न दिखाने वाला फंक्शन
function nextQuestion() {
  const progress = {
    subject: subject,
    topic: topic,
    currentIndex: currentIndex + 1,
    score: score,
    attemptedCount: attemptedCount
  };
  localStorage.setItem('quizProgress', JSON.stringify(progress));

  currentIndex++;
  showQuestion();
}

// endQuiz फंक्शन
function endQuiz() {
  const totalQuestions = questions.length;
  const correctAnswers = score;
  const attemptedQuestions = attemptedCount;
  const wrongAnswers = attemptedQuestions - correctAnswers;
  const unattemptedQuestions = totalQuestions - attemptedQuestions;
  const percentage = totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0;

  let message = "";
  if (percentage >= 80) {
    message = `🎉 शाबाश, ${userName}! बेहतरीन प्रदर्शन!`;
  } else if (percentage >= 60) {
    message = `👍 बहुत अच्छा, ${userName}! आप सही रास्ते पर हैं।`;
  } else if (percentage >= 40) {
    message = `😊 आपका प्रयास अच्छा रहा, थोड़ा और अभ्यास करें।`;
  } else {
    message = `💪 ${userName}, आपको अभी और मेहनत की जरूरत है।`;
  }

  const history = JSON.parse(localStorage.getItem('deepStudyHistory')) || [];
  const newResult = {
    subject: subject,
    topic: topic,
    score: correctAnswers,
    total: totalQuestions,
    date: new Date().toLocaleDateString("hi-IN", { day: 'numeric', month: 'long', year: 'numeric' })
  };
  history.push(newResult);
  localStorage.setItem('deepStudyHistory', JSON.stringify(history));
  localStorage.removeItem('quizProgress');

  // नया बदलाव: क्विज़ खत्म होने पर Back बटन को वापस दिखाएँ
  document.querySelector('.back-btn').style.display = 'block';

  clearInterval(timerInterval);
  document.querySelector(".quiz-container").style.display = "none";
  let resultBox = document.getElementById("result-box");
  resultBox.style.display = "block";

  resultBox.innerHTML = `
    <div class="result-card-details">
      <h3 class="result-topic">${topic.replace(/_/g, ' ').toUpperCase()}</h3>
      <p class="result-message">${message}</p>
      <div class="stats-container">
        <div class="stat-row">
          <span class="stat-label">कुल प्रश्न :</span>
          <span class="stat-value">${totalQuestions}</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">प्रयास किए :</span>
          <span class="stat-value">${attemptedQuestions}</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">सही उत्तर 👍:</span>
          <span class="stat-value correct">${correctAnswers}</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">गलत उत्तर 👎:</span>
          <span class="stat-value wrong">${wrongAnswers}</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">छोड़े गए प्रश्न :</span>
          <span class="stat-value unattempted">${unattemptedQuestions}</span>
        </div>
      </div>
    </div>
  `;
}

// टोस्ट नोटिफिकेशन दिखाने वाला फंक्शन
function showToast(message) {
  const toast = document.createElement("div");
  toast.className = "toast-notification";
  toast.textContent = message;
  document.body.appendChild(toast);

  setTimeout(() => toast.classList.add("show"), 100);

  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => toast.remove(), 500);
  }, 3000);
}

// स्कोर के आधार पर मैसेज दिखाने वाला फंक्शन
function showMessage() {
  if (score === 5) showToast("🎉 बहुत अच्छे, " + userName + "!");
  if (score === 10) showToast("👍 शानदार, " + userName + "!");
  if (score === 15) showToast("🚀 बेहतरीन प्रदर्शन, " + userName + "!");
}

// टॉपिक्स पेज पर वापस जाने वाला फंक्शन
function goBack() {
  window.location.href = `topics.html?subject=${subject}`;
}

// टाइमर शुरू करने वाला फंक्शन
function startTimer() {
  let timeLeft = 20 * 60; // 20 मिनट
  const timerEl = document.getElementById("timer");

  timerInterval = setInterval(() => {
    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      endQuiz();
      return;
    }
    let min = Math.floor(timeLeft / 60);
    let sec = timeLeft % 60;
    timerEl.textContent = `${min}:${sec < 10 ? "0" + sec : sec}`;
    timeLeft--;
  }, 1000);
}
