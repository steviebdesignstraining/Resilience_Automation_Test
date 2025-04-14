import { test } from '@playwright/test';

import { HomePage } from '../pages/home.page';

test.describe.serial('Main Page', () => {
    const searchTerms = ['cam', 'Cambridge'];

    test.beforeEach(async ({page, context}) => {
        await context.clearCookies();
        const homePage = new HomePage(page);
        await homePage.homePageLanding();
        await homePage.cookies();
    });

    for (const term of searchTerms) {
        test(`Search location using "${term}"`, async ({page}) => {
            const homePage = new HomePage(page);
            await homePage.search(term);
            await homePage.enterSearchTerm(term);
        });
    }

    test('Search invalid characters "@£$%"', async ({page}) => {
        const homePage = new HomePage(page);
        await homePage.search('@£$%');
        await homePage.searchBoxError();
    });

    test('Validate temperature Celcious and Farenheit', async ({page}) => {
        const homePage = new HomePage(page);
        await homePage.search('Cambridge');
        await homePage.enterSearchTerm('Cambridge');
        await homePage.temperature();
    });

    test('Navigate to “Weather” and select full forcast, validate tooltip and pollen', async ({
        page,
        context,
    }) => {
        test.setTimeout(60000);
        const homePage = new HomePage(page);
        await homePage.search('Cambridge');
        await homePage.enterSearchTerm('Cambridge');
        await homePage.navigatetoWeather();
        await homePage.tooltip();
        await homePage.pollen();
    });

    test('Toggle between daily/hourly view', async ({page}) => {
        const homePage = new HomePage(page);
        await homePage.search('Cambridge');
        await homePage.enterSearchTerm('Cambridge');
        await homePage.Date();
    });

    test('View interactive map and locate Cambridge via the map', async ({
        page,
    }) => {
        const homePage = new HomePage(page);
        await homePage.search('Cambridge');
        await homePage.enterSearchTerm('Cambridge');
        await homePage.map();
    });
});
