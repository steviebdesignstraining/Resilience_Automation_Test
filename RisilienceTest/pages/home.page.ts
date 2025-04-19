import { expect, Locator, Page } from '@playwright/test';

export class HomePage {
    private baseUrl = process.env.BASE_URL || 'https://www.metoffice.gov.uk/';
    private acceptAllButton: Locator;
    private searchBox: Locator;
    private suggestionItems: Locator;
    private tempUnitDropdown: Locator;
    private windUnitDropdown: Locator;

    constructor(private page: Page) {
        this.acceptAllButton = this.page.getByRole('button', {
            name: 'Accept All',
        });
        this.searchBox = this.page.getByRole('combobox', {
            name: 'Search for a place,',
        });
        this.suggestionItems = this.page.locator(
            '#suggested-results [role="menuitem"]',
        );
        this.tempUnitDropdown = this.page.locator('#temperature-unit-select');
        this.windUnitDropdown = this.page.getByLabel('Choose wind speed units');
    }

    async homePageLanding() {
        await this.page.goto(this.baseUrl);
        await this.acceptAllButton.click();
    }

    async cookies() {
        if (await this.acceptAllButton.isVisible()) {
            await this.acceptAllButton.click();
            console.log('Clicked Accept All');
        } else {
            const header = this.page.locator('h1, h2, h3', {
                hasText: 'Find a forecast',
            });
            const visible = await header.isVisible();
            console.log(visible ? 'Header found' : 'Header not found');
        }
    }

    async search(term: string) {
        await this.searchBox.click();
        await this.searchBox.fill(term);
    }

    async enterSearchTerm(term: string) {
        await this.search(term);
        console.log(`🔍 Entered search term: "${term}"`);

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
        } catch {
            await this.page.screenshot({path: 'search-no-suggestions.png'});
            throw new Error(`No suggestions for "${term}"`);
        }

        const count = await this.suggestionItems.count();
        console.log(`🔢 Suggestions: ${count}`);

        const firstItem = this.suggestionItems.first();
        await firstItem.waitFor({state: 'visible', timeout: 5000});

        const text = (await firstItem.innerText()).trim().toLowerCase();
        text.startsWith('cambridge')
            ? console.log(`Suggestion: Cambridge (${text})`)
            : console.warn(`⚠️ Unexpected suggestion: "${text}"`);

        await this.page.locator('#suggested-results > li').first().click();

        await expect(
            this.page.getByRole('heading', {name: 'Today.'}).getByRole('time'),
        ).toBeVisible();
    }

    async searchBoxError() {
        const errorBox = this.page.locator('#search-results-box');
        await errorBox.waitFor({state: 'visible', timeout: 5000});
        const errors = await errorBox.allTextContents();

        const expected =
            "Sorry we don't have any matches for that. Please re-enter your place, postcode or country above.";
        errors.includes(expected)
            ? console.log('Error message displayed.')
            : console.error('Expected error not found.');
    }

    async temperatureUnit() {
        const units = [
            {value: 'c', expected: '(°C)'},
            {value: 'f', expected: '(°F)'},
        ];

        for (const {value, expected} of units) {
            console.log(`🌡️ Setting temperature to ${value.toUpperCase()}`);
            try {
                await this.tempUnitDropdown.selectOption({value});
                await this.page.waitForTimeout(500);

                const unitSpan = this.page.locator(
                    '#feels-like-temp-row-heading span.temperature-unit',
                );
                await unitSpan.waitFor({state: 'visible', timeout: 5000});
                await expect(unitSpan).toHaveText(expected);

                console.log(`Temperature unit "${expected}" shown`);
            } catch (e) {
                const actual = await this.page
                    .locator('span.temperature-unit')
                    .textContent();
                console.error(`Expected: "${expected}", Got: "${actual}"`);
                await this.page.screenshot({
                    path: `temp-unit-error-${value}.png`,
                    fullPage: true,
                });
                throw e;
            }
        }
    }

    async windSpeed() {
        const units = [
            {label: 'mph', expected: '(mph)'},
            {label: 'km/h', expected: '(km/h)'},
            {label: 'knots', expected: '(knots)'},
            {label: 'm/s', expected: '(mps)'},
            {label: 'Beaufort', expected: '(Beaufort)'},
        ];

        for (const {label, expected} of units) {
            console.log(`💨 Checking wind unit: ${label}`);
            await this.windUnitDropdown.selectOption({label});

            const unitSpan = this.page.locator(
                '#wind-gust-row-heading span.wind-gust-unit',
            );
            await unitSpan.waitFor({state: 'visible', timeout: 5000});

            try {
                await expect(unitSpan).toHaveText(expected);
                console.log(`Wind unit "${expected}" shown`);
            } catch (e) {
                const actual = await unitSpan.textContent();
                console.error(`Expected: "${expected}", Got: "${actual}"`);
                await this.page.screenshot({
                    path: `wind-unit-error-${label}.png`,
                    fullPage: true,
                });
                throw e;
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
        const label = this.page.getByText('Sunday (20 April 2025)').first();
        await expect(label).toContainText('Sunday');
    }

    async tooltip() {
        await this.page.getByTestId('Temperature-enhanced').click();
        const tooltip = await this.page
            .locator('.tooltip-content')
            .allTextContents();
        expect(tooltip).toContain(
            'This number shows the air temperature at the time shown. You can see the temperature in Celsius or Fahrenheit by using the dropdown menu.',
        );
    }
    async pollen() {
        const pollen = this.page.getByRole('link', {name: 'Pollen'});
        await pollen.scrollIntoViewIfNeeded();
        await pollen.waitFor({state: 'visible', timeout: 5000});
        await pollen.click();
        await expect(
            this.page.locator('h1', {hasText: 'Pollen forecast'}),
        ).toBeVisible();
    }

    async map() {
        try {
            const navLink = this.page
                .getByRole('navigation')
                .getByRole('link', {name: 'Maps & charts'});
            await navLink.click();

            const precip = this.page.getByRole('link', {
                name: 'Precipitation map',
            });
            await precip.waitFor({state: 'visible', timeout: 10000});
            await precip.click({force: true});

            await this.page.waitForSelector('#map', {
                state: 'visible',
                timeout: 15000,
            });
            await this.page.waitForURL('**/maps-and-charts/precipitation-map', {
                waitUntil: 'load',
                timeout: 15000,
            });

            const mapSearch = this.searchBox;
            await mapSearch.waitFor({state: 'visible', timeout: 20000});
            await mapSearch.fill('Cambridge');
            await mapSearch.press('Enter');

            const timeOptions = this.page.locator('.ms-slide.time-slide');
            await timeOptions
                .first()
                .waitFor({state: 'visible', timeout: 15000});

            const count = await timeOptions.count();
            if (!count) throw new Error('❌ No time options found');

            const randomIndex = Math.floor(Math.random() * count);
            const randomTime = timeOptions.nth(randomIndex);
            const timeText =
                (await randomTime.textContent())?.trim() || 'Unknown';

            console.log(`🕒 Clicking time: ${timeText}`);
            await randomTime.scrollIntoViewIfNeeded();
            await randomTime.click({timeout: 10000});

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
