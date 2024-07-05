// Definición de variables globales
let attributesCell; // Declaración global única para attributesCell

// Función para buscar detalles de un producto por su ID
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

// Función para obtener la descripción de un producto por su ID
async function obtenerDescripcionProducto(itemId) {
    try {
        const response = await fetch(`https://api.mercadolibre.com/items/${itemId}/description`);
        const data = await response.json();
        return data.plain_text; // Devolvemos solo el texto plano de la descripción
    } catch (error) {
        console.error('Error al obtener la descripción del producto:', error);
        return null;
    }
}

// Función para mostrar los detalles de un producto en una tabla
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
    attributesCell = row.insertCell(); // Asignamos a la variable global attributesCell

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
    freeShippingCell.textContent = data.shipping && data.shipping.free_shipping ? "Sí" : "No";
    statusCell.textContent = data.status || "-";
    shippingModeCell.textContent = data.shipping && data.shipping.mode ? data.shipping.mode : "-";

    const link = document.createElement('a');
    link.href = data.permalink;
    link.textContent = 'Link';
    link.target = '_blank';
    permalinkCell.appendChild(link);

    // Celda para el botón "Ver Descripción"
    const descriptionCell = row.insertCell();
    const descriptionButton = document.createElement('button');
    descriptionButton.textContent = 'Ver Descripción';
    descriptionButton.classList.add('btn', 'btn-info', 'description-button');
    descriptionButton.addEventListener('click', () => mostrarDescripcion(data.id));
    descriptionCell.appendChild(descriptionButton);

    // Celda para el botón "Ver Atributos"
    const attributesButton = document.createElement('button');
    attributesButton.textContent = 'Ver Atributos';
    attributesButton.classList.add('btn', 'btn-primary', 'attributes-button');
    attributesButton.addEventListener('click', () => mostrarAtributos(data.id));
    attributesCell.appendChild(attributesButton);
}

// Función para mostrar la descripción de un producto en un modal
async function mostrarDescripcion(itemId) {
    const descripcion = await obtenerDescripcionProducto(itemId);

    const modal = document.createElement('div');
    modal.classList.add('modal', 'fade');
    modal.innerHTML = `
        <div class="modal-dialog modal-dialog-scrollable">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">Descripción del Producto</h5>
                    <button type="button" class="close" data-dismiss="modal">&times;</button>
                </div>
                <div class="modal-body">
                    ${descripcion} 
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
    $(modal).modal('show');
}

// Función para mostrar los atributos de un producto en un modal
async function mostrarAtributos(itemId) {
    try {
        const response = await fetch(`https://api.mercadolibre.com/items/${itemId}?include_attributes=all`);
        const data = await response.json();

        const modal = document.createElement('div');
        modal.classList.add('modal', 'fade');
        modal.innerHTML = `
            <div class="modal-dialog modal-dialog-scrollable">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Atributos del Producto</h5>
                        <button type="button" class="close" data-dismiss="modal">&times;</button>
                    </div>
                    <div class="modal-body">
                        <h3>Atributos:</h3>
                    </div>
                </div>
            </div>
        `;

        // Agrega cada atributo como un párrafo en el modal body
        const modalBody = modal.querySelector('.modal-body');
        data.attributes.forEach(attr => {
            const attributeElement = document.createElement('p');
            attributeElement.innerHTML = `<strong>${attr.name}:</strong> ${attr.value_name}`;
            modalBody.appendChild(attributeElement);
        });

        document.body.appendChild(modal);
        $(modal).modal('show');
    } catch (error) {
        console.error('Error al obtener los atributos del producto:', error);
    }
}


// Evento para procesar archivos al cargar un archivo CSV, XLS o XLSX
async function procesarArchivo() {
    const fileInput = document.getElementById('fileInput');
    const file = fileInput.files[0];
    const itemDetailsContainer = document.getElementById('item-details').getElementsByTagName('tbody')[0];
    const loadingIndicator = document.getElementById('loading-indicator');

    if (file) {
        // Actualiza el texto de la etiqueta del archivo
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

            // Contador para productos cargados exitosamente
            let productCount = 0;

            // Muestra el indicador de carga
            loadingIndicator.style.display = 'block';

            // Itera sobre las filas del archivo para obtener y mostrar detalles de productos
            for (const row of rows) {
                const itemId = row.trim();
                if (itemId) {
                    const itemData = await buscarProducto(itemId);
                    if (itemData) {
                        mostrarProducto(itemData, itemDetailsContainer);
                        productCount++; // Incrementa el contador de productos cargados
                    }
                }
            }

            // Oculta el indicador de carga después de cargar todos los productos
            loadingIndicator.style.display = 'none';

            // Actualiza el contador de productos cargados
            actualizarContadorProductos(productCount);

            // Agrega eventos de filtrado después de cargar los productos
            agregarEventosDeFiltrado();
        };

        // Lee el contenido del archivo como texto binario
        reader.readAsBinaryString(file);
    }
}

// Función para actualizar el contador de productos mostrados
function actualizarContadorProductos(count) {
    const productCountSpan = document.getElementById('product-count');
    productCountSpan.textContent = `Productos: ${count}`;
}

// Función para exportar los detalles de productos a un archivo XLSX descargable
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

// Agrega eventos de filtrado a los botones de búsqueda
function agregarEventosDeFiltrado() {
    const searchButtons = document.querySelectorAll('.search-button');

    searchButtons.forEach(button => {
        button.addEventListener('click', () => {
            const filterText = button.parentNode.querySelector('.filter').value.toLowerCase();
            const column = button.dataset.column;

            const itemDetailsContainer = document.getElementById('item-details').getElementsByTagName('tbody')[0];
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
            actualizarContadorProductos(visibleCount); // Actualiza el contador después de filtrar
        });
    });
}

// Evento para cargar eventos de filtrado y procesar archivos al cargar el documento HTML
document.addEventListener('DOMContentLoaded', () => {
    agregarEventosDeFiltrado();
});


// Asociar evento de click al botón de buscar MLA
document.getElementById('buscarMLA').addEventListener('click', async function() {
    const mla = document.getElementById('mlaInput').value.trim(); // Obtener valor del MLA y limpiar espacios
    if (mla) {
        const itemDetailsContainer = document.getElementById('item-details').getElementsByTagName('tbody')[0];
        const loadingIndicator = document.getElementById('loading-indicator');

        // Mostrar carga
        itemDetailsContainer.innerHTML = '';
        loadingIndicator.style.display = 'block';

        try {
            const itemData = await buscarProducto(mla); // Llamar a función para buscar por MLA
            if (itemData) {
                mostrarProducto(itemData, itemDetailsContainer);
            } else {
                console.error('No se encontró ningún producto con ese MLA.');
            }
        } catch (error) {
            console.error('Error al buscar producto:', error);
        } finally {
            // Ocultar carga
            loadingIndicator.style.display = 'none';
        }
    } else {
        console.error('Ingrese un MLA válido.');
    }
});

// Función para buscar producto por MLA (simulación)
async function buscarProducto(mla) {
    // Aquí deberías implementar la lógica para buscar por MLA, ya sea mediante una API o datos locales
    // Este ejemplo es una simulación
    const response = await fetch(`https://api.mercadolibre.com/items/${mla}`);
    if (response.ok) {
        const data = await response.json();
        return data;
    } else {
        throw new Error('Producto no encontrado');
    }
}
