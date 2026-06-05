const { createApp } = Vue;

createApp({
    data() {
        return {
            isLogged: false,
            map: null,
            selectedElement: null,
            toasts: [],
            quartieri: [
                {
                    type: 'quartiere', nome: "Centro Storico", poligono: [[46.0715, 11.1170],[46.0715, 11.1270],[46.0630, 11.1270],[46.0630, 11.1170]],
                    coloreStile: "#00ff88",
                    regole: [{ rifiuto: "Imballaggi Leggeri", orario: "Lunedì entro 09:00" }, { rifiuto: "Carta", orario: "Mercoledì entro 09:00" }, { rifiuto: "Organico", orario: "Mar / Gio / Sab entro 08:30" }, { rifiuto: "Secco Residuo", orario: "Venerdì entro 09:00" }]
                },
                {
                    type: 'quartiere', nome: "Zona Oltrefersina / Clarina", poligono: [[46.0610, 11.1190],[46.0610, 11.1350],[46.0500, 11.1350],[46.0500, 11.1190]],
                    coloreStile: "#00d2ff",
                    regole: [{ rifiuto: "Imballaggi Leggeri", orario: "Martedì entro 13:00" }, { rifiuto: "Carta", orario: "Giovedì entro 12:00" }, { rifiuto: "Organico", orario: "Lun / Mer / Ven entro 11:00" }, { rifiuto: "Secco Residuo", orario: "Sabato entro 13:00" }]
                }
            ],
            puntiSpeciali: [
                { type: 'speciale', nome: "Raccolta Olio Alimentare - Piazza Fiera", categoria: "Olio Esausto", indirizzo: "Piazza Fiera, nei pressi delle mura storiche", note: "Inserire l'olio solo in bottiglie di plastica ben chiuse. Non sversare direttamente.", stato: "Disponibile 24h", coordinate: [46.0645, 11.1235] },
                { type: 'speciale', nome: "Punto Raccolta RAEE - Via Calepina", categoria: "Piccoli Elettrodomestici", indirizzo: "Via Calepina, vicino all'ecocampus", note: "Valido per telefoni, caricabatterie, phon e piccoli elettrodomestici max 25cm.", stato: "Attivo (Presidiato)", coordinate: [46.0665, 11.1245] }
            ]
        }
    },
    mounted() {
        this.isLogged = !!localStorage.getItem('token');
        this.initMap();
    },
    methods: {
        // --- COLLEGAMENTO SICURO A LINGUE.JS ---
        t(chiave) { 
            return window.i18n ? window.i18n.t(chiave) : chiave; 
        },
        // ---------------------------------------

        logout() {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            this.isLogged = false;
            this.showToast(this.t('msg_logout_success') !== 'msg_logout_success' ? this.t('msg_logout_success') : "Logout effettuato correttamente."); 
            setTimeout(() => { window.location.reload(); }, 1500); 
        },

        initMap() {
            this.map = L.map('map', { zoomControl: false }).setView([46.0640, 11.1240], 15);
            L.control.zoom({ position: 'bottomright' }).addTo(this.map);
            L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', { attribution: '&copy; OpenStreetMap' }).addTo(this.map);

            this.quartieri.forEach(q => {
                const polygonLayer = L.polygon(q.poligono, { color: q.coloreStile, weight: 2, fillColor: q.coloreStile, fillOpacity: 0.08, dashArray: '5, 5' }).addTo(this.map);
                polygonLayer.on('mouseover', () => polygonLayer.setStyle({ fillOpacity: 0.2, weight: 3 }));
                polygonLayer.on('mouseout', () => polygonLayer.setStyle({ fillOpacity: 0.08, weight: 2 }));
                polygonLayer.on('click', (e) => {
                    this.selectedElement = q;
                    L.popup().setLatLng(e.latlng).setContent(`<b>${this.t('mappa_info_zona').toUpperCase()}: ${q.nome}</b>`).openOn(this.map);
                });
            });

            this.puntiSpeciali.forEach(p => {
                const marker = L.circleMarker(p.coordinate, { radius: 8, color: p.categoria === 'Olio Esausto' ? '#ffa502' : '#00d2ff', fillColor: p.categoria === 'Olio Esausto' ? '#ffa502' : '#00d2ff', fillOpacity: 0.8, weight: 3 }).addTo(this.map);
                marker.on('click', () => { this.selectedElement = p; });
            });

            setTimeout(() => {
                this.map.invalidateSize();
            }, 300);
        },

        getIconClass(rifiuto) {
            if (rifiuto.includes("Imballaggi")) return "fa-box-open icon-imballaggi";
            if (rifiuto.includes("Carta")) return "fa-file-lines icon-carta";
            if (rifiuto.includes("Organico")) return "fa-apple-whole icon-organico";
            return "fa-trash-can icon-residuo";
        },

        showToast(message) {
            const id = Date.now();
            this.toasts.push({ id, message });
            setTimeout(() => { this.toasts = this.toasts.filter(t => t.id !== id); }, 3000);
        }
    }
}).mount('#app');