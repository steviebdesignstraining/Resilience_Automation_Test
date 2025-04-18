import { expect, Page } from '@playwright/test';

export class HomePage {
    constructor(private page: Page) {}

    async homePageLanding() {
        const baseUrl = process.env.BASE_URL || 'https://www.metoffice.gov.uk/';
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

        const suggestions = this.page.locator(
            '#suggested-results [role="menuitem"]',
        );

        // Wait up to 10s for suggestions to appear
        try {
            await this.page.waitForFunction(
                () => {
                    const items = document.querySelectorAll(
                        '#suggested-results [role="menuitem"]',
                    );
                    return items.length > 0;
                },
                null,
                {timeout: 10000},
            );
        } catch (e) {
            await this.page.screenshot({path: 'search-no-suggestions.png'});
            throw new Error(
                `No suggestions appeared after searching for "${term}".`,
            );
        }

        const suggestionCount = await suggestions.count();
        console.log(`Suggestion count: ${suggestionCount}`);

        const firstMenuItem = suggestions.first();
        await firstMenuItem.waitFor({state: 'visible', timeout: 5000});

        const text = await firstMenuItem.innerText();
        const trimmedText = text.trim().toLowerCase();

        if (trimmedText.startsWith('cambridge')) {
            console.log(`First suggestion is Cambridge: "${text}"`);
        } else {
            console.warn(
                `⚠️ First suggestion is not Cambridge. Found: "${text}"`,
            );
        }
        const firstItem = this.page.locator('#suggested-results > li').first();
        await firstItem.click(); // or whatever action you want

        // await firstMenuItem.waitFor({state: 'visible', timeout: 5000});
        // await firstMenuItem.click();
        // await searchBox.press('Enter');

        await expect(
            this.page.getByRole('heading', {name: 'Today.'}).getByRole('time'),
        ).toBeVisible();
    }

    async temperatureUnit() {
        const units = [
            {value: 'c', expectedSpan: '(°C)'},
            {value: 'f', expectedSpan: '(°F)'},
        ];

        for (const {value, expectedSpan} of units) {
            console.log(`Checking temperature unit: ${value.toUpperCase()}`);

            const dropdown = this.page.locator('#temperature-unit-select');

            // Ensure dropdown is visible and ready
            await dropdown.waitFor({state: 'visible', timeout: 10000});
            await dropdown.scrollIntoViewIfNeeded();

            // Use value instead of label to avoid encoding/spacing issues
            try {
                await dropdown.selectOption({value});
                console.log(`Selected temperature unit: ${value}`);
            } catch (e) {
                console.error(
                    `Failed to select "${value}" from temperature dropdown`,
                );
                await this.page.screenshot({
                    path: `temp-unit-select-fail-${value}.png`,
                    fullPage: true,
                });
                throw e;
            }

            // Wait for UI to reflect change
            await this.page.waitForTimeout(500);

            // Validate the unit display
            const header = this.page.locator('#feels-like-temp-row-heading');
            const unitSpan = header.locator('span.temperature-unit');

            try {
                await unitSpan.waitFor({state: 'visible', timeout: 5000});
                await expect(unitSpan).toHaveText(expectedSpan);
                console.log(`Unit "${expectedSpan}" is correctly shown`);
            } catch (err) {
                const actual = await unitSpan.textContent();
                console.error(
                    `Expected "${expectedSpan}", but saw "${actual}"`,
                );
                await this.page.screenshot({
                    path: `temperature-unit-mismatch-${value}.png`,
                    fullPage: true,
                });
                throw new Error(
                    `Unit mismatch for "${value}": expected "${expectedSpan}", got "${actual}"`,
                );
            }
        }
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
            console.log(`Checking wind speed unit: ${label}`);

            const dropdown = this.page.getByLabel('Choose wind speed units');
            await dropdown.scrollIntoViewIfNeeded();
            // await dropdown.click();
            await dropdown.selectOption({label});

            // Wait a bit for UI to reflect the new unit
            // await this.page.waitForTimeout(5000);

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
    }

    async pollen() {
        const pollenLink = this.page.getByRole('link', {name: 'Pollen'});
        await pollenLink.scrollIntoViewIfNeeded();
        await pollenLink.waitFor({state: 'visible', timeout: 5000});
        await pollenLink.click();
        await this.page.locator('h1', {hasText: 'Pollen forecast'}).isVisible();
    }
    async map() {
        try {
            const navLink = this.page
                .getByRole('navigation')
                .getByRole('link', {
                    name: 'Maps & charts',
                });
            await navLink.click();

            const precipLink = this.page.getByRole('link', {
                name: 'Precipitation map',
            });
            await precipLink.waitFor({state: 'visible', timeout: 10000});
            await precipLink.click({force: true});

            await this.page.waitForSelector('#map', {
                state: 'visible',
                timeout: 15000, // more generous for CI
            });
            await this.page.waitForURL('**/maps-and-charts/precipitation-map', {
                waitUntil: 'load',
                timeout: 15000, // more generous for CI
            });

            const mapSearch = this.page.getByRole('combobox', {
                name: 'Search for a place,',
            });
            await mapSearch.waitFor({state: 'visible', timeout: 20000});
            await mapSearch.fill('Cambridge');
            await mapSearch.press('Enter');

            const timeOptions = this.page.locator('.ms-slide.time-slide');

            await this.page.waitForSelector('.ms-slide.time-slide', {
                state: 'visible',
                timeout: 15000, // more generous for CI
            });

            const count = await timeOptions.count();
            if (count === 0) throw new Error('No time options found');

            const randomIndex = Math.floor(Math.random() * count);
            const randomTime = timeOptions.nth(randomIndex);
            const timeText =
                (await randomTime.textContent())?.trim() || 'Unknown';

            console.log(`🕒 Attempting to click time slot: ${timeText}`);

            await randomTime.scrollIntoViewIfNeeded();
            await randomTime.waitFor({state: 'visible', timeout: 5000});

            try {
                await randomTime.click({timeout: 10000});
            } catch (e) {
                console.warn('⚠️ Normal click failed, retrying with force...');
                // await randomTime.click({force: true, timeout: 10000});
            }

            await expect(
                this.page.locator('.time-slide--selected'),
            ).toContainText(timeText);
        } catch (error) {
            console.error('💥 Map interaction failed:', error);
            if (!this.page.isClosed()) {
                await this.page.screenshot({
                    path: 'map-error.png',
                    fullPage: true,
                });
            }
            throw error;
        }
    }
}
