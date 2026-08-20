const API_URL = "http://127.0.0.1:8000";

export async function generateTests(code, count, description) {
  const response = await fetch(`${API_URL}/generate-tests`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      code,
      count: Number(count),
      description: description || null,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail?.message || "Failed to generate tests");
  }

  return response.json();
}

export async function runTests(code, tests) {
  const response = await fetch(`${API_URL}/run-tests`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      code,
      tests,
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to run tests");
  }

  return response.json();
}