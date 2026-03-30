# Istruzioni di Sviluppo: App "World News Map" - Fase Demo

## Ruolo e Obiettivo
Sei un programmatore esperto. Il tuo compito è scrivere il codice per la versione demo di un'app che permette di esplorare le notizie finanziarie e geopolitiche tramite una mappa del mondo interattiva. Selezionando un paese, l'utente vede le notizie relative. 

Per questa prima fase, l'obiettivo è creare l'interfaccia utente, la logica di navigazione e l'interazione con la mappa, utilizzando esclusivamente dati finti per le notizie.

## Stack Tecnologico
* **Mappe:** Google Maps Platform (utilizza gli SDK e le API più recenti).
* **Dati Notizie:** Mock data locali (JSON o strutture dati fisse).
* **Database:** Attualmente assente, ma il codice deve essere predisposto per l'integrazione con Firebase nella fase successiva.

## Specifiche delle Funzionalità
1.  **Integrazione Mappa:** Implementa la mappa di Google a schermo intero. Assicurati che lo zoom e lo spostamento siano fluidi.
2.  **Interazione con i Paesi:** Rendi i paesi selezionabili al tocco (tramite confini poligonali o marker specifici per nazione).
3.  **Pannello Notizie:** Quando si tocca un paese, fai apparire un componente overlay (es. un bottom sheet o una modale laterale) che mostra una lista di articoli.
4.  **Dati Demo:** Crea un file di dati finti per almeno 4-5 nazioni diverse. Ogni articolo demo deve avere: titolo, nome della testata (es. "Bloomberg Demo"), timestamp e un breve estratto.

## Linee Guida per l'Architettura del Codice
* **Isolamento dei Dati:** Questa è la regola più importante. Separa nettamente la logica dell'interfaccia grafica da quella del recupero dati. Usa un pattern (come il repository pattern) in modo che la UI "chiami" una funzione per avere le notizie. Ora quella funzione restituirà i dati JSON locali, ma in futuro dovrà essere sostituita facilmente con le chiamate a Firebase.
* **Segnaposto Firebase:** Inserisci dei commenti espliciti (es. `// TODO: Integrare fetch da Firebase Firestore qui`) nei punti esatti dove andrà collegato il database reale.
* **Gestione degli Stati:** Anche se i dati attuali sono in locale, implementa gli stati di caricamento (loading spinner) e di gestione degli errori (es. "Nessuna notizia trovata per questo stato"), per simulare il comportamento di un'app reale.



