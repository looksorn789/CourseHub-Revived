import api from "./api";

const SearchService = {
  // Shown when the search box opens: newest people and channels.
  async suggestions() {
    const response = await api.get("/api/search/suggestions");
    return response.data.data;
  },
  // People, channels and posts matching q (at least 2 characters).
  async search(q, limit = 5) {
    const response = await api.get("/api/search", { params: { q, limit } });
    return response.data.data;
  },
};

export default SearchService;
