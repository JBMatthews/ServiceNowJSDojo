import express from "express";
import ivm from "isolated-vm";

const app = express();
app.use(express.json());

app.post("/run", async (req, res) => {
  const { code, tests } = req.body;

  const isolate = new ivm.Isolate({ memoryLimit: 128 }); // 128MB per isolate
  const context = await isolate.createContext();
  const jail = context.global;
  await jail.set("global", jail.derefInto());

  let results = [];

  try {
    // Compile user code
    const script = await isolate.compileScript(code);
    await script.run(context, { timeout: 1000 }); // 1s limit

    // Run each test
    for (let t of tests) {
      try {
        const testScript = await isolate.compileScript(t.call);
        const actual = await testScript.run(context, { timeout: 500 });

        if (t.type === "assertEquals" && actual !== t.expected) {
          throw new Error(`Expected ${t.expected}, got ${actual}`);
        }
        results.push({ pass: true, call: t.call });
      } catch (e) {
        results.push({ pass: false, call: t.call, error: e.message });
      }
    }
  } catch (e) {
    return res.json({
      status: "Error",
      results: [{ pass: false, error: "Execution failed: " + e.message }]
    });
  }

  const passed = results.filter(r => r.pass).length;
  const status = passed === tests.length ? "Passed" : "Failed";

  res.json({ status, results });
});

app.listen(3000, () => console.log("JS Runner listening on port 3000"));

