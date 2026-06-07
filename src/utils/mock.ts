export function getDefaultMockResponseBody() {
  return JSON.stringify(
    {
      code: 0,
      message: "ok",
      data: {
        id: "mock-user-001",
        name: "Flamingo Mock User",
        role: "developer",
        features: ["redirect", "mock-response"],
        createdAt: "2026-06-07T00:00:00.000Z",
      },
    },
    null,
    2
  );
}
