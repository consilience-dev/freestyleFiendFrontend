import { renderHook, waitFor } from "@testing-library/react";
import { useBeats } from "../hooks/useBeats";

vi.mock("../lib/apiClient", () => ({
  getApiClient: () => ({
    GET: async () => ({ data: [
      {
        beatId: "test-beat",
        title: "Test Beat",
        producer: "Test Producer",
        genre: "Test Genre",
        bpm: 120,
        duration: "3:00",
        tags: ["Test"],
        description: "A test beat.",
        audioUrl: "https://test/audio.mp3",
        imageUrl: "https://test/image.png",
        s3Key: "beats/test.mp3",
        createdAt: "2025-01-01T00:00:00Z"
      }
    ], error: undefined })
  })
}));

describe("useBeats", () => {
  it("fetches and returns beats", async () => {
    const { result } = renderHook(() => useBeats());
    await waitFor(() => expect(result.current.beats).not.toBeNull());
    expect(result.current.beats?.[0].title).toBe("Test Beat");
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });
});
