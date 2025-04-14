import * as dotenv from 'dotenv';

import {expect, request, test} from '@playwright/test';

dotenv.config();

const API_KEY = process.env.API_KEY;
const BASE_URL = process.env.BASE_KEY;
const API_URL = process.env.API_URL;

test.describe('Met Office Site-Specific Forecast API (Three-Hourly)', () => {
    let apiContext;

    test.beforeAll(async () => {
        apiContext = await request.newContext({
            baseURL: API_URL,
            extraHTTPHeaders: {
                accept: 'application/json',
                apikey: API_KEY!,
            },
        });
    });

    test.afterAll(async () => {
        await apiContext.dispose();
    });

    // 1. Access the homepage
    test('Access homepage and check response', async () => {
        const res = await apiContext.get(API_URL);
        expect(res.status()).toBe(200);
        const body = await res.text();
        console.log('Homepage Response:', res.status(), body.substring(0, 100)); // log first 100 characters for visibility
    });

    // 2. Accept cookies (simulated)
    test('Accept cookies on homepage', async () => {
        const res = await apiContext.get(API_URL);
        expect(res.status()).toBe(200);
        const body = await res.text();
        console.log(
            'Homepage Cookies Response:',
            res.status(),
            body.substring(0, 100),
        );
        // Simulate clicking on accept cookies button if there's a cookie banner in the HTML
        // This is a placeholder for a real interaction; adapt it as needed:
        // await page.click('button#accept-cookies');
    });

    test('Fetch three-hourly forecast from Met Office Site-Specific API', async () => {
        const latitude = '52.1951';
        const longitude = '0.1313';

        const response = await apiContext.get(
            `/sitespecific/v0/point/three-hourly?latitude=${latitude}&longitude=${longitude}`,
            {
                headers: {
                    accept: 'application/json',
                    apikey: process.env.API_KEY as string,
                },
            },
        );

        expect(response.status()).toBe(200); // <- THIS should now pass
        const json = await response.json();
        console.log(JSON.stringify(json, null, 2));

        expect(json.features?.length).toBeGreaterThan(0);
    });

    test('Search with only spaces', async () => {
        const res = await apiContext.get(`${API_URL}/search/site?q=   `);
        expect(res.status()).toBe(404);
        const body = await res.text();
        console.log(
            'Search with spaces Response:',
            res.status(),
            body.substring(0, 100),
        );
        expect(body.length).toBeGreaterThan(10);
    });

    test('Get 3-hourly forecast for Cambridge', async () => {
        const latitude = '52.1951';
        const longitude = '0.1313';

        const res = await apiContext.get(
            `/sitespecific/v0/point/three-hourly?latitude=${latitude}&longitude=${longitude}`,
            {
                headers: {
                    accept: 'application/json',
                    apikey: process.env.API_KEY as string,
                },
            },
        );

        expect(res.status()).toBe(200);
        const json = await res.json();
        console.log(
            '3-hourly forecast for Cambridge Response:',
            res.status(),
            JSON.stringify(json, null, 2),
        );
        expect(json.features?.length).toBeGreaterThan(0);
    });
});
