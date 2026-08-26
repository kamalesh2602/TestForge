const API_URL = import.meta.env.VITE_API_URL;


export async function generateTests(
  code,
  count,
  description,
  language,
) {
  const response = await fetch(
    `${API_URL}/generate-tests`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        code,
        language,
        count: Number(count),
        description: description || null,
      }),
    },
  );

  if (!response.ok) {
    const error = await response.json();

    throw new Error(
      error.detail?.message ||
      "Failed to generate tests",
    );
  }

  return response.json();
}


export async function runTests(
  code,
  tests,
  language,
) {
  const response = await fetch(
    `${API_URL}/run-tests`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        code,
        language,
        tests,
      }),
    },
  );

  if (!response.ok) {
    const error = await response.json();

    throw new Error(
      error.detail?.message ||
      "Failed to run tests",
    );
  }

  return response.json();
}

export async function executeCode(code, stdin = "", language = "python") {
  const response = await fetch(`${API_URL}/execute`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      code,
      stdin,
      language,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(
      error.detail?.message || error.message || "Failed to execute code"
    );
  }

  return response.json();
}