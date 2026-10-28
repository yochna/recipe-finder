const request = require("supertest");
const { app, mongoose, models } = require("../server");
const { User, Favorite, Scan, Review } = models;

// Pull the JWT out of the Set-Cookie header so we can replay it as a Bearer
// token (the authenticate middleware accepts either cookie or Authorization).
const tokenFrom = (res) => {
  const cookies = res.headers["set-cookie"] || [];
  for (const c of cookies) {
    const m = /token=([^;]+)/.exec(c);
    if (m) return m[1];
  }
  return null;
};

let seq = 0;
const uniqueEmail = () => `user${Date.now()}_${seq++}@example.com`;

async function register(overrides = {}) {
  const payload = { name: "Test Cook", email: uniqueEmail(), password: "secret123", ...overrides };
  const res = await request(app).post("/api/auth/register").send(payload);
  return { token: tokenFrom(res), user: res.body.user, payload };
}

async function registerAdmin() {
  const { payload } = await register();
  await User.updateOne({ email: payload.email }, { role: "admin" });
  const login = await request(app).post("/api/auth/login").send(payload);
  return tokenFrom(login);
}

beforeAll(async () => {
  await mongoose.connect(process.env.MONGO_URI);
});

afterAll(async () => {
  await mongoose.disconnect();
});

beforeEach(async () => {
  await Promise.all([
    User.deleteMany({}),
    Favorite.deleteMany({}),
    Scan.deleteMany({}),
    Review.deleteMany({}),
  ]);
});

describe("Auth", () => {
  it("registers a user and returns a token without leaking the password", async () => {
    const res = await request(app).post("/api/auth/register")
      .send({ name: "Ada", email: uniqueEmail(), password: "secret123" });
    expect(res.status).toBe(201);
    expect(res.body.user).toMatchObject({ name: "Ada", role: "user" });
    expect(res.body.user.password).toBeUndefined();
    expect(tokenFrom(res)).toBeTruthy();
  });

  it("rejects a duplicate email", async () => {
    const { payload } = await register();
    const res = await request(app).post("/api/auth/register").send(payload);
    expect(res.status).toBe(409);
  });

  it("rejects a short password", async () => {
    const res = await request(app).post("/api/auth/register")
      .send({ name: "X", email: uniqueEmail(), password: "123" });
    expect(res.status).toBe(400);
  });

  it("rejects a wrong password on login", async () => {
    const { payload } = await register();
    const res = await request(app).post("/api/auth/login")
      .send({ email: payload.email, password: "wrongpass" });
    expect(res.status).toBe(401);
  });

  it("returns the current user for a valid token, 401 otherwise", async () => {
    const { token, user } = await register();
    const ok = await request(app).get("/api/auth/me").set("Authorization", `Bearer ${token}`);
    expect(ok.status).toBe(200);
    expect(ok.body.user.id).toBe(user.id);
    const no = await request(app).get("/api/auth/me");
    expect(no.status).toBe(401);
  });
});

describe("Favorites", () => {
  it("requires authentication", async () => {
    const res = await request(app).get("/api/favorites");
    expect(res.status).toBe(401);
  });

  it("creates, lists and deletes a favorite", async () => {
    const { token } = await register();
    const created = await request(app).post("/api/favorites")
      .set("Authorization", `Bearer ${token}`)
      .send({ recipeId: 12345, title: "Test Stew" });
    expect(created.status).toBe(201);

    const list = await request(app).get("/api/favorites").set("Authorization", `Bearer ${token}`);
    expect(list.body).toHaveLength(1);
    expect(list.body[0].recipeId).toBe(12345);

    const del = await request(app).delete("/api/favorites/12345").set("Authorization", `Bearer ${token}`);
    expect(del.status).toBe(200);
    const after = await request(app).get("/api/favorites").set("Authorization", `Bearer ${token}`);
    expect(after.body).toHaveLength(0);
  });

  it("rejects a favorite without a numeric recipeId", async () => {
    const { token } = await register();
    const res = await request(app).post("/api/favorites")
      .set("Authorization", `Bearer ${token}`)
      .send({ title: "No id" });
    expect(res.status).toBe(400);
  });
});

