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

// ✅ Login an existing user
app.post('/workout', (req, res) => {
  const { username, workoutType, amount } = req.body;

  console.log(`Workout request received from ${username}: ${workoutType} - ${amount} reps`);

  if (!users[username]) {
    console.log("Error: User not found in database.");
    return res.status(400).json({ error: "User not logged in!" });
  }

  // Ensure the user has a workouts log
  if (!users[username].workouts) {
    users[username].workouts = [];
  }

  // Store the workout in the user’s data
  users[username].workouts.push({ type: workoutType, amount });

  // Update EXP & Rank
  users[username].exp += amount;  // Increase EXP
  users[username].rank = calculateRank(users[username].exp); // Calculate Rank based on EXP

  console.log(`Updated ${username}: EXP = ${users[username].exp}, Rank = ${users[username].rank}`);
  console.log(`Workouts logged:`, users[username].workouts);

  // Return updated user data, including the new EXP, Rank, and Workouts
  res.json({ 
    totalExp: users[username].exp, 
    rank: users[username].rank,
    workouts: users[username].workouts
  });
});

  

// ✅ Retrieve leaderboard
app.get('/leaderboard', (req, res) => {
  const leaderboard = Object.keys(users).map(username => ({
    username,
    exp: users[username].exp,
    rank: getRank(users[username].exp)
  }));
  
  leaderboard.sort((a, b) => b.exp - a.exp);
  res.json({ leaderboard });
});

const PORT = 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
