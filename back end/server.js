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

const rankThresholds = { 'E': 0, 'D': 5000, 'C': 15000, 'B': 30000, 'A': 500000 };

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

// ✅ Login an existing user
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    if (!users[username] || users[username].password !== password) {
      return res.status(401).json({ error: "Invalid username or password" });
    }
    
    res.json({ message: "Login successful", exp: users[username].exp, rank: getRank(users[username].exp) });
  });

  const challenges = {
    'D': { task: "Do 30 pushups", reward: 100 },
    'C': { task: "Run 1 mile", reward: 250 },
    'B': { task: "Do 50 sit-ups", reward: 500 },
    'A': { task: "Complete 3 different exercises", reward: 1000 }
};

app.post('/workout', (req, res) => {
    const { username, workoutType, amount } = req.body;

    if (!users[username]) {
        return res.status(400).json({ error: "User not found!" });
    }

    const previousRank = users[username].rank;
    users[username].exp += amount;
    users[username].rank = getRank(users[username].exp);

    // ✅ Assign challenge only if the user is reaching the rank for the first time
    if (users[username].rank !== previousRank && challenges[users[username].rank]) {
        if (!users[username].completedChallenges) {
            users[username].completedChallenges = [];
        }

        // ✅ Only assign challenge if it's the user's first time reaching this rank
        if (!users[username].completedChallenges.includes(users[username].rank)) {
            users[username].activeChallenge = challenges[users[username].rank];
            users[username].completedChallenges.push(users[username].rank);
        }
    }

    saveUsers(users);

    res.json({ 
        totalExp: users[username].exp,
        rank: users[username].rank,
        workouts: users[username].workouts,
        challenge: users[username].activeChallenge || null // ✅ Ensure challenge is returned
    });
});




  
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
const PORT = 3000;

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
