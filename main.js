document.addEventListener('DOMContentLoaded', function () {
    populateCryptoDropdown();
    loadPortfolio(); // Load portfolio from local storage

    document.getElementById('crypto-form').addEventListener('submit', function (event) {
        event.preventDefault();

        const cryptoId = document.getElementById('crypto-select').value;
        const currency = document.getElementById('currency-select').value;

        if (!cryptoId || !currency) {
            alert('Please make sure all fields are selected.');
            return;
        }

        renderCoinSection(cryptoId, currency);
    });
});

function loadPortfolio() {
    let portfolio = JSON.parse(localStorage.getItem('portfolio')) || [];
    const portfolioList = document.getElementById('portfolio-list');

    // Ensure all items in portfolio are objects with valid `cryptoId` and `currency`
    //portfolio = portfolio.filter(item => item && typeof item.cryptoId === 'string' && typeof item.currency === 'string');

    portfolio.forEach(({ cryptoId, currency }) => {
        addPortfolioItem(cryptoId, currency, portfolioList); // Add to portfolio list
        renderCoinSection(cryptoId, currency); // Display coin data
    });

    // Save sanitized portfolio back to local storage
    localStorage.setItem('portfolio', JSON.stringify(portfolio));
}


function addPortfolioItem(cryptoId, currency, portfolioList) {
    const listItem = document.createElement('li');
    listItem.className = 'list-group-item portfolio-item';
    listItem.textContent = `${cryptoId.charAt(0).toUpperCase() + cryptoId.slice(1)} (${currency.toUpperCase()})`;

    listItem.addEventListener('click', function () {
        const coinSection = document.getElementById(`coin-section-${cryptoId}-${currency}`);
        if (coinSection) {
            coinSection.scrollIntoView({ behavior: 'smooth' });
        } else {
            alert('This coin is not yet added to the tracker!');
        }
    });

    portfolioList.appendChild(listItem);
}

function deletePortfolioItem(cryptoId, currency) {
    let portfolio = JSON.parse(localStorage.getItem('portfolio')) || [];

    // Remove the coin from the portfolio
    portfolio = portfolio.filter(item => item.cryptoId !== cryptoId || item.currency !== currency);
    localStorage.setItem('portfolio', JSON.stringify(portfolio));

    // Remove the coin from the portfolio list
    const portfolioList = document.getElementById('portfolio-list');
    const listItem = Array.from(portfolioList.children).find(
        item => item.textContent === `${cryptoId.charAt(0).toUpperCase() + cryptoId.slice(1)} (${currency.toUpperCase()})`
    );
    if (listItem) {
        portfolioList.removeChild(listItem);
    }

    alert(`${cryptoId} (${currency}) has been removed from your portfolio.`);
}



function saveToPortfolio(cryptoId, currency) {
    let portfolio = JSON.parse(localStorage.getItem('portfolio')) || [];

    // Check if the coin is already in the portfolio
    if (portfolio.some(item => item.cryptoId === cryptoId && item.currency === currency)) {
        alert(`${cryptoId} (${currency}) is already in your portfolio.`);
        return;
    }

    // Add the new coin to the portfolio
    portfolio.push({ cryptoId, currency });
    localStorage.setItem('portfolio', JSON.stringify(portfolio));

    const portfolioList = document.getElementById('portfolio-list');
    addPortfolioItem(cryptoId, currency, portfolioList);

    alert(`${cryptoId} (${currency}) has been added to your portfolio.`);
}


