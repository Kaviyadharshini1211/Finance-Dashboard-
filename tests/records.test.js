const request = require("supertest");
const app = require("../src/app");
const { setupDB, clearDB, teardownDB, createUser } = require("./helpers");

beforeAll(async () => {
  process.env.JWT_SECRET = "test_secret_key";
  await setupDB();
}, 30000);
afterEach(async () => await clearDB(), 10000);
afterAll(async () => await teardownDB(), 15000);

const validRecord = {
  amount: 5000,
  type: "income",
  category: "salary",
  date: "2024-06-01",
  notes: "Monthly salary",
};

describe("POST /api/records", () => {
  it("admin can create a record", async () => {
    const { token } = await createUser({ email: "admin@example.com", role: "admin" });
    const res = await request(app)
      .post("/api/records")
      .set("Authorization", `Bearer ${token}`)
      .send(validRecord);
    expect(res.statusCode).toBe(201);
    expect(res.body.data.record.amount).toBe(5000);
    expect(res.body.data.record.type).toBe("income");
  });

  it("viewer cannot create a record", async () => {
    const { token } = await createUser({ email: "viewer@example.com", role: "viewer" });
    const res = await request(app)
      .post("/api/records")
      .set("Authorization", `Bearer ${token}`)
      .send(validRecord);
    expect(res.statusCode).toBe(403);
  });

  it("analyst cannot create a record", async () => {
    const { token } = await createUser({ email: "analyst@example.com", role: "analyst" });
    const res = await request(app)
      .post("/api/records")
      .set("Authorization", `Bearer ${token}`)
      .send(validRecord);
    expect(res.statusCode).toBe(403);
  });

  it("should fail with missing required fields", async () => {
    const { token } = await createUser({ email: "admin2@example.com", role: "admin" });
    const res = await request(app)
      .post("/api/records")
      .set("Authorization", `Bearer ${token}`)
      .send({ amount: 100 });
    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty("errors");
  });

  it("should fail with negative amount", async () => {
    const { token } = await createUser({ email: "admin3@example.com", role: "admin" });
    const res = await request(app)
      .post("/api/records")
      .set("Authorization", `Bearer ${token}`)
      .send({ ...validRecord, amount: -100 });
    expect(res.statusCode).toBe(400);
  });

  it("should fail with invalid category", async () => {
    const { token } = await createUser({ email: "admin4@example.com", role: "admin" });
    const res = await request(app)
      .post("/api/records")
      .set("Authorization", `Bearer ${token}`)
      .send({ ...validRecord, category: "invalid-category" });
    expect(res.statusCode).toBe(400);
  });
});

describe("GET /api/records", () => {
  let adminToken, viewerToken;

  beforeEach(async () => {
    const admin = await createUser({ email: "admin@example.com", role: "admin" });
    const viewer = await createUser({ email: "viewer@example.com", role: "viewer" });
    adminToken = admin.token;
    viewerToken = viewer.token;

    // Seed records
    await request(app)
      .post("/api/records")
      .set("Authorization", `Bearer ${adminToken}`)
      .send(validRecord);
    await request(app)
      .post("/api/records")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ amount: 200, type: "expense", category: "food" });
  });

  it("viewer can list all records", async () => {
    const res = await request(app)
      .get("/api/records")
      .set("Authorization", `Bearer ${viewerToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.data.records.length).toBe(2);
    expect(res.body.data).toHaveProperty("pagination");
  });

  it("can filter records by type", async () => {
    const res = await request(app)
      .get("/api/records?type=income")
      .set("Authorization", `Bearer ${viewerToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.data.records.every((r) => r.type === "income")).toBe(true);
  });

  it("can filter records by category", async () => {
    const res = await request(app)
      .get("/api/records?category=food")
      .set("Authorization", `Bearer ${viewerToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.data.records.every((r) => r.category === "food")).toBe(true);
  });

  it("supports pagination", async () => {
    const res = await request(app)
      .get("/api/records?page=1&limit=1")
      .set("Authorization", `Bearer ${viewerToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.data.records.length).toBe(1);
    expect(res.body.data.pagination.totalPages).toBe(2);
  });

  it("returns 401 without auth token", async () => {
    const res = await request(app).get("/api/records");
    expect(res.statusCode).toBe(401);
  });
});

describe("PATCH /api/records/:id", () => {
  it("admin can update a record", async () => {
    const { token } = await createUser({ email: "admin@example.com", role: "admin" });
    const created = await request(app)
      .post("/api/records")
      .set("Authorization", `Bearer ${token}`)
      .send(validRecord);
    const id = created.body.data.record._id;

    const res = await request(app)
      .patch(`/api/records/${id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ amount: 9999 });
    expect(res.statusCode).toBe(200);
    expect(res.body.data.record.amount).toBe(9999);
  });

  it("viewer cannot update a record", async () => {
    const admin = await createUser({ email: "admin@example.com", role: "admin" });
    const viewer = await createUser({ email: "viewer@example.com", role: "viewer" });
    const created = await request(app)
      .post("/api/records")
      .set("Authorization", `Bearer ${admin.token}`)
      .send(validRecord);
    const id = created.body.data.record._id;

    const res = await request(app)
      .patch(`/api/records/${id}`)
      .set("Authorization", `Bearer ${viewer.token}`)
      .send({ amount: 1 });
    expect(res.statusCode).toBe(403);
  });
});

describe("DELETE /api/records/:id (soft delete)", () => {
  it("admin can soft delete a record", async () => {
    const { token } = await createUser({ email: "admin@example.com", role: "admin" });
    const created = await request(app)
      .post("/api/records")
      .set("Authorization", `Bearer ${token}`)
      .send(validRecord);
    const id = created.body.data.record._id;

    const del = await request(app)
      .delete(`/api/records/${id}`)
      .set("Authorization", `Bearer ${token}`);
    expect(del.statusCode).toBe(200);

    // Record should no longer appear in list (soft deleted)
    const list = await request(app)
      .get("/api/records")
      .set("Authorization", `Bearer ${token}`);
    expect(list.body.data.records.find((r) => r._id === id)).toBeUndefined();
  });

  it("admin can restore a soft-deleted record", async () => {
    const { token } = await createUser({ email: "admin@example.com", role: "admin" });
    const created = await request(app)
      .post("/api/records")
      .set("Authorization", `Bearer ${token}`)
      .send(validRecord);
    const id = created.body.data.record._id;

    await request(app).delete(`/api/records/${id}`).set("Authorization", `Bearer ${token}`);
    const res = await request(app)
      .patch(`/api/records/${id}/restore`)
      .set("Authorization", `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.data.record.isDeleted).toBe(false);
  });
});