import React, { useState, useEffect, useRef } from "react";
import "./index.css";

const coverUrl = (cover_i, size = "M") =>
  cover_i ? `https://covers.openlibrary.org/b/id/${cover_i}-${size}.jpg` : null;

function App() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [numFound, setNumFound] = useState(0);
  const [favorites, setFavorites] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("bf:favs") || "[]");
    } catch {
      return [];
    }
  });
  const [showFavorites, setShowFavorites] = useState(false);

  const controllerRef = useRef(null);
  const perPage = 12;

  useEffect(() => {
    localStorage.setItem("bf:favs", JSON.stringify(favorites));
  }, [favorites]);

  useEffect(() => {
    if (!query.trim() || showFavorites) {
      setResults([]);
      setNumFound(0);
      return;
    }

    setLoading(true);
    setError(null);
    if (controllerRef.current) controllerRef.current.abort();
    controllerRef.current = new AbortController();

    const q = encodeURIComponent(query.trim());
    const start = (page - 1) * perPage;
    const url = `https://openlibrary.org/search.json?title=${q}&limit=${perPage}&offset=${start}`;

    fetch(url, { signal: controllerRef.current.signal })
      .then(async (res) => {
        if (!res.ok) throw new Error("Network error");
        const data = await res.json();
        setResults(data.docs || []);
        setNumFound(data.numFound || 0);
      })
      .catch((err) => {
        if (err.name !== "AbortError") setError(err.message);
      })
      .finally(() => setLoading(false));

    return () => {
      if (controllerRef.current) controllerRef.current.abort();
    };
  }, [query, page, showFavorites]);

  function toggleFavorite(doc) {
    const id = doc.key;
    setFavorites((prev) =>
      prev.some((p) => p.key === id)
        ? prev.filter((p) => p.key !== id)
        : [doc, ...prev]
    );
  }

  function isFav(doc) {
    return favorites.some((f) => f.key === doc.key);
  }

  const displayedBooks = showFavorites ? favorites : results;

  return (
    <div className="min-h-screen flex flex-col bg-amber-50 text-stone-800">
      <header className="bg-amber-100 border-b border-amber-200 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <h1 className="text-2xl font-semibold text-stone-700 flex items-center gap-2 italic">
            📚 <span className="tracking-wide text-amber-600 font-bold">BookVerse</span>
          </h1>
          <div className="text-sm text-stone-600 opacity-80">
            Powered by Open Library API
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-5xl mx-auto p-4 w-full flex flex-col">
        {displayedBooks.length === 0 && !query && !showFavorites && (
          <div className="flex-1 flex flex-col items-center justify-center text-center">
            <h1 className="text-3xl font-semibold text-amber-600 drop-shadow-sm mb-8">
              Let's Find <span className="text-amber-500">My Book!!</span>
            </h1>
            <section className="bg-white/90 p-5 sm:p-6 rounded-xl shadow-lg border border-amber-200 w-full max-w-sm">
              <input
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setPage(1);
                }}
                placeholder="🔍 Search books by title — "
                className="w-full border border-amber-300 rounded-lg px-4 py-2 bg-amber-50 text-stone-700 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
              <div className="flex justify-center mt-3">
                <button
                  onClick={() => setShowFavorites(true)}
                  className="text-sm px-4 py-2 border border-amber-400 rounded text-amber-700 font-medium hover:bg-amber-50 transition"
                >
                  ⭐ View Favorites
                </button>
              </div>
            </section>
          </div>

        )}

        {(displayedBooks.length > 0 || query || showFavorites) && (
          <section className="bg-white p-4 rounded-xl shadow-sm border border-amber-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-2">
            <input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(1);
                setShowFavorites(false);
              }}
              placeholder="🔍 Search books by title"
              className="flex-1 w-full border border-amber-300 rounded-lg px-4 py-2 bg-amber-50 text-stone-700 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
            <button
              onClick={() => setShowFavorites((prev) => !prev)}
              className="text-sm px-3 py-2 border border-amber-400 rounded text-amber-700 hover:bg-amber-50 transition w-full sm:w-auto"
            >
              {showFavorites ? "📚 Back to Search" : "⭐ View Favorites"}
            </button>
          </section>
        )}

        {loading && <p className="text-center mt-6 text-stone-600">Loading...</p>}
        {error && <p className="text-center mt-6 text-red-600">Error: {error}</p>}
        {showFavorites && favorites.length === 0 && (
          <p className="text-center mt-10 text-stone-500 italic">
            You haven't added any favorites yet ⭐
          </p>
        )}
        {!loading && !error && !showFavorites && results.length === 0 && query && (
          <p className="text-center mt-6 text-stone-500">No results found.</p>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mt-6">
          {displayedBooks.map((doc) => (
            <div
              key={doc.key}
              className="bg-white p-4 rounded-lg border border-amber-100 shadow-md hover:shadow-lg hover:-translate-y-1 transition-all"
            >
              <img
                src={
                  coverUrl(doc.cover_i) ||
                  "https://via.placeholder.com/128x180?text=No+Cover"
                }
                alt={doc.title}
                className="w-full h-64 object-cover rounded"
              />
              <h3 className="mt-3 font-semibold text-stone-800 text-base sm:text-lg truncate">{doc.title}</h3>
              <p className="text-sm text-stone-600 truncate">
                {(doc.author_name || []).join(", ")}
              </p>

              <div className="flex flex-col sm:flex-row gap-2 mt-3">
                <button
                  onClick={() => toggleFavorite(doc)}
                  className="text-sm px-3 py-1 border border-amber-400 rounded w-full text-amber-700 hover:bg-amber-50 transition"
                >
                  {isFav(doc) ? "★ Favorited" : "☆ Favorite"}
                </button>
                <a
                  href={`https://openlibrary.org${doc.key}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm px-3 py-1 border border-stone-300 rounded w-full text-stone-700 hover:bg-amber-100 transition text-center"
                >
                  🔗 Know More
                </a>
              </div>
            </div>
          ))}
        </div>
      </main>

      <footer className="bg-amber-100 border-t border-amber-200 mt-6 py-4 text-center text-xs sm:text-sm text-stone-700">
        Built with 🧡 using Open Library API
      </footer>
    </div>
  );
}

export default App;
