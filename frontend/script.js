let currentUser = null;

const rankThresholds = { 'E': 0, 'D': 50000, 'C': 150000, 'B': 300000, 'A': 5000000 };


// Function to show the workout section after login
function showWorkoutSection(username, exp, rank, nextRankExp) {
  currentUser = username;
  document.getElementById('user-display').innerText = username;
  document.getElementById('exp-display').innerText = `EXP: ${exp}`;
  document.getElementById('rank-display').innerText = `Rank: ${rank}`;
  
  updateXPProgress(exp, nextRankExp);

  document.getElementById('auth-section').style.display = 'none';
  document.getElementById('workout-section').style.display = 'block';
}




// Register user
document.getElementById('register-btn').addEventListener('click', async () => {
  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value.trim();

  if (!username || !password) {
    document.getElementById('auth-message').innerText = "Please enter a username and password.";
    return;
  }

  try {
    const res = await fetch('http://localhost:3000/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    const data = await res.json();
    console.log("Register response:", data);  // Debugging line

    document.getElementById('auth-message').innerText = data.message || data.error;

    if (data.message) {
      loginUser(username, password); // Automatically log in
    }
  } catch (error) {
    console.error("Error registering user:", error);
  }
});

// Login user
document.getElementById('login-btn').addEventListener('click', async () => {
  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value.trim();

  if (!username || !password) {
    document.getElementById('auth-message').innerText = "Please enter your login details.";
    return;
  }

  loginUser(username, password);
});

async function loginUser(username, password) {
  try {
    const res = await fetch('http://localhost:3000/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    const data = await res.json();
    console.log("Login response:", data);  // Debugging line

    if (data.message) {
      showWorkoutSection(username, data.exp, data.rank, data.nextRankExp);
    } else {
      document.getElementById('auth-message').innerText = data.error;
    }
  } catch (error) {
    console.error("Error logging in:", error);
  }
}



// Function to log in user and update UI
async function loginUser(username, password) {
  const res = await fetch('http://localhost:3000/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });

  const data = await res.json();
  if (data.message) {
    showWorkoutSection(username, data.exp, data.rank);
  } else {
    document.getElementById('auth-message').innerText = data.error;
  }
}

/// Log workout (only works when logged in)
// Function to log a workout and check for rank-up
document.getElementById("workout-form").addEventListener("submit", async (e) => {
  e.preventDefault();

  if (!currentUser) {
      console.error("User not logged in!");
      return;
  }

  const type = document.getElementById('workout-type').value;
  const amount = parseInt(document.getElementById('workout-amount').value);

  try {
      const res = await fetch("http://localhost:3000/workout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: currentUser, workoutType: type, amount })
      });

      const data = await res.json();

      if (data.error) {
          document.getElementById('workout-message').innerText = data.error;
          return;
      }

      // ✅ Update UI with new EXP and Rank
      document.getElementById('exp-display').innerText = `EXP: ${data.totalExp}`;
      document.getElementById('rank-display').innerText = `Rank: ${data.rank}`;
      updateXPProgress(data.totalExp, data.nextRankExp);
      updateAvatar(data.rank);

      updateLeaderboard();

      // ✅ Check for a challenge after rank-up
      checkForChallenge(currentUser);

  } catch (error) {
      console.error("Error logging workout:", error);
      document.getElementById('workout-message').innerText = "Failed to log workout.";
  }
});












// Function to check if user is already logged in (Persistent session using Local Storage)
function checkLogin() {
  const savedUser = localStorage.getItem("currentUser");
  if (savedUser) {
    fetch(`http://localhost:3000/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: savedUser, password: localStorage.getItem("userPassword") }) 
    })
    .then(res => res.json())
    .then(data => {
      if (data.message) {
        showWorkoutSection(savedUser, data.exp, data.rank);
      }
    });
  }
}

// Check login on page load
checkLogin();

// ✅ Fetch and display the leaderboard
function updateLeaderboard() {
  fetch('http://localhost:3000/leaderboard')
      .then(response => response.json())
      .then(data => {
          console.log("Leaderboard data received:", data); // Debugging

          const leaderboardSection = document.getElementById("leaderboard-list");
          leaderboardSection.innerHTML = ""; // Clear existing leaderboard

          if (data.leaderboard.length === 0) {
              leaderboardSection.innerHTML = "<p>No users found.</p>";
              return;
          }

          // Create leaderboard list
          data.leaderboard.forEach((user, index) => {
              const li = document.createElement("li");
              li.innerHTML = `<strong>#${index + 1} ${user.username}</strong> - EXP: ${user.exp} (Rank: ${user.rank})`;
              leaderboardSection.appendChild(li);
          });
      })
      .catch(error => {
          console.error("Error fetching leaderboard:", error);
          document.getElementById("leaderboard-list").innerHTML += "<p style='color:red;'>Failed to load leaderboard.</p>";
      });
}

// ✅ Load leaderboard when page loads
document.addEventListener("DOMContentLoaded", updateLeaderboard);

// ✅ Fetch and show the challenge
// ✅ Fetch and show the challenge when a user ranks up
// ✅ Fetch challenge for the logged-in user
async function checkForChallenge(username) {
  try {
      const res = await fetch(`http://localhost:3000/challenge/${username}`);
      if (!res.ok) throw new Error("Challenge not found");

      const data = await res.json();
      if (data.challenge) {
          showNotification(data.challenge);
      }
  } catch (error) {
      console.error("Error fetching challenge:", error);
  }
}


