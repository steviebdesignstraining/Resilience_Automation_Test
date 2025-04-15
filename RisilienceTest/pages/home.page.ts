import {expect, Page} from '@playwright/test';

export class HomePage {
    constructor(private page: Page) {}

    async homePageLanding() {
        const baseUrl = process.env.BASE_URL || 'https://www.ft.com/';
        await this.page.goto(baseUrl);
        await this.page.getByRole('button', {name: 'Accept All'}).click();
    }

    async cookies() {
        const acceptButton = this.page.getByRole('button', {
            name: 'Accept All',
        });

        if (await acceptButton.isVisible()) {
            await acceptButton.click();
            console.log('Clicked Accept All');
        } else {
            const header = this.page.locator('h1, h2, h3', {
                hasText: 'Find a forecast',
            });
            if (await header.isVisible()) {
                console.log('Verified header: Find a forecast');
            } else {
                console.log('Header not found!');
            }
        }
    }

    async searchBoxError() {
        const searchBarError = this.page.locator('#search-results-box');
        searchBarError.waitFor({state: 'visible', timeout: 5000});
        const errorMessages = await searchBarError.allTextContents();
        if (
            errorMessages.includes(
                "Sorry we don't have any matches for that. Please re-enter your place, postcode or country above.",
            )
        ) {
            console.log('Error message displayed as expected.');
        } else {
            console.error('Expected error message not found.');
        }
    }

    async search(term: string) {
        const searchBox = this.page.getByRole('combobox', {
            name: 'Search for a place,',
        });

        await searchBox.click();
        await searchBox.fill(term);
    }

    async enterSearchTerm(term: string) {
        const searchBox = this.page.getByRole('combobox', {
            name: 'Search for a place,',
        });
        await searchBox.click();
        await searchBox.fill(term);
        console.log(`Filled search with "${term}"`);

        // Wait a bit for suggestions to populate
        await this.page.waitForTimeout(1000);

        const suggestions = this.page.locator(
            '#suggested-results [role="menuitem"]',
        );
        const suggestionCount = await suggestions.count();
        console.log(`Suggestion count: ${suggestionCount}`);

        if (suggestionCount === 0) {
            const firstMenuItem = suggestions.first();
            await firstMenuItem.waitFor({state: 'visible', timeout: 10000});

            const text = await firstMenuItem.innerText();
            const trimmedText = text.trim().toLowerCase();
            trimmedText.startsWith('cambridge');
            throw new Error('No suggestions appeared after search.');
        }

        const firstMenuItem = suggestions.first();
        await firstMenuItem.waitFor({state: 'visible', timeout: 10000});

        const text = await firstMenuItem.innerText();
        const trimmedText = text.trim().toLowerCase();

        if (trimmedText.startsWith('cambridge')) {
            console.log(`First suggestion is Cambridge: "${text}"`);
        } else {
            console.warn(
                `⚠️ First suggestion is not Cambridge. Found: "${text}"`,
            );
        }

        await searchBox.press('Enter');

        await expect(
            this.page.getByRole('heading', {name: 'Today.'}).getByRole('time'),
        ).toBeVisible();
    }

    async temperature() {
        const TempertatureState = this.page.locator('.temp-values').first();
        TempertatureState.waitFor({state: 'visible', timeout: 5000});
        // TempertatureState.textContent();
        const temperatureText = await TempertatureState.textContent();
        expect(temperatureText?.includes('°C'));
        await this.page
            .getByRole('cell', {name: 'Temperature °C Temperature'})
            .click();
        await this.page
            .getByLabel('Choose temperature units')
            .selectOption('°F');
        const temperatureinFahrenheit = await this.page
            .locator('.tooltip-header')
            .nth(3)
            .textContent();
        expect(temperatureinFahrenheit).toContain('°F');
    }

