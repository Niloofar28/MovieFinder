import { searchMovies, fetchMoviesByGenre } from './api.js'; 
import { renderMovieList, showLoading, hideLoading, showError, renderPagination } from './ui.js'; 
import { loadCommonComponents, setGenreMap, getGenreNameById } from './utils.js'; 

const resultsContainerId = 'search-results-container'; 
const paginationContainerId = 'pagination-controls-results'; 
const resultsTitleEl = document.getElementById('results-title');

let currentQuery = '';
let currentGenreId = null;
let currentGenreName = '';
let currentPage = 1; 
let totalPages = 1;

async function fetchAndRenderResults(page = 1) { 
    window.scrollTo(0, 0); 
    currentPage = page; 
    showLoading(resultsContainerId);
    
    const paginationContainerEl = document.getElementById(paginationContainerId);
    if (paginationContainerEl) {
        paginationContainerEl.style.display = 'none'; 
    }

    try {
        let data = { results: [], total_pages: 0, total_results: 0 };
        
        if (currentQuery) {
            data = await searchMovies(currentQuery, page);
            resultsTitleEl.textContent = `نتایج جستجو برای: «${currentQuery}»`;
        } else if (currentGenreId) {
            data = await fetchMoviesByGenre(currentGenreId, page);
            resultsTitleEl.textContent = `فیلم‌های ژانر: ${currentGenreName}`; 
        } else {
            showError('لطفا یک عبارت جستجو یا ژانر را مشخص کنید.', resultsContainerId);
            return;
        }

        const { results, total_pages } = data;
        totalPages = total_pages; 

        if (results && results.length > 0) {
            renderMovieList(results, document.getElementById(resultsContainerId), getGenreNameById); 
            renderPagination(currentPage, totalPages, paginationContainerId, fetchAndRenderResults);
        } else {
            const emptyEl = document.getElementById('empty-state-message');
            if (emptyEl) emptyEl.style.display = 'block';
            document.getElementById(resultsContainerId).style.display = 'none';
        }

    } catch (error) {
       console.error("خطا در واکشی نتایج جستجو:", error);
       const errorMessage = error.message || 'در بارگذاری نتایج جستجو خطای ناشناخته‌ای رخ داد.';
        showError(errorMessage, resultsContainerId);
    } finally {
        hideLoading(resultsContainerId);
    }
}

async function init() {
    await loadCommonComponents(); 
    await setGenreMap(); 
    
    const params = new URLSearchParams(window.location.search);
    const query = params.get('query');
    const genreId = params.get('genreId');
    const initialPage = parseInt(params.get('page')) || 1;
    
    if (query) {
        currentQuery = query;
        currentGenreId = null; 
    } else if (genreId) {
        currentGenreId = parseInt(genreId);
        // خواندن نام ژانر از URL (برای نمایش در عنوان)
        currentGenreName = params.get('genreName') 
            ? decodeURIComponent(params.get('genreName'))
            : getGenreNameById(currentGenreId) || 'ناشناخته'; 
        currentQuery = '';
    } else {
        showError('لطفا یک عبارت جستجو یا ژانر را مشخص کنید.', resultsContainerId);
        return;
    }
    
    fetchAndRenderResults(initialPage);
}

document.addEventListener('DOMContentLoaded', init);