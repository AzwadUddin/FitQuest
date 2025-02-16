// backend/server.js
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs');

const app = express();
app.use(cors());
app.use(bodyParser.json());

const USERS_FILE = 'users.json';

// Load users from JSON file
function loadUsers() {
  if (fs.existsSync(USERS_FILE)) {
    return JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
  }
  return {};
}

// Save users to JSON file
function saveUsers(users) {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

let users = loadUsers(); // Load users at startup

const rankThresholds = { 'E': 0, 'D': 50000, 'C': 150000, 'B': 300000, 'A': 5000000 };

const challenges = {
  'D': { task: "Do 30 pushups", reward: 100 },
  'C': { task: "Run 1 mile", reward: 250 },
  'B': { task: "Do 50 sit-ups", reward: 500 },
  'A': { task: "Complete 3 different exercises", reward: 1000 }
};

function getRank(exp) {
  if (exp >= rankThresholds['A']) return 'A';
  if (exp >= rankThresholds['B']) return 'B';
  if (exp >= rankThresholds['C']) return 'C';
  if (exp >= rankThresholds['D']) return 'D';
  return 'E';
}

// ✅ Register a new user
app.post('/register', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: "Missing username or password" });

  if (users[username]) return res.status(400).json({ error: "User already exists" });

  users[username] = { password, exp: 0, workouts: [] };
  saveUsers(users);

  res.json({ message: "User registered successfully" });
});

app.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (!users[username] || users[username].password !== password) {
      return res.status(401).json({ error: "Invalid username or password" });
  }

  let currentRank = getRank(users[username].exp);
  let nextRankExp = getNextRankExp(users[username].exp);

  res.json({ 
      message: "Login successful", 
      exp: users[username].exp, 
      rank: currentRank,
      nextRankExp: nextRankExp
  });
});

app.post('/workout', (req, res) => {
  const { username, workoutType, amount } = req.body;

  if (!users[username]) {
      return res.status(400).json({ error: "User not found!" });
  }

  let previousRank = getRank(users[username].exp); // Store previous rank
  users[username].exp += amount;
  users[username].rank = getRank(users[username].exp); // Update rank

  let nextRankExp = getNextRankExp(users[username].exp);
  let newRank = users[username].rank;

  let challenge = null;

  // ✅ If rank increased, assign a new challenge
  if (newRank !== previousRank && challenges[newRank]) {
      challenge = challenges[newRank]; // Send the challenge with response
      users[username].activeChallenge = challenge;
  }

  saveUsers(users);

  res.json({ 
      totalExp: users[username].exp, 
      rank: newRank,
      nextRankExp: nextRankExp,
      challenge: challenge // ✅ Include challenge in response
  });
});


// ✅ Function to get the EXP needed for the next rank
function getNextRankExp(exp) {
  let lastThreshold = 0;
  for (const rank in rankThresholds) {
      if (exp < rankThresholds[rank]) {
          return rankThresholds[rank];
      }
      lastThreshold = rankThresholds[rank];
  }
  return lastThreshold; // If at max rank, return the last threshold
}


  
// ✅ Fix: Correct Leaderboard Route
app.get('/leaderboard', (req, res) => {
  const leaderboard = Object.keys(users).map(username => ({
    username,
    exp: users[username].exp || 0,
    rank: getRank(users[username].exp)
  }));

  // Sort users by EXP in descending order
  leaderboard.sort((a, b) => b.exp - a.exp);

  res.json({ leaderboard }); // ✅ Send leaderboard in correct format
});



// ✅ Complete a challenge and add EXP
app.post('/complete-challenge', (req, res) => {
  const { username, reward } = req.body;

  if (!users[username]) {
      return res.status(400).json({ error: "User not found!" });
  }

  users[username].exp += reward; // ✅ Add challenge XP
  users[username].rank = getRank(users[username].exp); // ✅ Update rank

  // ✅ Remove the active challenge
  delete users[username].activeChallenge;

  saveUsers(users);

  res.json({ 
      totalExp: users[username].exp, 
      rank: users[username].rank 
  });
});

// ✅ Endpoint to fetch active challenge for a user
app.get('/challenge/:username', (req, res) => {
  const username = req.params.username;

  if (!users[username]) {
      return res.status(400).json({ error: "User not found!" });
  }

  const userRank = users[username].rank;
  const activeChallenge = challenges[userRank] || null; // Get challenge for the user's rank

  res.json({ challenge: activeChallenge });
});

const PORT = 3000;

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
