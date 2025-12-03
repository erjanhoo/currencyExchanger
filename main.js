// API Configuration - ExchangeRate-API
const EXCHANGERATE_API_KEY = '033fe123ed68dba89e3444e3';
const EXCHANGERATE_API_BASE_URL = 'https://v6.exchangerate-api.com/v6/';

// Cache for exchange rate data
let exchangeRateCache = null;
let cacheTimestamp = null;
const CACHE_DURATION = 3600000; // 1 hour in milliseconds

const currencyToCountryCode = {
    'USD': 'us',
    'EUR': 'eu',
    'GBP': 'gb',
    'JPY': 'jp',
    'SGD': 'sg',
    'AUD': 'au',
    'CAD': 'ca',
    'CHF': 'ch',
    'CNY': 'cn',
    'INR': 'in',
    'MXN': 'mx',
    'BRL': 'br',
    'ZAR': 'za',
    'KRW': 'kr',
    'RUB': 'ru',
    'TRY': 'tr',
    'NZD': 'nz',
    'NOK': 'no',
    'SEK': 'se',
    'DKK': 'dk',
    'PLN': 'pl',
    'THB': 'th',
    'IDR': 'id',
    'MYR': 'my',
    'PHP': 'ph',
    'HKD': 'hk',
    'AED': 'ae',
    'SAR': 'sa',
    'EGP': 'eg',
    'ILS': 'il',
    'CZK': 'cz',
    'HUF': 'hu',
    'RON': 'ro',
    'CLP': 'cl',
    'ARS': 'ar',
    'COP': 'co',
    'VND': 'vn',
    'NGN': 'ng',
    'PKR': 'pk',
    'BDT': 'bd',
};

function getFlagUrl(currencyCode) {
    const countryCode = currencyToCountryCode[currencyCode] || currencyCode.substring(0, 2).toLowerCase();
    return `https://flagcdn.com/48x36/${countryCode}.png`;
}

// DOM Elements
const fromCurrencySelector = document.getElementById('fromCurrencySelector');
const toCurrencySelector = document.getElementById('toCurrencySelector');
const fromDropdown = document.getElementById('fromDropdown');
const toDropdown = document.getElementById('toDropdown');
const fromAmount = document.getElementById('fromAmount');
const toAmount = document.getElementById('toAmount');
const swapButton = document.getElementById('swapButton');
const convertButton = document.getElementById('convertButton');
const exchangeRate = document.getElementById('exchangeRate');
const fromCurrencyCode = document.getElementById('fromCurrencyCode');
const toCurrencyCode = document.getElementById('toCurrencyCode');
const fromFlag = document.getElementById('fromFlag');
const toFlag = document.getElementById('toFlag');

// State
let availableCurrencies = [];
let selectedFromCurrency = 'USD';
let selectedToCurrency = 'SGD';
let debounceTimer;

// Initialize
async function init() {
    await loadCurrencies();
    updateFlags();
    // Don't auto-convert on init - user must click Convert button
}

// Load available currencies from ExchangeRate-API
async function loadCurrencies() {
    try {
        // Fetch exchange rates from ExchangeRate-API using USD as base
        const response = await fetch(`${EXCHANGERATE_API_BASE_URL}${EXCHANGERATE_API_KEY}/latest/USD`);

        if (!response.ok) {
            throw new Error('Failed to fetch currencies from ExchangeRate-API');
        }

        const data = await response.json();

        if (data.result !== 'success') {
            throw new Error(`API Error: ${data['error-type'] || 'Unknown error'}`);
        }
        
        // Cache the exchange rate data
        exchangeRateCache = data.conversion_rates;
        cacheTimestamp = Date.now();

        // Extract currency codes from conversion_rates
        availableCurrencies = Object.keys(data.conversion_rates).map(code => ({
            code: code,
            rate: data.conversion_rates[code]
        }));

        console.log(`Loaded ${availableCurrencies.length} currencies from ExchangeRate-API`);

        // Set default currencies
        selectedFromCurrency = 'USD';
        selectedToCurrency = 'SGD';

        // Populate both dropdowns
        populateDropdown(fromDropdown, 'from');
        populateDropdown(toDropdown, 'to');
        
    } catch (error) {
        console.error('Error loading currencies:', error);
        // Fallback to a basic set of currencies if API fails
        availableCurrencies = [
            { code: 'USD', rate: 1.0 },
            { code: 'EUR', rate: 0.92 },
            { code: 'GBP', rate: 0.79 },
            { code: 'JPY', rate: 149.5 },
            { code: 'SGD', rate: 1.34 },
            { code: 'AUD', rate: 1.53 },
            { code: 'CAD', rate: 1.36 }
        ];
        selectedFromCurrency = 'USD';
        selectedToCurrency = 'SGD';
        populateDropdown(fromDropdown, 'from');
        populateDropdown(toDropdown, 'to');
    }
}

