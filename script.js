let allParsedRecords = []; // Pour stocker les enregistrements parsés du fichier

async function loadAndParseData() {
    const loadingMessage = document.getElementById('loadingMessage');
    const resultDiv = document.getElementById('result');
    const viewAllDataButton = document.getElementById('viewAllDataButton');

    loadingMessage.style.display = 'block';
    resultDiv.textContent = "";
    viewAllDataButton.disabled = true; // Désactiver le bouton pendant le chargement

    try {
        const response = await fetch('data.txt'); // S'attend à ce que data.txt soit dans le même dossier
        if (!response.ok) {
            console.error("Erreur de chargement du fichier data.txt:", response.statusText);
            resultDiv.textContent = "Erreur: Impossible de charger le fichier de données. Vérifiez qu'il est nommé 'data.txt' et au bon endroit.";
            loadingMessage.style.display = 'none';
            return;
        }
        const text = await response.text();
        
        // Stocker le texte brut pour "Voir les données totales"
        document.getElementById('allDataDisplay').textContent = text;

        // Parser les données pour la recherche
        allParsedRecords = []; 
        const blocks = text.split(/\n--------------------\n?|\r\n--------------------\r\n?/); 

        blocks.forEach(block => {
            if (block.trim() === "") return;

            const record = {
                pseudo: "N/A",
                numeroOriginal: "N/A",
                numerosNormalises: [], // Pour stocker uniquement les chiffres des numéros
                date: "N/A",
                nomJedolo: "N/A",
                email: "N/A",
                rawBlock: block.trim() // Stocker le bloc brut pour un affichage facile
            };
            const lines = block.split('\n');
            let nomJedoloBuffer = ""; // Pour gérer les "nom jedolo" sur plusieurs lignes
            let inNomJedoloField = false;

            lines.forEach(line => {
                const cleanedLine = line.replace(/^\\s*/, '').trim();
                
                if (cleanedLine.startsWith('pseudo : ')) {
                    record.pseudo = cleanedLine.substring('pseudo : '.length).trim();
                    inNomJedoloField = false;
                } else if (cleanedLine.startsWith('numero : ')) {
                    record.numeroOriginal = cleanedLine.substring('numero : '.length).trim();
                    record.numerosNormalises = record.numeroOriginal.split(',')
                                               .map(n => n.replace(/\D/g, '').trim()) // Garde uniquement les chiffres
                                               .filter(n => n); // Filtre les chaînes vides
                    inNomJedoloField = false;
                } else if (cleanedLine.startsWith('date de creation (specifique) : ')) {
                    record.date = cleanedLine.substring('date de creation (specifique) : '.length).trim();
                    inNomJedoloField = false;
                } else if (cleanedLine.startsWith('nom jedolo : ')) {
                    nomJedoloBuffer = cleanedLine.substring('nom jedolo : '.length).trim();
                    inNomJedoloField = true; 
                } else if (cleanedLine.startsWith('email : ')) {
                    record.email = cleanedLine.substring('email : '.length).trim();
                    if (nomJedoloBuffer && record.nomJedolo === "N/A") { // Assigner le nom jedolo bufferisé
                        record.nomJedolo = nomJedoloBuffer.trim();
                    }
                    inNomJedoloField = false;
                    nomJedoloBuffer = "";
                } else if (inNomJedoloField && !cleanedLine.includes(' : ') && cleanedLine !== "") {
                    // Si on est dans un champ nom jedolo et que la ligne n'est pas une nouvelle clé:valeur
                    nomJedoloBuffer += " " + cleanedLine;
                }
            });
            // S'assurer que le nom jedolo est assigné s'il était la dernière info du bloc
            if (inNomJedoloField && nomJedoloBuffer && record.nomJedolo === "N/A") {
                record.nomJedolo = nomJedoloBuffer.trim();
            }
            
            if (record.pseudo !== "N/A" || record.numeroOriginal !== "N/A") { // Ajouter seulement si c'est un enregistrement valide
                 allParsedRecords.push(record);
            }
        });
        
        loadingMessage.style.display = 'none';
        viewAllDataButton.disabled = false; // Réactiver le bouton

        if (allParsedRecords.length > 0) {
            console.log(allParsedRecords.length + " enregistrements chargés et parsés.");
            resultDiv.textContent = "Prêt à rechercher. Entrez un numéro ci-dessus.";
            resultDiv.style.color = "initial";
        } else {
            resultDiv.textContent = "Aucun enregistrement valide n'a pu être extrait du fichier de données.";
            console.warn("Aucun enregistrement chargé depuis data.txt");
        }

    } catch (error) {
        console.error("Erreur lors du chargement ou du parsing des données:", error);
        resultDiv.textContent = "Erreur: Problème technique lors du chargement des données.";
        loadingMessage.style.display = 'none';
        viewAllDataButton.disabled = false;
    }
}

