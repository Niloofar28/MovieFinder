import { fetchGenres } from './api.js';
import { renderGenreList, showLoading, hideLoading, showError } from './ui.js'; 
import { loadCommonComponents } from './utils.js'; 

const genresContainerId = 'genres-container'; 

async function loadGenresPage() {
    await loadCommonComponents(); 

    showLoading(genresContainerId);

    try {
        const response = await fetchGenres(); 
        const genres = response?.genres; 
        
        console.log("✅ داده‌های ژانر دریافت شد:", genres); 

        if (Array.isArray(genres) && genres.length > 0) {
            renderGenreList(genres, genresContainerId); 
        } else {
            showError('لیست ژانرها خالی است یا واکشی نشد. (لطفا کلید API و پاسخ کنسول را بررسی کنید)', genresContainerId);
        }

    } catch (error) {
      const errorMessage = error.message || 'در بارگذاری لیست ژانرها خطای ناشناخته‌ای رخ داد.';
        showError(errorMessage, genresContainerId); 
    } finally {
        hideLoading();
    }
}

document.addEventListener('DOMContentLoaded', loadGenresPage);