    async windSpeed() {
        const units = [
            {label: 'mph', expectedSpan: '(mph)'},
            {label: 'km/h', expectedSpan: '(km/h)'},
            {label: 'knots', expectedSpan: '(knots)'},
            {label: 'm/s', expectedSpan: '(mps)'},
            {label: 'Beaufort', expectedSpan: '(Beaufort)'},
        ];

        for (const {label, expectedSpan} of units) {
            console.log(`🌀 Checking wind speed unit: ${label}`);

            const dropdown = this.page.getByLabel('Choose wind speed units');
            await dropdown.scrollIntoViewIfNeeded();
            await dropdown.selectOption({label});

            // Wait a bit for UI to reflect the new unit
            await this.page.waitForTimeout(500);

            // Target the specific element by ID
            const header = this.page.locator('#wind-gust-row-heading');
            const unitSpan = header.locator('span.wind-gust-unit');

            try {
                await unitSpan.waitFor({state: 'visible', timeout: 5000});
                await expect(unitSpan).toHaveText(expectedSpan);
                console.log(
                    `Wind gust unit "${expectedSpan}" is correctly shown`,
                );
            } catch (err) {
                const actual = await unitSpan.textContent();
                console.error(`Expected "${expectedSpan}" but saw "${actual}"`);
                await this.page.screenshot({
                    path: `wind-gust-unit-error-${label}.png`,
                    fullPage: true,
                });
                throw new Error(
                    `Unit mismatch for "${label}": expected "${expectedSpan}", got "${actual}"`,
                );
            }
        }
    }

    async navigatetoWeather() {
        const forecastButton = this.page.getByRole('button', {
            name: 'Show reduced forecast',
        });
        await forecastButton.scrollIntoViewIfNeeded();
        await forecastButton.waitFor();
        forecastButton.click();
        const detailedView = this.page
            .getByText('Feels like temperature (°C)')
            .first();
        await expect(detailedView).toBeVisible();
    }

    async Date() {
        await this.page.getByRole('link', {name: 'Sun 20 Apr'}).first().click();
        const dayLabel = this.page.getByText('Sunday (20 April 2025)').first();
        await expect(dayLabel).toContainText('Sunday');
    }

    async tooltip() {
        await this.page.getByTestId('Temperature-enhanced').click();
        const tooltipText = await this.page
            .locator('.tooltip-content')
            .allTextContents();
        expect(tooltipText).toContain(
            'This number shows the air temperature at the time shown. You can see the temperature in Celsius or Fahrenheit by using the dropdown menu.',
        );
        await this.page.getByRole('button', {name: 'Close'}).click();
    }

    async pollen() {
        const pollenLink = this.page.getByRole('link', {name: 'Pollen'});
        await pollenLink.scrollIntoViewIfNeeded();
        await pollenLink.waitFor({state: 'visible', timeout: 5000});
        await pollenLink.click();
        await this.page.locator('h1', {hasText: 'Pollen forecast'}).isVisible();
    }

    async map() {
        await this.page
            .getByRole('navigation')
            .getByRole('link', {name: 'Maps & charts'})
            .click();

        const precipLink = this.page.getByRole('link', {
            name: 'Precipitation map',
        });
        await precipLink.waitFor({state: 'visible', timeout: 5000});
        await precipLink.click({force: true});

        const mapSearch = this.page.getByRole('combobox', {
            name: 'Search for a place,',
        });
        mapSearch.waitFor({state: 'visible'});
        await mapSearch.fill('Cambridge');
        mapSearch.press('Enter', {timeout: 8000});

        const timeSelected = this.page.getByText('01:30').first();
        if (await timeSelected.isVisible()) {
            await timeSelected.click();

            await this.page
                .locator('.ms-slide time-slide time-slide--selected')
                .getByText('01:30')
                .isVisible();
        } else if (await timeSelected.isHidden()) {
            const searchResult = this.page.getByText(
                'Cambridge (Cambridgeshire)',
            );
            await searchResult.waitFor({state: 'visible'});
            await searchResult.click();
            console.log('Cambridge (Cambridgeshire) is not visible');
        }
    }
}
