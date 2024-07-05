// CARGAR ARCHIVOS //

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

// Función mostrarProducto
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
    const attributesCell = row.insertCell();

    idCell.textContent = data.id;
    imageCell.innerHTML = `<img src="<span class="math-inline">\{data\.thumbnail\}" alt\="</span>{data.title}">`;
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
    freeShippingCell.textContent = data.shipping && data.shipping.free_shipping ? "Sí" : "No";
    statusCell.textContent = data.status || "-";
    shippingModeCell.textContent = data.shipping && data.shipping.mode ? data.shipping.mode : "-";

    const link = document.createElement('a');
    link.href = data.permalink;
    link.textContent = 'Link';
    link.target = '_blank';
    permalinkCell.appendChild(link);

    // Botón para ver atributos
    const attributesButton = document.createElement('button');
    attributesButton.textContent = 'Ver Atributos';
    attributesButton.classList.add('btn', 'btn-primary', 'attributes-button');
    attributesButton.addEventListener('click', () => abrirAtributos(data.id));
    attributesCell.appendChild(attributesButton);
}

// Función abrirAtributos
async function abrirAtributos(itemId) {
    try {
        const response = await fetch(`https://api.mercadolibre.com/items/${itemId}?include_attributes=all`);
        const data = await response.json();
        mostrarDetallesProducto(data);
    } catch (error) {
        console.error('Error al obtener los detalles del producto:', error);
    }
}

// Función para mostrar los detalles del producto en una nueva ventana
async function mostrarDetallesProducto(data) {
    const newWindow = window.open('', '_blank');
    if (newWindow) {
        let shippingMethods = data.shipping && data.shipping.methods ? data.shipping.methods.join(', ') : 'N/A';
        let shippingDimensions = data.shipping && data.shipping.dimensions ? JSON.stringify(data.shipping.dimensions) : 'N/A';

        newWindow.document.body.innerHTML = `
            <h2>${data.title}</h2>
            <p><strong>ID:</strong> ${data.id}</p>
            <p><strong>Price:</strong> ${data.price} ${data.currency_id}</p>
            <p><strong>Base Price:</strong> ${data.base_price} ${data.currency_id}</p>
            <p><strong>Original Price:</strong> ${data.original_price || "N/A"} ${data.currency_id}</p>
            <p><strong>Initial Quantity:</strong> ${data.initial_quantity}</p>
            <p><strong>Listing Type ID:</strong> ${data.listing_type_id}</p>
            <p><strong>Condition:</strong> <span class="math-inline">\{data\.condition\}</p\>
<p\><strong\>Permalink\:</strong\> <a href\="</span>{data.permalink}" target="_blank">${data.permalink}</a></p>
            <p><strong>Shipping Mode:</strong> ${data.shipping && data.shipping.mode ? data.shipping.mode : 'N/A'}</p>
            <p><strong>Shipping Methods:</strong> ${shippingMethods}</p>
            <p><strong>Shipping Dimensions:</strong> ${shippingDimensions}</p>
            <p><strong>Local Pick Up:</strong> ${data.shipping && data.shipping.local_pick_up ? data.shipping.local_pick_up : 'N/A'}</p>
            <p><strong>Free Shipping:</strong> ${data.shipping && data.shipping.free_shipping ? "Sí" : "No"}</p>
            <p><strong>Logistic Type:</strong> ${data.shipping && data.shipping.logistic_type ? data.shipping.logistic_type : 'N/A'}</p>
            <p><strong>Store Pick Up:</strong> ${data.shipping && data.shipping.store_pick_up ? data.shipping.store_pick_up : 'N/A'}</p>
            <p><strong>Status:</strong> ${data.status}</p>
            <p><strong>Warranty:</strong> ${data.warranty}</p>
            <p><strong>Catalog Product ID:</strong> ${data.catalog_product_id || "N/A"}</p>
            <p><strong>Last Updated:</strong> ${data.last_updated}</p>
        `;

        if (data.attributes && data.attributes.length > 0) {
            newWindow.document.body.innerHTML += '<h3>Atributos:</h3>';
            data.attributes.forEach(attr => {
                newWindow.document.body.innerHTML += `<p><strong>${attr.name}:</strong> ${attr.value_name}</p>`;
            });
        }
    } else {
        console.error('No se pudo abrir una nueva ventana.');
    }
}

// Cargar productos desde localStorage al iniciar
document.addEventListener('DOMContentLoaded', () => {
    agregarEventosDeFiltrado();

    // Asegurarse de que el contador de productos se inicialice en 0 al cargar la página
    actualizarContadorProductos(0);
});

// Evento para procesar archivos
async function procesarArchivo() {
    const fileInput = document.getElementById('fileInput');
    const file = fileInput.files[0];
    const itemDetailsContainer = document.getElementById('item-details').getElementsByTagName('tbody')[0];
    const loadingIndicator = document.getElementById('loading-indicator');
    let productCount = 0;
    let mlaCount = 0;

    if (file) {
        // Actualizar el texto de la etiqueta del archivo
        fileInput.nextElementSibling.textContent = file.name;

        itemDetailsContainer.innerHTML = '';
        const reader = new FileReader();
        reader.onload = async function (e) {
            let rows;
            if (file.name.endsWith('.csv')) {
                rows = e.target.result.split('\n');
            } else if (file.name.endsWith('.xls') || file.name.endsWith('.xlsx')) {
                const workbook = XLSX.read(e.target.result, { type: 'binary' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                rows = XLSX.utils.sheet_to_csv(worksheet).split('\n');
            }

            // Mostrar indicador de carga
            loadingIndicator.style.display = 'block';

            for (const row of rows) {
                const itemId = row.trim();
                if (itemId) {
                    const itemData = await buscarProducto(itemId);
                    if (itemData) {
                        mostrarProducto(itemData, itemDetailsContainer);
                        productCount++;

                        // Actualizar contador de MLAs
                        if (itemData.listing_type_id === "gold_premium") {
                            mlaCount++;

                            // Exportar a XLSX
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

                            // Agregar eventos de filtrado
                            function agregarEventosDeFiltrado() {
                                const searchButtons = document.querySelectorAll('.search-button');

                                searchButtons.forEach(button => {
                                    button.addEventListener('click', () => {
                                        const filterText = button.parentNode.querySelector('.filter').value.toLowerCase();
                                        const column = button.dataset.column;

                                        const itemDetailsContainer = document.getElementById('item-details').getElementsByTagName('tbody')[0];
                                        const rows = itemDetailsContainer.getElementsByTagName('tr');
                                        let visibleCount = 0;
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
                                        actualizarContadorProductos(visibleCount);
                                    });
                                });
                            }
                        }
                    }
                }
            }
        }
    }
}