function performSearch() {
    const searchTerm = document.getElementById('searchInput').value;
    const resultDiv = document.getElementById('result');
    document.getElementById('allDataDisplay').style.display = 'none'; // Cacher l'affichage global

    if (!searchTerm.trim()) {
        resultDiv.innerHTML = "<p style='color: orange;'>Veuillez entrer un numéro à rechercher.</p>";
        return;
    }

    if (allParsedRecords.length === 0) {
        resultDiv.innerHTML = "<p style='color: red;'>Les données ne sont pas chargées. Veuillez rafraîchir.</p>";
        return;
    }

    const normalizedSearchDigits = searchTerm.replace(/\D/g, ''); // Garder que les chiffres de la recherche
    let foundRecordsHTML = "";
    let count = 0;

    if (normalizedSearchDigits === "") {
        resultDiv.innerHTML = "<p style='color: orange;'>Veuillez entrer des chiffres valides pour la recherche.</p>";
        return;
    }

    allParsedRecords.forEach(record => {
        let matchInRecord = false;
        record.numerosNormalises.forEach(normNum => {
            if (normNum.includes(normalizedSearchDigits)) {
                matchInRecord = true;
            }
        });

        if (matchInRecord) {
            count++;
            foundRecordsHTML += `
                <div class="record-result">
                    <p><strong>Pseudo:</strong> ${record.pseudo}</p>
                    <p><strong>Numéro(s) d'origine:</strong> ${record.numeroOriginal}</p>
                    <p><strong>Date de création:</strong> ${record.date}</p>
                    <p><strong>Nom Jedolo:</strong> ${record.nomJedolo}</p>
                    <p><strong>Email:</strong> ${record.email}</p>
                </div>
                <hr>`;
        }
    });

    if (count > 0) {
        resultDiv.innerHTML = `<h3>${count} enregistrement(s) trouvé(s) pour "${searchTerm}":</h3>${foundRecordsHTML}`;
    } else {
        resultDiv.innerHTML = `<p style='color: red;'>Le numéro "${searchTerm}" N'EST PAS PRÉSENT dans les données.</p>`;
    }
}

function toggleAllData() {
    const allDataDisplay = document.getElementById('allDataDisplay');
    const resultDiv = document.getElementById('result');
    if (allDataDisplay.style.display === 'none') {
        if (document.getElementById('allDataDisplay').textContent.trim() === "") {
            resultDiv.innerHTML = "<p style='color: orange;'>Les données n'ont pas encore été chargées. Veuillez patienter ou rafraîchir.</p>";
        } else {
            allDataDisplay.style.display = 'block';
            resultDiv.innerHTML = ""; // Effacer les résultats de recherche
        }
    } else {
        allDataDisplay.style.display = 'none';
    }
}

// Charger les données lorsque la page est prête
window.onload = () => {
    loadAndParseData();
    document.getElementById('viewAllDataButton').addEventListener('click', toggleAllData);
};