// ✅ Show Challenge Notification with Progress Bar
// ✅ Show Challenge Notification with Progress Bar
function showNotification(challenge) {
  const notification = document.createElement("div");
  notification.classList.add("notification");
  notification.innerHTML = `
      <p><strong>New Challenge Unlocked!</strong></p>
      <p>${challenge.task}</p>
      <div class="progress-bar">
          <div class="progress"></div>
      </div>
      <button onclick="completeChallenge(${challenge.reward})">Complete Challenge</button>
  `;

  document.body.appendChild(notification);

  // ✅ Animate progress bar over 10 seconds
  let progressBar = notification.querySelector(".progress");
  setTimeout(() => {
      progressBar.style.width = "100%";
  }, 100);

  // ✅ Auto-remove notification after 10 seconds
  setTimeout(() => {
      notification.remove();
  }, 10000);
}


// ✅ Complete Challenge and Claim XP
// ✅ Complete Challenge and Claim XP
function completeChallenge(reward) {
  fetch("http://localhost:3000/complete-challenge", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: currentUser, reward })
  })
  .then(response => response.json())
  .then(data => {
      // ✅ Update EXP and Rank in UI
      document.getElementById('exp-display').innerText = `EXP: ${data.totalExp}`;
      document.getElementById('rank-display').innerText = `Rank: ${data.rank}`;

      // ✅ Refresh Leaderboard
      updateLeaderboard();

      // ✅ Remove Challenge Notification
      document.querySelector(".notification").remove();

      alert(`Challenge completed! You earned ${reward} XP.`);
  })
  .catch(error => console.error("Error completing challenge:", error));
}




// ✅ Call challenge check after logging a workout
document.getElementById("workout-form").addEventListener("submit", async (e) => {
  e.preventDefault();

  if (!currentUser) {
      console.error("User not logged in!");
      return;
  }

  const type = document.getElementById('workout-type').value;
  const amount = parseInt(document.getElementById('workout-amount').value);

  try {
      const res = await fetch("http://localhost:3000/workout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: currentUser, workoutType: type, amount })
      });

      const data = await res.json();

      if (data.error) {
          document.getElementById('workout-message').innerText = data.error;
          return;
      }

      // ✅ Update UI with new EXP and Rank
      document.getElementById('exp-display').innerText = `EXP: ${data.totalExp}`;
      document.getElementById('rank-display').innerText = `Rank: ${data.rank}`;
      updateXPProgress(data.totalExp, data.nextRankExp);
      updateAvatar(data.rank);

      updateLeaderboard();

      // ✅ Show Challenge if one is received
      if (data.challenge) {
          showNotification(data.challenge);
      }

  } catch (error) {
      console.error("Error logging workout:", error);
      document.getElementById('workout-message').innerText = "Failed to log workout.";
  }
});


function updateXPProgress(exp, nextRankExp) {
  const progressBar = document.getElementById("xp-progress-bar");
  const progressLabel = document.getElementById("xp-progress-label");

  // ✅ Find the previous rank's threshold
  let previousThreshold = 0;
  for (const rank in rankThresholds) {
      if (exp < rankThresholds[rank]) {
          break;
      }
      previousThreshold = rankThresholds[rank];
  }

  if (nextRankExp === null) {
      progressBar.style.width = "100%";
      progressLabel.innerText = "Max Rank Reached!";
      return;
  }

  let progress = ((exp - previousThreshold) / (nextRankExp - previousThreshold)) * 100;
  progressBar.style.width = `${progress}%`;
  progressLabel.innerText = `Next Rank: ${exp}/${nextRankExp} XP`;
}

// Function to update the avatar based on rank
function updateAvatar(rank) {
  const avatarElement = document.getElementById("rank-avatar");
  const avatarImages = {
      'E': "Rank E.png",
      'D': "Rank D.png",
      'C': "Rank C.png",
      'B': "Rank B.png",
      'A': "Rank A.png"
  };

  avatarElement.src = avatarImages[rank];
}

// Update avatar when logging in
function showWorkoutSection(username, exp, rank, nextRankExp) {
  currentUser = username;
  document.getElementById('user-display').innerText = username;
  document.getElementById('exp-display').innerText = `EXP: ${exp}`;
  document.getElementById('rank-display').innerText = `Rank: ${rank}`;

  updateXPProgress(exp, nextRankExp);
  updateAvatar(rank);

  document.getElementById('auth-section').style.display = 'none';
  document.getElementById('workout-section').style.display = 'block';

  checkForChallenge(username); // ✅ Fetch challenge after login
}


// Update avatar when logging a workout
document.getElementById("workout-form").addEventListener("submit", async (e) => {
  e.preventDefault();

  if (!currentUser) {
      console.error("User not logged in!");
      return;
  }

  const type = document.getElementById('workout-type').value;
  const amount = parseInt(document.getElementById('workout-amount').value);

  try {
      const res = await fetch("http://localhost:3000/workout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: currentUser, workoutType: type, amount })
      });

      const data = await res.json();

      if (data.error) {
          document.getElementById('workout-message').innerText = data.error;
          return;
      }

      // ✅ Update UI with new EXP and Rank
      document.getElementById('exp-display').innerText = `EXP: ${data.totalExp}`;
      document.getElementById('rank-display').innerText = `Rank: ${data.rank}`;
      updateXPProgress(data.totalExp, data.nextRankExp);
      updateAvatar(data.rank);

      updateLeaderboard();

      // ✅ Fetch and show new challenge if the rank increased
      checkForChallenge(currentUser);

  } catch (error) {
      console.error("Error logging workout:", error);
      document.getElementById('workout-message').innerText = "Failed to log workout.";
  }
});