function populateCryptoDropdown() {
    console.log('Fetching cryptocurrency list...');
    $.ajax({
        url: 'https://api.coingecko.com/api/v3/coins/markets',
        method: 'GET',
        dataType: 'json',
        data: {
            vs_currency: 'usd', 
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

function renderCoinSection(cryptoId, currency) {
    const coinSectionId = `coin-section-${cryptoId}-${currency}`;

    // Check if the coin section already exists
    const existingSection = document.getElementById(coinSectionId);
    if (existingSection) {
        console.log(`Coin section for ${cryptoId} (${currency}) already exists.`);
        return;
    }

    const portfolio = JSON.parse(localStorage.getItem('portfolio')) || [];
    const isInPortfolio = portfolio.some(item => item.cryptoId === cryptoId && item.currency === currency);

    const coinContainer = document.getElementById('coin-container');
    const coinSection = document.createElement('div');
    coinSection.id = coinSectionId;
    coinSection.className = 'coin-section card mb-4';

    const cardHeader = document.createElement('div');
    cardHeader.className = 'card-header d-flex justify-content-between align-items-center';

    const coinTitle = document.createElement('h5');
    coinTitle.className = 'mb-0';
    coinTitle.textContent = 'Loading...';

    const portfolioBtn = document.createElement('button');
    portfolioBtn.className = isInPortfolio ? 'btn btn-danger btn-sm' : 'btn btn-success btn-sm';
    portfolioBtn.textContent = isInPortfolio ? 'Remove from Portfolio' : 'Add to Portfolio';

    // Toggle between adding and removing the coin from the portfolio
    portfolioBtn.addEventListener('click', function () {
        if (portfolioBtn.textContent === 'Add to Portfolio') {
            saveToPortfolio(cryptoId, currency);
            portfolioBtn.textContent = 'Remove from Portfolio';
            portfolioBtn.className = 'btn btn-danger btn-sm';
        } else {
            deletePortfolioItem(cryptoId, currency);
            portfolioBtn.textContent = 'Add to Portfolio';
            portfolioBtn.className = 'btn btn-success btn-sm';
        }
    });

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'btn btn-danger btn-sm';
    deleteBtn.textContent = 'Delete';
    deleteBtn.addEventListener('click', () => coinContainer.removeChild(coinSection));

    cardHeader.appendChild(coinTitle);
    cardHeader.appendChild(portfolioBtn);
    cardHeader.appendChild(deleteBtn);

    const cardBody = document.createElement('div');
    cardBody.className = 'card-body';

    const timeFrameSelector = document.createElement('select');
    timeFrameSelector.className = 'form-control mb-3';
    timeFrameSelector.innerHTML = `
        <option value="7">1 Week</option>
        <option value="30">1 Month</option>
        <option value="90">3 Months</option>
        <option value="365">1 Year</option>
    `;
    timeFrameSelector.value = "365";

    const currentPriceDiv = document.createElement('div');
    currentPriceDiv.className = 'current-price';

    const canvas = document.createElement('canvas');
    canvas.id = `chart-${cryptoId}-${currency}`;

    cardBody.appendChild(timeFrameSelector);
    cardBody.appendChild(currentPriceDiv);
    cardBody.appendChild(canvas);

    coinSection.appendChild(cardHeader);
    coinSection.appendChild(cardBody);
    coinContainer.appendChild(coinSection);

    fetchCurrentPrice(cryptoId, currency, currentPriceDiv, coinTitle);
    fetchHistoricalDataAndInitializeChart(cryptoId, currency, canvas.id, timeFrameSelector);
}


// Function to fetch current price and update the coin section
function fetchCurrentPrice(cryptoId, currency, currentPriceDiv, coinTitle) {
    console.log(`Fetching current price for ${cryptoId}...`);
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

// Function to fetch 1 year of historical data and initialize the chart
function fetchHistoricalDataAndInitializeChart(cryptoId, currency, canvasId, timeFrameSelector) {
    const url = `https://api.coingecko.com/api/v3/coins/${cryptoId}/market_chart`;
    console.log(`Fetching historical data for ${cryptoId}...`);

    $.ajax({
        url: url,
        method: 'GET',
        dataType: 'json',
        data: {
            vs_currency: currency,
            days: "365", // Fetch data for 1 year
        },
        success: function (data) {
            const allData = data.prices; // Store all price data for 1 year

            // Default chart display (1 Year)
            updateChart(allData, 365, canvasId);

            // Handle time frame changes
            timeFrameSelector.addEventListener('change', function () {
                const selectedTimeFrame = parseInt(this.value, 10); // Get selected time frame
                updateChart(allData, selectedTimeFrame, canvasId); // Update chart
            });
        },
        error: function (error) {
            console.error('Error fetching historical data:', error);
            alert('Failed to fetch historical data.');
        }
    });
}

// Function to update the chart based on the selected time frame
function updateChart(allData, timeFrame, canvasId) {
    // Filter data based on the selected time frame
    const now = new Date();
    const filteredData = allData.filter(value => {
        const date = new Date(value[0]);
        const timeDifference = (now - date) / (1000 * 60 * 60 * 24); // Difference in days
        return timeDifference <= timeFrame;
    });

    const labels = filteredData.map(value => new Date(value[0]).toLocaleDateString());
    const priceData = filteredData.map(value => value[1]);

    renderChart(labels, priceData, canvasId);
}

// Function to render the chart
function renderChart(labels, data, canvasId) {
    const ctx = document.getElementById(canvasId).getContext('2d');

    // Destroy existing chart if it exists
    if (ctx.chart) {
        ctx.chart.destroy();
    }

    ctx.chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Price',
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
                    title: { display: true, text: 'Price (USD)' }
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