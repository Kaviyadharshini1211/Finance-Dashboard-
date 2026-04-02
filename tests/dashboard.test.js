const request = require("supertest");
const app = require("../src/app");
const { setupDB, clearDB, teardownDB, createUser } = require("./helpers");

beforeAll(async () => {
  process.env.JWT_SECRET = "test_secret_key";
  await setupDB();
});
afterEach(async () => await clearDB());
afterAll(async () => await teardownDB());

const seedRecords = async (adminToken) => {
  const records = [
    { amount: 5000, type: "income", category: "salary" },
    { amount: 1000, type: "income", category: "freelance" },
    { amount: 200, type: "expense", category: "food" },
    { amount: 100, type: "expense", category: "transport" },
  ];
  for (const r of records) {
    await request(app)
      .post("/api/records")
      .set("Authorization", `Bearer ${adminToken}`)
      .send(r);
  }
};

describe("GET /api/dashboard/summary", () => {
  it("analyst can access summary", async () => {
    const { token } = await createUser({ email: "analyst@example.com", role: "analyst" });
    await seedRecords((await createUser({ email: "admin@example.com", role: "admin" })).token);

    const res = await request(app)
      .get("/api/dashboard/summary")
      .set("Authorization", `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.data).toHaveProperty("income");
    expect(res.body.data).toHaveProperty("expense");
    expect(res.body.data).toHaveProperty("netBalance");
    expect(res.body.data.income).toBe(6000);
    expect(res.body.data.expense).toBe(300);
    expect(res.body.data.netBalance).toBe(5700);
  });

  it("admin can access summary", async () => {
    const { token } = await createUser({ email: "admin@example.com", role: "admin" });
    const res = await request(app)
      .get("/api/dashboard/summary")
      .set("Authorization", `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
  });

  it("viewer cannot access summary", async () => {
    const { token } = await createUser({ email: "viewer@example.com", role: "viewer" });
    const res = await request(app)
      .get("/api/dashboard/summary")
      .set("Authorization", `Bearer ${token}`);
    expect(res.statusCode).toBe(403);
  });
});

describe("GET /api/dashboard/category-breakdown", () => {
  it("returns category breakdown for analyst", async () => {
    const admin = await createUser({ email: "admin@example.com", role: "admin" });
    const analyst = await createUser({ email: "analyst@example.com", role: "analyst" });
    await seedRecords(admin.token);

    const res = await request(app)
      .get("/api/dashboard/category-breakdown")
      .set("Authorization", `Bearer ${analyst.token}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.data).toHaveProperty("income");
    expect(res.body.data).toHaveProperty("expense");
    expect(Array.isArray(res.body.data.income)).toBe(true);
  });
});

describe("GET /api/dashboard/monthly-trends", () => {
  it("returns monthly trends", async () => {
    const { token } = await createUser({ email: "admin@example.com", role: "admin" });
    await seedRecords(token);

    const res = await request(app)
      .get("/api/dashboard/monthly-trends?months=6")
      .set("Authorization", `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });
});

describe("GET /api/dashboard/recent-activity", () => {
  it("returns recent records", async () => {
    const admin = await createUser({ email: "admin@example.com", role: "admin" });
    const analyst = await createUser({ email: "analyst@example.com", role: "analyst" });
    await seedRecords(admin.token);

    const res = await request(app)
      .get("/api/dashboard/recent-activity?limit=3")
      .set("Authorization", `Bearer ${analyst.token}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.data.records.length).toBeLessThanOrEqual(3);
  });
});

describe("RBAC - Role enforcement across routes", () => {
  it("viewer can read records but not create/update/delete", async () => {
    const admin = await createUser({ email: "admin@example.com", role: "admin" });
    const viewer = await createUser({ email: "viewer@example.com", role: "viewer" });

    // Create via admin
    const created = await request(app)
      .post("/api/records")
      .set("Authorization", `Bearer ${admin.token}`)
      .send({ amount: 100, type: "income", category: "salary" });
    const id = created.body.data.record._id;

    // Viewer can read
    const getAll = await request(app).get("/api/records").set("Authorization", `Bearer ${viewer.token}`);
    expect(getAll.statusCode).toBe(200);

    // Viewer cannot create
    const create = await request(app)
      .post("/api/records")
      .set("Authorization", `Bearer ${viewer.token}`)
      .send({ amount: 100, type: "income", category: "salary" });
    expect(create.statusCode).toBe(403);

    // Viewer cannot update
    const update = await request(app)
      .patch(`/api/records/${id}`)
      .set("Authorization", `Bearer ${viewer.token}`)
      .send({ amount: 999 });
    expect(update.statusCode).toBe(403);

    // Viewer cannot delete
    const del = await request(app)
      .delete(`/api/records/${id}`)
      .set("Authorization", `Bearer ${viewer.token}`);
    expect(del.statusCode).toBe(403);
  });

  it("analyst can read records and access dashboard but not modify records", async () => {
    const admin = await createUser({ email: "admin@example.com", role: "admin" });
    const analyst = await createUser({ email: "analyst@example.com", role: "analyst" });

    const created = await request(app)
      .post("/api/records")
      .set("Authorization", `Bearer ${admin.token}`)
      .send({ amount: 500, type: "expense", category: "food" });
    const id = created.body.data.record._id;

    // Analyst can read
    const read = await request(app).get("/api/records").set("Authorization", `Bearer ${analyst.token}`);
    expect(read.statusCode).toBe(200);

    // Analyst can access dashboard
    const dash = await request(app).get("/api/dashboard/summary").set("Authorization", `Bearer ${analyst.token}`);
    expect(dash.statusCode).toBe(200);

    // Analyst cannot create records
    const create = await request(app)
      .post("/api/records")
      .set("Authorization", `Bearer ${analyst.token}`)
      .send({ amount: 100, type: "income", category: "salary" });
    expect(create.statusCode).toBe(403);
  });
});