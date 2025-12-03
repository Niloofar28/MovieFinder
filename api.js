const TMDB_API_KEY = '3b41fef19f666f1e5ca918714204612b'; 
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

async function fetchTmdb(endpoint, params = {}) {
    const urlParams = new URLSearchParams({
        api_key: TMDB_API_KEY,
        language: 'en-US', 
        ...params
    });

    const url = `${TMDB_BASE_URL}${endpoint}?${urlParams.toString()}`;

    try {
        const response = await fetch(url);
        
        if (!response.ok) {
            if (response.status === 401) {
                throw new Error("Error: Invalid API key or unauthorized access. Check your key.");
            }
            throw new Error(`API Error Code ${response.status}. Please try again later.`);
        }
        
        return response.json();
        
    } catch (error) {
        if (error.name === "TypeError" && error.message === "Failed to fetch") {
            console.error("❌ Network Error: TMDb server is unavailable.");
            throw new Error("Connection Error: Could not connect to the movie server. Check your internet.");
        }
        console.error("Error calling TMDb API:", error);
        throw error;
    }
}

export async function fetchTrendingMovies(page = 1) {
    return fetchTmdb('/trending/movie/week', { page }); 
}
export async function searchMovies(query, page = 1) {
    if (!query) return { results: [], total_pages: 0 };
    return fetchTmdb('/search/movie', { query, page });
}

export async function fetchMovieDetails(movieId) {
    const details = await fetchTmdb(`/movie/${movieId}`);
    const credits = await fetchTmdb(`/movie/${movieId}/credits`);

    return { 
        ...details, 
        credits 
    };
}

export async function fetchGenres() {
    const data = await fetchTmdb('/genre/movie/list');

    if (data && Array.isArray(data.genres)) {
        const safeGenres = data.genres.filter(g => g && g.id);
        return {
            ...data,
            genres: safeGenres
        };
    }

    return {
        genres: []
    };
}
export async function fetchMoviesByGenre(genreId, page = 1) {

    return fetchTmdb('/discover/movie', {
        with_genres: genreId,
        sort_by: 'popularity.desc',
        page: page
    });
}