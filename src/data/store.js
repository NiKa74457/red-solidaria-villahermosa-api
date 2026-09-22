const users = new Map();

function resetStore() {
  users.clear();
}

function listUsers() {
  return Array.from(users.values());
}

function getUserById(id) {
  return users.get(id) || null;
}

function getUserByEmail(email) {
  const normalized = String(email).toLowerCase();
  return listUsers().find((user) => user.email === normalized) || null;
}

function saveUser(user) {
  users.set(user.id, user);
  return user;
}

module.exports = {
  resetStore,
  listUsers,
  getUserById,
  getUserByEmail,
  saveUser,
};
