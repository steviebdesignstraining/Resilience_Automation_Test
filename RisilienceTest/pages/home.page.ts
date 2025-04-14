import { expect, Locator, Page } from '@playwright/test';

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

    /*************  ✨ Windsurf Command ⭐  *************/
    /**
     * Opens the search box and enters the given search term.
     *
     * @param term - The search term to enter.
     */
    /*******  91e1b960-525f-4ddf-8e57-e6a563a64e22  *******/
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
            throw new Error('❌ No suggestions appeared after search.');
        }

        const firstMenuItem = suggestions.first();
        await firstMenuItem.waitFor({state: 'visible', timeout: 10000});

        const text = await firstMenuItem.innerText();
        const trimmedText = text.trim().toLowerCase();

        if (trimmedText.startsWith('cambridge')) {
            console.log(`✅ First suggestion is Cambridge: "${text}"`);
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
        //     console.log('Temperature includes °C');
        // } else {
        //     console.error('Temperature does not include °C');
        // }
        // if (temperatureText?.includes('°F')) {
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
        //         console.log('Temperature includes °F');
        //     } else {
        //         console.error('Temperature does not include °F');
        //     }
        // }
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
        // await detailedView.scrollIntoViewIfNeeded();
        await expect(detailedView).toBeVisible();
        // expect(detailedView).toContainText('Wind direction and speed');
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
        await this.page.getByRole('link', {name: 'Very High Pollen'}).click();
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

        const timeSelected = await this.page.getByText('19:30').first();
        if (await timeSelected.isVisible()) {
            await timeSelected.click();

            await this.page
                .locator('.ms-slide time-slide time-slide--selected')
                .getByText('19:30')
                .isVisible();
        } else if (await timeSelected.isHidden()) {
            await this.page.getByText('Cambridge (Cambridgeshire)').click();
            console.log('Cambridge (Cambridgeshire) is not visible');
        }
    }
}
