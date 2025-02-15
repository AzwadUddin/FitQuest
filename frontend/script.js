// script.js
let exp = 0;
let rank = 'E';

// Define EXP thresholds for each rank
const rankThresholds = {
  'E': 0,
  'D': 50,
  'C': 150,
  'B': 300,
  'A': 500
};

// Listen for form submission
document.getElementById('workout-form').addEventListener('submit', function(e) {
  e.preventDefault();
  
  const type = document.getElementById('workout-type').value;
  const amount = parseInt(document.getElementById('workout-amount').value);
  
  // Basic EXP calculation: add the workout amount to current EXP
  exp += amount;
  
  updateRank();
  updateDisplay();
  
  // Clear form inputs
  document.getElementById('workout-type').value = '';
  document.getElementById('workout-amount').value = '';
});

// Update the rank based on current EXP
function updateRank() {
  if(exp >= rankThresholds['A']) {
    rank = 'A';
  } else if(exp >= rankThresholds['B']) {
    rank = 'B';
  } else if(exp >= rankThresholds['C']) {
    rank = 'C';
  } else if(exp >= rankThresholds['D']) {
    rank = 'D';
  } else {
    rank = 'E';
  }
}

// Update the EXP and rank displays, and refresh leaderboard
function updateDisplay() {
  document.getElementById('exp-display').innerText = `EXP: ${exp}`;
  document.getElementById('rank-display').innerText = `Rank: ${rank}`;
  
  // Dummy leaderboard data for demonstration
  const leaderboardList = document.getElementById('leaderboard-list');
  leaderboardList.innerHTML = `
    <li>You: ${exp} EXP (${rank})</li>
    <li>Alice: ${exp + 20} EXP</li>
    <li>Bob: ${exp - 10} EXP</li>
  `;
}