function populateDropdown(dropdownElement, type) {
    dropdownElement.innerHTML = '';
    
    availableCurrencies.forEach(currency => {
        const option = document.createElement('div');
        option.className = 'dropdown-option';
        if ((type === 'from' && currency.code === selectedFromCurrency) || 
            (type === 'to' && currency.code === selectedToCurrency)) {
            option.classList.add('selected');
        }
        
        const flag = document.createElement('img');
        flag.src = getFlagUrl(currency.code);
        flag.alt = `${currency.code} flag`;
        
        const code = document.createElement('span');
        code.textContent = currency.code;
        
        option.appendChild(flag);
        option.appendChild(code);
        
        option.addEventListener('click', () => {
            if (type === 'from') {
                selectedFromCurrency = currency.code;
                fromDropdown.classList.remove('show');
                fromCurrencySelector.classList.remove('active');
            } else {
                selectedToCurrency = currency.code;
                toDropdown.classList.remove('show');
                toCurrencySelector.classList.remove('active');
            }
            updateFlags();
            // Don't auto-convert - user must click Convert button
            // Update selected state
            populateDropdown(dropdownElement, type);
        });
        
        dropdownElement.appendChild(option);
    });
}

// Toggle dropdown visibility
fromCurrencySelector.addEventListener('click', (e) => {
    e.stopPropagation();
    fromDropdown.classList.toggle('show');
    fromCurrencySelector.classList.toggle('active');
    toDropdown.classList.remove('show');
    toCurrencySelector.classList.remove('active');
});

toCurrencySelector.addEventListener('click', (e) => {
    e.stopPropagation();
    toDropdown.classList.toggle('show');
    toCurrencySelector.classList.toggle('active');
    fromDropdown.classList.remove('show');
    fromCurrencySelector.classList.remove('active');
});

// Close dropdowns when clicking outside
document.addEventListener('click', () => {
    fromDropdown.classList.remove('show');
    toDropdown.classList.remove('show');
    fromCurrencySelector.classList.remove('active');
    toCurrencySelector.classList.remove('active');
});

// Add event listener to Convert button
convertButton.addEventListener('click', convertCurrency);

swapButton.addEventListener('click', swapCurrencies);

// Functions
function updateFlags() {
    fromCurrencyCode.textContent = selectedFromCurrency;
    toCurrencyCode.textContent = selectedToCurrency;
    
    // Set flag images
    fromFlag.src = getFlagUrl(selectedFromCurrency);
    fromFlag.alt = `${selectedFromCurrency} flag`;
    fromFlag.style.display = 'block';
    
    toFlag.src = getFlagUrl(selectedToCurrency);
    toFlag.alt = `${selectedToCurrency} flag`;
    toFlag.style.display = 'block';
}

async function convertCurrency() {
    const amount = parseFloat(fromAmount.value) || 0;

    if (amount === 0) {
        toAmount.value = '0.00';
        updateExchangeRate(0);
        return;
    }

    try {
        // Always fetch fresh rates from ExchangeRate-API when Convert button is clicked
        const response = await fetch(`${EXCHANGERATE_API_BASE_URL}${EXCHANGERATE_API_KEY}/latest/${selectedFromCurrency}`);

        if (!response.ok) {
            throw new Error('Conversion failed');
        }

        const data = await response.json();

        if (data.result !== 'success') {
            throw new Error(`API Error: ${data['error-type'] || 'Unknown error'}`);
        }

        // Get the conversion rate for target currency
        const rate = data.conversion_rates[selectedToCurrency];

        if (!rate) {
            throw new Error('Rate not found');
        }

        // Calculate converted amount
        const result = amount * rate;
        toAmount.value = result.toFixed(2);
        
        // Display exchange rate
        updateExchangeRate(rate);
        
    } catch (error) {
        console.error('Error converting currency:', error);
        toAmount.value = 'Error';
        exchangeRate.textContent = 'Unable to fetch rate';
    }
}

function updateExchangeRate(rate) {
    exchangeRate.textContent = `1 ${selectedFromCurrency} = ${rate.toFixed(4)} ${selectedToCurrency}`;
}

function swapCurrencies() {
    // Swap currency selections
    const temp = selectedFromCurrency;
    selectedFromCurrency = selectedToCurrency;
    selectedToCurrency = temp;
    
    // Swap amounts
    const tempAmount = fromAmount.value;
    fromAmount.value = toAmount.value;
    toAmount.value = tempAmount;

    // Update UI
    updateFlags();
    // Don't auto-convert - user must click Convert button
    populateDropdown(fromDropdown, 'from');
    populateDropdown(toDropdown, 'to');
    
    // Add animation
    swapButton.style.transform = 'rotate(180deg)';
    setTimeout(() => {
        swapButton.style.transform = 'rotate(0deg)';
    }, 300);
}

// Format number input on blur
fromAmount.addEventListener('blur', () => {
    const value = parseFloat(fromAmount.value);
    if (!isNaN(value)) {
        fromAmount.value = value.toFixed(2);
    }
});

// Prevent negative values
fromAmount.addEventListener('keydown', (e) => {
    if (e.key === '-' || e.key === 'e') {
        e.preventDefault();
    }
});

// Initialize the app
init();