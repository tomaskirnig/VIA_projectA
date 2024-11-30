document.addEventListener('DOMContentLoaded', function () {
    // Populate cryptocurrency dropdown
    populateCryptoDropdown();

    // Handle form submission
    document.getElementById('crypto-form').addEventListener('submit', function (event) {
        event.preventDefault(); // Prevent the form from submitting normally

        // Get user inputs
        const cryptoId = document.getElementById('crypto-select').value;
        const currency = document.getElementById('currency-select').value;
        const days = document.getElementById('date-range').value;

        // Validate inputs
        if (!cryptoId || !currency || !days) {
            alert('Please make sure all fields are selected.');
            return;
        }

        // Fetch data and render coin section
        renderCoinSection(cryptoId, currency, days);
    });
});

// Function to populate the cryptocurrency dropdown
function populateCryptoDropdown() {
    $.ajax({
        url: 'https://api.coingecko.com/api/v3/coins/markets',
        method: 'GET',
        dataType: 'json',
        data: {
            vs_currency: 'usd', // Retrieve data in USD
            order: 'market_cap_desc', // Order by market cap descending
            per_page: 250, // Max coins per page
            page: 1, // First page
            sparkline: false // Exclude sparkline data for simplicity
        },
        success: function (data) {
            const select = document.getElementById('crypto-select');
            data.forEach(coin => {
                const option = document.createElement('option');
                option.value = coin.id;
                option.textContent = `${coin.name} (${coin.symbol.toUpperCase()})`;
                select.appendChild(option);
            });

            // Fetch additional coins (optional)
            $.ajax({
                url: 'https://api.coingecko.com/api/v3/coins/markets',
                method: 'GET',
                dataType: 'json',
                data: {
                    vs_currency: 'usd',
                    order: 'market_cap_desc',
                    per_page: 50, // Fetch the next 50 coins
                    page: 2,
                    sparkline: false
                },
                success: function (data) {
                    data.forEach(coin => {
                        const option = document.createElement('option');
                        option.value = coin.id;
                        option.textContent = `${coin.name} (${coin.symbol.toUpperCase()})`;
                        select.appendChild(option);
                    });
                },
                error: function (error) {
                    console.error('Error fetching additional coins:', error);
                }
            });
        },
        error: function (error) {
            console.error('Error fetching cryptocurrency list:', error);
            alert('Failed to fetch cryptocurrency list.');
        }
    });
}

// Function to render the coin section
function renderCoinSection(cryptoId, currency, days) {
    const coinSectionId = `coin-section-${cryptoId}-${currency}`;

    // Check if the coin section already exists
    if (document.getElementById(coinSectionId)) {
        alert('This coin is already added.');
        return;
    }

    // Create the coin section
    const coinContainer = document.getElementById('coin-container');
    const coinSection = document.createElement('div');
    coinSection.id = coinSectionId;
    coinSection.className = 'coin-section card mb-4';

    // Create card header
    const cardHeader = document.createElement('div');
    cardHeader.className = 'card-header d-flex justify-content-between align-items-center';
    const coinTitle = document.createElement('h5');
    coinTitle.className = 'mb-0';
    coinTitle.textContent = 'Loading...';
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'btn btn-danger btn-sm';
    deleteBtn.textContent = 'Delete';
    deleteBtn.addEventListener('click', () => coinContainer.removeChild(coinSection));
    cardHeader.appendChild(coinTitle);
    cardHeader.appendChild(deleteBtn);

    // Create card body
    const cardBody = document.createElement('div');
    cardBody.className = 'card-body';
    const currentPriceDiv = document.createElement('div');
    currentPriceDiv.className = 'current-price';
    const canvas = document.createElement('canvas');
    canvas.id = `chart-${cryptoId}-${currency}`;
    cardBody.appendChild(currentPriceDiv);
    cardBody.appendChild(canvas);

    // Assemble coin section
    coinSection.appendChild(cardHeader);
    coinSection.appendChild(cardBody);
    coinContainer.appendChild(coinSection);

    // Fetch current price and update the coin title
    fetchCurrentPrice(cryptoId, currency, currentPriceDiv, coinTitle);

    // Fetch historical data and render chart
    fetchHistoricalData(cryptoId, currency, days, canvas.id);
}

// Function to fetch current price and update the coin section
function fetchCurrentPrice(cryptoId, currency, currentPriceDiv, coinTitle) {
    $.ajax({
        url: 'https://api.coingecko.com/api/v3/simple/price',
        method: 'GET',
        dataType: 'json',
        data: {
            ids: cryptoId,
            vs_currencies: currency,
            include_24hr_change: true
        },
        success: function (data) {
            const price = data[cryptoId][currency];
            const change = data[cryptoId][`${currency}_24h_change`].toFixed(2);

            currentPriceDiv.innerHTML = `
                <h6>Current Price: ${price} ${currency.toUpperCase()}</h6>
                <p>24h Change: ${change}%</p>
            `;

            coinTitle.textContent = cryptoId.charAt(0).toUpperCase() + cryptoId.slice(1);
        },
        error: function (error) {
            console.error('Error fetching current price:', error);
            alert('Failed to fetch current price.');
            coinTitle.textContent = 'Error Loading Coin';
        }
    });
}

// Function to fetch historical data and render the chart
function fetchHistoricalData(cryptoId, currency, days, canvasId) {
    $.ajax({
        url: `https://api.coingecko.com/api/v3/coins/${cryptoId}/market_chart`,
        method: 'GET',
        dataType: 'json',
        data: {
            vs_currency: currency,
            days: days
        },
        success: function (data) {
            const prices = data.prices;
            const labels = prices.map(value => new Date(value[0]).toLocaleDateString());
            const priceData = prices.map(value => value[1]);

            renderChart(labels, priceData, cryptoId, currency, canvasId);
        },
        error: function (error) {
            console.error('Error fetching historical data:', error);
            alert('Failed to fetch historical data.');
        }
    });
}

// Function to render the chart
function renderChart(labels, data, cryptoId, currency, canvasId) {
    const ctx = document.getElementById(canvasId).getContext('2d');

    new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: `${cryptoId.toUpperCase()} Price in ${currency.toUpperCase()}`,
                data: data,
                borderColor: 'rgba(75, 192, 192, 1)',
                fill: false,
                tension: 0.1
            }]
        },
        options: {
            scales: {
                x: {
                    display: true,
                    title: { display: true, text: 'Date' }
                },
                y: {
                    display: true,
                    title: { display: true, text: `Price (${currency.toUpperCase()})` }
                }
            },
            plugins: {
                tooltip: { mode: 'index', intersect: false },
                legend: { display: true, position: 'top' }
            },
            interaction: {
                mode: 'nearest',
                axis: 'x',
                intersect: false
            }
        }
    });
}
