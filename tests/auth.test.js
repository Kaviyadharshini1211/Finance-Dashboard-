const request = require("supertest");
const app = require("../src/app");
const { setupDB, clearDB, teardownDB, createUser } = require("./helpers");

beforeAll(async () => {
  process.env.JWT_SECRET = "test_secret_key";
  await setupDB();
});
afterEach(async () => await clearDB());
afterAll(async () => await teardownDB());

describe("POST /api/auth/register", () => {
  const validPayload = {
    name: "Alice",
    email: "alice@example.com",
    password: "password123",
  };

  it("should register a new user and return a token", async () => {
    const res = await request(app).post("/api/auth/register").send(validPayload);
    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty("token");
    expect(res.body.data.user.email).toBe(validPayload.email);
    expect(res.body.data.user).not.toHaveProperty("password");
  });

  it("should not register with a duplicate email", async () => {
    await request(app).post("/api/auth/register").send(validPayload);
    const res = await request(app).post("/api/auth/register").send(validPayload);
    expect(res.statusCode).toBe(409);
    expect(res.body.success).toBe(false);
  });

  it("should fail validation with missing fields", async () => {
    const res = await request(app).post("/api/auth/register").send({ email: "x@x.com" });
    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty("errors");
  });

  it("should fail with invalid email format", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ name: "Bob", email: "not-an-email", password: "abc123" });
    expect(res.statusCode).toBe(400);
  });

  it("should fail with password shorter than 6 characters", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ name: "Bob", email: "bob@example.com", password: "123" });
    expect(res.statusCode).toBe(400);
  });
});

describe("POST /api/auth/login", () => {
  beforeEach(async () => {
    await request(app).post("/api/auth/register").send({
      name: "Alice",
      email: "alice@example.com",
      password: "password123",
    });
  });

  it("should login with correct credentials and return a token", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "alice@example.com", password: "password123" });
    expect(res.statusCode).toBe(200);
    expect(res.body.data).toHaveProperty("token");
  });

  it("should reject wrong password", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "alice@example.com", password: "wrongpass" });
    expect(res.statusCode).toBe(401);
  });

  it("should reject non-existent email", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "ghost@example.com", password: "password123" });
    expect(res.statusCode).toBe(401);
  });
});

describe("GET /api/auth/me", () => {
  it("should return the current user when authenticated", async () => {
    const { token, user } = await createUser({ email: "me@example.com" });
    const res = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.data.user.email).toBe(user.email);
  });

  it("should return 401 without a token", async () => {
    const res = await request(app).get("/api/auth/me");
    expect(res.statusCode).toBe(401);
  });

  it("should return 401 with an invalid token", async () => {
    const res = await request(app)
      .get("/api/auth/me")
      .set("Authorization", "Bearer invalidtoken");
    expect(res.statusCode).toBe(401);
  });
});