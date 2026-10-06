import { fetchGenres } from './api.js';
import { renderGenresForDropdown, toggleDropdown } from './ui.js'; 

const MENU_ID = 'genres-dropdown-menu'; 
const CONTAINER_ID = 'genres-dropdown-container'; 
const TOGGLE_ID = 'genres-dropdown-toggle'; 

async function loadGenresToDropdown() {
    const dropdownMenu = document.getElementById(MENU_ID);
    if (!dropdownMenu) return;

    dropdownMenu.innerHTML = '<p class="loading-message">در حال بارگذاری ژانرها...</p>';
    dropdownMenu.style.display = 'flex'; 

    try {
        const data = await fetchGenres(); 
        const genres = data?.genres || [];
        
        if (genres.length > 0) {
            renderGenresForDropdown(genres, MENU_ID);
        } else {
            console.warn("❌ لیست ژانرها خالی است یا واکشی نشد.");
            dropdownMenu.innerHTML = '<p class="error-message">ژانری یافت نشد.</p>';
        }

    } catch (error) {
        console.error("❌ خطای بارگذاری ژانرها:", error);
        dropdownMenu.innerHTML = '<p class="error-message">خطا در بارگذاری لیست ژانرها.</p>';
    }
}

function setupDropdownListeners() {
    const dropdownContainer = document.getElementById(CONTAINER_ID); 
    const toggleLink = document.getElementById(TOGGLE_ID); 
    
    if (!dropdownContainer || !toggleLink) {
        console.error("❌ المان‌های Dropdown پیدا نشدند. (بررسی IDها در header.html)");
        return;
    }

    toggleLink.addEventListener('click', (e) => {
        e.preventDefault(); 
    });

    dropdownContainer.addEventListener('mouseenter', () => {
        toggleDropdown(MENU_ID, true); 
    });

    dropdownContainer.addEventListener('mouseleave', () => {
        setTimeout(() => {
            toggleDropdown(MENU_ID, false); 
        }, 150); 
    });
    
    dropdownContainer.addEventListener('focusin', () => {
        toggleDropdown(MENU_ID, true);
    });
    
    dropdownContainer.addEventListener('focusout', (e) => {
        if (!dropdownContainer.contains(e.relatedTarget)) {
            toggleDropdown(MENU_ID, false);
        }
    });
}

export function initHeaderLogic() {
    loadGenresToDropdown(); 
    
    const dropdownContainer = document.getElementById(CONTAINER_ID); 
    const toggleLink = document.getElementById(TOGGLE_ID); 
    
    if (!dropdownContainer || !toggleLink) {
         console.error("❌ المان‌های دراپ‌دان ژانرها پیدا نشد.");
         return;
    }
    
    toggleLink.addEventListener('click', (e) => {
        e.preventDefault(); 
    });

    dropdownContainer.addEventListener('mouseenter', () => {
        toggleDropdown(MENU_ID, true); 
    });

    dropdownContainer.addEventListener('mouseleave', () => {
        setTimeout(() => {
            toggleDropdown(MENU_ID, false); 
        }, 150); 
    });
    
    dropdownContainer.addEventListener('focusin', () => {
        toggleDropdown(MENU_ID, true);
    });
    
    dropdownContainer.addEventListener('focusout', (e) => {
        if (!dropdownContainer.contains(e.relatedTarget)) {
            toggleDropdown(MENU_ID, false);
        }
    });
}