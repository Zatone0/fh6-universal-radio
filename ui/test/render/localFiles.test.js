import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createLocalFiles } from "../../dist/js/render/localFiles.js";

const json = body => ({ ok: true, json: async () => body });

const STATIONS = {
  stations: [
    {
      name: "My Music",
      roots: [],
      excluded: [],
      order: "shuffle",
      grouping: "folder",
      repeat: "all",
    },
  ],
  active_station: "My Music",
  track_count: 0,
};

beforeEach(() => {
  document.body.innerHTML = "<main></main>";
  global.fetch = vi.fn(url => {
    if (url.includes("/stations")) return Promise.resolve(json(STATIONS));
    if (url.includes("/queue")) return Promise.resolve(json({ cursor: 0, tracks: [] }));
    return Promise.resolve(json({}));
  });
});

afterEach(() => vi.restoreAllMocks());

const ctx = (enabled, state = { sources: { available: [] } }) => ({
  getState: () => state,
  getConfig: () => ({ local_files: { enabled } }),
  onSaved: async () => {},
});

describe("createLocalFiles", () => {
  it("inserts the card hidden until local_files is enabled", () => {
    const lf = createLocalFiles(document.querySelector("main"), ctx(false));
    lf.render();
    expect(document.getElementById("local-files-card").hidden).toBe(true);
  });

  it("shows the card and loads stations when enabled", async () => {
    const lf = createLocalFiles(document.querySelector("main"), ctx(true));
    lf.render();
    expect(document.getElementById("local-files-card").hidden).toBe(false);
    await new Promise(r => setTimeout(r, 0));
    const opts = document.getElementById("lf-station").querySelectorAll("option");
    expect(opts.length).toBe(1);
    expect(opts[0].textContent).toContain("My Music");
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/source/local_files/stations",
      expect.anything(),
    );
  });
});
