async function buscarProducto(itemId) {
    try {
        const response = await fetch(`https://api.mercadolibre.com/items/${itemId}`);
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error al obtener los detalles del producto:', error);
        return null;
    }
}

function mostrarProducto(data, container) {
    const row = container.insertRow();

    const idCell = row.insertCell();
    const imageCell = row.insertCell();
    const titleCell = row.insertCell();
    const priceCell = row.insertCell();
    const basePriceCell = row.insertCell();
    const gtinCell = row.insertCell();
    const brandCell = row.insertCell();
    const skuCell = row.insertCell();
    const listingTypeIdCell = row.insertCell();
    const conditionCell = row.insertCell();
    const freeShippingCell = row.insertCell();
    const statusCell = row.insertCell();
    const shippingModeCell = row.insertCell();
    const permalinkCell = row.insertCell();
    const attributesCell = row.insertCell(); // Nueva celda para los atributos

    idCell.textContent = data.id;
    imageCell.innerHTML = `<img src="${data.thumbnail}" alt="${data.title}">`;
    titleCell.textContent = data.title;
    priceCell.textContent = `$${data.price}`;
    basePriceCell.textContent = `$${data.base_price}`;

    const gtinAttribute = data.attributes.find(attr => attr.id === "GTIN");
    gtinCell.textContent = gtinAttribute ? gtinAttribute.value_name : "-";

    const brandAttribute = data.attributes.find(attr => attr.id === "BRAND");
    brandCell.textContent = brandAttribute ? brandAttribute.value_name : "-";

    const skuAttribute = data.attributes.find(attr => attr.id === "ALPHANUMERIC_MODEL");
    skuCell.textContent = skuAttribute ? skuAttribute.value_name : "-";

    listingTypeIdCell.textContent = data.listing_type_id || "-";
    conditionCell.textContent = data.condition || "-";
    freeShippingCell.textContent = data.shipping.free_shipping ? "Sí" : "No";
    statusCell.textContent = data.status || "-";
    shippingModeCell.textContent = data.shipping.mode || "-";

    const link = document.createElement('a');
    link.href = data.permalink;
    link.textContent = 'Link';
    link.target = '_blank';
    permalinkCell.appendChild(link);

    // Crear el botón de atributos
    const attributesButton = document.createElement('button');
    attributesButton.textContent = 'Atributos';
    attributesButton.className = 'btn btn-info';
    attributesButton.onclick = () => abrirAtributos(data.id);
    attributesCell.appendChild(attributesButton);
}

function abrirAtributos(mla) {
    const url = `https://api.mercadolibre.com/items/${mla}?include_attributes=all#json`;
    window.open(url, '_blank');
}

async function procesarArchivo() {
    const fileInput = document.getElementById('fileInput');
    const file = fileInput.files[0];
    const itemDetailsContainer = document.getElementById('item-details').getElementsByTagName('tbody')[0];
    const loadingIndicator = document.getElementById('loading-indicator');

    if (file) {
        // Actualizar el texto de la etiqueta del archivo
        fileInput.nextElementSibling.textContent = file.name;

        itemDetailsContainer.innerHTML = '';
        const reader = new FileReader();
        reader.onload = async function(e) {
            let rows;
            if (file.name.endsWith('.csv')) {
                rows = e.target.result.split('\n');
            } else if (file.name.endsWith('.xls') || file.name.endsWith('.xlsx')) {
                const workbook = XLSX.read(e.target.result, { type: 'binary' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                rows = XLSX.utils.sheet_to_csv(worksheet).split('\n');
            }

            // Contador de MLAs cargados
            let mlaCount = 0;

            // Mostrar indicador de carga
            loadingIndicator.style.display = 'block';

            for (const row of rows) {
                const itemId = row.trim();
                if (itemId) {
                    const itemData = await buscarProducto(itemId);
                    if (itemData) {
                        mostrarProducto(itemData, itemDetailsContainer);
                        mlaCount++; // Incrementar el contador
                    }
                }
            }

            // Ocultar indicador de carga
            loadingIndicator.style.display = 'none';

            // Actualizar el contador después de cargar todos los MLAs
            actualizarContadorMLAs(mlaCount);

            // Agregar eventos de filtrado
            const searchButtons = document.querySelectorAll('.search-button');

            searchButtons.forEach(button => {
                button.addEventListener('click', () => {
                    const filterText = button.parentNode.querySelector('.filter').value.toLowerCase();
                    const column = button.dataset.column;

                    const rows = itemDetailsContainer.getElementsByTagName('tr');
                    let visibleCount = 0; // Contador de filas visibles
                    for (const row of rows) {
                        const cell = row.getElementsByTagName('td')[column];
                        if (cell) {
                            const cellText = cell.textContent.toLowerCase();
                            row.style.display = (cellText.includes(filterText) && row.style.display !== 'none') ? '' : 'none';
                            if (row.style.display !== 'none') {
                                visibleCount++;
                            }
                        }
                    }
                    actualizarContadorMLAs(visibleCount); // Actualizar contador después de filtrar
                });
            });
        };
        reader.readAsBinaryString(file);
    }
}

// Función para actualizar el contador de MLAs
function actualizarContadorMLAs(count) {
    const mlaCountSpan = document.getElementById('mla-count');
    mlaCountSpan.textContent = `MLAs: ${count}`;
}

function exportarXLS() {
    const table = document.getElementById('item-details');
    const wb = XLSX.utils.table_to_book(table, { sheet: "Sheet JS" });
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'binary' });

    function s2ab(s) {
        const buf = new ArrayBuffer(s.length);
        const view = new Uint8Array(buf);
        for (let i = 0; i < s.length; i++) view[i] = s.charCodeAt(i) & 0xFF;
        return buf;
    }

    const blob = new Blob([s2ab(wbout)], { type: "application/octet-stream" });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = "mercadolibre_data.xlsx";
    link.click();
}

