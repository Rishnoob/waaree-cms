/** Inline script for the CMS layout: applies the saved dark theme before first paint (no flash). */
export const THEME_STORAGE_KEY = "waaree-cms-theme";
export const THEME_INIT_SCRIPT = `try{if(localStorage.getItem("${THEME_STORAGE_KEY}")==="dark")document.documentElement.classList.add("dark")}catch(e){}`;