describe("Scan history", () => {
  it("requires authentication", async () => {
    expect((await request(app).post("/api/scans").send({ ingredients: ["a"] })).status).toBe(401);
    expect((await request(app).get("/api/scans")).status).toBe(401);
  });

  it("saves, filters by week and deletes a scan", async () => {
    const { token } = await register();
    const created = await request(app).post("/api/scans")
      .set("Authorization", `Bearer ${token}`)
      .send({ ingredients: ["Tomato", "tomato", " Basil "], recipeCount: 4 });
    expect(created.status).toBe(201);
    // deduped + lowercased + trimmed
    expect(created.body.ingredients).toEqual(["tomato", "basil"]);
    expect(created.body.recipeCount).toBe(4);

    const week = await request(app).get("/api/scans?days=7").set("Authorization", `Bearer ${token}`);
    expect(week.body).toHaveLength(1);

    const del = await request(app).delete(`/api/scans/${created.body._id}`).set("Authorization", `Bearer ${token}`);
    expect(del.status).toBe(200);
    expect((await request(app).get("/api/scans").set("Authorization", `Bearer ${token}`)).body).toHaveLength(0);
  });

  it("rejects an empty ingredient list", async () => {
    const { token } = await register();
    const res = await request(app).post("/api/scans")
      .set("Authorization", `Bearer ${token}`)
      .send({ ingredients: [] });
    expect(res.status).toBe(400);
  });
});

describe("Reviews + moderation", () => {
  it("requires authentication to submit", async () => {
    const res = await request(app).post("/api/reviews").send({ recipeId: 1, rating: 5 });
    expect(res.status).toBe(401);
  });

  it("rejects an out-of-range rating", async () => {
    const { token } = await register();
    const res = await request(app).post("/api/reviews")
      .set("Authorization", `Bearer ${token}`)
      .send({ recipeId: 1, rating: 9 });
    expect(res.status).toBe(400);
  });

  it("keeps new reviews pending until an admin approves them", async () => {
    const { token } = await register();
    const adminToken = await registerAdmin();

    const created = await request(app).post("/api/reviews")
      .set("Authorization", `Bearer ${token}`)
      .send({ recipeId: 777, recipeTitle: "Curry", rating: 5, comment: "Delicious" });
    expect(created.status).toBe(201);
    expect(created.body.status).toBe("pending");

    const before = await request(app).get("/api/reviews/recipe/777");
    expect(before.body.count).toBe(0);

    const approve = await request(app).patch(`/api/admin/reviews/${created.body._id}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ status: "approved" });
    expect(approve.status).toBe(200);
    expect(approve.body.status).toBe("approved");

    const after = await request(app).get("/api/reviews/recipe/777");
    expect(after.body.count).toBe(1);
    expect(after.body.avg).toBe(5);
  });

  it("updates an existing review instead of duplicating, and re-queues it", async () => {
    const { token } = await register();
    const first = await request(app).post("/api/reviews")
      .set("Authorization", `Bearer ${token}`)
      .send({ recipeId: 888, rating: 3, comment: "ok" });
    const second = await request(app).post("/api/reviews")
      .set("Authorization", `Bearer ${token}`)
      .send({ recipeId: 888, rating: 5, comment: "actually great" });
    expect(second.status).toBe(200); // update, not 201
    expect(second.body._id).toBe(first.body._id);
    expect(second.body.rating).toBe(5);
    expect(second.body.status).toBe("pending");
    expect(await Review.countDocuments({ recipeId: 888 })).toBe(1);
  });

  it("blocks non-admins from the moderation queue", async () => {
    const { token } = await register();
    const res = await request(app).get("/api/admin/reviews").set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(403);
  });
});

describe("Image proxy SSRF guard", () => {
  it("blocks a disallowed host", async () => {
    const res = await request(app).get("/api/image-proxy")
      .query({ url: "https://evil.internal.example.com/x.png" });
    expect(res.status).toBe(403);
  });

  it("blocks non-https schemes", async () => {
    const res = await request(app).get("/api/image-proxy")
      .query({ url: "http://images.unsplash.com/x.jpg" });
    expect(res.status).toBe(403);
  });

  it("requires a url", async () => {
    expect((await request(app).get("/api/image-proxy")).status).toBe(400);
  });
});
