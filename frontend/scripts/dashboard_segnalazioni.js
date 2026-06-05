/**
 * ECOTRENTO - Dashboard Operatore (Gestione Segnalazioni)
 * Architettura: Vue.js 3 (CDN) - API RESTful
 */

const { createApp } = Vue;

createApp({
    data() {
        return {
            segnalazioni: [],
            filtroStato: '',
            isLoading: true,
            messaggio: '',
            tipoMessaggio: '',
            apiBaseUrl: 'http://localhost:3000',
            linguaAttuale: localStorage.getItem('eco_lang') || 'it',
        };
    },
    mounted() {
        this.caricaSegnalazioni();
    },
    methods: {
        
        t(chiave) { return window.i18n ? window.i18n.t(chiave) : chiave; },
impostaLingua(lang) { if(window.i18n) window.i18n.cambiaLingua(lang); },

        getAuthHeaders() {
            const token = localStorage.getItem('token'); 
            return {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
                'x-access-token': token
            };
        },

        /**
         * Scarica le segnalazioni e recupera i dettagli per ciascuna
         */
        async caricaSegnalazioni() {
            this.isLoading = true;
            this.nascondiMessaggio();

            try {
                // 1. Costruiamo l'URL globale
                let url = `${this.apiBaseUrl}/api/v1/segnalazioni`;
                if (this.filtroStato) {
                    url += `?stato=${this.filtroStato}`;
                }

                const response = await fetch(url, {
                    method: 'GET',
                    headers: this.getAuthHeaders()
                });

                if (!response.ok) {
                    throw new Error(`Errore Server: ${response.status}`);
                }

                // 2. Il server restituisce solo un array "leggero" [{self: "...", title: "..."}]
                const list = await response.json();

                if (list.length === 0) {
                    this.segnalazioni = [];
                    this.isLoading = false;
                    return;
                }

                // 3. Facciamo il FETCH dei dettagli completi in parallelo usando l'URL in 'self'
                const promises = list.map(item => 
                    fetch(`${this.apiBaseUrl}${item.self}`, { headers: this.getAuthHeaders() })
                    .then(res => res.json())
                );

                // Aspettiamo che tutti i dettagli siano stati scaricati
                const segnalazioniComplete = await Promise.all(promises);
                
                // Mettiamo le segnalazioni in ordine decrescente (le più nuove per prime)
                this.segnalazioni = segnalazioniComplete.reverse();

            } catch (error) {
                console.error('[ECOTRENTO] Errore API GET Segnalazioni:', error);
                this.mostraMessaggio("Errore nel caricamento delle segnalazioni.", 'error');
            } finally {
                this.isLoading = false;
            }
        },

        /**
         * PATCH: Aggiorna lo stato chiamando l'endpoint esatto di Omens
         * @param {String} selfUrl - "/api/v1/segnalazioni/:id"
         * @param {String} azione  - "presaInCarico" o "risolta"
         */
        async aggiornaStato(selfUrl, azione) {
            const messaggiAzione = {
                'presaInCarico': 'prendere in carico',
                'risolta': 'segnare come risolta'
            };

            if (!confirm(`Vuoi ${messaggiAzione[azione]} questa segnalazione?`)) {
                return;
            }

            // Aggiunge l'azione in fondo all'URL come richiesto dal router
            const targetUrl = `${this.apiBaseUrl}${selfUrl}/${azione}`;

            try {
                const response = await fetch(targetUrl, {
                    method: 'PATCH',
                    headers: this.getAuthHeaders()
                });

                if (!response.ok) {
                    throw new Error(`Aggiornamento fallito (Status: ${response.status})`);
                }

                this.mostraMessaggio(`Stato aggiornato! L'utente riceverà una notifica.`, 'success');
                
                // Refresh dei dati
                this.caricaSegnalazioni();

            } catch (error) {
                console.error('[ECOTRENTO] Errore API PATCH:', error);
                this.mostraMessaggio('Errore durante l\'aggiornamento della segnalazione.', 'error');
            }
        },

        /**
         * Utility UI: Sostituisce gli underscore ("In_Lavorazione" -> "In Lavorazione")
         */
        formattaTesto(testo) {
            if (!testo) return 'Sconosciuto';
            return testo.replace(/_/g, ' ');
        },

        mostraMessaggio(testo, tipo) {
            this.messaggio = testo;
            this.tipoMessaggio = tipo;
            setTimeout(() => this.nascondiMessaggio(), 5000);
        },

        nascondiMessaggio() {
            this.messaggio = '';
            this.tipoMessaggio = '';
        }
    }
}).mount('#app');