class TradingWidgetManager {
    constructor() {
        this.currentSymbol = 'NASDAQ:AAPL';
        this.currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
        this.widgets = new Map();
        
        // Initialize widgets
        this.initializeWidgets();
        
        // Set up symbol search
        this.setupSymbolSearch();
        
        // Listen for theme changes
        this.setupThemeListener();
    }

    initializeWidgets() {
        // Initialize Chart Widget
        this.createAdvancedChart('tradingview-chart');
        
        // Initialize other widgets (to be added later)
        // this.createMarketMovers('market-movers-widget');
        // this.createTechnicalAnalysis('technical-analysis-widget');
        // this.createCompanyProfile('company-profile-widget');
        // this.createFinancials('financials-widget');
        // this.createNewsFeed('news-feed-widget');
    }

    createAdvancedChart(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        // Clear existing content
        container.innerHTML = '';

        // Create widget container
        const widgetContainer = document.createElement('div');
        widgetContainer.className = 'tradingview-widget-container';
        widgetContainer.style.height = '100%';
        widgetContainer.style.width = '100%';

        // Create widget div
        const widget = document.createElement('div');
        widget.className = 'tradingview-widget-container__widget';
        widget.style.height = '100%';
        widget.style.width = '100%';

        // Create copyright div (hidden to maximize space)
        const copyright = document.createElement('div');
        copyright.className = 'tradingview-widget-copyright';
        copyright.style.display = 'none';
        copyright.innerHTML = '<a href="https://www.tradingview.com/" rel="noopener nofollow" target="_blank"><span class="blue-text">Track all markets on TradingView</span></a>';

        // Append elements
        widgetContainer.appendChild(widget);
        widgetContainer.appendChild(copyright);
        container.appendChild(widgetContainer);

        // Create and load script
        const script = document.createElement('script');
        script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
        script.type = 'text/javascript';
        script.async = true;

        // Widget configuration
        const widgetConfig = {
            autosize: true,
            symbol: this.currentSymbol,
            interval: "D",
            timezone: "Etc/UTC",
            theme: this.currentTheme,
            style: "1",
            locale: "en",
            withdateranges: true,
            hide_side_toolbar: false,
            allow_symbol_change: true,
            details: true,
            hotlist: true,
            calendar: false,
            support_host: "https://www.tradingview.com"
        };

        script.textContent = JSON.stringify(widgetConfig);
        widgetContainer.appendChild(script);

        // Store widget reference
        this.widgets.set('chart', {
            containerId,
            update: () => this.createAdvancedChart(containerId)
        });
    }

    updateSymbol(newSymbol) {
        this.currentSymbol = newSymbol;
        
        // Update all widgets that need symbol sync
        this.widgets.forEach(widget => {
            widget.update();
        });
    }

    updateTheme(newTheme) {
        this.currentTheme = newTheme;
        
        // Update all widgets
        this.widgets.forEach(widget => {
            widget.update();
        });
    }

    setupSymbolSearch() {
        const searchInput = document.getElementById('symbolSearch');
        const searchButton = document.getElementById('searchButton');

        if (searchInput && searchButton) {
            searchButton.addEventListener('click', () => {
                const symbol = searchInput.value.trim().toUpperCase();
                if (symbol) {
                    this.updateSymbol(symbol);
                }
            });

            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    const symbol = searchInput.value.trim().toUpperCase();
                    if (symbol) {
                        this.updateSymbol(symbol);
                    }
                }
            });
        }
    }

    setupThemeListener() {
        // Listen for theme changes
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.attributeName === 'data-theme') {
                    const newTheme = document.documentElement.getAttribute('data-theme') || 'light';
                    this.updateTheme(newTheme);
                }
            });
        });

        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['data-theme']
        });
    }
}

// Initialize widget manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.tradingWidgetManager = new TradingWidgetManager();
});
