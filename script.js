let phoneNumbersOnly = []; // Pour stocker uniquement les chiffres des numéros

async function loadAndParseData() {
    const loadingMessage = document.getElementById('loadingMessage');
    const resultDiv = document.getElementById('result');
    loadingMessage.style.display = 'block';
    resultDiv.textContent = ""; // Effacer les anciens résultats

    try {
        const response = await fetch('data.txt'); // S'attend à ce que data.txt soit dans le même dossier
        if (!response.ok) {
            console.error("Erreur de chargement du fichier data.txt:", response.statusText);
            resultDiv.textContent = "Erreur: Impossible de charger le fichier de données.";
            loadingMessage.style.display = 'none';
            return;
        }
        const text = await response.text();
        const lines = text.split('\n');
        phoneNumbersOnly = []; // Réinitialiser avant de parser

        lines.forEach(line => {
            const cleanedLine = line.toLowerCase().replace(/^\\s*/, '').trim(); // Nettoyer les préfixes 
            if (cleanedLine.startsWith('numero : ')) {
                const numberString = cleanedLine.substring('numero : '.length).trim();
                // Gérer plusieurs numéros sur une ligne, séparés par une virgule
                const individualNumberEntries = numberString.split(',').map(n => n.trim());
                individualNumberEntries.forEach(numEntry => {
                    // Extraire uniquement les chiffres de chaque entrée pour la recherche
                    const digitsOnly = numEntry.replace(/\D/g, ''); // Enlève tout ce qui n'est pas un chiffre
                    if (digitsOnly) {
                        phoneNumbersOnly.push(digitsOnly);
                    }
                });
            }
        });
        
        loadingMessage.style.display = 'none';
        if (phoneNumbersOnly.length > 0) {
            console.log(phoneNumbersOnly.length + " numéros (chiffres seulement) chargés pour la recherche.");
            resultDiv.textContent = "Prêt à rechercher. Entrez un numéro ci-dessus.";
            resultDiv.style.color = "initial";
        } else {
            resultDiv.textContent = "Aucun numéro n'a pu être extrait du fichier de données ou le fichier est vide.";
            console.warn("Aucun numéro chargé depuis data.txt");
        }

    } catch (error) {
        console.error("Erreur lors du chargement ou du parsing des données:", error);
        resultDiv.textContent = "Erreur: Problème technique lors du chargement des données.";
        loadingMessage.style.display = 'none';
    }
}

function performSearch() {
    const searchTerm = document.getElementById('searchInput').value;
    const resultDiv = document.getElementById('result');

    if (!searchTerm.trim()) {
        resultDiv.textContent = "Veuillez entrer un numéro à rechercher.";
        resultDiv.style.color = "orange";
        return;
    }

    if (phoneNumbersOnly.length === 0) {
        resultDiv.textContent = "Les données ne sont pas chargées ou sont vides. Veuillez rafraîchir la page.";
        resultDiv.style.color = "red";
        // Optionnel : essayer de recharger les données si elles sont vides
        // loadAndParseData(); 
        return;
    }

    // Normaliser le terme recherché par l'utilisateur pour ne garder que les chiffres
    const normalizedSearchDigits = searchTerm.replace(/\D/g, '');
    let found = false;

    if (normalizedSearchDigits === "") { // Si l'utilisateur n'a entré que du texte non numérique
        resultDiv.textContent = "Veuillez entrer des chiffres pour la recherche de numéro.";
        resultDiv.style.color = "orange";
        return;
    }

    for (const storedDigits of phoneNumbersOnly) {
        // Vérifier si les chiffres recherchés sont inclus dans les numéros stockés
        if (storedDigits.includes(normalizedSearchDigits)) {
            found = true;
            break;
        }
    }

    if (found) {
        resultDiv.textContent = `Le numéro (ou la séquence de chiffres) "${searchTerm}" est PRÉSENT dans les données.`;
        resultDiv.style.color = "green";
    } else {
        resultDiv.textContent = `Le numéro "${searchTerm}" N'EST PAS PRÉSENT dans les données.`;
        resultDiv.style.color = "red";
    }
}

// Charger les données lorsque la page est prête
window.onload = loadAndParseData;