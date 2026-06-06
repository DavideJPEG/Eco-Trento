/**
 * ECOTRENTO - Security Middleware Frontend
 * Controlla se l'utente possiede un token valido.
 */
(function() {
    const token = localStorage.getItem('token');

    // Se NON c'è il token, blocchiamo la pagina
    if (!token) {
        
        // 1. Nascondiamo immediatamente la pagina per evitare "sfarfallii" o fughe di dati
        document.documentElement.style.display = 'none';

        // 2. Aspettiamo che il browser abbia letto la pagina per manipolarla
        document.addEventListener("DOMContentLoaded", function() {
            
            // Svuotiamo fisicamente il contenuto della pagina protetta
            document.body.innerHTML = ''; 
            
            // Rimettiamo visibile il contenitore principale
            document.documentElement.style.display = '';
            
            // Impostiamo uno sfondo scuro
            document.body.style.background = 'radial-gradient(circle at center, #1a1a2e 0%, #080810 100%)';
            document.body.style.display = 'flex';
            document.body.style.justifyContent = 'center';
            document.body.style.alignItems = 'center';
            document.body.style.height = '100vh';
            document.body.style.margin = '0';
            document.body.style.fontFamily = 'system-ui, -apple-system, sans-serif';
            
            // 3. Creiamo il modale "Glassmorphism"
            const modal = document.createElement('div');
            modal.style.background = 'rgba(255, 255, 255, 0.03)';
            modal.style.backdropFilter = 'blur(20px)';
            modal.style.border = '1px solid rgba(255, 255, 255, 0.08)';
            modal.style.padding = '40px 30px';
            modal.style.borderRadius = '24px';
            modal.style.textAlign = 'center';
            modal.style.boxShadow = '0 25px 50px rgba(0,0,0,0.5)';
            modal.style.color = 'white';
            modal.style.maxWidth = '350px';

            // Aggiungiamo un'animazione CSS per la rotellina di caricamento
            const style = document.createElement('style');
            style.innerHTML = `@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`;
            document.head.appendChild(style);

            // Inseriamo HTML e icone dentro al modale
            modal.innerHTML = `
                <div style="font-size: 50px; color: #ff4757; margin-bottom: 20px;">
                    <i class="fa-solid fa-lock"></i>
                </div>
                <h2 style="margin: 0 0 10px 0; font-size: 24px; font-weight: 800;">Accesso Richiesto</h2>
                <p style="color: #a0a0b0; font-size: 14px; line-height: 1.5; margin-bottom: 25px;">
                    Per motivi di sicurezza devi accedere per visualizzare questa pagina.<br><br>
                    <i>Reindirizzamento in corso...</i>
                </p>
                <div style="width: 30px; height: 30px; border: 3px solid rgba(255,255,255,0.1); border-top-color: #00d2ff; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto;"></div>
            `;

            document.body.appendChild(modal);

            // 4. Dopo 2.5 secondi rimanda alla pagina di Login
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 2500);
        });
    }
})();