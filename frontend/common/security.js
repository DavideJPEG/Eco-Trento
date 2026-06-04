// --- BLOCCO DI SICUREZZA GLOBALE ---
// Questo script viene caricato prima di Vue.js nelle pagine protette.

const token = localStorage.getItem('token');

// Se non c'è il token (utente non loggato) e non si trova in una pagina libera, lo buttiamo fuori
if (!token && !window.location.href.includes('login.html') && !window.location.href.includes('guida.html')) {
    alert("Accesso negato. Devi effettuare il login per utilizzare questo servizio.");
    window.location.href = 'login.html'; 
}