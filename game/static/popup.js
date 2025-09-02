const trivia = [
  { question: "What is Iron Man's real name?", answer: "tony stark" },
  { question: "Who is Thor's brother?", answer: "loki" },
  { question: "What is Captain America's shield made of?", answer: "vibranium" },
  { question: "Who says 'I am Groot'?", answer: "groot" }
];

const quotes = [
  "“I can do this all day.” – Captain America",
  "“I am Iron Man.” – Tony Stark",
  "“Hulk... SMASH!” – Hulk",
  "“Avengers, assemble!” – Captain America",
  "“Wakanda forever!” – T’Challa"
];

let currentTrivia;

// Show popup after 10 seconds
setTimeout(() => {
  showTrivia();
}, 10000); // 10 sec

function showTrivia() {
  document.getElementById("popup-overlay").style.display = "flex";
  currentTrivia = trivia[Math.floor(Math.random() * trivia.length)];
  document.getElementById("question").textContent = currentTrivia.question;
}

// Check answer
document.getElementById("submit-btn").addEventListener("click", () => {
  const userAnswer = document.getElementById("answer").value.trim().toLowerCase();
  const feedback = document.getElementById("feedback");
  const quoteBox = document.getElementById("quote");

  if (userAnswer === currentTrivia.answer) {
    feedback.textContent = "Correct!";
    feedback.style.color = "green";
    const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
    quoteBox.textContent = randomQuote;

    // Auto-close popup after 5 seconds
    setTimeout(closePopup, 5000);
  } else {
    feedback.textContent = "Try again!";
    feedback.style.color = "red";
  }
});

// Close popup function
function closePopup() {
  const feedback = document.getElementById("feedback");
  const quoteBox = document.getElementById("quote");
  document.getElementById("popup-overlay").style.display = "none";
  document.getElementById("answer").value = "";
  feedback.textContent = "";
  quoteBox.textContent = "";
}

// Cross button
document.getElementById("close-popup").addEventListener("click", closePopup);
